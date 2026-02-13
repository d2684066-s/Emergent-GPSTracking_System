#!/usr/bin/env python3
"""
GCE Campus Transportation System - Backend API Testing
Tests all endpoints including admin, driver, public, GPS, and RFID functionality
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class GCECampusAPITester:
    def __init__(self, base_url: str = "https://gpsbackend.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.driver_token = None
        self.student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.created_resources = {
            'vehicles': [],
            'users': [],
            'rfid_devices': []
        }

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append(f"{name}: {details}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    token: Optional[str] = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}

            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_admin_login(self):
        """Test admin login with default credentials"""
        success, response = self.make_request(
            'POST', 'auth/login',
            data={"email": "admin@gceits.com", "password": "Admin@12345"}
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.log_test("Admin Login", True, f"Token received, user: {response.get('user', {}).get('name', 'Unknown')}")
            return True
        else:
            self.log_test("Admin Login", False, f"Response: {response}")
            return False

    def test_admin_stats(self):
        """Test admin dashboard stats"""
        if not self.admin_token:
            self.log_test("Admin Stats", False, "No admin token available")
            return False

        success, response = self.make_request('GET', 'admin/stats', token=self.admin_token)
        
        if success:
            required_fields = ['total_students', 'total_drivers', 'total_buses', 'total_ambulances', 
                             'active_trips', 'pending_bookings', 'total_offences', 'unpaid_offences']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test("Admin Stats", True, f"All stats present: {response}")
                return True
            else:
                self.log_test("Admin Stats", False, f"Missing fields: {missing_fields}")
                return False
        else:
            self.log_test("Admin Stats", False, f"Response: {response}")
            return False

    def test_add_bus_vehicle(self):
        """Test adding a new bus vehicle"""
        if not self.admin_token:
            self.log_test("Add Bus Vehicle", False, "No admin token available")
            return False

        vehicle_data = {
            "vehicle_number": f"GCE-BUS-{datetime.now().strftime('%H%M%S')}",
            "gps_imei": f"IMEI{datetime.now().strftime('%H%M%S')}001",
            "barcode": f"BC{datetime.now().strftime('%H%M%S')}001",
            "vehicle_type": "bus"
        }

        success, response = self.make_request(
            'POST', 'admin/vehicles', 
            data=vehicle_data, 
            token=self.admin_token,
            expected_status=200
        )
        
        if success and 'id' in response:
            self.created_resources['vehicles'].append(response['id'])
            self.log_test("Add Bus Vehicle", True, f"Bus added: {response['vehicle_number']}")
            return True
        else:
            self.log_test("Add Bus Vehicle", False, f"Response: {response}")
            return False

    def test_add_ambulance_vehicle(self):
        """Test adding a new ambulance vehicle"""
        if not self.admin_token:
            self.log_test("Add Ambulance Vehicle", False, "No admin token available")
            return False

        vehicle_data = {
            "vehicle_number": f"GCE-AMB-{datetime.now().strftime('%H%M%S')}",
            "gps_imei": f"IMEI{datetime.now().strftime('%H%M%S')}002",
            "barcode": f"BC{datetime.now().strftime('%H%M%S')}002",
            "vehicle_type": "ambulance"
        }

        success, response = self.make_request(
            'POST', 'admin/vehicles', 
            data=vehicle_data, 
            token=self.admin_token,
            expected_status=200
        )
        
        if success and 'id' in response:
            self.created_resources['vehicles'].append(response['id'])
            self.log_test("Add Ambulance Vehicle", True, f"Ambulance added: {response['vehicle_number']}")
            return True
        else:
            self.log_test("Add Ambulance Vehicle", False, f"Response: {response}")
            return False

    def test_view_vehicles(self):
        """Test viewing registered vehicles"""
        if not self.admin_token:
            self.log_test("View Vehicles", False, "No admin token available")
            return False

        success, response = self.make_request('GET', 'admin/vehicles', token=self.admin_token)
        
        if success and 'vehicles' in response:
            vehicle_count = len(response['vehicles'])
            self.log_test("View Vehicles", True, f"Found {vehicle_count} vehicles")
            return True
        else:
            self.log_test("View Vehicles", False, f"Response: {response}")
            return False

    def test_delete_vehicle(self):
        """Test deleting a vehicle"""
        if not self.admin_token or not self.created_resources['vehicles']:
            self.log_test("Delete Vehicle", False, "No admin token or vehicles to delete")
            return False

        vehicle_id = self.created_resources['vehicles'][0]
        success, response = self.make_request(
            'DELETE', f'admin/vehicles/{vehicle_id}', 
            token=self.admin_token
        )
        
        if success:
            self.created_resources['vehicles'].remove(vehicle_id)
            self.log_test("Delete Vehicle", True, f"Vehicle {vehicle_id} deleted")
            return True
        else:
            self.log_test("Delete Vehicle", False, f"Response: {response}")
            return False

    def test_view_offences(self):
        """Test viewing offences section"""
        if not self.admin_token:
            self.log_test("View Offences", False, "No admin token available")
            return False

        success, response = self.make_request('GET', 'admin/offences', token=self.admin_token)
        
        if success and 'offences' in response:
            offence_count = len(response['offences'])
            self.log_test("View Offences", True, f"Found {offence_count} offences")
            return True
        else:
            self.log_test("View Offences", False, f"Response: {response}")
            return False

    def test_add_rfid_device(self):
        """Test adding RFID device"""
        if not self.admin_token:
            self.log_test("Add RFID Device", False, "No admin token available")
            return False

        rfid_data = {
            "rfid_id": f"RFID{datetime.now().strftime('%H%M%S')}",
            "location_name": "Main Gate Test Location"
        }

        success, response = self.make_request(
            'POST', 'admin/rfid-devices', 
            data=rfid_data, 
            token=self.admin_token,
            expected_status=200
        )
        
        if success and 'id' in response:
            self.created_resources['rfid_devices'].append(response['id'])
            self.log_test("Add RFID Device", True, f"RFID device added: {response['rfid_id']}")
            return True
        else:
            self.log_test("Add RFID Device", False, f"Response: {response}")
            return False

    def test_driver_signup(self):
        """Test driver signup (new driver registration)"""
        driver_data = {
            "name": f"Test Driver {datetime.now().strftime('%H%M%S')}",
            "phone": f"9876543{datetime.now().strftime('%H%M')}",
            "password": "TestDriver123!",
            "registration_id": f"DRV{datetime.now().strftime('%H%M%S')}",
            "role": "driver",
            "driver_type": "bus"
        }

        success, response = self.make_request(
            'POST', 'auth/signup', 
            data=driver_data,
            expected_status=200
        )
        
        if success and 'access_token' in response:
            self.driver_token = response['access_token']
            user_id = response.get('user', {}).get('id')
            if user_id:
                self.created_resources['users'].append(user_id)
            self.log_test("Driver Signup", True, f"Driver registered: {driver_data['name']}")
            return True
        else:
            self.log_test("Driver Signup", False, f"Response: {response}")
            return False

    def test_driver_login_bus(self):
        """Test driver login for bus driver"""
        if not self.driver_token:
            # Try to login with a test driver
            login_data = {
                "phone": f"9876543{datetime.now().strftime('%H%M')}",
                "password": "TestDriver123!"
            }
            
            success, response = self.make_request(
                'POST', 'auth/login', 
                data=login_data
            )
            
            if success and 'access_token' in response:
                self.driver_token = response['access_token']
                self.log_test("Driver Login (Bus)", True, f"Driver logged in: {response.get('user', {}).get('name', 'Unknown')}")
                return True
            else:
                self.log_test("Driver Login (Bus)", False, f"Response: {response}")
                return False
        else:
            self.log_test("Driver Login (Bus)", True, "Already logged in from signup")
            return True

    def test_student_signup(self):
        """Test student signup (public app registration)"""
        student_data = {
            "name": f"Test Student {datetime.now().strftime('%H%M%S')}",
            "phone": f"8765432{datetime.now().strftime('%H%M')}",
            "password": "TestStudent123!",
            "registration_id": f"STU{datetime.now().strftime('%H%M%S')}",
            "role": "student"
        }

        success, response = self.make_request(
            'POST', 'auth/signup', 
            data=student_data,
            expected_status=200
        )
        
        if success and 'access_token' in response:
            self.student_token = response['access_token']
            user_id = response.get('user', {}).get('id')
            if user_id:
                self.created_resources['users'].append(user_id)
            self.log_test("Student Signup", True, f"Student registered: {student_data['name']}")
            return True
        else:
            self.log_test("Student Signup", False, f"Response: {response}")
            return False

    def test_student_login(self):
        """Test student login"""
        if not self.student_token:
            # Try to login with a test student
            login_data = {
                "phone": f"8765432{datetime.now().strftime('%H%M')}",
                "password": "TestStudent123!"
            }
            
            success, response = self.make_request(
                'POST', 'auth/login', 
                data=login_data
            )
            
            if success and 'access_token' in response:
                self.student_token = response['access_token']
                self.log_test("Student Login", True, f"Student logged in: {response.get('user', {}).get('name', 'Unknown')}")
                return True
            else:
                self.log_test("Student Login", False, f"Response: {response}")
                return False
        else:
            self.log_test("Student Login", True, "Already logged in from signup")
            return True

    def test_public_map_buses(self):
        """Test public map view shows bus/ambulance options"""
        success, response = self.make_request('GET', 'public/buses')
        
        if success and ('buses' in response or 'all_out_of_station' in response):
            bus_count = len(response.get('buses', []))
            out_of_station = response.get('all_out_of_station', False)
            self.log_test("Public Map Buses", True, f"Buses: {bus_count}, All out: {out_of_station}")
            return True
        else:
            self.log_test("Public Map Buses", False, f"Response: {response}")
            return False

    def test_public_ambulances(self):
        """Test public ambulance availability"""
        success, response = self.make_request('GET', 'public/ambulances')
        
        if success and 'ambulances' in response:
            ambulance_count = len(response.get('ambulances', []))
            self.log_test("Public Ambulances", True, f"Available ambulances: {ambulance_count}")
            return True
        else:
            self.log_test("Public Ambulances", False, f"Response: {response}")
            return False

    def test_gps_mock_endpoint(self):
        """Test GPS mock endpoint receives location data"""
        # First, we need a vehicle with GPS IMEI
        if not self.created_resources['vehicles']:
            self.log_test("GPS Mock Endpoint", False, "No vehicles available for GPS test")
            return False

        # Get vehicle details to find IMEI
        if not self.admin_token:
            self.log_test("GPS Mock Endpoint", False, "No admin token for vehicle lookup")
            return False

        success, vehicles_response = self.make_request('GET', 'admin/vehicles', token=self.admin_token)
        if not success or not vehicles_response.get('vehicles'):
            self.log_test("GPS Mock Endpoint", False, "Could not fetch vehicles for GPS test")
            return False

        # Use the first vehicle's IMEI
        vehicle = vehicles_response['vehicles'][0]
        gps_data = {
            "imei": vehicle['gps_imei'],
            "latitude": 21.6300,
            "longitude": 85.5800,
            "speed": 35.5,
            "timestamp": datetime.now().isoformat()
        }

        success, response = self.make_request(
            'POST', 'gps/receive', 
            data=gps_data,
            expected_status=200
        )
        
        if success and 'message' in response:
            self.log_test("GPS Mock Endpoint", True, f"GPS data received for vehicle: {response.get('vehicle_id', 'Unknown')}")
            return True
        else:
            self.log_test("GPS Mock Endpoint", False, f"Response: {response}")
            return False

    def test_rfid_scan_endpoint(self):
        """Test RFID scan endpoint detects speed violations"""
        # First check if we have RFID devices
        if not self.created_resources['rfid_devices']:
            self.log_test("RFID Scan Endpoint", False, "No RFID devices available for test")
            return False

        # Get RFID device details
        if not self.admin_token:
            self.log_test("RFID Scan Endpoint", False, "No admin token for RFID lookup")
            return False

        success, rfid_response = self.make_request('GET', 'admin/rfid-devices', token=self.admin_token)
        if not success or not rfid_response.get('devices'):
            self.log_test("RFID Scan Endpoint", False, "Could not fetch RFID devices")
            return False

        # Use the first RFID device
        rfid_device = rfid_response['devices'][0]
        scan_data = {
            "rfid_device_id": rfid_device['rfid_id'],
            "student_registration_id": f"STU{datetime.now().strftime('%H%M%S')}TEST",
            "student_name": "Test Student Speed",
            "phone": "9999999999",
            "speed": 50.0,  # Above campus speed limit of 40
            "timestamp": datetime.now().isoformat()
        }

        success, response = self.make_request(
            'POST', 'rfid/scan', 
            data=scan_data,
            expected_status=200
        )
        
        if success and 'message' in response:
            violation_detected = 'violation' in response['message'].lower()
            self.log_test("RFID Scan Endpoint", True, f"RFID scan processed, violation detected: {violation_detected}")
            return True
        else:
            self.log_test("RFID Scan Endpoint", False, f"Response: {response}")
            return False

    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n🧹 Cleaning up test resources...")
        
        if self.admin_token:
            # Clean up vehicles
            for vehicle_id in self.created_resources['vehicles']:
                success, _ = self.make_request('DELETE', f'admin/vehicles/{vehicle_id}', token=self.admin_token)
                if success:
                    print(f"   ✅ Deleted vehicle: {vehicle_id}")
                else:
                    print(f"   ❌ Failed to delete vehicle: {vehicle_id}")
            
            # Clean up RFID devices
            for device_id in self.created_resources['rfid_devices']:
                success, _ = self.make_request('DELETE', f'admin/rfid-devices/{device_id}', token=self.admin_token)
                if success:
                    print(f"   ✅ Deleted RFID device: {device_id}")
                else:
                    print(f"   ❌ Failed to delete RFID device: {device_id}")

    def run_all_tests(self):
        """Run all test cases"""
        print("🚀 Starting GCE Campus Transportation System API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)

        # Authentication Tests
        print("\n🔐 AUTHENTICATION TESTS")
        self.test_admin_login()

        # Admin Dashboard Tests
        print("\n👨‍💼 ADMIN DASHBOARD TESTS")
        self.test_admin_stats()
        self.test_add_bus_vehicle()
        self.test_add_ambulance_vehicle()
        self.test_view_vehicles()
        self.test_view_offences()
        self.test_add_rfid_device()
        self.test_delete_vehicle()

        # Driver Tests
        print("\n🚗 DRIVER TESTS")
        self.test_driver_signup()
        self.test_driver_login_bus()

        # Student/Public Tests
        print("\n🎓 STUDENT/PUBLIC TESTS")
        self.test_student_signup()
        self.test_student_login()
        self.test_public_map_buses()
        self.test_public_ambulances()

        # Mock API Tests
        print("\n📡 MOCK API TESTS")
        self.test_gps_mock_endpoint()
        self.test_rfid_scan_endpoint()

        # Cleanup
        self.cleanup_resources()

        # Results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print(f"✅ Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Failed: {len(self.failed_tests)}/{self.tests_run}")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"   • {failure}")

        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = GCECampusAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
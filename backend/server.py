from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import socketio
import math
from contextlib import asynccontextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'gce-campus-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Speed limits (km/h)
BUS_SPEED_LIMIT = 40
AMBULANCE_SPEED = 60
CAMPUS_SPEED_LIMIT = 40

# Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# Security
security = HTTPBearer()

# ============ MODELS ============

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")

class UserCreate(BaseModel):
    name: str
    phone: str
    password: str
    registration_id: Optional[str] = None
    email: Optional[EmailStr] = None
    dob: Optional[str] = None
    role: str = "student"
    driver_type: Optional[str] = None  # "bus" or "ambulance"

class UserLogin(BaseModel):
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    phone: str
    registration_id: Optional[str] = None
    email: Optional[EmailStr] = None
    role: str
    driver_type: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class VehicleCreate(BaseModel):
    vehicle_number: str
    gps_imei: str
    barcode: str
    vehicle_type: str  # "bus" or "ambulance"

class VehicleResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    vehicle_number: str
    gps_imei: str
    barcode: str
    vehicle_type: str
    assigned_to: Optional[str] = None
    assigned_driver_name: Optional[str] = None
    is_out_of_station: bool = False
    current_location: Optional[Dict] = None
    created_at: str

class TripCreate(BaseModel):
    vehicle_id: str

class TripResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    vehicle_id: str
    vehicle_number: str
    driver_id: str
    driver_name: str
    vehicle_type: str
    start_time: str
    end_time: Optional[str] = None
    is_active: bool = True

class BookingCreate(BaseModel):
    student_registration_id: str
    phone: str
    place: str
    place_details: Optional[str] = None
    user_location: Dict  # {lat, lng}

class BookingResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    student_registration_id: str
    student_name: Optional[str] = None
    phone: str
    place: str
    place_details: Optional[str] = None
    user_location: Dict
    status: str  # "pending", "accepted", "in_progress", "completed", "cancelled"
    otp: Optional[str] = None
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    vehicle_id: Optional[str] = None
    vehicle_number: Optional[str] = None
    eta_minutes: Optional[float] = None
    created_at: str

class GPSDataInput(BaseModel):
    imei: str
    latitude: float
    longitude: float
    speed: float  # km/h
    timestamp: Optional[str] = None

class OffenceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    offence_type: str  # "bus_overspeed" or "student_speed"
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    student_registration_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    vehicle_number: Optional[str] = None
    speed: float
    speed_limit: float
    location: Optional[Dict] = None
    rfid_number: Optional[str] = None
    timestamp: str
    is_paid: bool = False

class RFIDDeviceCreate(BaseModel):
    rfid_id: str
    location_name: str

class RFIDDeviceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    rfid_id: str
    location_name: str
    created_at: str

class RFIDScanInput(BaseModel):
    rfid_device_id: str
    student_registration_id: str
    student_name: str
    phone: str
    speed: float
    timestamp: Optional[str] = None

class OTPVerifyInput(BaseModel):
    booking_id: str
    otp: str

class ForgotPasswordInput(BaseModel):
    phone: str

class ResetPasswordInput(BaseModel):
    phone: str
    otp: str
    new_password: str

class MarkOutOfStationInput(BaseModel):
    is_out_of_station: bool

# ============ UTILITIES ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_role(roles: List[str]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user['role'] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using Haversine formula (returns km)"""
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def calculate_eta(distance_km: float, speed_kmh: float) -> float:
    """Calculate ETA in minutes"""
    if speed_kmh <= 0:
        return 0
    return (distance_km / speed_kmh) * 60

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    import random
    return str(random.randint(100000, 999999))

# Mock OTP storage (in production, use Redis or similar)
otp_storage: Dict[str, Dict] = {}

def send_otp_mock(phone: str, otp: str) -> bool:
    """Mock OTP sending - stores in memory"""
    otp_storage[phone] = {
        'otp': otp,
        'expires': datetime.now(timezone.utc) + timedelta(minutes=10)
    }
    logging.info(f"[MOCK OTP] Sent OTP {otp} to {phone}")
    return True

# Twilio OTP (commented for later use)
# def send_otp_twilio(phone: str, otp: str) -> bool:
#     """Send OTP via Twilio"""
#     from twilio.rest import Client
#     account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
#     auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
#     from_number = os.environ.get('TWILIO_PHONE_NUMBER')
#     client = Client(account_sid, auth_token)
#     message = client.messages.create(
#         body=f"Your GCE Campus OTP is: {otp}",
#         from_=from_number,
#         to=phone
#     )
#     return True

def verify_otp_mock(phone: str, otp: str) -> bool:
    """Verify mock OTP"""
    if phone in otp_storage:
        stored = otp_storage[phone]
        if stored['otp'] == otp and stored['expires'] > datetime.now(timezone.utc):
            del otp_storage[phone]
            return True
    return False

# ============ ROUTERS ============

# Create the main app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed admin user
    admin = await db.users.find_one({"email": "admin@gceits.com"})
    if not admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "name": "Admin",
            "phone": "0000000000",
            "email": "admin@gceits.com",
            "password": hash_password("Admin@12345"),
            "registration_id": "ADMIN001",
            "role": "admin",
            "driver_type": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logging.info("Admin user seeded")
    yield
    # Shutdown
    client.close()

app = FastAPI(lifespan=lifespan)

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
public_router = APIRouter(prefix="/public", tags=["Public"])
driver_router = APIRouter(prefix="/driver", tags=["Driver"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])

# ============ AUTH ROUTES ============

@auth_router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({
        "$or": [
            {"phone": user_data.phone},
            {"registration_id": user_data.registration_id} if user_data.registration_id else {"_id": None}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="User already exists with this phone or registration ID")
    
    user = {
        "id": str(uuid.uuid4()),
        "name": user_data.name,
        "phone": user_data.phone,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "registration_id": user_data.registration_id,
        "role": user_data.role,
        "dob": user_data.dob,
        "driver_type": user_data.driver_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_token(user['id'], user['role'])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user['id'],
            name=user['name'],
            phone=user['phone'],
            registration_id=user['registration_id'],
            email=user['email'],
            role=user['role'],
            driver_type=user['driver_type'],
            created_at=user['created_at']
        )
    )

@auth_router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    query = {}
    if credentials.email:
        query["email"] = credentials.email
    elif credentials.phone:
        query["phone"] = credentials.phone
    else:
        raise HTTPException(status_code=400, detail="Email or phone required")
    
    user = await db.users.find_one(query, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['role'])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user['id'],
            name=user['name'],
            phone=user['phone'],
            registration_id=user.get('registration_id'),
            email=user.get('email'),
            role=user['role'],
            driver_type=user.get('driver_type'),
            created_at=user['created_at']
        )
    )

@auth_router.post("/check-user")
async def check_user(phone: str = None, registration_id: str = None):
    """Check if user exists (for reinstall scenario)"""
    query = {}
    if phone:
        query["phone"] = phone
    if registration_id:
        query["registration_id"] = registration_id
    
    if not query:
        raise HTTPException(status_code=400, detail="Phone or registration_id required")
    
    user = await db.users.find_one(query, {"_id": 0, "password": 0})
    return {"exists": user is not None, "user": user if user else None}

@auth_router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordInput):
    """Send OTP for password reset"""
    user = await db.users.find_one({"phone": data.phone})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    otp = generate_otp()
    send_otp_mock(data.phone, otp)
    return {"message": "OTP sent successfully", "otp": otp}  # Remove otp in production

@auth_router.post("/reset-password")
async def reset_password(data: ResetPasswordInput):
    """Reset password with OTP verification"""
    if not verify_otp_mock(data.phone, data.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    result = await db.users.update_one(
        {"phone": data.phone},
        {"$set": {"password": hash_password(data.new_password)}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Password reset successfully"}

@auth_router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user['id'],
        name=user['name'],
        phone=user['phone'],
        registration_id=user.get('registration_id'),
        email=user.get('email'),
        role=user['role'],
        driver_type=user.get('driver_type'),
        created_at=user['created_at']
    )

# ============ PUBLIC ROUTES ============

@public_router.get("/buses")
async def get_active_buses():
    """Get all active buses with their locations"""
    # Get active trips for buses
    active_trips = await db.trips.find(
        {"is_active": True, "vehicle_type": "bus"},
        {"_id": 0}
    ).to_list(100)
    
    # Check if all buses are out of station
    vehicles = await db.vehicles.find(
        {"vehicle_type": "bus"},
        {"_id": 0}
    ).to_list(100)
    
    all_out = all(v.get('is_out_of_station', False) for v in vehicles) if vehicles else True
    
    if all_out:
        return {"message": "All buses are out of station", "buses": [], "all_out_of_station": True}
    
    buses = []
    for trip in active_trips:
        vehicle = await db.vehicles.find_one({"id": trip['vehicle_id']}, {"_id": 0})
        if vehicle and not vehicle.get('is_out_of_station', False):
            buses.append({
                "trip_id": trip['id'],
                "vehicle_id": vehicle['id'],
                "vehicle_number": vehicle['vehicle_number'],
                "driver_name": trip['driver_name'],
                "location": vehicle.get('current_location'),
                "is_out_of_station": vehicle.get('is_out_of_station', False)
            })
    
    return {"buses": buses, "all_out_of_station": False}

@public_router.get("/bus/{bus_id}/eta")
async def get_bus_eta(bus_id: str, user_lat: float, user_lng: float):
    """Calculate ETA for a specific bus to user location"""
    vehicle = await db.vehicles.find_one({"id": bus_id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Bus not found")
    
    if not vehicle.get('current_location'):
        return {"eta_minutes": None, "message": "Bus location not available"}
    
    bus_loc = vehicle['current_location']
    distance = calculate_distance(bus_loc['lat'], bus_loc['lng'], user_lat, user_lng)
    eta = calculate_eta(distance, BUS_SPEED_LIMIT)
    
    return {
        "bus_location": bus_loc,
        "user_location": {"lat": user_lat, "lng": user_lng},
        "distance_km": round(distance, 2),
        "eta_minutes": round(eta, 1),
        "speed_assumed_kmh": BUS_SPEED_LIMIT
    }

@public_router.get("/ambulances")
async def get_available_ambulances():
    """Get available ambulances (not on active trips)"""
    # Get vehicles not assigned
    ambulances = await db.vehicles.find(
        {"vehicle_type": "ambulance", "assigned_to": None},
        {"_id": 0}
    ).to_list(100)
    return {"ambulances": ambulances}

@public_router.post("/ambulance/book", response_model=BookingResponse)
async def book_ambulance(booking_data: BookingCreate, user: dict = Depends(get_current_user)):
    """Book an ambulance"""
    # Get student info
    student = await db.users.find_one(
        {"registration_id": booking_data.student_registration_id},
        {"_id": 0}
    )
    
    booking = {
        "id": str(uuid.uuid4()),
        "student_registration_id": booking_data.student_registration_id,
        "student_name": student['name'] if student else None,
        "phone": booking_data.phone,
        "place": booking_data.place,
        "place_details": booking_data.place_details,
        "user_location": booking_data.user_location,
        "status": "pending",
        "otp": None,
        "driver_id": None,
        "driver_name": None,
        "vehicle_id": None,
        "vehicle_number": None,
        "eta_minutes": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(booking)
    
    # Broadcast to drivers via socket
    await sio.emit('new_booking', booking)
    
    return BookingResponse(**booking)

@public_router.get("/booking/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str):
    """Get booking status"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return BookingResponse(**booking)

@public_router.get("/my-bookings")
async def get_my_bookings(user: dict = Depends(get_current_user)):
    """Get user's bookings"""
    bookings = await db.bookings.find(
        {"phone": user['phone']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"bookings": bookings}

# ============ DRIVER ROUTES ============

@driver_router.get("/available-vehicles/{vehicle_type}")
async def get_available_vehicles(vehicle_type: str, user: dict = Depends(get_current_user)):
    """Get available vehicles (not assigned) of specified type"""
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can access this")
    
    vehicles = await db.vehicles.find(
        {"vehicle_type": vehicle_type, "assigned_to": None},
        {"_id": 0}
    ).to_list(100)
    return {"vehicles": vehicles}

@driver_router.post("/assign-vehicle/{vehicle_id}")
async def assign_vehicle(vehicle_id: str, user: dict = Depends(get_current_user)):
    """Assign vehicle to driver"""
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can access this")
    
    vehicle = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    if vehicle.get('assigned_to'):
        raise HTTPException(status_code=400, detail="Vehicle already assigned")
    
    await db.vehicles.update_one(
        {"id": vehicle_id},
        {"$set": {"assigned_to": user['id'], "assigned_driver_name": user['name']}}
    )
    
    return {"message": "Vehicle assigned successfully"}

@driver_router.post("/release-vehicle/{vehicle_id}")
async def release_vehicle(vehicle_id: str, user: dict = Depends(get_current_user)):
    """Release vehicle from driver"""
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can access this")
    
    vehicle = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    if vehicle.get('assigned_to') != user['id']:
        raise HTTPException(status_code=403, detail="Vehicle not assigned to you")
    
    await db.vehicles.update_one(
        {"id": vehicle_id},
        {"$set": {"assigned_to": None, "assigned_driver_name": None}}
    )
    
    return {"message": "Vehicle released successfully"}

@driver_router.post("/start-trip", response_model=TripResponse)
async def start_trip(trip_data: TripCreate, user: dict = Depends(get_current_user)):
    """Start a new trip"""
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can access this")
    
    vehicle = await db.vehicles.find_one({"id": trip_data.vehicle_id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    if vehicle.get('assigned_to') != user['id']:
        raise HTTPException(status_code=403, detail="Vehicle not assigned to you")
    
    # Check for active trip
    active_trip = await db.trips.find_one({
        "driver_id": user['id'],
        "is_active": True
    })
    if active_trip:
        raise HTTPException(status_code=400, detail="You already have an active trip")
    
    trip = {
        "id": str(uuid.uuid4()),
        "vehicle_id": vehicle['id'],
        "vehicle_number": vehicle['vehicle_number'],
        "driver_id": user['id'],
        "driver_name": user['name'],
        "vehicle_type": vehicle['vehicle_type'],
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": None,
        "is_active": True
    }
    await db.trips.insert_one(trip)
    
    return TripResponse(**trip)

@driver_router.post("/end-trip/{trip_id}")
async def end_trip(trip_id: str, user: dict = Depends(get_current_user)):
    """End an active trip"""
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can access this")
    
    trip = await db.trips.find_one({"id": trip_id, "driver_id": user['id']}, {"_id": 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if not trip['is_active']:
        raise HTTPException(status_code=400, detail="Trip already ended")
    
    await db.trips.update_one(
        {"id": trip_id},
        {"$set": {
            "is_active": False,
            "end_time": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Clear vehicle location
    await db.vehicles.update_one(
        {"id": trip['vehicle_id']},
        {"$set": {"current_location": None}}
    )
    
    return {"message": "Trip ended successfully"}

@driver_router.post("/mark-out-of-station/{vehicle_id}")
async def mark_out_of_station(vehicle_id: str, data: MarkOutOfStationInput, user: dict = Depends(get_current_user)):
    """Mark bus as out of station"""
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can access this")
    
    vehicle = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    if vehicle.get('assigned_to') != user['id']:
        raise HTTPException(status_code=403, detail="Vehicle not assigned to you")
    
    await db.vehicles.update_one(
        {"id": vehicle_id},
        {"$set": {"is_out_of_station": data.is_out_of_station}}
    )
    
    return {"message": f"Vehicle marked as {'out of' if data.is_out_of_station else 'in'} station"}

@driver_router.get("/pending-bookings")
async def get_pending_bookings(user: dict = Depends(get_current_user)):
    """Get pending ambulance bookings"""
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can access this")
    
    bookings = await db.bookings.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"bookings": bookings}

@driver_router.post("/accept-booking/{booking_id}")
async def accept_booking(booking_id: str, user: dict = Depends(get_current_user)):
    """Accept an ambulance booking"""
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can access this")
    
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Booking no longer available")
    
    # Get driver's assigned ambulance
    vehicle = await db.vehicles.find_one({
        "assigned_to": user['id'],
        "vehicle_type": "ambulance"
    }, {"_id": 0})
    
    if not vehicle:
        raise HTTPException(status_code=400, detail="No ambulance assigned to you")
    
    # Generate OTP
    otp = generate_otp()
    send_otp_mock(booking['phone'], otp)
    
    # Calculate initial ETA if vehicle has location
    eta = None
    if vehicle.get('current_location') and booking.get('user_location'):
        v_loc = vehicle['current_location']
        u_loc = booking['user_location']
        distance = calculate_distance(v_loc['lat'], v_loc['lng'], u_loc['lat'], u_loc['lng'])
        eta = calculate_eta(distance, AMBULANCE_SPEED)
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "status": "accepted",
            "driver_id": user['id'],
            "driver_name": user['name'],
            "vehicle_id": vehicle['id'],
            "vehicle_number": vehicle['vehicle_number'],
            "otp": otp,
            "eta_minutes": round(eta, 1) if eta else None
        }}
    )
    
    # Notify user via socket
    updated_booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    await sio.emit('booking_accepted', updated_booking)
    
    return {"message": "Booking accepted", "otp": otp, "booking": updated_booking}

@driver_router.post("/abort-booking/{booking_id}")
async def abort_booking(booking_id: str, user: dict = Depends(get_current_user)):
    """Abort/cancel a booking"""
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can access this")
    
    await db.bookings.update_one(
        {"id": booking_id, "driver_id": user['id']},
        {"$set": {"status": "cancelled"}}
    )
    
    await sio.emit('booking_cancelled', {"booking_id": booking_id})
    
    return {"message": "Booking cancelled"}

@driver_router.post("/verify-otp")
async def verify_booking_otp(data: OTPVerifyInput, user: dict = Depends(get_current_user)):
    """Verify OTP to start ambulance ride"""
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can access this")
    
    booking = await db.bookings.find_one({"id": data.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['driver_id'] != user['id']:
        raise HTTPException(status_code=403, detail="This booking is not assigned to you")
    
    if booking['otp'] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    await db.bookings.update_one(
        {"id": data.booking_id},
        {"$set": {"status": "in_progress"}}
    )
    
    return {"message": "OTP verified, ride started"}

@driver_router.post("/complete-booking/{booking_id}")
async def complete_booking(booking_id: str, user: dict = Depends(get_current_user)):
    """Complete an ambulance booking"""
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can access this")
    
    await db.bookings.update_one(
        {"id": booking_id, "driver_id": user['id']},
        {"$set": {"status": "completed"}}
    )
    
    await sio.emit('booking_completed', {"booking_id": booking_id})
    
    return {"message": "Booking completed"}

@driver_router.get("/my-trips")
async def get_my_trips(user: dict = Depends(get_current_user)):
    """Get driver's trip history"""
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can access this")
    
    trips = await db.trips.find(
        {"driver_id": user['id']},
        {"_id": 0}
    ).sort("start_time", -1).to_list(100)
    return {"trips": trips}

@driver_router.get("/active-trip")
async def get_active_trip(user: dict = Depends(get_current_user)):
    """Get driver's active trip"""
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can access this")
    
    trip = await db.trips.find_one(
        {"driver_id": user['id'], "is_active": True},
        {"_id": 0}
    )
    return {"trip": trip}

# ============ ADMIN ROUTES ============

@admin_router.get("/stats")
async def get_admin_stats(user: dict = Depends(get_current_user)):
    """Get dashboard statistics"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_students = await db.users.count_documents({"role": "student"})
    total_drivers = await db.users.count_documents({"role": "driver"})
    total_buses = await db.vehicles.count_documents({"vehicle_type": "bus"})
    total_ambulances = await db.vehicles.count_documents({"vehicle_type": "ambulance"})
    active_trips = await db.trips.count_documents({"is_active": True})
    pending_bookings = await db.bookings.count_documents({"status": "pending"})
    total_offences = await db.offences.count_documents({})
    unpaid_offences = await db.offences.count_documents({"is_paid": False})
    
    return {
        "total_students": total_students,
        "total_drivers": total_drivers,
        "total_buses": total_buses,
        "total_ambulances": total_ambulances,
        "active_trips": active_trips,
        "pending_bookings": pending_bookings,
        "total_offences": total_offences,
        "unpaid_offences": unpaid_offences
    }

@admin_router.post("/vehicles", response_model=VehicleResponse)
async def add_vehicle(vehicle_data: VehicleCreate, user: dict = Depends(get_current_user)):
    """Add a new vehicle"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if vehicle exists
    existing = await db.vehicles.find_one({
        "$or": [
            {"vehicle_number": vehicle_data.vehicle_number},
            {"gps_imei": vehicle_data.gps_imei}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle with this number or IMEI already exists")
    
    vehicle = {
        "id": str(uuid.uuid4()),
        "vehicle_number": vehicle_data.vehicle_number,
        "gps_imei": vehicle_data.gps_imei,
        "barcode": vehicle_data.barcode,
        "vehicle_type": vehicle_data.vehicle_type,
        "assigned_to": None,
        "assigned_driver_name": None,
        "is_out_of_station": False,
        "current_location": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.vehicles.insert_one(vehicle)
    
    return VehicleResponse(**vehicle)

@admin_router.get("/vehicles")
async def get_all_vehicles(
    vehicle_type: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get all vehicles with optional filters"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if vehicle_type:
        query["vehicle_type"] = vehicle_type
    if search:
        query["$or"] = [
            {"vehicle_number": {"$regex": search, "$options": "i"}},
            {"gps_imei": {"$regex": search, "$options": "i"}}
        ]
    
    vehicles = await db.vehicles.find(query, {"_id": 0}).to_list(1000)
    return {"vehicles": vehicles}

@admin_router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, user: dict = Depends(get_current_user)):
    """Delete a vehicle"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.vehicles.delete_one({"id": vehicle_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    return {"message": "Vehicle deleted"}

@admin_router.get("/students")
async def get_all_students(
    search: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get all students"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {"role": "student"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"registration_id": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    students = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    return {"students": students}

@admin_router.delete("/students/{student_id}")
async def delete_student(student_id: str, user: dict = Depends(get_current_user)):
    """Delete a student"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.users.delete_one({"id": student_id, "role": "student"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return {"message": "Student deleted"}

@admin_router.get("/drivers")
async def get_all_drivers(
    driver_type: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get all drivers"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {"role": "driver"}
    if driver_type:
        query["driver_type"] = driver_type
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"registration_id": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    drivers = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    return {"drivers": drivers}

@admin_router.delete("/drivers/{driver_id}")
async def delete_driver(driver_id: str, user: dict = Depends(get_current_user)):
    """Delete a driver"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # First release any assigned vehicles
    await db.vehicles.update_many(
        {"assigned_to": driver_id},
        {"$set": {"assigned_to": None, "assigned_driver_name": None}}
    )
    
    result = await db.users.delete_one({"id": driver_id, "role": "driver"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    return {"message": "Driver deleted"}

@admin_router.get("/offences")
async def get_all_offences(
    offence_type: Optional[str] = None,
    search: Optional[str] = None,
    is_paid: Optional[bool] = None,
    user: dict = Depends(get_current_user)
):
    """Get all offences"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if offence_type:
        query["offence_type"] = offence_type
    if is_paid is not None:
        query["is_paid"] = is_paid
    if search:
        query["$or"] = [
            {"driver_name": {"$regex": search, "$options": "i"}},
            {"student_name": {"$regex": search, "$options": "i"}},
            {"vehicle_number": {"$regex": search, "$options": "i"}}
        ]
    
    offences = await db.offences.find(query, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return {"offences": offences}

@admin_router.delete("/offences/{offence_id}")
async def delete_offence(offence_id: str, user: dict = Depends(get_current_user)):
    """Delete an offence (after payment)"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.offences.delete_one({"id": offence_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Offence not found")
    
    return {"message": "Offence deleted"}

@admin_router.patch("/offences/{offence_id}/mark-paid")
async def mark_offence_paid(offence_id: str, user: dict = Depends(get_current_user)):
    """Mark offence as paid"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.offences.update_one(
        {"id": offence_id},
        {"$set": {"is_paid": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Offence not found")
    
    return {"message": "Offence marked as paid"}

@admin_router.post("/rfid-devices", response_model=RFIDDeviceResponse)
async def add_rfid_device(device_data: RFIDDeviceCreate, user: dict = Depends(get_current_user)):
    """Add an RFID scanner device"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = await db.rfid_devices.find_one({"rfid_id": device_data.rfid_id})
    if existing:
        raise HTTPException(status_code=400, detail="RFID device already exists")
    
    device = {
        "id": str(uuid.uuid4()),
        "rfid_id": device_data.rfid_id,
        "location_name": device_data.location_name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.rfid_devices.insert_one(device)
    
    return RFIDDeviceResponse(**device)

@admin_router.get("/rfid-devices")
async def get_rfid_devices(user: dict = Depends(get_current_user)):
    """Get all RFID devices"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    devices = await db.rfid_devices.find({}, {"_id": 0}).to_list(100)
    return {"devices": devices}

@admin_router.delete("/rfid-devices/{device_id}")
async def delete_rfid_device(device_id: str, user: dict = Depends(get_current_user)):
    """Delete an RFID device"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.rfid_devices.delete_one({"id": device_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {"message": "Device deleted"}

@admin_router.get("/trips")
async def get_all_trips(
    is_active: Optional[bool] = None,
    vehicle_type: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get all trips"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if is_active is not None:
        query["is_active"] = is_active
    if vehicle_type:
        query["vehicle_type"] = vehicle_type
    
    trips = await db.trips.find(query, {"_id": 0}).sort("start_time", -1).to_list(1000)
    return {"trips": trips}

@admin_router.get("/bookings")
async def get_all_bookings(
    status: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get all ambulance bookings"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"bookings": bookings}

# ============ GPS & RFID RECEIVER ROUTES ============

@api_router.post("/gps/receive")
async def receive_gps_data(gps_data: GPSDataInput):
    """Receive GPS data from vehicle tracking device (Mock endpoint)"""
    # Find vehicle by IMEI
    vehicle = await db.vehicles.find_one({"gps_imei": gps_data.imei}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found for this IMEI")
    
    # Update vehicle location
    location = {
        "lat": gps_data.latitude,
        "lng": gps_data.longitude,
        "speed": gps_data.speed,
        "timestamp": gps_data.timestamp or datetime.now(timezone.utc).isoformat()
    }
    
    await db.vehicles.update_one(
        {"id": vehicle['id']},
        {"$set": {"current_location": location}}
    )
    
    # Check for overspeeding (only for buses)
    if vehicle['vehicle_type'] == 'bus' and gps_data.speed > CAMPUS_SPEED_LIMIT:
        # Get driver info
        if vehicle.get('assigned_to'):
            driver = await db.users.find_one({"id": vehicle['assigned_to']}, {"_id": 0})
            
            offence = {
                "id": str(uuid.uuid4()),
                "offence_type": "bus_overspeed",
                "driver_id": vehicle.get('assigned_to'),
                "driver_name": driver['name'] if driver else None,
                "vehicle_id": vehicle['id'],
                "vehicle_number": vehicle['vehicle_number'],
                "speed": gps_data.speed,
                "speed_limit": CAMPUS_SPEED_LIMIT,
                "location": {"lat": gps_data.latitude, "lng": gps_data.longitude},
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "is_paid": False
            }
            await db.offences.insert_one(offence)
            logging.warning(f"Overspeeding detected: {vehicle['vehicle_number']} at {gps_data.speed} km/h")
    
    # Broadcast location update via socket
    await sio.emit('vehicle_location', {
        "vehicle_id": vehicle['id'],
        "vehicle_number": vehicle['vehicle_number'],
        "vehicle_type": vehicle['vehicle_type'],
        "location": location
    })
    
    # Update ETA for active bookings if ambulance
    if vehicle['vehicle_type'] == 'ambulance':
        active_booking = await db.bookings.find_one({
            "vehicle_id": vehicle['id'],
            "status": {"$in": ["accepted", "in_progress"]}
        }, {"_id": 0})
        
        if active_booking and active_booking.get('user_location'):
            u_loc = active_booking['user_location']
            distance = calculate_distance(location['lat'], location['lng'], u_loc['lat'], u_loc['lng'])
            eta = calculate_eta(distance, AMBULANCE_SPEED)
            
            await db.bookings.update_one(
                {"id": active_booking['id']},
                {"$set": {"eta_minutes": round(eta, 1)}}
            )
            
            await sio.emit('eta_update', {
                "booking_id": active_booking['id'],
                "eta_minutes": round(eta, 1),
                "vehicle_location": location
            })
    
    return {"message": "GPS data received", "vehicle_id": vehicle['id']}

@api_router.post("/rfid/scan")
async def receive_rfid_scan(scan_data: RFIDScanInput):
    """Receive RFID scan data from campus scanners"""
    # Verify RFID device exists
    device = await db.rfid_devices.find_one({"rfid_id": scan_data.rfid_device_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="RFID device not registered")
    
    # Check for speed violation
    if scan_data.speed > CAMPUS_SPEED_LIMIT:
        # Get student info
        student = await db.users.find_one(
            {"registration_id": scan_data.student_registration_id},
            {"_id": 0}
        )
        
        offence = {
            "id": str(uuid.uuid4()),
            "offence_type": "student_speed",
            "student_id": student['id'] if student else None,
            "student_name": scan_data.student_name,
            "student_registration_id": scan_data.student_registration_id,
            "phone": scan_data.phone,
            "speed": scan_data.speed,
            "speed_limit": CAMPUS_SPEED_LIMIT,
            "rfid_number": scan_data.rfid_device_id,
            "location": {"name": device['location_name']},
            "timestamp": scan_data.timestamp or datetime.now(timezone.utc).isoformat(),
            "is_paid": False
        }
        await db.offences.insert_one(offence)
        logging.warning(f"Student speed violation: {scan_data.student_name} at {scan_data.speed} km/h")
        
        return {"message": "Speed violation recorded", "offence_id": offence['id']}
    
    return {"message": "Scan recorded, no violation"}

# ============ INCLUDE ROUTERS ============

api_router.include_router(auth_router)
api_router.include_router(public_router)
api_router.include_router(driver_router)
api_router.include_router(admin_router)
app.include_router(api_router)

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, app)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ SOCKET.IO EVENTS ============

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    """Join a specific room for targeted updates"""
    room = data.get('room')
    if room:
        await sio.enter_room(sid, room)
        logger.info(f"Client {sid} joined room {room}")

@sio.event
async def leave_room(sid, data):
    """Leave a room"""
    room = data.get('room')
    if room:
        await sio.leave_room(sid, room)
        logger.info(f"Client {sid} left room {room}")

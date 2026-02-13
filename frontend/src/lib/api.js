import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('gce_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    ...getAuthHeaders(),
  };
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gce_token');
      // Don't redirect, let the component handle it
    }
    return Promise.reject(error);
  }
);

// Admin API calls
export const adminApi = {
  // Stats
  getStats: () => api.get('/admin/stats'),
  
  // Vehicles
  getVehicles: (params) => api.get('/admin/vehicles', { params }),
  addVehicle: (data) => api.post('/admin/vehicles', data),
  deleteVehicle: (id) => api.delete(`/admin/vehicles/${id}`),
  
  // Students
  getStudents: (params) => api.get('/admin/students', { params }),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),
  
  // Drivers
  getDrivers: (params) => api.get('/admin/drivers', { params }),
  deleteDriver: (id) => api.delete(`/admin/drivers/${id}`),
  
  // Offences
  getOffences: (params) => api.get('/admin/offences', { params }),
  deleteOffence: (id) => api.delete(`/admin/offences/${id}`),
  markOffencePaid: (id) => api.patch(`/admin/offences/${id}/mark-paid`),
  
  // RFID Devices
  getRFIDDevices: () => api.get('/admin/rfid-devices'),
  addRFIDDevice: (data) => api.post('/admin/rfid-devices', data),
  deleteRFIDDevice: (id) => api.delete(`/admin/rfid-devices/${id}`),
  
  // Trips
  getTrips: (params) => api.get('/admin/trips', { params }),
  
  // Bookings
  getBookings: (params) => api.get('/admin/bookings', { params }),
};

// Driver API calls
export const driverApi = {
  // Vehicles
  getAvailableVehicles: (type) => api.get(`/driver/available-vehicles/${type}`),
  assignVehicle: (id) => api.post(`/driver/assign-vehicle/${id}`),
  releaseVehicle: (id) => api.post(`/driver/release-vehicle/${id}`),
  
  // Trips
  startTrip: (vehicleId) => api.post('/driver/start-trip', { vehicle_id: vehicleId }),
  endTrip: (tripId) => api.post(`/driver/end-trip/${tripId}`),
  getActiveTrip: () => api.get('/driver/active-trip'),
  getMyTrips: () => api.get('/driver/my-trips'),
  
  // Bus
  markOutOfStation: (vehicleId, isOut) => api.post(`/driver/mark-out-of-station/${vehicleId}`, { is_out_of_station: isOut }),
  
  // Ambulance bookings
  getPendingBookings: () => api.get('/driver/pending-bookings'),
  acceptBooking: (id) => api.post(`/driver/accept-booking/${id}`),
  abortBooking: (id) => api.post(`/driver/abort-booking/${id}`),
  verifyOTP: (bookingId, otp) => api.post('/driver/verify-otp', { booking_id: bookingId, otp }),
  completeBooking: (id) => api.post(`/driver/complete-booking/${id}`),
};

// Public API calls
export const publicApi = {
  getBuses: () => api.get('/public/buses'),
  getBusETA: (busId, lat, lng) => api.get(`/public/bus/${busId}/eta`, { params: { user_lat: lat, user_lng: lng } }),
  getAmbulances: () => api.get('/public/ambulances'),
  bookAmbulance: (data) => api.post('/public/ambulance/book', data),
  getBooking: (id) => api.get(`/public/booking/${id}`),
  getMyBookings: () => api.get('/public/my-bookings'),
};

// GPS Mock API
export const gpsApi = {
  sendLocation: (data) => api.post('/gps/receive', data),
};

// RFID Scan API
export const rfidApi = {
  sendScan: (data) => api.post('/rfid/scan', data),
};

export default api;

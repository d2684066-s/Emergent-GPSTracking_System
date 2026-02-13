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
      window.location.href = '/login';
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

// Public API calls (for map view)
export const publicApi = {
  getBuses: () => api.get('/public/buses'),
  getBusETA: (busId, lat, lng) => api.get(`/public/bus/${busId}/eta`, { params: { user_lat: lat, user_lng: lng } }),
  getAmbulances: () => api.get('/public/ambulances'),
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

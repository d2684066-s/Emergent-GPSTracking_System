import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { publicApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Bus, Ambulance, X, MapPin, Navigation, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PLACES = [
  { value: '1', label: 'BAITARANI HALL OF RESIDENCE' },
  { value: '2', label: 'BALADEVJEW HALL OF RESIDENCE' },
  { value: '3', label: 'MAA TARINI HALL OF RESIDENCE' },
  { value: '4', label: 'GANDHAMARDAN HALL OF RESIDENCE' },
  { value: '5', label: 'ADMINISTRATIVE BLOCK' },
  { value: '6', label: 'Other (please specify)' },
];

// Keonjhar center coordinates
const CENTER = { lat: 21.6300, lng: 85.5800 };

const PublicMap = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [showServicePopup, setShowServicePopup] = useState(false);
  const [showAmbulancePopup, setShowAmbulancePopup] = useState(false);
  const [showBusInfo, setShowBusInfo] = useState(false);
  const [buses, setBuses] = useState([]);
  const [allOutOfStation, setAllOutOfStation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [etaInfo, setEtaInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    student_registration_id: '',
    phone: '',
    place: '',
    place_details: ''
  });
  const [activeBooking, setActiveBooking] = useState(null);

  useEffect(() => {
    fetchBuses();
    const interval = setInterval(fetchBuses, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBuses = async () => {
    try {
      const response = await publicApi.getBuses();
      setBuses(response.data.buses || []);
      setAllOutOfStation(response.data.all_out_of_station || false);
    } catch (error) {
      console.error('Failed to fetch buses:', error);
    }
  };

  const handleOpenService = () => {
    // Check location permission
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setShowServicePopup(true);
      },
      (err) => {
        toast.error('Please enable location services to use this feature');
      }
    );
  };

  const handleSelectBus = async () => {
    setShowServicePopup(false);
    
    if (allOutOfStation) {
      toast.info('All buses are out of station');
      return;
    }

    if (buses.length === 0) {
      toast.info('No active buses at the moment');
      return;
    }

    setShowBusInfo(true);

    // Calculate ETA for the nearest bus
    if (buses[0] && userLocation) {
      try {
        const response = await publicApi.getBusETA(buses[0].vehicle_id, userLocation.lat, userLocation.lng);
        setEtaInfo(response.data);
        setSelectedBus(buses[0]);
      } catch (error) {
        console.error('Failed to get ETA:', error);
      }
    }
  };

  const handleSelectAmbulance = () => {
    setShowServicePopup(false);
    
    if (!user) {
      toast.error('Please login to book an ambulance');
      navigate('/login');
      return;
    }

    setBookingForm({
      ...bookingForm,
      student_registration_id: user.registration_id || '',
      phone: user.phone || ''
    });
    setShowAmbulancePopup(true);
  };

  const handleBookAmbulance = async () => {
    if (!bookingForm.student_registration_id || !bookingForm.phone || !bookingForm.place) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!userLocation) {
      toast.error('Location required');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/public/ambulance/book`, {
        ...bookingForm,
        user_location: userLocation
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setActiveBooking(response.data);
      setShowAmbulancePopup(false);
      toast.success('Ambulance booked! Waiting for driver...');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative" data-testid="public-map">
      {/* Header */}
      <div className="bg-sky-500 text-white p-4 text-center">
        <h1 className="font-heading font-bold text-xl">College Transport System</h1>
        <p className="text-sm text-white/80">GCE Campus</p>
      </div>

      {/* Map Area */}
      <div className="relative h-[calc(100vh-180px)] bg-zinc-900">
        {/* Map Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1563558603156-1e0f5d0592a2?w=1920)' }}
        />
        <div className="absolute inset-0 grid-pattern" />

        {/* Map Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-4">
          {/* User Location Marker */}
          {userLocation && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping absolute" />
              <div className="w-4 h-4 bg-blue-500 rounded-full relative z-10" />
            </div>
          )}

          {/* Bus Markers */}
          {buses.map((bus, index) => (
            <div 
              key={bus.vehicle_id}
              className="absolute cursor-pointer"
              style={{ 
                top: `${30 + index * 15}%`, 
                left: `${40 + index * 10}%`,
              }}
              onClick={() => setSelectedBus(bus)}
            >
              <div className="p-2 bg-sky-500/20 rounded-full border-2 border-sky-500 animate-pulse">
                <Bus className="h-6 w-6 text-sky-500" />
              </div>
              <p className="text-xs text-center mt-1 text-white font-mono">{bus.vehicle_number}</p>
            </div>
          ))}

          {/* No buses message */}
          {buses.length === 0 && !allOutOfStation && (
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No active buses</p>
            </div>
          )}

          {allOutOfStation && (
            <div className="text-center bg-yellow-500/20 p-4 rounded-lg border border-yellow-500/30">
              <p className="text-yellow-500 font-medium">All buses are out of station</p>
            </div>
          )}
        </div>

        {/* Selected Bus Info */}
        {selectedBus && (
          <div className="absolute bottom-4 left-4 right-4 p-4 rounded-lg glass">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-sky-500">{selectedBus.vehicle_number}</p>
                <p className="text-sm text-muted-foreground">{selectedBus.driver_name}</p>
                {etaInfo && (
                  <p className="text-green-500 font-mono mt-1">ETA: {etaInfo.eta_minutes} min</p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedBus(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Active Booking Info */}
        {activeBooking && (
          <div className="absolute top-4 left-4 right-4 p-4 rounded-lg bg-red-500/20 border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Ambulance className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-500">Ambulance Booked</span>
            </div>
            <p className="text-sm text-foreground">Status: {activeBooking.status}</p>
            {activeBooking.otp && (
              <p className="text-lg font-mono text-green-500 mt-2">Your OTP: {activeBooking.otp}</p>
            )}
            {activeBooking.eta_minutes && (
              <p className="text-sky-500 font-mono">ETA: {activeBooking.eta_minutes} min</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t border-border">
        <div className="flex justify-center gap-4">
          {!user && (
            <>
              <Button variant="outline" onClick={() => navigate('/login')}>Login</Button>
              <Button variant="outline" onClick={() => navigate('/signup')}>Sign Up</Button>
            </>
          )}
          {user && (
            <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
          )}
        </div>
      </div>

      {/* Floating + Button */}
      <button
        onClick={handleOpenService}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-sky-500 text-white text-3xl font-bold shadow-lg hover:bg-sky-600 transition-all active:scale-95 flex items-center justify-center"
        data-testid="add-service-btn"
      >
        <Plus className="h-8 w-8" />
      </button>

      {/* Service Selection Popup */}
      <Dialog open={showServicePopup} onOpenChange={setShowServicePopup}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">Select Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Button 
              onClick={handleSelectBus}
              className="w-full h-16 text-xl bg-sky-500 hover:bg-sky-600"
              data-testid="select-bus-btn"
            >
              <Bus className="h-6 w-6 mr-3" />
              Bus
            </Button>
            <Button 
              onClick={handleSelectAmbulance}
              className="w-full h-16 text-xl bg-red-500 hover:bg-red-600"
              data-testid="select-ambulance-btn"
            >
              <Ambulance className="h-6 w-6 mr-3" />
              Ambulance
            </Button>
            <Button variant="outline" onClick={() => setShowServicePopup(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ambulance Booking Popup */}
      <Dialog open={showAmbulancePopup} onOpenChange={setShowAmbulancePopup}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">Ambulance Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>College ID</Label>
              <Input 
                placeholder="Enter College ID"
                value={bookingForm.student_registration_id}
                onChange={(e) => setBookingForm({...bookingForm, student_registration_id: e.target.value})}
                data-testid="college-id-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                placeholder="Enter Phone Number"
                value={bookingForm.phone}
                onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Pickup Location</Label>
              <Select value={bookingForm.place} onValueChange={(v) => setBookingForm({...bookingForm, place: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {PLACES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {bookingForm.place === '6' && (
              <div className="space-y-2">
                <Label>Specify Location</Label>
                <Input 
                  placeholder="Enter location details"
                  value={bookingForm.place_details}
                  onChange={(e) => setBookingForm({...bookingForm, place_details: e.target.value})}
                />
              </div>
            )}
            <Button 
              onClick={handleBookAmbulance}
              className="w-full bg-red-500 hover:bg-red-600"
              disabled={loading}
              data-testid="book-ambulance-btn"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Book Ambulance
            </Button>
            <Button variant="outline" onClick={() => setShowAmbulancePopup(false)} className="w-full">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicMap;

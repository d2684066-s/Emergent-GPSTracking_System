import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { driverApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Ambulance, LogOut, Check, X, Loader2, MapPin, Phone, User } from 'lucide-react';

const PLACES = {
  '1': 'BAITARANI HALL',
  '2': 'BALADEVJEW HALL',
  '3': 'MAA TARINI HALL',
  '4': 'GANDHAMARDAN HALL',
  '5': 'ADMIN BLOCK',
  '6': 'Other'
};

const AmbulanceWork = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [status, setStatus] = useState('Offline');
  const [pendingBookings, setPendingBookings] = useState([]);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchBookings();
    // Poll for new bookings
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await driverApi.getAvailableVehicles('ambulance');
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await driverApi.getPendingBookings();
      setPendingBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const handleOnDuty = async () => {
    if (!selectedVehicle) {
      toast.error('Please select an ambulance');
      return;
    }
    setLoading(true);
    try {
      await driverApi.assignVehicle(selectedVehicle);
      setStatus('On Duty - Waiting for Requests');
      toast.success('Ready for duty');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOffDuty = async () => {
    setLoading(true);
    try {
      if (selectedVehicle) {
        await driverApi.releaseVehicle(selectedVehicle);
      }
      setStatus('Offline');
      toast.success('Off duty');
      logout();
      navigate('/driver');
    } catch (error) {
      toast.error('Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (booking) => {
    setLoading(true);
    try {
      const response = await driverApi.acceptBooking(booking.id);
      setCurrentBooking({ ...booking, ...response.data.booking, otp: response.data.otp });
      setStatus('Booking Accepted - En Route');
      toast.success(`Booking accepted. OTP: ${response.data.otp}`);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept');
    } finally {
      setLoading(false);
    }
  };

  const handleAbort = async (bookingId) => {
    try {
      await driverApi.abortBooking(bookingId);
      setCurrentBooking(null);
      setStatus('On Duty - Waiting for Requests');
      toast.info('Booking cancelled');
    } catch (error) {
      toast.error('Failed');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || !currentBooking) return;
    setLoading(true);
    try {
      await driverApi.verifyOTP(currentBooking.id, otp);
      setStatus('Ride Started');
      toast.success('OTP verified. Ride started!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRide = async () => {
    if (!currentBooking) return;
    try {
      await driverApi.completeBooking(currentBooking.id);
      setCurrentBooking(null);
      setOtp('');
      setStatus('On Duty - Waiting for Requests');
      toast.success('Ride completed');
    } catch (error) {
      toast.error('Failed');
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="ambulance-work-page">
      {/* Header */}
      <div className="bg-red-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ambulance className="h-6 w-6" />
          <span className="font-semibold">Ambulance Driver – {user?.name}</span>
        </div>
        <Button 
          variant="ghost" 
          className="text-white hover:bg-red-600"
          onClick={handleOffDuty}
          disabled={loading}
        >
          <LogOut className="h-4 w-4 mr-2" />
          OFF DUTY
        </Button>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Select Ambulance */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-lg mb-4 text-foreground">Select Ambulance</h3>
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger>
              <SelectValue placeholder="Select Ambulance" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.vehicle_number}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleOnDuty} 
            className="w-full mt-4 bg-green-500 hover:bg-green-600"
            disabled={loading || !selectedVehicle}
          >
            ON DUTY
          </Button>
        </div>

        {/* Current Request / Booking */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-lg mb-4 text-foreground">Request</h3>
          
          {currentBooking ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-red-500" />
                  <span className="font-medium">{currentBooking.student_name || currentBooking.student_registration_id}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{currentBooking.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span>{PLACES[currentBooking.place] || currentBooking.place}</span>
                </div>
                {currentBooking.eta_minutes && (
                  <p className="mt-2 text-sky-500 font-mono">ETA: {currentBooking.eta_minutes} min</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Enter OTP from student:</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter OTP" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                  />
                  <Button onClick={handleVerifyOTP} disabled={loading}>
                    Verify
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleCompleteRide} className="bg-green-500 hover:bg-green-600">
                  Complete Ride
                </Button>
                <Button variant="outline" onClick={() => handleAbort(currentBooking.id)}>
                  Abort
                </Button>
              </div>
            </div>
          ) : pendingBookings.length > 0 ? (
            <div className="space-y-3">
              {pendingBookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm">{booking.student_registration_id}</span>
                    <span className="text-xs text-muted-foreground">{new Date(booking.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm mb-2"><MapPin className="h-3 w-3 inline mr-1" />{PLACES[booking.place] || booking.place}</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleAccept(booking)}>
                      <Check className="h-4 w-4 mr-1" />Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No booking requests</p>
          )}
        </div>

        {/* Status */}
        <div className="p-4 rounded-lg border border-border bg-card text-center">
          <p className={`font-mono ${status.includes('Active') || status.includes('Accepted') ? 'text-green-500' : 'text-muted-foreground'}`}>
            {status}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceWork;

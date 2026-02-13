import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Bus, Ambulance } from 'lucide-react';

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  const fetchVehicleDetails = async () => {
    try {
      const [vehiclesRes, tripsRes] = await Promise.all([
        adminApi.getVehicles(),
        adminApi.getTrips()
      ]);
      
      const foundVehicle = vehiclesRes.data.vehicles.find(v => v.id === id);
      setVehicle(foundVehicle);
      
      // Filter trips for this vehicle
      const vehicleTrips = tripsRes.data.trips.filter(t => t.vehicle_id === id);
      setTrips(vehicleTrips);
    } catch (error) {
      toast.error('Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vehicle not found</p>
        <Button onClick={() => navigate('/admin/vehicles')} className="mt-4">
          Back to Vehicles
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="vehicle-details-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/vehicles')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-heading font-bold text-3xl text-foreground">Vehicle Details</h1>
      </div>

      {/* Vehicle Info */}
      <div className="p-6 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-4 mb-4">
          {vehicle.vehicle_type === 'bus' ? (
            <Bus className="h-10 w-10 text-sky-500" />
          ) : (
            <Ambulance className="h-10 w-10 text-red-500" />
          )}
          <div>
            <h2 className="text-2xl font-bold font-mono">{vehicle.vehicle_number}</h2>
            <p className="text-muted-foreground capitalize">{vehicle.vehicle_type}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">GPS Device</p>
            <p className="font-mono">{vehicle.gps_imei}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Barcode</p>
            <p className="font-mono">{vehicle.barcode}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Assigned Driver</p>
            <p>{vehicle.assigned_driver_name || 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              vehicle.is_out_of_station 
                ? 'bg-yellow-500/20 text-yellow-500' 
                : 'bg-green-500/20 text-green-500'
            }`}>
              {vehicle.is_out_of_station ? 'Out of Station' : 'Available'}
            </span>
          </div>
        </div>
      </div>

      {/* Trip History */}
      <div className="p-6 rounded-lg border border-border bg-card">
        <h3 className="font-heading font-semibold text-xl text-foreground mb-4">Trip History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Driver</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Start Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">End Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No trips recorded yet
                  </td>
                </tr>
              ) : (
                trips.map((trip) => (
                  <tr key={trip.id} className="border-b border-border/50">
                    <td className="py-3 px-4">{trip.driver_name}</td>
                    <td className="py-3 px-4 font-mono">{formatTime(trip.start_time)}</td>
                    <td className="py-3 px-4 font-mono">
                      {trip.end_time ? formatTime(trip.end_time) : '-'}
                    </td>
                    <td className="py-3 px-4">{formatDate(trip.start_time)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trip.is_active 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {trip.is_active ? 'Active' : 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;

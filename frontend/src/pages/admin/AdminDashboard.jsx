import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Bus, AlertTriangle, GraduationCap, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [vehicleStatus, setVehicleStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchData();
    // Poll for live updates every 3 seconds
    const interval = setInterval(fetchLiveStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, tripsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getTrips({ is_active: true })
      ]);
      setStats(statsRes.data);
      setVehicleStatus(tripsRes.data.trips || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStatus = async () => {
    try {
      const response = await adminApi.getTrips({ is_active: true });
      setVehicleStatus(response.data.trips || []);
    } catch (error) {
      console.error('Failed to fetch live status:', error);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-foreground">
            Admin Dashboard – Live Monitoring
          </h1>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-6 rounded-lg border border-border bg-card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            onClick={() => navigate('/admin/add-vehicle')}
            className="h-16 bg-sky-500 hover:bg-sky-600 text-lg"
            data-testid="add-vehicle-btn"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Vehicle
          </Button>
          <Button 
            onClick={() => navigate('/admin/vehicles')}
            variant="outline"
            className="h-16 text-lg"
            data-testid="vehicles-btn"
          >
            <Bus className="h-5 w-5 mr-2" />
            Registered Vehicles
          </Button>
          <Button 
            onClick={() => navigate('/admin/offences')}
            variant="outline"
            className="h-16 text-lg border-red-500/30 text-red-500 hover:bg-red-500/10"
            data-testid="offences-btn"
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            Offences
          </Button>
          <Button 
            onClick={() => navigate('/admin/student-offences')}
            variant="outline"
            className="h-16 text-lg border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
            data-testid="student-offences-btn"
          >
            <GraduationCap className="h-5 w-5 mr-2" />
            Student Offences
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card text-center">
            <p className="text-3xl font-bold text-sky-500">{stats.total_buses}</p>
            <p className="text-sm text-muted-foreground">Total Buses</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card text-center">
            <p className="text-3xl font-bold text-red-500">{stats.total_ambulances}</p>
            <p className="text-sm text-muted-foreground">Total Ambulances</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card text-center">
            <p className="text-3xl font-bold text-green-500">{stats.active_trips}</p>
            <p className="text-sm text-muted-foreground">Active Trips</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card text-center">
            <p className="text-3xl font-bold text-yellow-500">{stats.unpaid_offences}</p>
            <p className="text-sm text-muted-foreground">Unpaid Offences</p>
          </div>
        </div>
      )}

      {/* Live Vehicle Status Table */}
      <div className="p-6 rounded-lg border border-border bg-card">
        <h3 className="font-heading font-semibold text-xl text-foreground mb-4">
          Live Vehicle Status
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Bus</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Driver</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Speed (km/h)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicleStatus.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No active vehicles at the moment
                  </td>
                </tr>
              ) : (
                vehicleStatus.map((trip, index) => {
                  const speed = trip.current_speed || Math.floor(Math.random() * 20 + 30); // Mock speed
                  const overspeed = speed > 40 && trip.vehicle_type === 'bus';
                  return (
                    <tr 
                      key={trip.id || index} 
                      className={`border-b border-border/50 ${overspeed ? 'text-red-500' : 'text-foreground'}`}
                    >
                      <td className="py-3 px-4 font-mono">{trip.vehicle_number}</td>
                      <td className="py-3 px-4">{trip.driver_name}</td>
                      <td className="py-3 px-4 font-mono">{speed}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          overspeed 
                            ? 'bg-red-500/20 text-red-500' 
                            : 'bg-green-500/20 text-green-500'
                        }`}>
                          {overspeed ? 'Overspeed' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

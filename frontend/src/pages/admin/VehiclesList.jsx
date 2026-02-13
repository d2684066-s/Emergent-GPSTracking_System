import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Bus, Ambulance, Search, Trash2, Eye, ArrowLeft } from 'lucide-react';

const VehiclesList = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('bus');

  useEffect(() => {
    fetchVehicles();
  }, [activeTab, search]);

  const fetchVehicles = async () => {
    try {
      const response = await adminApi.getVehicles({ 
        vehicle_type: activeTab,
        search: search || undefined
      });
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    
    try {
      await adminApi.deleteVehicle(id);
      toast.success('Vehicle deleted');
      fetchVehicles();
    } catch (error) {
      toast.error('Failed to delete vehicle');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6" data-testid="vehicles-list-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-heading font-bold text-3xl text-foreground">Registered Vehicles</h1>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by vehicle number or GPS ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="vehicle-search"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="bus" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-500">
            <Bus className="h-4 w-4 mr-2" />
            Buses
          </TabsTrigger>
          <TabsTrigger value="ambulance" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500">
            <Ambulance className="h-4 w-4 mr-2" />
            Ambulances
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Vehicle No</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">GPS Device</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Assigned Driver</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Added Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No vehicles found
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <tr 
                      key={vehicle.id} 
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/vehicles/${vehicle.id}`)}
                    >
                      <td className="py-3 px-4 font-mono font-medium">{vehicle.vehicle_number}</td>
                      <td className="py-3 px-4 font-mono text-sm text-muted-foreground">{vehicle.gps_imei}</td>
                      <td className="py-3 px-4">
                        {vehicle.assigned_driver_name || (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">{formatDate(vehicle.created_at)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/admin/vehicles/${vehicle.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(vehicle.id)}
                            data-testid={`delete-${vehicle.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VehiclesList;

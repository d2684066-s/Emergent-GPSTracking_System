import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Trash2, Bus, Ambulance, Loader2 } from 'lucide-react';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('bus');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_number: '',
    gps_imei: '',
    barcode: '',
    vehicle_type: 'bus'
  });

  useEffect(() => {
    fetchVehicles();
  }, [activeTab, search]);

  const fetchVehicles = async () => {
    try {
      const response = await adminApi.getVehicles({ 
        vehicle_type: activeTab, 
        search: search || undefined 
      });
      setVehicles(response.data.vehicles);
    } catch (error) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await adminApi.addVehicle({ ...newVehicle, vehicle_type: activeTab });
      toast.success('Vehicle added successfully');
      setDialogOpen(false);
      setNewVehicle({ vehicle_number: '', gps_imei: '', barcode: '', vehicle_type: activeTab });
      fetchVehicles();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add vehicle');
    } finally {
      setSubmitting(false);
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

  const columns = [
    { key: 'vehicle_number', label: 'Vehicle Number' },
    { key: 'gps_imei', label: 'GPS IMEI', render: (row) => (
      <span className="font-mono text-sm">{row.gps_imei}</span>
    )},
    { key: 'barcode', label: 'Barcode' },
    { key: 'assigned_driver_name', label: 'Assigned To', render: (row) => (
      row.assigned_driver_name || <span className="text-muted-foreground">Unassigned</span>
    )},
    { key: 'is_out_of_station', label: 'Status', render: (row) => (
      <StatusBadge status={row.is_out_of_station ? 'Out of Station' : 'Available'} />
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-destructive hover:text-destructive"
        onClick={() => handleDelete(row.id)}
        data-testid={`delete-vehicle-${row.id}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    )}
  ];

  return (
    <div className="space-y-6" data-testid="vehicles-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-foreground">Vehicles</h1>
          <p className="text-muted-foreground mt-1">Manage buses and ambulances</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600" data-testid="add-vehicle-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading">Add New {activeTab === 'bus' ? 'Bus' : 'Ambulance'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddVehicle} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input
                  placeholder="e.g., OD-01-AB-1234"
                  value={newVehicle.vehicle_number}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_number: e.target.value })}
                  required
                  data-testid="vehicle-number-input"
                />
              </div>
              <div className="space-y-2">
                <Label>GPS IMEI</Label>
                <Input
                  placeholder="e.g., 123456789012345"
                  value={newVehicle.gps_imei}
                  onChange={(e) => setNewVehicle({ ...newVehicle, gps_imei: e.target.value })}
                  required
                  data-testid="gps-imei-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input
                  placeholder="e.g., GCE-BUS-001"
                  value={newVehicle.barcode}
                  onChange={(e) => setNewVehicle({ ...newVehicle, barcode: e.target.value })}
                  required
                  data-testid="barcode-input"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-sky-500 hover:bg-sky-600"
                disabled={submitting}
                data-testid="submit-vehicle-btn"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add {activeTab === 'bus' ? 'Bus' : 'Ambulance'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
          <DataTable
            columns={columns}
            data={vehicles}
            searchPlaceholder={`Search ${activeTab}es...`}
            searchValue={search}
            onSearch={setSearch}
            isLoading={loading}
            emptyMessage={`No ${activeTab}es found`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Vehicles;

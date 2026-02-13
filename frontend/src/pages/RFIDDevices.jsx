import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import DataTable from '@/components/DataTable';
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
import { toast } from 'sonner';
import { Plus, Trash2, CreditCard, Loader2, MapPin } from 'lucide-react';

const RFIDDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newDevice, setNewDevice] = useState({
    rfid_id: '',
    location_name: ''
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await adminApi.getRFIDDevices();
      setDevices(response.data.devices);
    } catch (error) {
      toast.error('Failed to load RFID devices');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await adminApi.addRFIDDevice(newDevice);
      toast.success('RFID device added successfully');
      setDialogOpen(false);
      setNewDevice({ rfid_id: '', location_name: '' });
      fetchDevices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add device');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this RFID device?')) return;
    
    try {
      await adminApi.deleteRFIDDevice(id);
      toast.success('Device deleted');
      fetchDevices();
    } catch (error) {
      toast.error('Failed to delete device');
    }
  };

  const columns = [
    { key: 'rfid_id', label: 'RFID ID', render: (row) => (
      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{row.rfid_id}</span>
    )},
    { key: 'location_name', label: 'Location', render: (row) => (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-sky-500" />
        {row.location_name}
      </div>
    )},
    { key: 'created_at', label: 'Added On', render: (row) => (
      new Date(row.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-destructive hover:text-destructive"
        onClick={() => handleDelete(row.id)}
        data-testid={`delete-rfid-${row.id}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    )}
  ];

  return (
    <div className="space-y-6" data-testid="rfid-devices-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-foreground">RFID Devices</h1>
          <p className="text-muted-foreground mt-1">Manage campus speed scanner devices</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600" data-testid="add-rfid-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading">Add RFID Scanner</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddDevice} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>RFID Device ID</Label>
                <Input
                  placeholder="e.g., RFID-SCANNER-001"
                  value={newDevice.rfid_id}
                  onChange={(e) => setNewDevice({ ...newDevice, rfid_id: e.target.value })}
                  required
                  data-testid="rfid-id-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Location Name</Label>
                <Input
                  placeholder="e.g., Main Gate, Library Entrance"
                  value={newDevice.location_name}
                  onChange={(e) => setNewDevice({ ...newDevice, location_name: e.target.value })}
                  required
                  data-testid="location-name-input"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-sky-500 hover:bg-sky-600"
                disabled={submitting}
                data-testid="submit-rfid-btn"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Device
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info */}
      <div className="p-4 rounded-lg bg-sky-500/10 border border-sky-500/20">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-sky-500 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium">About RFID Scanners</p>
            <p className="text-sm text-muted-foreground mt-1">
              RFID scanners detect student speed violations on campus. When a student passes through with 
              speed exceeding 40 km/h, the system automatically records an offence.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 w-fit">
        <CreditCard className="h-5 w-5 text-purple-500" />
        <span className="font-semibold text-purple-500">{devices.length}</span>
        <span className="text-muted-foreground text-sm">Active Scanners</span>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={devices}
        searchPlaceholder="Search devices..."
        isLoading={loading}
        emptyMessage="No RFID devices found"
      />
    </div>
  );
};

export default RFIDDevices;

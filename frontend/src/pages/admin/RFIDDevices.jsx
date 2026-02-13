import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, CreditCard, MapPin, Loader2 } from 'lucide-react';

const RFIDDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newDevice, setNewDevice] = useState({ rfid_id: '', location_name: '' });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await adminApi.getRFIDDevices();
      setDevices(response.data.devices || []);
    } catch (error) {
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.addRFIDDevice(newDevice);
      toast.success('Device added');
      setDialogOpen(false);
      setNewDevice({ rfid_id: '', location_name: '' });
      fetchDevices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this device?')) return;
    try {
      await adminApi.deleteRFIDDevice(id);
      toast.success('Device deleted');
      fetchDevices();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6" data-testid="rfid-page">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-3xl text-foreground">RFID Devices</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600">
              <Plus className="h-4 w-4 mr-2" />Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add RFID Scanner</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>RFID Device ID</Label>
                <Input placeholder="RFID-SCANNER-001" value={newDevice.rfid_id} onChange={(e) => setNewDevice({...newDevice, rfid_id: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Location Name</Label>
                <Input placeholder="Main Gate" value={newDevice.location_name} onChange={(e) => setNewDevice({...newDevice, location_name: e.target.value})} required />
              </div>
              <Button type="submit" className="w-full bg-sky-500 hover:bg-sky-600" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Add Device
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-4 rounded-lg bg-sky-500/10 border border-sky-500/20">
        <p className="text-sm text-sky-400">RFID scanners detect student speed violations on campus roads.</p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">RFID ID</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Location</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Added</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : devices.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No devices</td></tr>
            ) : devices.map((d) => (
              <tr key={d.id} className="border-b border-border/50">
                <td className="py-3 px-4 font-mono bg-muted/30 text-sm">{d.rfid_id}</td>
                <td className="py-3 px-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-sky-500" />{d.location_name}</td>
                <td className="py-3 px-4 text-sm">{new Date(d.created_at).toLocaleDateString('en-IN')}</td>
                <td className="py-3 px-4">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(d.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RFIDDevices;

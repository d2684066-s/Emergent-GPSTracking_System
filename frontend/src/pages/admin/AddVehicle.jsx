import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Camera, Loader2, ArrowLeft } from 'lucide-react';

const AddVehicle = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    gps_imei: '',
    barcode: '',
    vehicle_type: 'bus'
  });

  const handleScanGPS = () => {
    // Mock GPS scan - in real app this would use QR scanner
    const mockIMEI = 'GPS-KEON-' + Math.floor(Math.random() * 1000);
    setFormData({ ...formData, gps_imei: mockIMEI });
    toast.success('GPS Device scanned: ' + mockIMEI);
  };

  const handleScanBarcode = () => {
    // Mock Barcode scan
    const mockBarcode = 'GCE-' + formData.vehicle_type.toUpperCase() + '-' + Math.floor(Math.random() * 100);
    setFormData({ ...formData, barcode: mockBarcode });
    toast.success('Barcode scanned: ' + mockBarcode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminApi.addVehicle(formData);
      toast.success('Vehicle added successfully!');
      navigate('/admin/vehicles');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="add-vehicle-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-heading font-bold text-3xl text-foreground">Add New Vehicle</h1>
      </div>

      {/* Form */}
      <div className="max-w-lg">
        <div className="p-6 rounded-lg border border-border bg-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
              >
                <SelectTrigger data-testid="vehicle-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="ambulance">Ambulance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vehicle Number</Label>
              <Input
                placeholder="OD-09-AB-1234"
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                required
                data-testid="vehicle-number-input"
              />
            </div>

            <div className="space-y-2">
              <Label>GPS Device ID</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Scan GPS QR"
                  value={formData.gps_imei}
                  onChange={(e) => setFormData({ ...formData, gps_imei: e.target.value })}
                  required
                  data-testid="gps-id-input"
                />
                <Button type="button" variant="outline" onClick={handleScanGPS}>
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Barcode</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Scan Barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  required
                  data-testid="barcode-input"
                />
                <Button type="button" variant="outline" onClick={handleScanBarcode}>
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-sky-500 hover:bg-sky-600"
              disabled={loading}
              data-testid="submit-vehicle-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddVehicle;

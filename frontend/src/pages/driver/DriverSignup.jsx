import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';

const DriverSignup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    registration_id: '',
    phone: '',
    dob: '',
    password: '',
    confirmPassword: '',
    driver_type: 'bus'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await signup({
        name: formData.name,
        registration_id: formData.registration_id,
        phone: formData.phone,
        dob: formData.dob,
        password: formData.password,
        role: 'driver',
        driver_type: formData.driver_type
      });
      toast.success('Registration successful');
      navigate(formData.driver_type === 'bus' ? '/driver/bus/work' : '/driver/ambulance/work');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/driver')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center">
            <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <h1 className="font-heading font-bold text-2xl text-foreground">Driver Registration</h1>
          </div>
          <div className="w-10" />
        </div>

        {/* Form */}
        <div className="glass rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Driver Type</Label>
              <Select value={formData.driver_type} onValueChange={(v) => setFormData({...formData, driver_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bus">Bus Driver</SelectItem>
                  <SelectItem value="ambulance">Ambulance Driver</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                placeholder="Enter full name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Registration ID (College Provided)</Label>
              <Input 
                placeholder="e.g., DRV-001" 
                value={formData.registration_id}
                onChange={(e) => setFormData({...formData, registration_id: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                type="tel"
                placeholder="Enter phone number" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input 
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({...formData, dob: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input 
                type="password"
                placeholder="Create password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input 
                type="password"
                placeholder="Retype password" 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-green-500 hover:bg-green-600 text-lg mt-6"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              Register
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DriverSignup;

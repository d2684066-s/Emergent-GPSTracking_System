import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Bus, Ambulance, Shield } from 'lucide-react';

const DriverHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // If driver is logged in, show options to go to work
  if (user && user.role === 'driver') {
    return (
      <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="font-heading font-bold text-3xl text-foreground">Welcome, {user.name}</h1>
            <p className="text-muted-foreground mt-1">Driver Type: {user.driver_type}</p>
          </div>

          <div className="glass rounded-xl p-8 space-y-4">
            {user.driver_type === 'bus' ? (
              <Button 
                onClick={() => navigate('/driver/bus/work')}
                className="w-full h-16 text-xl bg-sky-500 hover:bg-sky-600"
              >
                <Bus className="h-6 w-6 mr-3" />
                Go to Bus Duty
              </Button>
            ) : (
              <Button 
                onClick={() => navigate('/driver/ambulance/work')}
                className="w-full h-16 text-xl bg-red-500 hover:bg-red-600"
              >
                <Ambulance className="h-6 w-6 mr-3" />
                Go to Ambulance Duty
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => { logout(); navigate('/driver'); }}
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="font-heading font-bold text-3xl text-foreground">Driver App</h1>
          <p className="text-muted-foreground mt-1">GCE Campus Transport</p>
        </div>

        {/* Service Selection */}
        <div className="glass rounded-xl p-8" data-testid="driver-home">
          <h2 className="text-xl font-semibold text-center mb-6 text-foreground">Select Service</h2>
          
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/driver/bus/login')}
              className="w-full h-16 text-xl bg-sky-500 hover:bg-sky-600"
              data-testid="bus-service-btn"
            >
              <Bus className="h-6 w-6 mr-3" />
              Bus
            </Button>

            <Button 
              onClick={() => navigate('/driver/ambulance/login')}
              className="w-full h-16 text-xl bg-red-500 hover:bg-red-600"
              data-testid="ambulance-service-btn"
            >
              <Ambulance className="h-6 w-6 mr-3" />
              Ambulance
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">New driver?</p>
            <Button 
              variant="link" 
              onClick={() => navigate('/driver/signup')}
              className="text-sky-500"
            >
              Register here
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverHome;

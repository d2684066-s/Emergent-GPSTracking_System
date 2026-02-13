import { useState, useEffect } from 'react';
import { publicApi, gpsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Map as MapIcon, 
  Bus, 
  Ambulance, 
  RefreshCw, 
  Navigation,
  Loader2,
  AlertCircle
} from 'lucide-react';

const MapView = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allOutOfStation, setAllOutOfStation] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [mockDialogOpen, setMockDialogOpen] = useState(false);
  const [mockGPS, setMockGPS] = useState({
    imei: '',
    latitude: 20.3489,
    longitude: 85.8074,
    speed: 35
  });
  const [sendingGPS, setSendingGPS] = useState(false);

  useEffect(() => {
    fetchBuses();
    const interval = setInterval(fetchBuses, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchBuses = async () => {
    try {
      const response = await publicApi.getBuses();
      setBuses(response.data.buses || []);
      setAllOutOfStation(response.data.all_out_of_station || false);
    } catch (error) {
      console.error('Failed to fetch buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMockGPS = async (e) => {
    e.preventDefault();
    setSendingGPS(true);
    
    try {
      await gpsApi.sendLocation(mockGPS);
      toast.success('GPS data sent successfully');
      fetchBuses();
      setMockDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send GPS data');
    } finally {
      setSendingGPS(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="map-view-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-foreground">Live Map</h1>
          <p className="text-muted-foreground mt-1">Real-time vehicle tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setMockDialogOpen(true)}
            data-testid="mock-gps-btn"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Send Mock GPS
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchBuses}
            disabled={loading}
            data-testid="refresh-map-btn"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Placeholder */}
        <div className="lg:col-span-3 aspect-video bg-card rounded-lg border border-border overflow-hidden relative">
          {/* Map Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1563558603156-1e0f5d0592a2?w=1920)' }}
          />
          
          {/* Grid Overlay */}
          <div className="absolute inset-0 grid-pattern" />
          
          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center p-8">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                Loading map data...
              </div>
            ) : allOutOfStation ? (
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground">All Buses Out of Station</h3>
                <p className="text-muted-foreground mt-2">No buses are currently available on campus</p>
              </div>
            ) : buses.length === 0 ? (
              <div className="text-center">
                <MapIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground">No Active Vehicles</h3>
                <p className="text-muted-foreground mt-2">Send mock GPS data to see vehicles on the map</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {buses.map((bus) => (
                    <div 
                      key={bus.vehicle_id}
                      className="p-4 rounded-lg bg-background/80 border border-sky-500/30 cursor-pointer hover:border-sky-500 transition-colors"
                      onClick={() => setSelectedVehicle(bus)}
                    >
                      <Bus className="h-8 w-8 text-sky-500 mx-auto mb-2" />
                      <p className="font-mono font-semibold">{bus.vehicle_number}</p>
                      <p className="text-xs text-muted-foreground">{bus.driver_name}</p>
                      {bus.location && (
                        <p className="text-xs text-sky-500 mt-1">
                          {bus.location.speed} km/h
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sky-500" />
                <span className="text-sm">Active Bus</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">Active Ambulance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-500" />
                <span className="text-sm">Out of Station</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Live Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bus className="h-4 w-4 text-sky-500" />
                  <span className="text-sm">Active Buses</span>
                </div>
                <span className="font-mono font-semibold">{buses.length}</span>
              </div>
            </div>
          </div>

          {/* Selected Vehicle */}
          {selectedVehicle && (
            <div className="p-4 rounded-lg border border-sky-500/30 bg-sky-500/5">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-sky-500 mb-3">Selected Vehicle</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Number:</strong> {selectedVehicle.vehicle_number}</p>
                <p><strong>Driver:</strong> {selectedVehicle.driver_name}</p>
                {selectedVehicle.location && (
                  <>
                    <p><strong>Speed:</strong> {selectedVehicle.location.speed} km/h</p>
                    <p><strong>Location:</strong></p>
                    <p className="font-mono text-xs">
                      {selectedVehicle.location.lat.toFixed(6)}, {selectedVehicle.location.lng.toFixed(6)}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mock GPS Dialog */}
      <Dialog open={mockDialogOpen} onOpenChange={setMockDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">Send Mock GPS Data</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendMockGPS} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>GPS IMEI (Vehicle)</Label>
              <Input
                placeholder="Enter vehicle GPS IMEI"
                value={mockGPS.imei}
                onChange={(e) => setMockGPS({ ...mockGPS, imei: e.target.value })}
                required
                data-testid="mock-imei-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={mockGPS.latitude}
                  onChange={(e) => setMockGPS({ ...mockGPS, latitude: parseFloat(e.target.value) })}
                  required
                  data-testid="mock-lat-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={mockGPS.longitude}
                  onChange={(e) => setMockGPS({ ...mockGPS, longitude: parseFloat(e.target.value) })}
                  required
                  data-testid="mock-lng-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Speed (km/h)</Label>
              <Input
                type="number"
                value={mockGPS.speed}
                onChange={(e) => setMockGPS({ ...mockGPS, speed: parseFloat(e.target.value) })}
                required
                data-testid="mock-speed-input"
              />
              <p className="text-xs text-muted-foreground">
                Speed &gt; 40 km/h will trigger overspeeding offence for buses
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-sky-500 hover:bg-sky-600"
              disabled={sendingGPS}
              data-testid="submit-mock-gps-btn"
            >
              {sendingGPS ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send GPS Data
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MapView;

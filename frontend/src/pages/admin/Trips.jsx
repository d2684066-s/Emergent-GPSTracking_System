import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Route, Bus, Ambulance, Clock } from 'lucide-react';

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchTrips();
  }, [activeTab]);

  const fetchTrips = async () => {
    try {
      const params = {};
      if (activeTab === 'active') params.is_active = true;
      if (activeTab === 'completed') params.is_active = false;
      if (activeTab === 'bus') params.vehicle_type = 'bus';
      if (activeTab === 'ambulance') params.vehicle_type = 'ambulance';
      const response = await adminApi.getTrips(params);
      setTrips(response.data.trips || []);
    } catch (error) {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (str) => new Date(str).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (str) => new Date(str).toLocaleDateString('en-IN');

  return (
    <div className="space-y-6" data-testid="trips-page">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-3xl text-foreground">Trips</h1>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <Clock className="h-5 w-5 text-green-500" />
          <span className="font-semibold text-green-500">{trips.filter(t => t.is_active).length}</span>
          <span className="text-sm text-muted-foreground">Active</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="bus"><Bus className="h-4 w-4 mr-1" />Bus</TabsTrigger>
          <TabsTrigger value="ambulance"><Ambulance className="h-4 w-4 mr-1" />Ambulance</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-6">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Vehicle</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Driver</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Start</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">End</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : trips.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No trips found</td></tr>
                ) : trips.map((t) => (
                  <tr key={t.id} className="border-b border-border/50">
                    <td className="py-3 px-4 font-mono">{t.vehicle_number}</td>
                    <td className="py-3 px-4">{t.driver_name}</td>
                    <td className="py-3 px-4 capitalize">{t.vehicle_type}</td>
                    <td className="py-3 px-4 font-mono">{formatTime(t.start_time)}</td>
                    <td className="py-3 px-4 font-mono">{t.end_time ? formatTime(t.end_time) : '-'}</td>
                    <td className="py-3 px-4">{formatDate(t.start_time)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${t.is_active ? 'bg-green-500/20 text-green-500' : 'bg-zinc-500/20 text-zinc-400'}`}>
                        {t.is_active ? 'Active' : 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Trips;

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
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
      setTrips(response.data.trips);
    } catch (error) {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'vehicle_number', label: 'Vehicle', render: (row) => (
      <div className="flex items-center gap-2">
        {row.vehicle_type === 'bus' ? (
          <Bus className="h-4 w-4 text-sky-500" />
        ) : (
          <Ambulance className="h-4 w-4 text-red-500" />
        )}
        <span className="font-mono">{row.vehicle_number}</span>
      </div>
    )},
    { key: 'driver_name', label: 'Driver' },
    { key: 'vehicle_type', label: 'Type', render: (row) => (
      <StatusBadge status={row.vehicle_type} />
    )},
    { key: 'start_time', label: 'Started', render: (row) => (
      <div>
        <p>{new Date(row.start_time).toLocaleDateString('en-IN')}</p>
        <p className="text-xs text-muted-foreground">{new Date(row.start_time).toLocaleTimeString('en-IN')}</p>
      </div>
    )},
    { key: 'end_time', label: 'Ended', render: (row) => (
      row.end_time ? (
        <div>
          <p>{new Date(row.end_time).toLocaleDateString('en-IN')}</p>
          <p className="text-xs text-muted-foreground">{new Date(row.end_time).toLocaleTimeString('en-IN')}</p>
        </div>
      ) : <span className="text-muted-foreground">-</span>
    )},
    { key: 'is_active', label: 'Status', render: (row) => (
      <StatusBadge status={row.is_active ? 'Active' : 'Completed'} />
    )},
    { key: 'duration', label: 'Duration', render: (row) => {
      if (!row.end_time) return <span className="text-green-500 animate-pulse">Ongoing</span>;
      const start = new Date(row.start_time);
      const end = new Date(row.end_time);
      const diff = Math.floor((end - start) / 1000 / 60);
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return <span className="font-mono text-sm">{hours}h {mins}m</span>;
    }}
  ];

  const activeCount = trips.filter(t => t.is_active).length;

  return (
    <div className="space-y-6" data-testid="trips-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-foreground">Trips</h1>
          <p className="text-muted-foreground mt-1">Track vehicle trips and history</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <Clock className="h-5 w-5 text-green-500" />
            <span className="font-semibold text-green-500">{activeCount}</span>
            <span className="text-muted-foreground text-sm">Active Trips</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary/20">
            All Trips
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500">
            Active
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-zinc-500/20">
            Completed
          </TabsTrigger>
          <TabsTrigger value="bus" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-500">
            <Bus className="h-4 w-4 mr-2" />
            Bus
          </TabsTrigger>
          <TabsTrigger value="ambulance" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500">
            <Ambulance className="h-4 w-4 mr-2" />
            Ambulance
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <DataTable
            columns={columns}
            data={trips}
            isLoading={loading}
            emptyMessage="No trips found"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Trips;

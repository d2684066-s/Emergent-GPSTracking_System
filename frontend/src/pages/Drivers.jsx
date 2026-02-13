import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Trash2, UserCog, Bus, Ambulance } from 'lucide-react';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchDrivers();
  }, [activeTab, search]);

  const fetchDrivers = async () => {
    try {
      const response = await adminApi.getDrivers({ 
        driver_type: activeTab === 'all' ? undefined : activeTab,
        search: search || undefined 
      });
      setDrivers(response.data.drivers);
    } catch (error) {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver? Any assigned vehicles will be released.')) return;
    
    try {
      await adminApi.deleteDriver(id);
      toast.success('Driver deleted');
      fetchDrivers();
    } catch (error) {
      toast.error('Failed to delete driver');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'registration_id', label: 'Registration ID', render: (row) => (
      <span className="font-mono text-sm">{row.registration_id}</span>
    )},
    { key: 'phone', label: 'Phone' },
    { key: 'driver_type', label: 'Type', render: (row) => (
      <StatusBadge status={row.driver_type || 'Unknown'} />
    )},
    { key: 'dob', label: 'DOB', render: (row) => row.dob || '-' },
    { key: 'created_at', label: 'Registered On', render: (row) => (
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
        data-testid={`delete-driver-${row.id}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    )}
  ];

  return (
    <div className="space-y-6" data-testid="drivers-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-foreground">Drivers</h1>
          <p className="text-muted-foreground mt-1">Manage registered drivers</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <UserCog className="h-5 w-5 text-green-500" />
          <span className="font-semibold text-green-500">{drivers.length}</span>
          <span className="text-muted-foreground text-sm">Total Drivers</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary/20">
            All Drivers
          </TabsTrigger>
          <TabsTrigger value="bus" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-500">
            <Bus className="h-4 w-4 mr-2" />
            Bus Drivers
          </TabsTrigger>
          <TabsTrigger value="ambulance" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500">
            <Ambulance className="h-4 w-4 mr-2" />
            Ambulance Drivers
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <DataTable
            columns={columns}
            data={drivers}
            searchPlaceholder="Search by name, registration ID, or phone..."
            searchValue={search}
            onSearch={setSearch}
            isLoading={loading}
            emptyMessage="No drivers found"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Drivers;

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, Bus, CreditCard, Check } from 'lucide-react';

const Offences = () => {
  const [offences, setOffences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchOffences();
  }, [activeTab, search]);

  const fetchOffences = async () => {
    try {
      const response = await adminApi.getOffences({ 
        offence_type: activeTab === 'all' ? undefined : activeTab,
        search: search || undefined 
      });
      setOffences(response.data.offences);
    } catch (error) {
      toast.error('Failed to load offences');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offence record?')) return;
    
    try {
      await adminApi.deleteOffence(id);
      toast.success('Offence deleted');
      fetchOffences();
    } catch (error) {
      toast.error('Failed to delete offence');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await adminApi.markOffencePaid(id);
      toast.success('Offence marked as paid');
      fetchOffences();
    } catch (error) {
      toast.error('Failed to update offence');
    }
  };

  const columns = [
    { key: 'offence_type', label: 'Type', render: (row) => (
      <StatusBadge status={row.offence_type === 'bus_overspeed' ? 'Bus' : 'Student'} />
    )},
    { key: 'name', label: 'Offender', render: (row) => (
      <div>
        <p className="font-medium">{row.driver_name || row.student_name}</p>
        <p className="text-xs text-muted-foreground">
          {row.vehicle_number || row.student_registration_id}
        </p>
      </div>
    )},
    { key: 'speed', label: 'Speed', render: (row) => (
      <div className="text-center">
        <span className="font-mono text-red-500 font-semibold">{row.speed}</span>
        <span className="text-muted-foreground text-sm"> / {row.speed_limit} km/h</span>
      </div>
    )},
    { key: 'location', label: 'Location', render: (row) => (
      row.location?.name || (row.location?.lat ? `${row.location.lat.toFixed(4)}, ${row.location.lng.toFixed(4)}` : '-')
    )},
    { key: 'timestamp', label: 'Date/Time', render: (row) => (
      <div>
        <p>{new Date(row.timestamp).toLocaleDateString('en-IN')}</p>
        <p className="text-xs text-muted-foreground">{new Date(row.timestamp).toLocaleTimeString('en-IN')}</p>
      </div>
    )},
    { key: 'is_paid', label: 'Status', render: (row) => (
      <StatusBadge status={row.is_paid ? 'Paid' : 'Unpaid'} />
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        {!row.is_paid && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-green-500 hover:text-green-600"
            onClick={() => handleMarkPaid(row.id)}
            data-testid={`mark-paid-${row.id}`}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-destructive hover:text-destructive"
          onClick={() => handleDelete(row.id)}
          data-testid={`delete-offence-${row.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )}
  ];

  const unpaidCount = offences.filter(o => !o.is_paid).length;

  return (
    <div className="space-y-6" data-testid="offences-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-foreground">Offences</h1>
          <p className="text-muted-foreground mt-1">Track overspeeding violations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="font-semibold text-red-500">{unpaidCount}</span>
            <span className="text-muted-foreground text-sm">Unpaid</span>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <p className="text-sm text-yellow-500">
          <strong>Note:</strong> Ambulance drivers are exempt from speed violations. 
          Only bus overspeeding ({'>'}40 km/h) and student RFID violations are tracked.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary/20">
            All Offences
          </TabsTrigger>
          <TabsTrigger value="bus_overspeed" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-500">
            <Bus className="h-4 w-4 mr-2" />
            Bus Overspeeding
          </TabsTrigger>
          <TabsTrigger value="student_speed" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-500">
            <CreditCard className="h-4 w-4 mr-2" />
            Student RFID
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <DataTable
            columns={columns}
            data={offences}
            searchPlaceholder="Search by name or vehicle..."
            searchValue={search}
            onSearch={setSearch}
            isLoading={loading}
            emptyMessage="No offences found"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Offences;

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Ambulance, Clock, MapPin, Phone, User } from 'lucide-react';

const PLACE_OPTIONS = {
  '1': 'BAITARANI HALL OF RESIDENCE',
  '2': 'BALADEVJEW HALL OF RESIDENCE',
  '3': 'MAA TARINI HALL OF RESIDENCE',
  '4': 'GANDHAMARDAN HALL OF RESIDENCE',
  '5': 'ADMINISTRATIVE BLOCK',
  '6': 'Other'
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      
      const response = await adminApi.getBookings(params);
      setBookings(response.data.bookings);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'student', label: 'Student', render: (row) => (
      <div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.student_name || 'Unknown'}</span>
        </div>
        <p className="text-xs text-muted-foreground font-mono mt-1">{row.student_registration_id}</p>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: (row) => (
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-muted-foreground" />
        {row.phone}
      </div>
    )},
    { key: 'place', label: 'Pickup Location', render: (row) => (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-red-500" />
        <div>
          <p className="text-sm">{PLACE_OPTIONS[row.place] || row.place}</p>
          {row.place_details && <p className="text-xs text-muted-foreground">{row.place_details}</p>}
        </div>
      </div>
    )},
    { key: 'driver_name', label: 'Assigned Driver', render: (row) => (
      row.driver_name ? (
        <div>
          <p>{row.driver_name}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.vehicle_number}</p>
        </div>
      ) : <span className="text-muted-foreground">Not assigned</span>
    )},
    { key: 'eta_minutes', label: 'ETA', render: (row) => (
      row.eta_minutes ? (
        <span className="font-mono text-sky-500">{row.eta_minutes} min</span>
      ) : <span className="text-muted-foreground">-</span>
    )},
    { key: 'status', label: 'Status', render: (row) => (
      <StatusBadge status={row.status} />
    )},
    { key: 'created_at', label: 'Booked At', render: (row) => (
      <div>
        <p>{new Date(row.created_at).toLocaleDateString('en-IN')}</p>
        <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleTimeString('en-IN')}</p>
      </div>
    )}
  ];

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="space-y-6" data-testid="bookings-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-foreground">Ambulance Bookings</h1>
          <p className="text-muted-foreground mt-1">Track ambulance service requests</p>
        </div>
        <div className="flex items-center gap-4">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 animate-pulse">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold text-yellow-500">{pendingCount}</span>
              <span className="text-muted-foreground text-sm">Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary/20">
            All Bookings
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-500">
            Pending
          </TabsTrigger>
          <TabsTrigger value="accepted" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-500">
            Accepted
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-500">
            In Progress
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500">
            Completed
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="data-[state=active]:bg-zinc-500/20">
            Cancelled
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <DataTable
            columns={columns}
            data={bookings}
            isLoading={loading}
            emptyMessage="No bookings found"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Bookings;

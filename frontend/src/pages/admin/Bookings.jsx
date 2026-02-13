import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Ambulance, Clock, MapPin, Phone, User } from 'lucide-react';

const PLACES = {
  '1': 'BAITARANI HALL',
  '2': 'BALADEVJEW HALL',
  '3': 'MAA TARINI HALL',
  '4': 'GANDHAMARDAN HALL',
  '5': 'ADMIN BLOCK',
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
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const response = await adminApi.getBookings(params);
      setBookings(response.data.bookings || []);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (str) => {
    const d = new Date(str);
    return `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-6" data-testid="bookings-page">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-3xl text-foreground">Ambulance Bookings</h1>
        {bookings.filter(b => b.status === 'pending').length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 animate-pulse">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold text-yellow-500">{bookings.filter(b => b.status === 'pending').length}</span>
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-6">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Student</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Pickup</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Driver</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">ETA</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Booked</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No bookings</td></tr>
                ) : bookings.map((b) => (
                  <tr key={b.id} className="border-b border-border/50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{b.student_name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground font-mono">{b.student_registration_id}</div>
                    </td>
                    <td className="py-3 px-4">{b.phone}</td>
                    <td className="py-3 px-4 text-sm">{PLACES[b.place] || b.place}</td>
                    <td className="py-3 px-4">{b.driver_name || '-'}</td>
                    <td className="py-3 px-4 font-mono text-sky-500">{b.eta_minutes ? `${b.eta_minutes} min` : '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        b.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                        b.status === 'accepted' ? 'bg-sky-500/20 text-sky-500' :
                        b.status === 'in_progress' ? 'bg-purple-500/20 text-purple-500' :
                        b.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                        'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{formatDateTime(b.created_at)}</td>
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

export default Bookings;

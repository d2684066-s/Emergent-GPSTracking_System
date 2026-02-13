import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import StatCard from '@/components/StatCard';
import { 
  Users, 
  UserCog, 
  Bus, 
  Ambulance, 
  Route, 
  Clock, 
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminApi.getStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-3xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of campus transportation system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats?.total_students || 0}
          icon={Users}
          color="sky"
        />
        <StatCard
          title="Total Drivers"
          value={stats?.total_drivers || 0}
          icon={UserCog}
          color="green"
        />
        <StatCard
          title="Total Buses"
          value={stats?.total_buses || 0}
          icon={Bus}
          color="sky"
        />
        <StatCard
          title="Total Ambulances"
          value={stats?.total_ambulances || 0}
          icon={Ambulance}
          color="red"
        />
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Trips"
          value={stats?.active_trips || 0}
          icon={Route}
          color="green"
        />
        <StatCard
          title="Pending Bookings"
          value={stats?.pending_bookings || 0}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Total Offences"
          value={stats?.total_offences || 0}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Unpaid Offences"
          value={stats?.unpaid_offences || 0}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-heading font-semibold text-lg text-foreground mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">GPS Tracking</span>
              <span className="status-active px-2 py-0.5 rounded-full text-xs font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">RFID Scanners</span>
              <span className="status-active px-2 py-0.5 rounded-full text-xs font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">OTP Service</span>
              <span className="status-warning px-2 py-0.5 rounded-full text-xs font-medium">Mock Mode</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Real-time Updates</span>
              <span className="status-active px-2 py-0.5 rounded-full text-xs font-medium">Connected</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Quick Guide</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Bus className="h-4 w-4 mt-0.5 text-sky-500 flex-shrink-0" />
              <span>Manage buses and ambulances from the Vehicles section</span>
            </p>
            <p className="flex items-start gap-2">
              <Users className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
              <span>View and manage student registrations in Students section</span>
            </p>
            <p className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
              <span>Monitor overspeeding and RFID violations in Offences</span>
            </p>
            <p className="flex items-start gap-2">
              <Route className="h-4 w-4 mt-0.5 text-purple-500 flex-shrink-0" />
              <span>Track active trips and ambulance bookings in real-time</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

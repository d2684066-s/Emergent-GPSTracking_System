import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Check } from 'lucide-react';

const Offences = () => {
  const navigate = useNavigate();
  const [offences, setOffences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffences();
  }, []);

  const fetchOffences = async () => {
    try {
      const response = await adminApi.getOffences({ offence_type: 'bus_overspeed' });
      setOffences(response.data.offences || []);
    } catch (error) {
      toast.error('Failed to load offences');
    } finally {
      setLoading(false);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Payment confirmed? Remove offence record.')) return;
    
    try {
      await adminApi.deleteOffence(id);
      toast.success('Offence cleared');
      fetchOffences();
    } catch (error) {
      toast.error('Failed to delete offence');
    }
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return {
      time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      date: date.toLocaleDateString('en-IN')
    };
  };

  return (
    <div className="space-y-6" data-testid="offences-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-heading font-bold text-3xl text-foreground">Vehicle Offences</h1>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <p className="text-sm text-red-400">
          Bus overspeeding violations (speed {'>'} 40 km/h). Fine: ₹500
        </p>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Vehicle</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Driver</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Violation</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Speed</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Time</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Location</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Fine</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : offences.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  No offences recorded
                </td>
              </tr>
            ) : (
              offences.map((offence) => {
                const { time, date } = formatDateTime(offence.timestamp);
                return (
                  <tr key={offence.id} className="border-b border-border/50">
                    <td className="py-3 px-4 font-mono">{offence.vehicle_number}</td>
                    <td className="py-3 px-4">{offence.driver_name || 'Unknown'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-500">
                        Overspeed
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-red-500">{offence.speed} km/h</td>
                    <td className="py-3 px-4 text-sm">
                      <div>{time}</div>
                      <div className="text-muted-foreground">{date}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {offence.location?.name || (offence.location?.lat ? 
                        `${offence.location.lat.toFixed(4)}, ${offence.location.lng.toFixed(4)}` : 
                        'Campus Road'
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-yellow-500">₹500</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {!offence.is_paid && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-green-500 hover:text-green-600"
                            onClick={() => handleMarkPaid(offence.id)}
                            title="Mark as Paid"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(offence.id)}
                          title="Clear (Paid)"
                          data-testid={`delete-offence-${offence.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Offences;

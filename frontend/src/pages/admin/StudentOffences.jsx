import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Trash2 } from 'lucide-react';

const StudentOffences = () => {
  const navigate = useNavigate();
  const [offences, setOffences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffences();
  }, []);

  const fetchOffences = async () => {
    try {
      const response = await adminApi.getOffences({ offence_type: 'student_speed' });
      setOffences(response.data.offences || []);
    } catch (error) {
      toast.error('Failed to load student offences');
    } finally {
      setLoading(false);
    }
  };

  const handleClearOffence = async (id) => {
    if (!window.confirm('Payment confirmed? Remove offence record.')) return;
    
    try {
      await adminApi.deleteOffence(id);
      toast.success('Offence cleared');
      fetchOffences();
    } catch (error) {
      toast.error('Failed to clear offence');
    }
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6" data-testid="student-offences-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-heading font-bold text-3xl text-foreground">Student Offences</h1>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <p className="text-sm text-yellow-400">
          Student speed violations detected by RFID scanners (speed {'>'} 40 km/h)
        </p>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Registration No</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Offence Type</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Speed</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Location</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Offence Time</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : offences.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No student offences recorded
                </td>
              </tr>
            ) : (
              offences.map((offence) => (
                <tr key={offence.id} className="border-b border-border/50">
                  <td className="py-3 px-4 font-mono">{offence.student_registration_id}</td>
                  <td className="py-3 px-4">{offence.student_name || 'Unknown'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-500">
                      Overspeeding
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-red-500">{offence.speed} km/h</td>
                  <td className="py-3 px-4 text-sm">{offence.location?.name || 'Campus'}</td>
                  <td className="py-3 px-4 text-sm">{formatDateTime(offence.timestamp)}</td>
                  <td className="py-3 px-4">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleClearOffence(offence.id)}
                      data-testid={`clear-offence-${offence.id}`}
                    >
                      Clear (Paid)
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentOffences;

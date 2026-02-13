import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Search, Trash2, UserCog, Bus, Ambulance } from 'lucide-react';

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
      setDrivers(response.data.drivers || []);
    } catch (error) {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this driver?')) return;
    try {
      await adminApi.deleteDriver(id);
      toast.success('Driver deleted');
      fetchDrivers();
    } catch (error) {
      toast.error('Failed to delete driver');
    }
  };

  return (
    <div className="space-y-6" data-testid="drivers-page">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-3xl text-foreground">Drivers</h1>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <UserCog className="h-5 w-5 text-green-500" />
          <span className="font-semibold text-green-500">{drivers.length}</span>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="bus"><Bus className="h-4 w-4 mr-2" />Bus</TabsTrigger>
          <TabsTrigger value="ambulance"><Ambulance className="h-4 w-4 mr-2" />Ambulance</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-6">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Reg ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : drivers.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No drivers found</td></tr>
                ) : drivers.map((d) => (
                  <tr key={d.id} className="border-b border-border/50">
                    <td className="py-3 px-4">{d.name}</td>
                    <td className="py-3 px-4 font-mono">{d.registration_id}</td>
                    <td className="py-3 px-4">{d.phone}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${d.driver_type === 'bus' ? 'bg-sky-500/20 text-sky-500' : 'bg-red-500/20 text-red-500'}`}>
                        {d.driver_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default Drivers;

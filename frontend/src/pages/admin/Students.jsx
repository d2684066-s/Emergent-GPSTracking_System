import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, Trash2, Users } from 'lucide-react';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const fetchStudents = async () => {
    try {
      const response = await adminApi.getStudents({ search: search || undefined });
      setStudents(response.data.students || []);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student? This will remove their access.')) return;
    try {
      await adminApi.deleteStudent(id);
      toast.success('Student deleted');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  return (
    <div className="space-y-6" data-testid="students-page">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-3xl text-foreground">Students</h1>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
          <Users className="h-5 w-5 text-sky-500" />
          <span className="font-semibold text-sky-500">{students.length}</span>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, reg ID, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Registration ID</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Phone</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Registered</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No students found</td></tr>
            ) : students.map((s) => (
              <tr key={s.id} className="border-b border-border/50">
                <td className="py-3 px-4">{s.name}</td>
                <td className="py-3 px-4 font-mono">{s.registration_id}</td>
                <td className="py-3 px-4">{s.phone}</td>
                <td className="py-3 px-4 text-sm">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                <td className="py-3 px-4">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Students;

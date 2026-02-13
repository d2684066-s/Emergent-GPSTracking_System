import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2, Users } from 'lucide-react';

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
      setStudents(response.data.students);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student? This will remove their access.')) return;
    
    try {
      await adminApi.deleteStudent(id);
      toast.success('Student deleted');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'registration_id', label: 'Registration ID', render: (row) => (
      <span className="font-mono text-sm">{row.registration_id}</span>
    )},
    { key: 'phone', label: 'Phone' },
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
        data-testid={`delete-student-${row.id}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    )}
  ];

  return (
    <div className="space-y-6" data-testid="students-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-foreground">Students</h1>
          <p className="text-muted-foreground mt-1">Manage registered students</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
          <Users className="h-5 w-5 text-sky-500" />
          <span className="font-semibold text-sky-500">{students.length}</span>
          <span className="text-muted-foreground text-sm">Total Students</span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="Search by name, registration ID, or phone..."
        searchValue={search}
        onSearch={setSearch}
        isLoading={loading}
        emptyMessage="No students found"
      />
    </div>
  );
};

export default Students;

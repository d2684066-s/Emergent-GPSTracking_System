import { cn } from '@/lib/utils';

const statusStyles = {
  active: 'status-active',
  inactive: 'status-inactive',
  alert: 'status-alert',
  warning: 'status-warning',
  pending: 'status-pending',
  accepted: 'bg-sky-500/15 text-sky-500 border border-sky-500/20',
  in_progress: 'bg-purple-500/15 text-purple-500 border border-purple-500/20',
  completed: 'status-active',
  cancelled: 'status-inactive',
  paid: 'status-active',
  unpaid: 'status-alert',
  bus: 'bg-sky-500/15 text-sky-500 border border-sky-500/20',
  ambulance: 'bg-red-500/15 text-red-500 border border-red-500/20',
};

const StatusBadge = ({ status, className }) => {
  const normalizedStatus = status?.toLowerCase().replace(/ /g, '_');
  
  return (
    <span 
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide',
        statusStyles[normalizedStatus] || 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20',
        className
      )}
    >
      {status}
    </span>
  );
};

export default StatusBadge;

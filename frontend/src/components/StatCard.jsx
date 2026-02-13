import { cn } from '@/lib/utils';

const StatCard = ({ title, value, icon: Icon, trend, color = 'sky', className }) => {
  const colorClasses = {
    sky: 'text-sky-500 bg-sky-500/10',
    red: 'text-red-500 bg-red-500/10',
    green: 'text-green-500 bg-green-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
  };

  return (
    <div 
      className={cn(
        'stat-card p-6 rounded-lg border border-border bg-card transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold font-heading text-foreground">
            {value}
          </p>
          {trend && (
            <p className={cn(
              'mt-1 text-xs font-medium',
              trend > 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {trend > 0 ? '+' : ''}{trend}% from last week
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-lg', colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

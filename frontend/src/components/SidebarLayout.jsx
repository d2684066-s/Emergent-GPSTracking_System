import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Bus, 
  Users, 
  UserCog, 
  AlertTriangle, 
  CreditCard, 
  Map, 
  Route, 
  Ambulance,
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/vehicles', icon: Bus, label: 'Vehicles' },
  { path: '/students', icon: Users, label: 'Students' },
  { path: '/drivers', icon: UserCog, label: 'Drivers' },
  { path: '/offences', icon: AlertTriangle, label: 'Offences' },
  { path: '/rfid-devices', icon: CreditCard, label: 'RFID Devices' },
  { path: '/trips', icon: Route, label: 'Trips' },
  { path: '/bookings', icon: Ambulance, label: 'Bookings' },
  { path: '/map', icon: Map, label: 'Live Map' },
];

const SidebarLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="mobile-menu-toggle"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          bg-card/50 backdrop-blur-xl border-r border-border`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <Shield className="h-8 w-8 text-sky-500 mr-3" />
            <div>
              <h1 className="font-heading font-bold text-lg text-foreground">GCE Campus</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `nav-item flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                    ${isActive 
                      ? 'active bg-sky-500/10 text-sky-500' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`
                  }
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
                <span className="text-sky-500 font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={logout}
              data-testid="logout-btn"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SidebarLayout;

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useEffect } from "react";
import "@/App.css";

// Auth Context
import { AuthProvider, useAuth } from "@/context/AuthContext";

// Admin Pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AddVehicle from "@/pages/admin/AddVehicle";
import VehiclesList from "@/pages/admin/VehiclesList";
import VehicleDetails from "@/pages/admin/VehicleDetails";
import Offences from "@/pages/admin/Offences";
import StudentOffences from "@/pages/admin/StudentOffences";
import Students from "@/pages/admin/Students";
import Drivers from "@/pages/admin/Drivers";
import Trips from "@/pages/admin/Trips";
import Bookings from "@/pages/admin/Bookings";
import RFIDDevices from "@/pages/admin/RFIDDevices";

// Driver Pages
import DriverHome from "@/pages/driver/DriverHome";
import BusLogin from "@/pages/driver/BusLogin";
import BusWork from "@/pages/driver/BusWork";
import AmbulanceLogin from "@/pages/driver/AmbulanceLogin";
import AmbulanceWork from "@/pages/driver/AmbulanceWork";
import DriverSignup from "@/pages/driver/DriverSignup";

// Public Pages
import PublicMap from "@/pages/public/PublicMap";
import PublicSignup from "@/pages/public/PublicSignup";
import PublicLogin from "@/pages/public/PublicLogin";

// Layout
import AdminLayout from "@/components/AdminLayout";

const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

const DriverProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }
  
  if (!user || user.role !== 'driver') {
    return <Navigate to="/driver" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public App Routes */}
      <Route path="/" element={<PublicMap />} />
      <Route path="/signup" element={<PublicSignup />} />
      <Route path="/login" element={<PublicLogin />} />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="add-vehicle" element={<AddVehicle />} />
        <Route path="vehicles" element={<VehiclesList />} />
        <Route path="vehicles/:id" element={<VehicleDetails />} />
        <Route path="offences" element={<Offences />} />
        <Route path="student-offences" element={<StudentOffences />} />
        <Route path="students" element={<Students />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="trips" element={<Trips />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="rfid-devices" element={<RFIDDevices />} />
      </Route>

      {/* Driver Routes */}
      <Route path="/driver" element={<DriverHome />} />
      <Route path="/driver/signup" element={<DriverSignup />} />
      <Route path="/driver/bus/login" element={<BusLogin />} />
      <Route path="/driver/ambulance/login" element={<AmbulanceLogin />} />
      <Route
        path="/driver/bus/work"
        element={
          <DriverProtectedRoute>
            <BusWork />
          </DriverProtectedRoute>
        }
      />
      <Route
        path="/driver/ambulance/work"
        element={
          <DriverProtectedRoute>
            <AmbulanceWork />
          </DriverProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="App dark">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster 
            position="top-center" 
            richColors 
            closeButton
            toastOptions={{
              className: 'dark:bg-card dark:text-foreground dark:border-border',
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;

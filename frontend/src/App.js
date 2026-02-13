import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import "@/App.css";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Vehicles from "@/pages/Vehicles";
import Students from "@/pages/Students";
import Drivers from "@/pages/Drivers";
import Offences from "@/pages/Offences";
import RFIDDevices from "@/pages/RFIDDevices";
import Trips from "@/pages/Trips";
import Bookings from "@/pages/Bookings";
import MapView from "@/pages/MapView";

// Layout
import SidebarLayout from "@/components/SidebarLayout";

// Auth context
import { AuthProvider, useAuth } from "@/context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SidebarLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="students" element={<Students />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="offences" element={<Offences />} />
        <Route path="rfid-devices" element={<RFIDDevices />} />
        <Route path="trips" element={<Trips />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="map" element={<MapView />} />
      </Route>
    </Routes>
  );
};

function App() {
  useEffect(() => {
    // Apply dark theme
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="App dark">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster 
            position="top-right" 
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

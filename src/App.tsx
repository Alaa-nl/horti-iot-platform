import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import ResearcherDashboard from './pages/ResearcherDashboard';
import GrowerDashboard from './pages/GrowerDashboard';
import StatisticsPage from './pages/StatisticsPage';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import RawSensorDisplay from './components/sensors/RawSensorDisplay';
import PlantBalanceDashboard from './pages/PlantBalanceDashboard';

// Protected Route Component with multiple allowed roles
const ProtectedRoute: React.FC<{
  children: React.ReactElement;
  allowedRoles?: ('admin' | 'researcher' | 'grower' | 'farmer')[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

// Main App Component with Routes
const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to={`/${user.role}`} replace /> : <Login />
      } />

      {/* Researcher Dashboard - accessible by all roles (researcher, grower/farmer, admin) */}
      <Route path="/researcher" element={
        <ProtectedRoute allowedRoles={['researcher', 'grower', 'farmer', 'admin']}>
          <ResearcherDashboard />
        </ProtectedRoute>
      } />

      <Route path="/researcher/statistics" element={
        <ProtectedRoute allowedRoles={['researcher', 'grower', 'farmer', 'admin']}>
          <StatisticsPage />
        </ProtectedRoute>
      } />

      {/* Educational Plant Balance Dashboard - accessible by all authenticated users */}
      <Route path="/algorithms" element={
        <ProtectedRoute allowedRoles={['researcher', 'grower', 'farmer', 'admin']}>
          <PlantBalanceDashboard />
        </ProtectedRoute>
      } />

      {/* Raw Sensor Data Display - accessible by all authenticated users */}
      <Route path="/sensors" element={
        <ProtectedRoute allowedRoles={['researcher', 'grower', 'farmer', 'admin']}>
          <RawSensorDisplay />
        </ProtectedRoute>
      } />

      {/* Grower/Farmer Dashboard - accessible by all roles (grower/farmer, researcher, admin) */}
      <Route path="/grower" element={
        <ProtectedRoute allowedRoles={['grower', 'farmer', 'researcher', 'admin']}>
          <GrowerDashboard />
        </ProtectedRoute>
      } />

      {/* Alias route for farmer (same as grower) */}
      <Route path="/farmer" element={
        <ProtectedRoute allowedRoles={['farmer', 'grower', 'researcher', 'admin']}>
          <GrowerDashboard />
        </ProtectedRoute>
      } />

      {/* Admin Dashboard - accessible only by admin */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Profile - accessible by all authenticated users */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />

      <Route path="/" element={
        user ? <Navigate to={`/${user.role}`} replace /> : <Navigate to="/login" replace />
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
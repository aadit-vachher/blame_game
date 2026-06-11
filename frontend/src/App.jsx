import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Toaster } from 'react-hot-toast';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Blames from './pages/Blames';
import CreateBlame from './pages/CreateBlame';
import BlameDetail from './pages/BlameDetail';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';

// Admin Pages
import UserManagement from './pages/admin/UserManagement';
import TeamManagement from './pages/admin/TeamManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import AuditLogs from './pages/admin/AuditLogs';

// Helper hook usage
import useAuth from './hooks/useAuth';

// Admin route protector
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-page flex items-center justify-center" style={{ height: '100vh', background: 'var(--color-bg)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          {/* Toast notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-sm)',
                borderRadius: 'var(--radius-md)',
              },
            }}
          />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Workspace Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/blames" element={<Blames />} />
              <Route path="/blames/create" element={<CreateBlame />} />
              <Route path="/blames/:id" element={<BlameDetail />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Protected Admin Insights */}
              <Route 
                path="/analytics" 
                element={
                  <AdminRoute>
                    <Analytics />
                  </AdminRoute>
                } 
              />
              
              {/* Protected Admin Management */}
              <Route 
                path="/admin/users" 
                element={
                  <AdminRoute>
                    <UserManagement />
                  </AdminRoute>
                } 
              />
              
              <Route 
                path="/admin/teams" 
                element={
                  <AdminRoute>
                    <TeamManagement />
                  </AdminRoute>
                } 
              />
              
              <Route 
                path="/admin/categories" 
                element={
                  <AdminRoute>
                    <CategoryManagement />
                  </AdminRoute>
                } 
              />
              
              <Route 
                path="/admin/audit-logs" 
                element={
                  <AdminRoute>
                    <AuditLogs />
                  </AdminRoute>
                } 
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

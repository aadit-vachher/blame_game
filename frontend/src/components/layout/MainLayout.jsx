import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ title }) => {
  const { user, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="loading-page flex items-center justify-center" style={{ height: '100vh', background: 'var(--color-bg)' }}>
        <div className="spinner" />
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex' }}>
      {/* Sidebar */}
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Main content wrapper */}
      <div style={{
        flex: 1,
        marginLeft: 'var(--sidebar-width)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}>
        {/* Header */}
        <Header title={title} toggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        {/* Content Body */}
        <main style={{
          padding: 'var(--space-6)',
          flex: 1,
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

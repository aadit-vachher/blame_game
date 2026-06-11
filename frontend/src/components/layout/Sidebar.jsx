import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  PlusCircle, 
  Bell, 
  BarChart3, 
  Users, 
  FolderTree, 
  ShieldAlert, 
  Settings,
  Flame
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();

  const activeStyle = {
    background: 'var(--color-sidebar-active)',
    color: 'white',
    fontWeight: '500',
  };

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    fontSize: 'var(--font-size-sm)',
    color: '#a3a8cc',
    borderRadius: 'var(--radius-md)',
    transition: 'all 0.15s ease',
    ...(isActive ? activeStyle : {}),
  });

  return (
    <aside className="sidebar" style={{
      width: 'var(--sidebar-width)',
      background: 'var(--color-sidebar)',
      color: 'white',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 101,
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '0 var(--space-6)',
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}>
          <Flame size={16} fill="white" />
        </div>
        <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, letterSpacing: '0.5px' }}>
          BLAME GAME
        </span>
      </div>

      {/* Navigation Links */}
      <div style={{
        flex: 1,
        padding: 'var(--space-4)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          color: '#555b85',
          textTransform: 'uppercase',
          padding: 'var(--space-2) var(--space-4)',
          letterSpacing: '1px',
        }}>
          Workspace
        </span>

        <NavLink to="/" style={linkStyle} end>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/blames" style={linkStyle} end>
          <AlertTriangle size={18} />
          Blames
        </NavLink>

        <NavLink to="/blames/create" style={linkStyle}>
          <PlusCircle size={18} />
          Raise Blame
        </NavLink>

        <NavLink to="/notifications" style={linkStyle}>
          <Bell size={18} />
          Notifications
        </NavLink>

        {isAdmin && (
          <>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#555b85',
              textTransform: 'uppercase',
              padding: 'var(--space-4) var(--space-4) var(--space-2)',
              letterSpacing: '1px',
            }}>
              Insights
            </span>
            <NavLink to="/analytics" style={linkStyle}>
              <BarChart3 size={18} />
              Analytics
            </NavLink>
          </>
        )}

        {isAdmin && (
          <>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#555b85',
              textTransform: 'uppercase',
              padding: 'var(--space-4) var(--space-4) var(--space-2)',
              letterSpacing: '1px',
            }}>
              Administration
            </span>

            <NavLink to="/admin/users" style={linkStyle}>
              <Users size={18} />
              User Settings
            </NavLink>

            <NavLink to="/admin/teams" style={linkStyle}>
              <FolderTree size={18} />
              Team Directory
            </NavLink>

            <NavLink to="/admin/categories" style={linkStyle}>
              <Settings size={18} />
              Categories
            </NavLink>

            <NavLink to="/admin/audit-logs" style={linkStyle}>
              <ShieldAlert size={18} />
              Audit Logs
            </NavLink>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div style={{
        padding: 'var(--space-4)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(0, 0, 0, 0.1)',
      }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: 'var(--font-size-xs)',
          }}>
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'white' }} className="truncate">
              {user?.name}
            </span>
            <span style={{ fontSize: '10px', color: '#686e96' }} className="truncate">
              {user?.role} Account
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

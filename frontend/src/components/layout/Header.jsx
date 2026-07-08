import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useNotifications from '../../hooks/useNotifications';
import { Bell, LogOut, User as UserIcon, ChevronDown, Menu } from 'lucide-react';

const Header = ({ title, toggleMobileSidebar }) => {
  const { user, logoutUser } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  return (
    <header className="header flex items-center justify-between" style={{
      height: 'var(--header-height)',
      background: 'var(--color-bg-secondary)',
      borderBottom: '1px solid var(--color-border-light)',
      padding: '0 var(--space-6)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          className="btn btn-ghost btn-sm mobile-menu-btn"
          onClick={toggleMobileSidebar}
        >
          <Menu size={20} />
        </button>
        
        <h1 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600 }}>{title || 'Blame Game'}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Icon */}
        <Link to="/notifications" className="btn btn-ghost btn-sm flex items-center justify-center" style={{
          position: 'relative',
          width: '32px',
          height: '32px',
          padding: 0,
          borderRadius: 'var(--radius-full)',
        }}>
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: 'var(--color-blocked)',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              minWidth: '16px',
              height: '16px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="flex items-center gap-2"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              padding: 'var(--space-1) var(--space-2)',
              borderRadius: 'var(--radius-md)',
              transition: 'background 0.15s ease',
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 'var(--font-size-xs)',
            }}>
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="text-left" style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, lineHeight: 1.2 }}>{user?.name}</span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{user?.team?.name || 'No Team'}</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay for closing dropdown */}
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 10 }} 
                onClick={() => setDropdownOpen(false)}
              />
              
              <div style={{
                position: 'absolute',
                right: 0,
                marginTop: 'var(--space-2)',
                width: '180px',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 20,
                padding: 'var(--space-1) 0',
              }}>
                <Link
                  to="/profile"
                  className="flex items-center gap-2"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                    transition: 'background 0.15s ease',
                    display: 'flex',
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--color-bg-tertiary)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <UserIcon size={16} />
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2"
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-blocked)',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                    display: 'flex',
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--color-blocked-bg)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

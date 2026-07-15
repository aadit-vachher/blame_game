import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';
import { Bell, CheckSquare, Clock, AlertTriangle, MessageSquare, Link as LinkIcon, HelpCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, loading, fetchNotifications } = useNotifications();
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    if (notif.blameId) {
      navigate(`/blames/${notif.blameId}`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'BLAME_CREATED':
      case 'BLAME_ASSIGNED':
        return <AlertTriangle size={16} style={{ color: 'var(--color-blocked)' }} />;
      case 'NEW_MESSAGE':
      case 'MENTIONED':
        return <MessageSquare size={16} style={{ color: 'var(--color-open)' }} />;
      case 'DEPENDENCY_ADDED':
        return <LinkIcon size={16} style={{ color: 'var(--color-warning)' }} />;
      case 'STATUS_CHANGED':
        return <CheckSquare size={16} style={{ color: 'var(--color-resolved)' }} />;
      default:
        return <Bell size={16} style={{ color: 'var(--color-text-muted)' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Notifications</h2>
          <p className="page-subtitle">Stay updated on blame assignments, discussions, and resolution updates.</p>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllAsRead} className="btn btn-secondary btn-sm">
            <CheckSquare size={14} /> Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="card" style={{ padding: 'var(--space-2)' }}>
        {loading && notifications.length === 0 ? (
          <div className="loading-page">
            <div className="spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell className="empty-state-icon" />
            <div className="empty-state-title">No notifications</div>
            <p style={{ fontSize: 'var(--font-size-xs)' }}>You're all caught up!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                style={{
                  borderBottom: '1px solid var(--color-border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0, flex: 1 }}>
                  {!notif.isRead && <div className="notification-dot" style={{ margin: 0 }} />}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: notif.isRead ? 'var(--color-bg-tertiary)' : 'var(--color-primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {getIcon(notif.type)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: notif.isRead ? 400 : 600 }} className="truncate">
                      {notif.title}
                    </span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }} className="truncate">
                      {notif.message}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '10px', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  <Clock size={10} />
                  <span>{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
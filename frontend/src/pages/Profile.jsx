import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { changePassword } from '../api/auth';
import { User, Key, Shield, HelpCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await changePassword(currentPassword, newPassword);
      if (response.success) {
        toast.success('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Failed to change password:', err);
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)' }}>
      {/* Profile Info Sidebar */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: 'fit-content' }}>
        <h3 className="card-title">Profile Info</h3>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-4) 0' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xl)',
            fontWeight: 700,
          }}>
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
          </div>
          <h4 style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>{user?.name}</h4>
          <span className="badge badge-low" style={{ textTransform: 'uppercase' }}>{user?.role}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Email Address</span>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{user?.email}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Employee ID</span>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{user?.employeeId}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Team Alignment</span>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{user?.team?.name || 'Unassigned'}</span>
          </div>
        </div>
      </div>

      {/* Password Reset Section */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Account Security</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="spinner" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
                  Updating Password...
                </>
              ) : (
                <>
                  <Key size={14} />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;

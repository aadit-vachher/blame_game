import React, { useState, useEffect } from 'react';
import { listUsers, createUser, updateUser, disableUser, enableUser, resetUserPassword, transferUserTeam } from '../../api/users';
import { listTeams } from '../../api/teams';
import { Search, UserPlus, Key, ArrowLeftRight, Check, X, Shield, Lock, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Filter State
  const [search, setSearch] = useState('');
  const [teamIdFilter, setTeamIdFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Selected user context
  const [selectedUser, setSelectedUser] = useState(null);

  // Create User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newTeamId, setNewTeamId] = useState('');
  const [newRole, setNewRole] = useState('USER');
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Reset Password State
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

  // Transfer Team State
  const [transferTeamId, setTransferTeamId] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search;
      if (teamIdFilter) params.teamId = teamIdFilter;
      if (roleFilter) params.role = roleFilter;
      
      const response = await listUsers(params);
      if (response.success) {
        setUsers(response.data.users || response.data); // Support both list structures
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, [search, teamIdFilter, roleFilter]);

  useEffect(() => {
    const fetchTeamsList = async () => {
      try {
        const response = await listTeams({ includeArchived: false });
        if (response.success) setTeams(response.data);
      } catch (err) {
        console.error('Failed to load teams:', err);
      }
    };
    fetchTeamsList();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newEmployeeId || !newPassword || !newTeamId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmittingCreate(true);
    try {
      const response = await createUser({
        name: newName,
        email: newEmail,
        employeeId: newEmployeeId,
        password: newPassword,
        teamId: newTeamId,
        role: newRole,
      });

      if (response.success) {
        toast.success('User account created successfully');
        setShowCreateModal(false);
        setNewName('');
        setNewEmail('');
        setNewEmployeeId('');
        setNewPassword('');
        setNewTeamId('');
        setNewRole('USER');
        fetchUsersData();
      }
    } catch (err) {
      console.error('Failed to create user:', err);
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleToggleStatus = async (userObj) => {
    try {
      if (userObj.status === 'ACTIVE') {
        const response = await disableUser(userObj.id);
        if (response.success) {
          toast.success(`Account for ${userObj.name} has been disabled`);
          fetchUsersData();
        }
      } else {
        const response = await enableUser(userObj.id);
        if (response.success) {
          toast.success(`Account for ${userObj.name} has been enabled`);
          fetchUsersData();
        }
      }
    } catch (err) {
      console.error('Failed to toggle user status:', err);
      toast.error('Failed to toggle status');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPasswordVal.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmittingReset(true);
    try {
      const response = await resetUserPassword(selectedUser.id, resetPasswordVal);
      if (response.success) {
        toast.success(`Password reset for ${selectedUser.name}`);
        setShowResetModal(false);
        setResetPasswordVal('');
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Failed to reset password:', err);
      toast.error('Failed to reset password');
    } finally {
      setSubmittingReset(false);
    }
  };

  const handleTransferTeam = async (e) => {
    e.preventDefault();
    if (!transferTeamId) {
      toast.error('Please select a team');
      return;
    }

    setSubmittingTransfer(true);
    try {
      const response = await transferUserTeam(selectedUser.id, transferTeamId);
      if (response.success) {
        toast.success(`${selectedUser.name} transferred to new team`);
        setShowTransferModal(false);
        setTransferTeamId('');
        setSelectedUser(null);
        fetchUsersData();
      }
    } catch (err) {
      console.error('Failed to transfer user team:', err);
      toast.error('Failed to transfer team');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">User Directory</h2>
          <p className="page-subtitle">Configure user credentials, team alignments, and authorization roles.</p>
        </div>
        
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <UserPlus size={16} /> Create User Account
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div style={{ display: 'flex', flex: 1, minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '32px' }}
          />
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
        </div>

        <select
          value={teamIdFilter}
          onChange={(e) => setTeamIdFilter(e.target.value)}
          className="form-select"
        >
          <option value="">All Teams</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="form-select"
        >
          <option value="">All Roles</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      {/* Users List Grid */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-page">
            <div className="spinner" />
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <Shield className="empty-state-icon" />
            <div className="empty-state-title">No users found</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontFamily: 'monospace' }}>{u.employeeId}</td>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-critical' : 'badge-low'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.team?.name || <em style={{ color: 'var(--color-text-muted)' }}>Unassigned</em>}</td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-resolved' : 'badge-closed'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: u.status === 'ACTIVE' ? 'var(--color-blocked)' : 'var(--color-success)' }}
                          title={u.status === 'ACTIVE' ? 'Disable Account' : 'Enable Account'}
                        >
                          {u.status === 'ACTIVE' ? <X size={16} /> : <Check size={16} />}
                        </button>
                        
                        <button
                          onClick={() => { setSelectedUser(u); setShowResetModal(true); }}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-discussion)' }}
                          title="Reset Password"
                        >
                          <Key size={16} />
                        </button>

                        <button
                          onClick={() => { setSelectedUser(u); setTransferTeamId(u.teamId || ''); setShowTransferModal(true); }}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-primary)' }}
                          title="Transfer Team"
                        >
                          <ArrowLeftRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Create User Account</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Employee ID *</label>
                    <input
                      type="text"
                      placeholder="e.g. EMP-104"
                      value={newEmployeeId}
                      onChange={(e) => setNewEmployeeId(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Team Assignment *</label>
                    <select
                      value={newTeamId}
                      onChange={(e) => setNewTeamId(e.target.value)}
                      className="form-select"
                      required
                    >
                      <option value="">Select team</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Authorization Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="form-select"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" disabled={submittingCreate}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submittingCreate}>
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Reset User Password</h3>
              <button onClick={() => { setShowResetModal(false); setSelectedUser(null); }} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleResetPassword}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--font-size-xs)' }}>
                  Set a new password for account <strong>{selectedUser.name}</strong> ({selectedUser.email}).
                </p>

                <div className="form-group">
                  <label className="form-label">New Password *</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => { setShowResetModal(false); setSelectedUser(null); }} className="btn btn-secondary" disabled={submittingReset}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submittingReset}>
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER TEAM MODAL */}
      {showTransferModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Transfer Team</h3>
              <button onClick={() => { setShowTransferModal(false); setSelectedUser(null); }} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleTransferTeam}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--font-size-xs)' }}>
                  Transfer employee <strong>{selectedUser.name}</strong> from their current team to another team.
                </p>

                <div className="form-group">
                  <label className="form-label">New Team Alignment *</label>
                  <select
                    value={transferTeamId}
                    onChange={(e) => setTransferTeamId(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Select team</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => { setShowTransferModal(false); setSelectedUser(null); }} className="btn btn-secondary" disabled={submittingTransfer}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submittingTransfer}>
                  Transfer Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

import React, { useState, useEffect } from 'react';
import { listTeams, createTeam, updateTeam, archiveTeam, getTeamMembers } from '../../api/teams';
import { Plus, FolderTree, Trash2, Edit2, Users, Calendar, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create / Edit modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await listTeams({ includeArchived: true });
      if (response.success) {
        setTeams(response.data);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
      toast.error('Failed to load team list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName) {
      toast.error('Team name is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createTeam({ name: teamName, description: teamDesc });
      if (response.success) {
        toast.success('Team created successfully');
        setShowCreateModal(false);
        setTeamName('');
        setTeamDesc('');
        fetchTeams();
      }
    } catch (err) {
      console.error('Failed to create team:', err);
      toast.error(err.response?.data?.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTeam = async (e) => {
    e.preventDefault();
    if (!teamName) {
      toast.error('Team name is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await updateTeam(selectedTeam.id, { name: teamName, description: teamDesc });
      if (response.success) {
        toast.success('Team details updated successfully');
        setShowEditModal(false);
        setTeamName('');
        setTeamDesc('');
        setSelectedTeam(null);
        fetchTeams();
      }
    } catch (err) {
      console.error('Failed to update team:', err);
      toast.error(err.response?.data?.message || 'Failed to update team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveTeam = async (team) => {
    if (team._count?.members > 0) {
      toast.error('Cannot archive team with active members. Reassign members first.');
      return;
    }

    if (!window.confirm(`Are you sure you want to archive team: ${team.name}?`)) return;

    try {
      const response = await archiveTeam(team.id);
      toast.success('Team archived successfully');
      fetchTeams();
    } catch (err) {
      console.error('Failed to archive team:', err);
      toast.error(err.response?.data?.message || 'Failed to archive team');
    }
  };

  const handleOpenEdit = (team) => {
    setSelectedTeam(team);
    setTeamName(team.name);
    setTeamDesc(team.description || '');
    setShowEditModal(true);
  };

  const handleOpenRoster = async (team) => {
    setSelectedTeam(team);
    setShowRosterModal(true);
    setLoadingRoster(true);
    try {
      const response = await getTeamMembers(team.id);
      if (response.success) {
        setRoster(response.data);
      }
    } catch (err) {
      console.error('Failed to load roster:', err);
      toast.error('Failed to load team roster');
    } finally {
      setLoadingRoster(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Team Directory</h2>
          <p className="page-subtitle">Configure organization departments, review rosters, and toggle operational status.</p>
        </div>
        
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> Create New Team
        </button>
      </div>

      {/* Teams Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-page">
            <div className="spinner" />
          </div>
        ) : teams.length === 0 ? (
          <div className="empty-state">
            <FolderTree className="empty-state-icon" />
            <div className="empty-state-title">No teams registered</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Description</th>
                  <th>Member Count</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td style={{ color: 'var(--color-text-secondary)', maxWidth: '300px' }} className="truncate" title={t.description}>
                      {t.description || <em style={{ color: 'var(--color-text-muted)' }}>No description</em>}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleOpenRoster(t)}
                        className="btn btn-ghost btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--color-primary)' }}
                      >
                        <Users size={14} />
                        {t._count?.members || 0} members
                      </button>
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'ACTIVE' ? 'badge-resolved' : 'badge-closed'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>
                      {format(new Date(t.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-primary)' }}
                          title="Edit Team"
                        >
                          <Edit2 size={16} />
                        </button>
                        
                        {t.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleArchiveTeam(t)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-blocked)' }}
                            title="Archive Team"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Team Profile</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTeam}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Team Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Warehouse Operations"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    placeholder="Describe team responsibilities, scopes..."
                    value={teamDesc}
                    onChange={(e) => setTeamDesc(e.target.value)}
                    className="form-textarea"
                    style={{ minHeight: '80px' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedTeam && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Team Details</h3>
              <button onClick={() => { setShowEditModal(false); setSelectedTeam(null); }} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditTeam}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Team Name *</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={teamDesc}
                    onChange={(e) => setTeamDesc(e.target.value)}
                    className="form-textarea"
                    style={{ minHeight: '80px' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedTeam(null); }} className="btn btn-secondary" disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROSTER MODAL */}
      {showRosterModal && selectedTeam && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedTeam.name} Roster</h3>
              <button onClick={() => { setShowRosterModal(false); setRoster([]); setSelectedTeam(null); }} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto', padding: 'var(--space-4)' }}>
              {loadingRoster ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="spinner" />
                </div>
              ) : roster.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-4)' }}>
                  <Users className="empty-state-icon" />
                  <div className="empty-state-title">No active team members</div>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Emp ID</th>
                        <th>Name</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map(member => (
                        <tr key={member.id}>
                          <td style={{ fontFamily: 'monospace' }}>{member.employeeId}</td>
                          <td style={{ fontWeight: 500 }}>{member.name}</td>
                          <td>
                            <span className={`badge ${member.role === 'ADMIN' ? 'badge-critical' : 'badge-low'}`}>
                              {member.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => { setShowRosterModal(false); setRoster([]); setSelectedTeam(null); }} className="btn btn-secondary">
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;

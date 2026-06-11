import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listBlames } from '../api/blames';
import { listTeams } from '../api/teams';
import { AlertTriangle, PlusCircle, CheckCircle2, Flame, Loader2, ArrowRight } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    blocked: 0,
    resolved: 0,
  });
  const [recentBlames, setRecentBlames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch stats in parallel by querying count with limit 1
        const [totalRes, openRes, blockedRes, resolvedRes, recentRes] = await Promise.all([
          listBlames({ limit: 1 }),
          listBlames({ status: 'OPEN', limit: 1 }),
          listBlames({ status: 'BLOCKED', limit: 1 }),
          listBlames({ status: 'RESOLVED', limit: 1 }),
          listBlames({ limit: 5 }),
        ]);

        setStats({
          total: totalRes.data.total || 0,
          open: openRes.data.total || 0,
          blocked: blockedRes.data.total || 0,
          resolved: resolvedRes.data.total || 0,
        });

        setRecentBlames(recentRes.data.blames || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <Loader2 className="spinner" />
      </div>
    );
  }

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'LOW': return 'badge badge-low';
      case 'MEDIUM': return 'badge badge-medium';
      case 'HIGH': return 'badge badge-high';
      case 'CRITICAL': return 'badge badge-critical';
      default: return 'badge';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'OPEN': return 'badge badge-open';
      case 'IN_DISCUSSION': return 'badge badge-in_discussion';
      case 'BLOCKED': return 'badge badge-blocked';
      case 'RESOLVED': return 'badge badge-resolved';
      case 'CLOSED': return 'badge badge-closed';
      default: return 'badge';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Welcome Banner */}
      <div className="card flex items-center justify-between" style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, #3d4dd0 100%)',
        color: 'white',
        border: 'none',
      }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
            Welcome back, {user?.name}!
          </h2>
          <p style={{ opacity: 0.8, fontSize: 'var(--font-size-sm)' }}>
            Track cross-team blockers, resolve operational delays, and view dependency chains.
          </p>
        </div>
        <button
          onClick={() => navigate('/blames/create')}
          className="btn"
          style={{ background: 'white', color: 'var(--color-primary)' }}
        >
          <PlusCircle size={16} />
          Raise Blame
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Blames</div>
          <div className="stat-card-value">{stats.total}</div>
          <div className="stat-card-sub">All logged occurrences</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-open)' }}>
          <div className="stat-card-label">Open</div>
          <div className="stat-card-value" style={{ color: 'var(--color-open)' }}>{stats.open}</div>
          <div className="stat-card-sub">Needs attention</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-blocked)' }}>
          <div className="stat-card-label">Blocked</div>
          <div className="stat-card-value" style={{ color: 'var(--color-blocked)' }}>{stats.blocked}</div>
          <div className="stat-card-sub">Critical blocker active</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-resolved)' }}>
          <div className="stat-card-label">Resolved</div>
          <div className="stat-card-value" style={{ color: 'var(--color-resolved)' }}>{stats.resolved}</div>
          <div className="stat-card-sub">Successfully resolved</div>
        </div>
      </div>

      {/* Main Grid: Recent Blames & Blame Guide */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 'var(--space-6)',
      }}>
        {/* Recent Blames */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="flex items-center justify-between">
            <h3 className="card-title">Recent Blames</h3>
            <Link to="/blames" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {recentBlames.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 className="empty-state-icon" style={{ color: 'var(--color-resolved)' }} />
              <div className="empty-state-title">All clean! No recent blames raised.</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table table-clickable">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Blamed Team</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Raised</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBlames.map((blame) => (
                    <tr key={blame.id} onClick={() => navigate(`/blames/${blame.id}`)}>
                      <td style={{ fontWeight: 500 }}>{blame.title}</td>
                      <td>{blame.blamedTeam?.name}</td>
                      <td>
                        <span className={getPriorityBadgeClass(blame.priority)}>
                          {blame.priority}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(blame.status)}>
                          {blame.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                        {formatDistanceToNow(new Date(blame.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Accountability Guidelines */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 className="card-title">Product Philosophy</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            The purpose of <strong>Blame Game</strong> is to provide structured visibility into operational friction.
          </p>
          <ul style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            paddingLeft: 'var(--space-4)',
            listStyleType: 'disc',
          }}>
            <li>Identify team dependencies early.</li>
            <li>Collaborate inside discussion threads rather than pointing fingers.</li>
            <li>Maintain data integrity by documenting hours lost.</li>
            <li>Help leadership allocate resources to bottlenecks.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { listAuditLogs } from '../../api/audit';
import { ShieldAlert, Search, Calendar, ChevronDown, ChevronUp, Clock, Eye, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Filter States
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
      };
      
      if (action) params.action = action;
      if (entityType) params.entityType = entityType;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await listAuditLogs(params);
      if (response.success && response.data) {
        setLogs(response.data.logs);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      toast.error('Failed to fetch audit log trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action, entityType, dateFrom, dateTo]);

  const toggleExpandLog = (id) => {
    if (expandedLogId === id) {
      setExpandedLogId(null);
    } else {
      setExpandedLogId(id);
    }
  };

  const getActionBadgeClass = (action) => {
    if (action.includes('CREATED')) return 'badge badge-open';
    if (action.includes('UPDATED')) return 'badge badge-in_discussion';
    if (action.includes('DELETED') || action.includes('ARCHIVED') || action.includes('DISABLED') || action.includes('DEACTIVATED')) return 'badge badge-blocked';
    if (action.includes('RESOLVED') || action.includes('CHANGED')) return 'badge badge-resolved';
    return 'badge';
  };

  // Helper to format JSON values pretty-printed
  const formatJSONValue = (val) => {
    if (!val) return 'None';
    try {
      if (typeof val === 'string') {
        const parsed = JSON.parse(val);
        return JSON.stringify(parsed, null, 2);
      }
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Security & Audit Logs</h2>
          <p className="page-subtitle">Immutable system log mapping all user actions, state updates, and configuration adjustments.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="form-select"
          style={{ minWidth: '180px' }}
        >
          <option value="">All Actions</option>
          <option value="BLAME_CREATED">BLAME_CREATED</option>
          <option value="BLAME_UPDATED">BLAME_UPDATED</option>
          <option value="BLAME_STATUS_CHANGED">BLAME_STATUS_CHANGED</option>
          <option value="DEPENDENCY_ADDED">DEPENDENCY_ADDED</option>
          <option value="DEPENDENCY_REMOVED">DEPENDENCY_REMOVED</option>
          <option value="USER_CREATED">USER_CREATED</option>
          <option value="USER_UPDATED">USER_UPDATED</option>
          <option value="USER_DISABLED">USER_DISABLED</option>
          <option value="USER_ENABLED">USER_ENABLED</option>
          <option value="TEAM_CREATED">TEAM_CREATED</option>
          <option value="TEAM_UPDATED">TEAM_UPDATED</option>
          <option value="TEAM_ARCHIVED">TEAM_ARCHIVED</option>
          <option value="CATEGORY_CREATED">CATEGORY_CREATED</option>
          <option value="CATEGORY_UPDATED">CATEGORY_UPDATED</option>
          <option value="CATEGORY_DEACTIVATED">CATEGORY_DEACTIVATED</option>
        </select>

        <select
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          className="form-select"
          style={{ minWidth: '150px' }}
        >
          <option value="">All Entity Types</option>
          <option value="Blame">Blame</option>
          <option value="Dependency">Dependency</option>
          <option value="User">User</option>
          <option value="Team">Team</option>
          <option value="Category">Category</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="form-input"
            style={{ width: '130px' }}
          />
          <span style={{ color: 'var(--color-text-muted)' }}>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="form-input"
            style={{ width: '130px' }}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-page">
            <div className="spinner" />
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <ShieldAlert className="empty-state-icon" />
            <div className="empty-state-title">No audit logs found</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }} />
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr 
                      onClick={() => toggleExpandLog(log.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        {expandedLogId === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                        {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {log.user ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{log.user.name}</span>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{log.user.email}</span>
                          </div>
                        ) : (
                          <em style={{ color: 'var(--color-text-muted)' }}>System / Anonymous</em>
                        )}
                      </td>
                      <td>
                        <span className={getActionBadgeClass(log.action)}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{log.entityType}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }} title={log.entityId}>
                        {log.entityId?.substring(0, 8)}...
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                        {log.ipAddress || 'Internal'}
                      </td>
                    </tr>
                    
                    {/* EXPANDED CHANGES PANEL */}
                    {expandedLogId === log.id && (
                      <tr>
                        <td colSpan={7} style={{ background: 'var(--color-bg-tertiary)', padding: 'var(--space-4) var(--space-8)' }}>
                          <div className="grid-1-1">
                            <div>
                              <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Pre-State Value (Old)
                              </h4>
                              <pre style={{
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-3)',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                overflowX: 'auto',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                                color: 'var(--color-text-secondary)',
                                maxHeight: '200px',
                                overflowY: 'auto',
                              }}>
                                {formatJSONValue(log.oldValue)}
                              </pre>
                            </div>
                            <div>
                              <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Post-State Value (New)
                              </h4>
                              <pre style={{
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-3)',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                overflowX: 'auto',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                                color: 'var(--color-text)',
                                maxHeight: '200px',
                                overflowY: 'auto',
                              }}>
                                {formatJSONValue(log.newValue)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary btn-sm"
            style={{ width: '32px', height: '32px', padding: 0 }}
          >
            <ChevronLeft size={16} />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`pagination-btn ${page === p ? 'active' : ''}`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-secondary btn-sm"
            style={{ width: '32px', height: '32px', padding: 0 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listBlames } from '../api/blames';
import { listTeams } from '../api/teams';
import { listCategories } from '../api/categories';
import { Search, PlusCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const Blames = () => {
  const navigate = useNavigate();
  const [blames, setBlames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Search & Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [creatorTeamId, setCreatorTeamId] = useState('');
  const [blamedTeamId, setBlamedTeamId] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  // Load dropdown lists (teams and categories)
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [teamsRes, catsRes] = await Promise.all([
          listTeams({ includeArchived: true }),
          listCategories(),
        ]);
        if (teamsRes.success) setTeams(teamsRes.data);
        if (catsRes.success) setCategories(catsRes.data);
      } catch (err) {
        console.error('Failed to load filter dropdowns:', err);
      }
    };
    loadDropdownData();
  }, []);

  // Fetch blames when filters or page changes
  const fetchBlamesData = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search;
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (categoryId) params.categoryId = categoryId;
      if (creatorTeamId) params.creatorTeamId = creatorTeamId;
      if (blamedTeamId) params.blamedTeamId = blamedTeamId;

      const response = await listBlames(params);
      if (response.success && response.data) {
        setBlames(response.data.blames);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch blames:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlamesData();
  }, [page, status, priority, categoryId, creatorTeamId, blamedTeamId, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBlamesData();
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Blame Registry</h2>
          <p className="page-subtitle">Track, filter, and review team blockers and resolutions.</p>
        </div>
        <button
          onClick={() => navigate('/blames/create')}
          className="btn btn-primary"
        >
          <PlusCircle size={16} />
          Raise Blame
        </button>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="filter-bar">
        <div style={{ display: 'flex', flex: 1, minWidth: '200px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search blames..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '32px' }}
          />
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="form-select"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_DISCUSSION">In Discussion</option>
          <option value="BLOCKED">Blocked</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value); setPage(1); }}
          className="form-select"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>

        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          className="form-select"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={creatorTeamId}
          onChange={(e) => { setCreatorTeamId(e.target.value); setPage(1); }}
          className="form-select"
        >
          <option value="">Raised By (Team)</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select
          value={blamedTeamId}
          onChange={(e) => { setBlamedTeamId(e.target.value); setPage(1); }}
          className="form-select"
        >
          <option value="">Against (Team)</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split(':');
            setSortBy(field);
            setSortOrder(order);
            setPage(1);
          }}
          className="form-select"
        >
          <option value="createdAt:desc">Created: Newest First</option>
          <option value="createdAt:asc">Created: Oldest First</option>
          <option value="updatedAt:desc">Updated: Newest First</option>
          <option value="priority:desc">Priority: High to Low</option>
        </select>
        
        <button type="submit" className="btn btn-secondary btn-sm" style={{ display: 'none' }}>
          Search
        </button>
      </form>

      {/* Blames Table / List */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-page">
            <div className="spinner" />
          </div>
        ) : blames.length === 0 ? (
          <div className="empty-state">
            <AlertCircle className="empty-state-icon" />
            <div className="empty-state-title">No blames found</div>
            <p style={{ fontSize: 'var(--font-size-sm)' }}>Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table table-clickable">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Raised By</th>
                  <th>Against</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Dependencies</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {blames.map((blame) => (
                  <tr key={blame.id} onClick={() => navigate(`/blames/${blame.id}`)}>
                    <td style={{ fontWeight: 500, maxWidth: '280px' }} className="truncate" title={blame.title}>
                      {blame.title}
                    </td>
                    <td>{blame.category?.name}</td>
                    <td>{blame.creatorTeam?.name}</td>
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
                    <td style={{ textAlign: 'center', fontWeight: 600, color: blame._count.dependencies > 0 ? 'var(--color-blocked)' : 'inherit' }}>
                      {blame._count.dependencies}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>
                      {format(new Date(blame.createdAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
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

export default Blames;

import React, { useState, useEffect } from 'react';
import { 
  getOverviewAnalytics, 
  getTeamsAnalytics, 
  getCategoriesAnalytics, 
  getProductivityAnalytics, 
  getTrendsAnalytics 
} from '../api/analytics';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { BarChart3, Clock, AlertOctagon, TrendingUp, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#4f5fe0', '#10b981', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6', '#ec4899'];

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  const [overviewData, setOverviewData] = useState(null);
  const [teamsData, setTeamsData] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [productivityData, setProductivityData] = useState(null);
  const [trendsData, setTrendsData] = useState([]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, teamsRes, catsRes, prodRes, trendsRes] = await Promise.all([
        getOverviewAnalytics(),
        getTeamsAnalytics(),
        getCategoriesAnalytics(),
        getProductivityAnalytics(),
        getTrendsAnalytics(),
      ]);

      if (overviewRes.success) setOverviewData(overviewRes.data);
      if (teamsRes.success) setTeamsData(teamsRes.data);
      if (catsRes.success) setCategoriesData(catsRes.data);
      if (prodRes.success) setProductivityData(prodRes.data);
      if (trendsRes.success) setTrendsData(trendsRes.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      toast.error('Failed to load analytics reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <Loader2 className="spinner" />
      </div>
    );
  }

  // Pre-process data
  const mostBlamedTeams = teamsData.mostBlamed || [];
  const mostBlamingTeams = teamsData.mostBlaming || [];
  const categoryDistribution = categoriesData.distribution || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Executive Analytics</h2>
          <p className="page-subtitle">Identify cross-team bottlenecks, compute hours lost, and track resolution trends.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          Team Bottlenecks
        </button>
        <button 
          className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button 
          className={`tab ${activeTab === 'productivity' ? 'active' : ''}`}
          onClick={() => setActiveTab('productivity')}
        >
          Productivity Impact
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Key Stat Cards */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-card-label">Total Blames Raised</div>
              <div className="stat-card-value">{overviewData?.total || 0}</div>
              <div className="stat-card-sub">All time logged records</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid var(--color-open)' }}>
              <div className="stat-card-label">Open / In Progress</div>
              <div className="stat-card-value" style={{ color: 'var(--color-open)' }}>
                {(overviewData?.open || 0) + (overviewData?.inDiscussion || 0)}
              </div>
              <div className="stat-card-sub">Under active assessment</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid var(--color-critical)' }}>
              <div className="stat-card-label">Critical / Blocked</div>
              <div className="stat-card-value" style={{ color: 'var(--color-critical)' }}>
                {overviewData?.critical || 0}
              </div>
              <div className="stat-card-sub">Severe operational blockers</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
              <div className="stat-card-label">Average Resolution Time</div>
              <div className="stat-card-value" style={{ color: 'var(--color-success)', fontSize: '1.25rem', paddingTop: '6px' }}>
                {overviewData?.avgResolutionTimeDays ? `${overviewData.avgResolutionTimeDays.toFixed(1)} days` : 'N/A'}
              </div>
              <div className="stat-card-sub">Calculated from resolved blames</div>
            </div>
          </div>

          {/* Trend Line Chart */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Blame Frequency Trend</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f6" />
                  <XAxis dataKey="month" stroke="#8b90a5" fontSize={11} />
                  <YAxis stroke="#8b90a5" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="count" name="Raised Blames" stroke="#4f5fe0" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="resolvedCount" name="Resolved Blames" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TEAMS TAB */}
      {activeTab === 'teams' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {/* Most Blamed (Bottlenecks) */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Top Blamed Teams (Bottlenecks)</h3>
            {mostBlamedTeams.length === 0 ? (
              <div className="empty-state">No team records found.</div>
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={mostBlamedTeams}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f6" />
                    <XAxis dataKey="teamName" stroke="#8b90a5" fontSize={11} />
                    <YAxis stroke="#8b90a5" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 'var(--radius-md)' }} />
                    <Bar dataKey="blameCount" name="Blames Against" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Most Blaming (Affected Teams) */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Top Blaming Teams (Most Affected)</h3>
            {mostBlamingTeams.length === 0 ? (
              <div className="empty-state">No team records found.</div>
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={mostBlamingTeams}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f6" />
                    <XAxis dataKey="teamName" stroke="#8b90a5" fontSize={11} />
                    <YAxis stroke="#8b90a5" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 'var(--radius-md)' }} />
                    <Bar dataKey="blameCount" name="Blames Raised" fill="#4f5fe0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)' }}>
          {/* Category Distribution Pie */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Blame Categories Distribution</h3>
            {categoryDistribution.length === 0 ? (
              <div className="empty-state">No category records found.</div>
            ) : (
              <div className="flex items-center justify-between" style={{ height: 300 }}>
                <div style={{ width: '55%', height: '100%' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="categoryName"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {categoryDistribution.map((entry, index) => (
                    <div key={entry.categoryId} className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-xs)' }}>
                      <div style={{ width: '10px', height: '10px', background: COLORS[index % COLORS.length], borderRadius: '50%' }} />
                      <span style={{ fontWeight: 500 }}>{entry.categoryName}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>({entry.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 className="card-title">Category Insights</h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Review which classifications generate the most friction.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
              <div className="flex items-start gap-2" style={{ fontSize: 'var(--font-size-xs)' }}>
                <div style={{ marginTop: '3px' }}><div style={{ width: '6px', height: '6px', background: 'var(--color-primary)', borderRadius: '50%' }} /></div>
                <span><strong>System Issues</strong>: Represent tooling dependencies. High volumes indicate software infrastructure requirements.</span>
              </div>
              <div className="flex items-start gap-2" style={{ fontSize: 'var(--font-size-xs)' }}>
                <div style={{ marginTop: '3px' }}><div style={{ width: '6px', height: '6px', background: 'var(--color-primary)', borderRadius: '50%' }} /></div>
                <span><strong>Operational Delays</strong>: Indicate staffing, supply chain, or handoff issues.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTIVITY TAB */}
      {activeTab === 'productivity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Productivity Stats */}
          <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="stat-card" style={{ borderLeft: '4px solid var(--color-blocked)' }}>
              <div className="stat-card-label">Aggregated Hours Lost</div>
              <div className="stat-card-value" style={{ color: 'var(--color-blocked)' }}>
                {productivityData?.totalHoursLost ? `${productivityData.totalHoursLost.toFixed(1)} hrs` : '0.0 hrs'}
              </div>
              <div className="stat-card-sub">Sum of estimated team delays</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
              <div className="stat-card-label">Total Employees Affected</div>
              <div className="stat-card-value" style={{ color: 'var(--color-warning)' }}>
                {productivityData?.totalEmployeesAffected || 0} staff
              </div>
              <div className="stat-card-sub">Sum of impacted staff members</div>
            </div>
          </div>

          {/* Hours Lost per Team */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Hours Lost per Team due to Blockers</h3>
            {!productivityData?.hoursLostByTeam || productivityData.hoursLostByTeam.length === 0 ? (
              <div className="empty-state">No productivity logs available.</div>
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={productivityData.hoursLostByTeam}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f6" />
                    <XAxis dataKey="teamName" stroke="#8b90a5" fontSize={11} />
                    <YAxis stroke="#8b90a5" fontSize={11} />
                    <Tooltip contentStyle={{ borderRadius: 'var(--radius-md)' }} />
                    <Bar dataKey="totalHours" name="Total Hours Lost" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBlameById, changeBlameStatus, updateBlame } from '../api/blames';
import { listTeams } from '../api/teams';
import { listCategories } from '../api/categories';
import { listDiscussionMessages, createDiscussionMessage } from '../api/discussions';
import { getDependencyChain, createDependency, removeDependency } from '../api/dependencies';
import { uploadAttachment, deleteAttachment, getAttachmentDownloadUrl } from '../api/attachments';
import { 
  ArrowLeft, Calendar, User, Clock, Users, Tag, AlertTriangle, FileText, 
  MessageSquare, Paperclip, Send, Plus, Trash2, ShieldAlert, CheckCircle2,
  FolderLock, RefreshCw, X, Link as LinkIcon, Download, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';

const BlameDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [blame, setBlame] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chain, setChain] = useState({ nodes: [], dependencies: [], isCircular: false });
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);

  // UI Control
  const [activeTab, setActiveTab] = useState('discussion');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Form States
  const [commentText, setCommentText] = useState('');
  const [commentFile, setCommentFile] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit Blame Form States
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImpactDescription, setEditImpactDescription] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editHoursLost, setEditHoursLost] = useState('');
  const [editAffected, setEditAffected] = useState('');
  const [editImpactNotes, setEditImpactNotes] = useState('');
  const [updatingBlame, setUpdatingBlame] = useState(false);

  // Dependency Form States
  const [showDepModal, setShowDepModal] = useState(false);
  const [depBlockedTeamId, setDepBlockedTeamId] = useState('');
  const [depBlockedByTeamId, setDepBlockedByTeamId] = useState('');
  const [depReason, setDepReason] = useState('');
  const [depNotes, setDepNotes] = useState('');
  const [submittingDep, setSubmittingDep] = useState(false);

  // Direct Attachment Form State
  const [directFile, setDirectFile] = useState(null);
  const [uploadingDirectFile, setUploadingDirectFile] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [blameRes, chainRes, messagesRes, teamsRes, catsRes] = await Promise.all([
        getBlameById(id),
        getDependencyChain(id),
        listDiscussionMessages(id),
        listTeams({ includeArchived: false }),
        listCategories(),
      ]);

      if (blameRes.success) {
        setBlame(blameRes.data);
        setEditTitle(blameRes.data.title);
        setEditDescription(blameRes.data.description);
        setEditImpactDescription(blameRes.data.impactDescription);
        setEditPriority(blameRes.data.priority);
        setEditCategoryId(blameRes.data.categoryId);
        setEditHoursLost(blameRes.data.estimatedHoursLost || '');
        setEditAffected(blameRes.data.employeesAffected || '');
        setEditImpactNotes(blameRes.data.businessImpactNotes || '');
      }

      if (chainRes.success) {
        setChain(chainRes.data);
      }

      if (messagesRes.success) {
        setMessages(messagesRes.data.messages);
      }

      if (teamsRes.success) {
        setTeams(teamsRes.data);
      }

      if (catsRes.success) {
        setCategories(catsRes.data);
      }

    } catch (err) {
      console.error('Failed to fetch blame details:', err);
      toast.error('Failed to load blame details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleStatusTransition = async (newStatus) => {
    try {
      const response = await changeBlameStatus(id, newStatus);
      if (response.success) {
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleUpdateBlame = async (e) => {
    e.preventDefault();
    setUpdatingBlame(true);
    try {
      const payload = {
        title: editTitle,
        description: editDescription,
        impactDescription: editImpactDescription,
        priority: editPriority,
        categoryId: editCategoryId,
        estimatedHoursLost: editHoursLost ? parseFloat(editHoursLost) : null,
        employeesAffected: editAffected ? parseInt(editAffected) : null,
        businessImpactNotes: editImpactNotes || null,
      };

      const response = await updateBlame(id, payload);
      if (response.success) {
        toast.success('Blame updated successfully');
        setEditMode(false);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update blame:', err);
      toast.error(err.response?.data?.message || 'Failed to update blame');
    } finally {
      setUpdatingBlame(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const msgRes = await createDiscussionMessage(id, { content: commentText });
      if (msgRes.success && msgRes.data) {
        const messageId = msgRes.data.id;

        if (commentFile) {
          try {
            await uploadAttachment(commentFile, { messageId });
          } catch (fileErr) {
            console.error('Comment file upload failed:', fileErr);
            toast.error('Comment posted, but file upload failed');
          }
        }

        setCommentText('');
        setCommentFile(null);
        toast.success('Comment posted');
        
        // Refresh messages
        const messagesRes = await listDiscussionMessages(id);
        if (messagesRes.success) setMessages(messagesRes.data.messages);
        
        // Auto status check - if comment was posted on OPEN blame, it auto transitions to IN_DISCUSSION
        if (blame.status === 'OPEN') {
          fetchData();
        }
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddDependency = async (e) => {
    e.preventDefault();
    if (!depBlockedTeamId || !depBlockedByTeamId || !depReason) {
      toast.error('Please fill in all dependency fields');
      return;
    }

    setSubmittingDep(true);
    try {
      const response = await createDependency(id, {
        blockedTeamId: depBlockedTeamId,
        blockedByTeamId: depBlockedByTeamId,
        reason: depReason,
        notes: depNotes,
      });

      if (response.success) {
        toast.success('Dependency added successfully');
        setShowDepModal(false);
        setDepBlockedTeamId('');
        setDepBlockedByTeamId('');
        setDepReason('');
        setDepNotes('');
        
        // Refresh chain and details
        const chainRes = await getDependencyChain(id);
        if (chainRes.success) setChain(chainRes.data);
      }
    } catch (err) {
      console.error('Failed to add dependency:', err);
      toast.error(err.response?.data?.message || 'Failed to add dependency');
    } finally {
      setSubmittingDep(false);
    }
  };

  const handleRemoveDep = async (depId) => {
    if (!window.confirm('Are you sure you want to remove this dependency?')) return;
    try {
      const response = await removeDependency(depId);
      toast.success('Dependency removed');
      // Refresh chain
      const chainRes = await getDependencyChain(id);
      if (chainRes.success) setChain(chainRes.data);
    } catch (err) {
      console.error('Failed to remove dependency:', err);
      toast.error('Failed to remove dependency');
    }
  };

  const handleUploadDirectFile = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit');
        return;
      }
      
      setUploadingDirectFile(true);
      try {
        await uploadAttachment(file, { blameId: id });
        toast.success('Attachment uploaded successfully');
        fetchData();
      } catch (err) {
        console.error('Failed to upload direct attachment:', err);
        toast.error('Failed to upload attachment');
      } finally {
        setUploadingDirectFile(false);
      }
    }
  };

  const handleDeleteDirectFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await deleteAttachment(fileId);
      toast.success('Attachment deleted');
      fetchData();
    } catch (err) {
      console.error('Failed to delete attachment:', err);
      toast.error('Failed to delete attachment');
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <Loader2 className="spinner" />
      </div>
    );
  }

  if (!blame) {
    return (
      <div className="empty-state">
        <AlertTriangle className="empty-state-icon" />
        <div className="empty-state-title">Blame not found</div>
        <button onClick={() => navigate('/blames')} className="btn btn-primary mt-4">Back to registry</button>
      </div>
    );
  }

  const isCreator = blame.creatorId === user?.id;
  const canEdit = isCreator || isAdmin;

  // Render Status Badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN': return <span className="badge badge-open">OPEN</span>;
      case 'IN_DISCUSSION': return <span className="badge badge-in_discussion">IN DISCUSSION</span>;
      case 'BLOCKED': return <span className="badge badge-blocked">BLOCKED</span>;
      case 'RESOLVED': return <span className="badge badge-resolved">RESOLVED</span>;
      case 'CLOSED': return <span className="badge badge-closed">CLOSED</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'LOW': return <span className="badge badge-low">LOW</span>;
      case 'MEDIUM': return <span className="badge badge-medium">MEDIUM</span>;
      case 'HIGH': return <span className="badge badge-high">HIGH</span>;
      case 'CRITICAL': return <span className="badge badge-critical">CRITICAL</span>;
      default: return <span className="badge">{priority}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Top Navigation & Status Transitions */}
      <div className="flex items-center justify-between flex-wrap gap-4" style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: 'var(--space-4)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/blames')} className="btn btn-secondary btn-sm" style={{ width: '32px', height: '32px', padding: 0 }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                ID: {blame.id.substring(0, 8)}...
              </span>
              {getStatusBadge(blame.status)}
              {getPriorityBadge(blame.priority)}
            </div>
            <h2 className="page-title" style={{ marginTop: 'var(--space-1)' }}>{blame.title}</h2>
          </div>
        </div>

        {/* Transition Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {blame.status === 'OPEN' && (
            <>
              <button onClick={() => handleStatusTransition('IN_DISCUSSION')} className="btn btn-secondary btn-sm">Start Discussion</button>
              <button onClick={() => handleStatusTransition('BLOCKED')} className="btn btn-danger btn-sm">Mark Blocked</button>
              <button onClick={() => handleStatusTransition('RESOLVED')} className="btn btn-primary btn-sm" style={{ background: 'var(--color-success)' }}>Resolve</button>
            </>
          )}

          {blame.status === 'IN_DISCUSSION' && (
            <>
              <button onClick={() => handleStatusTransition('BLOCKED')} className="btn btn-danger btn-sm">Mark Blocked</button>
              <button onClick={() => handleStatusTransition('RESOLVED')} className="btn btn-primary btn-sm" style={{ background: 'var(--color-success)' }}>Resolve</button>
            </>
          )}

          {blame.status === 'BLOCKED' && (
            <>
              <button onClick={() => handleStatusTransition('IN_DISCUSSION')} className="btn btn-secondary btn-sm">Resume Discussion</button>
              <button onClick={() => handleStatusTransition('RESOLVED')} className="btn btn-primary btn-sm" style={{ background: 'var(--color-success)' }}>Resolve</button>
            </>
          )}

          {blame.status === 'RESOLVED' && (
            <>
              <button onClick={() => handleStatusTransition('CLOSED')} className="btn btn-secondary btn-sm">Close Blame</button>
              <button onClick={() => handleStatusTransition('OPEN')} className="btn btn-ghost btn-sm">Reopen</button>
            </>
          )}

          {blame.status === 'CLOSED' && (isAdmin || isCreator) && (
            <button onClick={() => handleStatusTransition('OPEN')} className="btn btn-ghost btn-sm">Reopen Blame</button>
          )}

          {canEdit && !editMode && (
            <button onClick={() => setEditMode(true)} className="btn btn-secondary btn-sm">Edit Details</button>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        
        {/* Left Side: Info / Form & Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {editMode ? (
            /* EDIT FORM */
            <div className="card">
              <form onSubmit={handleUpdateBlame} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h3 className="card-title">Edit Blame Details</h3>
                
                <div className="form-group">
                  <label className="form-label">Blame Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="form-input"
                    maxLength={200}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} className="form-select">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)} className="form-select">
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Blocker details</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="form-textarea"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Impact Details</label>
                  <textarea
                    value={editImpactDescription}
                    onChange={(e) => setEditImpactDescription(e.target.value)}
                    className="form-textarea"
                    required
                  />
                </div>

                <div style={{ background: 'var(--color-bg-tertiary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Quantitative Metrics</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Estimated Hours Lost</label>
                      <input
                        type="number"
                        value={editHoursLost}
                        onChange={(e) => setEditHoursLost(e.target.value)}
                        className="form-input"
                        step="0.1"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Employees Affected</label>
                      <input
                        type="number"
                        value={editAffected}
                        onChange={(e) => setEditAffected(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Impact Notes</label>
                    <textarea
                      value={editImpactNotes}
                      onChange={(e) => setEditImpactNotes(e.target.value)}
                      className="form-textarea"
                      style={{ minHeight: '60px' }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2" style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-3)' }}>
                  <button type="button" onClick={() => setEditMode(false)} className="btn btn-secondary" disabled={updatingBlame}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={updatingBlame}>
                    {updatingBlame ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* VIEW CONTENT DETAILS */
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
                  Blocker Description
                </h4>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--color-text)' }}>{blame.description}</p>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
                  Workflow Impact
                </h4>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--color-text)' }}>{blame.impactDescription}</p>
              </div>
            </div>
          )}

          {/* TAB SYSTEM */}
          <div>
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'discussion' ? 'active' : ''}`}
                onClick={() => setActiveTab('discussion')}
              >
                Discussion ({messages.length})
              </button>
              <button 
                className={`tab ${activeTab === 'chain' ? 'active' : ''}`}
                onClick={() => setActiveTab('chain')}
              >
                Dependency Chain ({chain.dependencies.length})
              </button>
              <button 
                className={`tab ${activeTab === 'attachments' ? 'active' : ''}`}
                onClick={() => setActiveTab('attachments')}
              >
                Attachments ({blame.attachments?.length || 0})
              </button>
            </div>

            {/* TAB CONTENT: DISCUSSION */}
            {activeTab === 'discussion' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                
                {/* Messages List */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '450px', overflowY: 'auto' }}>
                  {messages.length === 0 ? (
                    <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
                      <MessageSquare className="empty-state-icon" />
                      <div className="empty-state-title">No comments yet</div>
                      <p style={{ fontSize: 'var(--font-size-xs)' }}>Start the discussion to align on a resolution.</p>
                    </div>
                  ) : (
                    <div className="discussion-thread">
                      {messages.map((msg) => (
                        <div key={msg.id} className="message-item">
                          <div className="message-avatar">
                            {msg.author.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="message-body">
                            <div className="message-meta">
                              <span className="message-author">{msg.author.name}</span>
                              <span className="message-team">({msg.author.team?.name || 'No Team'})</span>
                              <span className="message-time">• {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                            </div>
                            <div className="message-content">{msg.content}</div>

                            {/* Message Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                                {msg.attachments.map(att => (
                                  <a
                                    key={att.id}
                                    href={getAttachmentDownloadUrl(att.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 'var(--space-1)',
                                      background: 'var(--color-bg-tertiary)',
                                      border: '1px solid var(--color-border)',
                                      borderRadius: 'var(--radius-sm)',
                                      padding: '2px 8px',
                                      fontSize: 'var(--font-size-xs)',
                                      color: 'var(--color-primary)',
                                    }}
                                  >
                                    <Paperclip size={12} />
                                    <span className="truncate" style={{ maxWidth: '180px' }}>{att.originalName}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comment Form */}
                {blame.status !== 'CLOSED' && (
                  <form onSubmit={handlePostComment} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div className="form-group">
                      <textarea
                        placeholder="Write a message... Use @Name to notify specific team members."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="form-textarea"
                        style={{ minHeight: '80px' }}
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                          <Paperclip size={14} />
                          {commentFile ? 'Change File' : 'Attach File'}
                          <input
                            type="file"
                            onChange={(e) => setCommentFile(e.target.files?.[0] || null)}
                            style={{ display: 'none' }}
                          />
                        </label>
                        {commentFile && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                            <span className="truncate" style={{ maxWidth: '120px' }}>{commentFile.name}</span>
                            <button type="button" onClick={() => setCommentFile(null)} style={{ color: 'var(--color-blocked)', display: 'flex' }}>
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      <button type="submit" className="btn btn-primary btn-sm" disabled={submittingComment}>
                        {submittingComment ? 'Posting...' : (
                          <>
                            <Send size={14} />
                            Post Message
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB CONTENT: DEPENDENCY CHAIN */}
            {activeTab === 'chain' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Visual flowchart chain */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="flex items-center justify-between">
                    <h3 className="card-title">Recursive Dependency Flow</h3>
                    {blame.status !== 'CLOSED' && (
                      <button 
                        onClick={() => {
                          setDepBlockedTeamId(blame.blamedTeamId);
                          setShowDepModal(true);
                        }} 
                        className="btn btn-primary btn-sm"
                      >
                        <Plus size={14} /> Add Chain Link
                      </button>
                    )}
                  </div>

                  {chain.isCircular && (
                    <div className="dep-circular-warning">
                      <ShieldAlert size={18} />
                      <span>Warning: Circular Dependency Loop Detected in active linkages!</span>
                    </div>
                  )}

                  {chain.nodes.length === 0 ? (
                    <div className="empty-state">
                      <FolderLock className="empty-state-icon" />
                      <div className="empty-state-title">No dependency links added</div>
                    </div>
                  ) : (
                    <div className="dep-chain">
                      {chain.nodes.map((node, index) => (
                        <React.Fragment key={node.team.id}>
                          {index > 0 && (
                            <div className="dep-arrow">
                              <div className="dep-arrow-line" />
                              <div className="dep-arrow-text" style={{ padding: '2px 8px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', margin: '4px 0' }}>
                                {node.reason || 'Blocked By'}
                              </div>
                              <div className="dep-arrow-line" />
                            </div>
                          )}

                          <div className={`dep-node ${node.type}`}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span className="dep-node-label">{node.team.name}</span>
                              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                {node.type === 'creator' ? 'Raised Blame' : node.type === 'blamed' ? 'Direct Blame' : 'Sub-blocker'}
                              </span>
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>

                {/* List of active links for management */}
                {chain.dependencies.length > 0 && (
                  <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-3)' }}>Linkage Manager</h3>
                    <div className="table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Blocked Team</th>
                            <th>Blocked By Team</th>
                            <th>Reason</th>
                            <th>Added By</th>
                            {blame.status !== 'CLOSED' && <th>Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {chain.dependencies.map(dep => (
                            <tr key={dep.id}>
                              <td style={{ fontWeight: 500 }}>{dep.blockedTeam.name}</td>
                              <td style={{ fontWeight: 500 }}>{dep.blockedByTeam.name}</td>
                              <td>{dep.reason}</td>
                              <td>{dep.createdBy?.name || 'System'}</td>
                              {blame.status !== 'CLOSED' && (
                                <td>
                                  {(canEdit || dep.createdById === user?.id) && (
                                    <button 
                                      onClick={() => handleRemoveDep(dep.id)} 
                                      style={{ color: 'var(--color-blocked)' }}
                                      className="btn btn-ghost btn-sm"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: ATTACHMENTS */}
            {activeTab === 'attachments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Upload zone */}
                {blame.status !== 'CLOSED' && (
                  <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-2)' }}>Upload Direct Evidence</h3>
                    <div style={{
                      border: '2px dashed var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      textAlign: 'center',
                      position: 'relative',
                      background: 'var(--color-bg-secondary)',
                    }}>
                      <input
                        type="file"
                        onChange={handleUploadDirectFile}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                        disabled={uploadingDirectFile}
                      />
                      {uploadingDirectFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="spinner" />
                          <span style={{ fontSize: 'var(--font-size-sm)' }}>Uploading attachment...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                          <Paperclip size={16} />
                          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Click to attach evidence file (Max 10MB)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Direct Attachments List */}
                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: 'var(--space-3)' }}>Evidence Repository</h3>
                  {blame.attachments?.length === 0 ? (
                    <div className="empty-state" style={{ padding: 'var(--space-4)' }}>
                      <FileText className="empty-state-icon" />
                      <div className="empty-state-title">No attachments found</div>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>File Name</th>
                            <th>Size</th>
                            <th>Uploader</th>
                            <th>Uploaded</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blame.attachments?.map(att => (
                            <tr key={att.id}>
                              <td style={{ fontWeight: 500 }}>
                                <div className="flex items-center gap-2">
                                  <FileText size={16} style={{ color: 'var(--color-text-secondary)' }} />
                                  <span className="truncate" style={{ maxWidth: '250px' }}>{att.originalName}</span>
                                </div>
                              </td>
                              <td>{(att.sizeBytes / 1024 / 1024).toFixed(2)} MB</td>
                              <td>{att.uploader?.name}</td>
                              <td>{format(new Date(att.createdAt), 'MMM d, yyyy h:mm a')}</td>
                              <td>
                                <div className="flex items-center gap-1">
                                  <a
                                    href={getAttachmentDownloadUrl(att.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--color-primary)' }}
                                    title="Download File"
                                  >
                                    <Download size={14} />
                                  </a>
                                  {(canEdit || att.uploaderId === user?.id) && (
                                    <button
                                      onClick={() => handleDeleteDirectFile(att.id)}
                                      className="btn btn-ghost btn-sm"
                                      style={{ color: 'var(--color-blocked)' }}
                                      title="Delete File"
                                    >
                                      <Trash2 size={14} />
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
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sidebar Meta Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Metadata Block */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 className="card-title">Registry Info</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="flex items-center gap-3">
                <Users size={16} style={{ color: 'var(--color-text-muted)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>RAISED BY (TEAM)</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{blame.creatorTeam?.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>AGAINST (TEAM)</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{blame.blamedTeam?.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Tag size={16} style={{ color: 'var(--color-text-muted)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>CATEGORY</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{blame.category?.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User size={16} style={{ color: 'var(--color-text-muted)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>CREATOR</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{blame.creator?.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar size={16} style={{ color: 'var(--color-text-muted)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>FILED ON</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                    {format(new Date(blame.createdAt), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quantitative Impact Card */}
          {(blame.estimatedHoursLost !== null || blame.employeesAffected !== null || blame.businessImpactNotes) && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', borderLeft: '4px solid var(--color-primary)' }}>
              <h3 className="card-title">Impact Assessment</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {blame.estimatedHoursLost !== null && (
                  <div className="flex items-center gap-3">
                    <Clock size={16} style={{ color: 'var(--color-primary)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>ESTIMATED HOURS LOST</span>
                      <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>
                        {blame.estimatedHoursLost} hrs
                      </span>
                    </div>
                  </div>
                )}

                {blame.employeesAffected !== null && (
                  <div className="flex items-center gap-3">
                    <Users size={16} style={{ color: 'var(--color-primary)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>EMPLOYEES AFFECTED</span>
                      <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>
                        {blame.employeesAffected} staff
                      </span>
                    </div>
                  </div>
                )}

                {blame.businessImpactNotes && (
                  <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                      BUSINESS IMPACT NOTES
                    </span>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {blame.businessImpactNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DEPENDENCY LINK MODAL */}
      {showDepModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Link Blame Dependency</h3>
              <button onClick={() => setShowDepModal(false)} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddDependency}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  State which team is blocked by another team. Circular loops are auto-detected and blocked.
                </p>

                <div className="form-group">
                  <label className="form-label">Blocked Team *</label>
                  <select
                    value={depBlockedTeamId}
                    onChange={(e) => setDepBlockedTeamId(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Select team being blocked</option>
                    {/* Allow selecting from list of teams */}
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Blocked By (Blocking Team) *</label>
                  <select
                    value={depBlockedByTeamId}
                    onChange={(e) => setDepBlockedByTeamId(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Select team causing the block</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason *</label>
                  <input
                    type="text"
                    placeholder="e.g. Awaiting database design clearance"
                    value={depReason}
                    onChange={(e) => setDepReason(e.target.value)}
                    className="form-input"
                    maxLength={500}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    placeholder="Provide additional details about the bottleneck..."
                    value={depNotes}
                    onChange={(e) => setDepNotes(e.target.value)}
                    className="form-textarea"
                    style={{ minHeight: '60px' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowDepModal(false)} className="btn btn-secondary" disabled={submittingDep}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submittingDep}>
                  {submittingDep ? 'Adding Link...' : 'Link Dependency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlameDetail;

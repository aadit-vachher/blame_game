import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBlame } from '../api/blames';
import { listTeams } from '../api/teams';
import { listCategories } from '../api/categories';
import { uploadAttachment } from '../api/attachments';
import { AlertCircle, ArrowLeft, Send, UploadCloud, File, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';

const CreateBlame = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [blamedTeamId, setBlamedTeamId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [impactDescription, setImpactDescription] = useState('');
  const [estimatedHoursLost, setEstimatedHoursLost] = useState('');
  const [employeesAffected, setEmployeesAffected] = useState('');
  const [businessImpactNotes, setBusinessImpactNotes] = useState('');
  
  // File State
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [teamsRes, catsRes] = await Promise.all([
          listTeams({ includeArchived: false }),
          listCategories(),
        ]);
        if (teamsRes.success) {
          // Exclude user's own team from the blameable list
          setTeams(teamsRes.data.filter(t => t.id !== user?.teamId));
        }
        if (catsRes.success) {
          setCategories(catsRes.data);
        }
      } catch (err) {
        console.error('Error fetching form details:', err);
        toast.error('Failed to load teams or categories');
      }
    };

    if (user) {
      fetchFormData();
    }
  }, [user]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !blamedTeamId || !categoryId || !description || !impactDescription) {
      setError('Please fill in all required fields marked with *');
      return;
    }

    setLoading(true);

    try {
      const blamePayload = {
        title,
        blamedTeamId,
        categoryId,
        priority,
        description,
        impactDescription,
        estimatedHoursLost: estimatedHoursLost ? parseFloat(estimatedHoursLost) : null,
        employeesAffected: employeesAffected ? parseInt(employeesAffected) : null,
        businessImpactNotes: businessImpactNotes || null,
      };

      const blameRes = await createBlame(blamePayload);
      
      if (blameRes.success && blameRes.data) {
        const blameId = blameRes.data.id;
        
        // If file is selected, upload it
        if (selectedFile) {
          try {
            await uploadAttachment(selectedFile, { blameId });
          } catch (fileErr) {
            console.error('File upload failed:', fileErr);
            toast.error('Blame raised, but attachment upload failed.');
          }
        }

        toast.success('Blame raised successfully');
        navigate(`/blames/${blameId}`);
      } else {
        setError(blameRes.message || 'Failed to raise blame');
      }
    } catch (err) {
      console.error('Error submitting blame:', err);
      setError(err.response?.data?.message || 'Failed to raise blame. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary btn-sm"
          style={{ width: '32px', height: '32px', padding: 0 }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="page-title">Raise New Blame</h2>
          <p className="page-subtitle">Identify a cross-team dependency blocker or operational delay.</p>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'var(--color-critical-bg)',
          color: 'var(--color-critical)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontSize: 'var(--font-size-sm)',
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          
          <div className="form-group">
            <label className="form-label">Blame Title *</label>
            <input
              type="text"
              placeholder="e.g., Warehouse shipment delay for Order #1040"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              maxLength={200}
              required
            />
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'right' }}>
              {title.length}/200 characters
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Blamed Team *</label>
              <select
                value={blamedTeamId}
                onChange={(e) => setBlamedTeamId(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select the blocking team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="form-select"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium (Default)</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Business Area Impacted</label>
              <input
                type="text"
                placeholder="e.g., Shipping Logistics, Customer Success"
                className="form-input"
                disabled
                value={user?.team?.name || ''}
              />
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                Automatically set to your current team
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">What is blocking you? (Description) *</label>
            <textarea
              placeholder="Describe the issue, dependency, or block in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Impact Description *</label>
            <textarea
              placeholder="How does this delay or block affect your team's workflow and output?"
              value={impactDescription}
              onChange={(e) => setImpactDescription(e.target.value)}
              className="form-textarea"
              required
            />
          </div>

          <div style={{
            background: 'var(--color-bg-tertiary)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            border: '1px solid var(--color-border)',
          }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text)' }}>
              Quantitative & Business Impact Metrics (Optional)
            </h4>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Estimated Hours Lost</label>
                <input
                  type="number"
                  placeholder="e.g. 4.5"
                  value={estimatedHoursLost}
                  onChange={(e) => setEstimatedHoursLost(e.target.value)}
                  className="form-input"
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Employees Affected</label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  value={employeesAffected}
                  onChange={(e) => setEmployeesAffected(e.target.value)}
                  className="form-input"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Business Impact Notes</label>
              <textarea
                placeholder="Any client impact, revenue risks, or extra comments..."
                value={businessImpactNotes}
                onChange={(e) => setBusinessImpactNotes(e.target.value)}
                className="form-textarea"
                style={{ minHeight: '60px' }}
              />
            </div>
          </div>

          {/* File Upload Area */}
          <div className="form-group">
            <label className="form-label">Supporting Evidence / Attachment</label>
            <div style={{
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--color-bg-secondary)',
              position: 'relative',
            }}>
              <input
                type="file"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                <UploadCloud size={32} style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                  Click to upload a file or drag and drop
                </span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  PNG, JPG, PDF, CSV, XLSX, DOCX (Max 10MB)
                </span>
              </div>
            </div>

            {selectedFile && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                marginTop: 'var(--space-2)',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
                  <File size={16} style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontSize: 'var(--font-size-sm)' }} className="truncate">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  style={{ color: 'var(--color-blocked)', display: 'flex', alignItems: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="spinner" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
                  Raising Blame...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Raise Blame
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Simple loader helper inside same file
const Loader2 = ({ className, style }) => (
  <span className={className} style={{ ...style, display: 'inline-block', width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
);

export default CreateBlame;

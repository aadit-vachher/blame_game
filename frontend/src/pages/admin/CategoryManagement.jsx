import React, { useState, useEffect } from 'react';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../../api/categories';
import { Plus, Tag, Trash2, Edit2, Check, X, ShieldAlert, Settings, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form States
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await listCategories({ activeOnly: false });
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      toast.error('Failed to load category tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName) {
      toast.error('Category name is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createCategory({ name: catName, description: catDesc });
      if (response.success) {
        toast.success('Category created successfully');
        setShowCreateModal(false);
        setCatName('');
        setCatDesc('');
        fetchCategories();
      }
    } catch (err) {
      console.error('Failed to create category:', err);
      toast.error('Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!catName) {
      toast.error('Category name is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await updateCategory(selectedCategory.id, { name: catName, description: catDesc });
      if (response.success) {
        toast.success('Category updated successfully');
        setShowEditModal(false);
        setCatName('');
        setCatDesc('');
        setSelectedCategory(null);
        fetchCategories();
      }
    } catch (err) {
      console.error('Failed to update category:', err);
      toast.error('Failed to update category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const newStatus = !category.isActive;
      const response = await updateCategory(category.id, { isActive: newStatus });
      if (response.success) {
        toast.success(`Category ${category.name} is now ${newStatus ? 'active' : 'inactive'}`);
        fetchCategories();
      }
    } catch (err) {
      console.error('Failed to toggle category state:', err);
      toast.error('Failed to update category status');
    }
  };

  const handleDeactivateCategory = async (category) => {
    if (!window.confirm(`Are you sure you want to deactivate: ${category.name}?`)) return;

    try {
      await deleteCategory(category.id);
      toast.success(`Category ${category.name} deactivated`);
      fetchCategories();
    } catch (err) {
      console.error('Failed to deactivate category:', err);
      toast.error('Failed to deactivate');
    }
  };

  const handleOpenEdit = (category) => {
    setSelectedCategory(category);
    setCatName(category.name);
    setCatDesc(category.description || '');
    setShowEditModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Blame Categories</h2>
          <p className="page-subtitle">Configure issue classification tags used for structuring cross-team blames.</p>
        </div>
        
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Category Tag
        </button>
      </div>

      {/* Category List */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-page">
            <div className="spinner" />
          </div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <Tag className="empty-state-icon" />
            <div className="empty-state-title">No categories configured</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Display Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {c.description || <em style={{ color: 'var(--color-text-muted)' }}>No description</em>}
                    </td>
                    <td>
                      <span className={`badge ${c.isActive ? 'badge-resolved' : 'badge-closed'}`}>
                        {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td>{c.sortOrder}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-primary)' }}
                          title="Edit Details"
                        >
                          <Edit2 size={16} />
                        </button>
                        
                        <button
                          onClick={() => handleToggleActive(c)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: c.isActive ? 'var(--color-blocked)' : 'var(--color-success)' }}
                          title={c.isActive ? 'Mark Inactive' : 'Mark Active'}
                        >
                          {c.isActive ? <X size={16} /> : <Check size={16} />}
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
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Category Tag</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCategory}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. System Outage"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    placeholder="Provide description of issues mapping here..."
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    className="form-textarea"
                    style={{ minHeight: '80px' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedCategory && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Category Details</h3>
              <button onClick={() => { setShowEditModal(false); setSelectedCategory(null); }} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditCategory}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    className="form-textarea"
                    style={{ minHeight: '80px' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedCategory(null); }} className="btn btn-secondary" disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;

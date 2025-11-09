import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useModules } from '../hooks/useModules'
import { useModal } from '../hooks/useModal'
import { MODULE_STATUS, STATUS_ICONS } from '../constants'
import LoadingSpinner from '../components/LoadingSpinner'
import './Modules.css'

export default function Modules() {
  const { user } = useAuth()
  const { modules, loading, createModule } = useModules()
  const { isOpen: showModal, open: openModal, close: closeModal, modalRef } = useModal()
  const [formData, setFormData] = useState({ name: '', description: '', duration: '', status: MODULE_STATUS.IN_PROGRESS })
  const [submitting, setSubmitting] = useState(false)

  const handleCreateModule = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    const result = await createModule(formData)
    if (result.success) {
      setFormData({ name: '', description: '', duration: '', status: MODULE_STATUS.IN_PROGRESS })
      closeModal()
    }
    
    setSubmitting(false)
  }

  const getStatusBadge = (status) => {
    const isCompleted = status === MODULE_STATUS.COMPLETED
    return (
      <span 
        className={`status-badge ${isCompleted ? 'completed' : 'in-progress'}`}
        aria-label={`Module status: ${status}`}
      >
        {isCompleted ? STATUS_ICONS.COMPLETED : STATUS_ICONS.IN_PROGRESS} {status}
      </span>
    )
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString()
    }
    return new Date(timestamp).toLocaleDateString()
  }

  if (loading) {
    return <LoadingSpinner size="large" text="Loading modules..." />
  }

  return (
    <div className="modules-page">
      <div className="modules-header">
        <h2>Module Management</h2>
        {user?.role === 'admin' && (
          <button 
            className="btn-primary" 
            onClick={openModal}
            aria-label="Create new module"
          >
            ➕ Create Module
          </button>
        )}
      </div>

      <div className="modules-table-container">
        {modules.length > 0 ? (
          <table className="modules-table">
            <thead>
              <tr>
                <th>Module Name</th>
                {user?.role === 'admin' && <th>Trainees</th>}
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {modules.map(module => (
                <tr key={module.id}>
                  <td>
                    <strong>{module.name}</strong>
                    {module.description && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {module.description.substring(0, 50)}...
                      </div>
                    )}
                  </td>
                  {user?.role === 'admin' && (
                    <td>{module.trainees || 0}</td>
                  )}
                  <td>{getStatusBadge(module.status || 'In Progress')}</td>
                  <td>{formatDate(module.created)}</td>
                  <td>
                    <button className="btn-view" style={{ color: 'var(--green-icon)' }}>
                      👁️ View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No modules found. {user?.role === 'admin' && 'Create your first module!'}
          </div>
        )}
      </div>

      {showModal && (
        <div 
          className="modal-overlay" 
          onClick={() => !submitting && closeModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
          >
            <h3 id="modal-title">Create New Module</h3>
            <form onSubmit={handleCreateModule}>
              <div className="form-group">
                <label>Module Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter module name"
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Enter module description"
                  rows="4"
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label>Duration (hours)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                  min="1"
                  placeholder="Enter duration"
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={submitting}
                  aria-label="Module status"
                >
                  <option value={MODULE_STATUS.IN_PROGRESS}>{MODULE_STATUS.IN_PROGRESS}</option>
                  <option value={MODULE_STATUS.COMPLETED}>{MODULE_STATUS.COMPLETED}</option>
                </select>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={closeModal}
                  disabled={submitting}
                  aria-label="Cancel creating module"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {submitting ? (
                    <>
                      <LoadingSpinner size="small" text="" inline={true} />
                      <span>Creating...</span>
                    </>
                  ) : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

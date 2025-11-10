import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStats } from '../../hooks/useDashboardStats'
import LoadingSpinner from '../LoadingSpinner'
import './DashboardComponents.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { stats, recentActivity, loading } = useDashboardStats()

  const formatTimeAgo = (date) => {
    if (!date) return 'Recently'
    const now = new Date()
    const diff = now - date
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  if (loading) {
    return <LoadingSpinner size="large" text="Loading dashboard..." />
  }

  return (
    <div className="admin-dashboard">
      <div className="overview-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--green-icon)' }}>👥</div>
          <div className="stat-content">
            <h3>Total Trainees</h3>
            <p className="stat-value">{stats.totalTrainees}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--green-icon)' }}>📚</div>
          <div className="stat-content">
            <h3>Active Modules</h3>
            <p className="stat-value">{stats.activeModules}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--green-icon)' }}>✅</div>
          <div className="stat-content">
            <h3>Attendance Rate</h3>
            <p className="stat-value">{stats.attendanceRate}%</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={() => navigate('/modules')}>
            ➕ Add Module
          </button>
          <button className="action-btn primary" onClick={() => navigate('/messaging')}>
            💬 Send Message
          </button>
          <button className="action-btn primary" onClick={() => navigate('/assessments')}>
            📊 View Reports
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-icon" style={{ color: 'var(--green-icon)' }}>
                  {activity.type === 'module' ? '📝' : '✓'}
                </span>
                <div className="activity-content">
                  <p>{activity.message}</p>
                  <span className="activity-time">{formatTimeAgo(activity.time)}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)', padding: '20px' }}>No recent activity</p>
          )}
        </div>
      </div>
    </div>
  )
}

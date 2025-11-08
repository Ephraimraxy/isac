import React from 'react'
import { useRealTimeTraineeDashboard } from '../../hooks/useRealTimeTraineeDashboard'
import LoadingSpinner from '../LoadingSpinner'
import './DashboardComponents.css'

export default function TraineeDashboard() {
  const { progress, upcomingSessions, assessmentStats, loading } = useRealTimeTraineeDashboard()

  const formatDate = (date) => {
    if (!date) return { day: '--', month: '---' }
    const d = date instanceof Date ? date : date.toDate()
    return {
      day: d.getDate().toString(),
      month: d.toLocaleDateString('en-US', { month: 'short' })
    }
  }

  if (loading) {
    return <LoadingSpinner size="large" text="Loading your dashboard..." />
  }

  return (
    <div className="trainee-dashboard">
      <div className="progress-tracker">
        <h2>Your Progress</h2>
        <div className="progress-card">
          <div className="progress-header">
            <span>Overall Completion</span>
            <span className="progress-percentage">{progress.overall}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress.overall}%`, backgroundColor: 'var(--orange-primary)' }}
            ></div>
          </div>
          <p className="progress-stats">
            {progress.completedModules} of {progress.totalModules} modules completed
          </p>
        </div>
      </div>

      <div className="upcoming-sessions">
        <h2>Upcoming Sessions</h2>
        <div className="session-list">
          {upcomingSessions.length > 0 ? (
            upcomingSessions.map((session, index) => {
              const dateInfo = formatDate(session.created)
              return (
                <div key={session.id || index} className="session-item">
                  <div className="session-date">
                    <span className="session-day">{dateInfo.day}</span>
                    <span className="session-month">{dateInfo.month}</span>
                  </div>
                  <div className="session-details">
                    <h3>{session.name}</h3>
                    <p>{session.duration ? `${session.duration} hours` : 'Scheduled'}</p>
                  </div>
                  <span className="session-status" style={{ color: 'var(--green-icon)' }}>📅 Scheduled</span>
                </div>
              )
            })
          ) : (
            <p style={{ color: 'var(--text-secondary)', padding: '20px' }}>No upcoming sessions</p>
          )}
        </div>
      </div>

      <div className="assessment-summary">
        <h2>Assessment Summary</h2>
        <div className="assessment-cards">
          <div className="assessment-card">
            <div className="assessment-icon" style={{ color: 'var(--green-icon)' }}>📝</div>
            <div>
              <h3>Average Score</h3>
              <p className="assessment-value">{assessmentStats.averageScore}%</p>
            </div>
          </div>
          <div className="assessment-card">
            <div className="assessment-icon" style={{ color: 'var(--green-icon)' }}>✅</div>
            <div>
              <h3>Completed</h3>
              <p className="assessment-value">{assessmentStats.completed}/{assessmentStats.total}</p>
            </div>
          </div>
          <div className="assessment-card">
            <div className="assessment-icon" style={{ color: 'var(--green-icon)' }}>⏰</div>
            <div>
              <h3>Pending</h3>
              <p className="assessment-value">{assessmentStats.pending}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

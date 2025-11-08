import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useError } from '../contexts/ErrorContext'
import { subscribeToAttendance, subscribeToModules, markAttendance, getTrainees } from '../services/firestore'
import { useModal } from '../hooks/useModal'
import { ATTENDANCE_STATUS, STATUS_ICONS, STATUS_COLORS, SUCCESS_MESSAGES } from '../constants'
import LoadingSpinner from '../components/LoadingSpinner'
import './Attendance.css'

export default function Attendance() {
  const { user } = useAuth()
  const { showError, showSuccess, showErrorFromException } = useError()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedModule, setSelectedModule] = useState('all')
  const [attendance, setAttendance] = useState([])
  const [modules, setModules] = useState([])
  const [trainees, setTrainees] = useState([])
  const [loading, setLoading] = useState(true)
  const { isOpen: showMarkModal, open: openMarkModal, close: closeMarkModal, modalRef } = useModal()
  const [markFormData, setMarkFormData] = useState({ traineeId: '', module: '', status: ATTENDANCE_STATUS.PRESENT, time: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const traineesData = await getTrainees()
        setTrainees(traineesData)
      } catch (error) {
        showErrorFromException(error, 'Failed to load trainees. Please refresh the page.')
      }
    }
    fetchData()

    const unsubscribeModules = subscribeToModules((modulesData) => {
      setModules(modulesData)
    })

    return () => unsubscribeModules()
  }, [showErrorFromException])

  useEffect(() => {
    const filters = {}
    if (selectedDate) filters.date = selectedDate
    if (selectedModule !== 'all') filters.module = selectedModule

    const unsubscribe = subscribeToAttendance(filters, (attendanceData) => {
      setAttendance(attendanceData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [selectedDate, selectedModule, showErrorFromException])

  const handleMarkAttendance = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const trainee = trainees.find(t => t.id === markFormData.traineeId)
      await markAttendance({
        traineeId: markFormData.traineeId,
        traineeName: trainee?.name || 'Unknown',
        module: markFormData.module,
        date: selectedDate,
        status: markFormData.status,
        time: markFormData.time || new Date().toLocaleTimeString(),
        markedBy: user?.uid
      })
      
      // Attendance will update automatically via real-time listener
      closeMarkModal()
      setMarkFormData({ traineeId: '', module: '', status: ATTENDANCE_STATUS.PRESENT, time: '' })
      showSuccess(SUCCESS_MESSAGES.ATTENDANCE_MARKED)
    } catch (error) {
      showErrorFromException(error, 'Failed to mark attendance. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredAttendance = attendance

  const getStatusBadge = (status) => {
    const statusConfig = {
      [ATTENDANCE_STATUS.PRESENT]: { ...STATUS_COLORS.PRESENT, icon: STATUS_ICONS.PRESENT },
      [ATTENDANCE_STATUS.ABSENT]: { ...STATUS_COLORS.ABSENT, icon: STATUS_ICONS.ABSENT },
      [ATTENDANCE_STATUS.LATE]: { ...STATUS_COLORS.LATE, icon: STATUS_ICONS.LATE }
    }
    const style = statusConfig[status] || statusConfig[ATTENDANCE_STATUS.PRESENT]
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: style.bg, color: style.color }}
        aria-label={`Attendance status: ${status}`}
      >
        {style.icon} {status}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return <LoadingSpinner size="large" text="Loading attendance..." />
  }

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <h2>Attendance Tracking</h2>
      </div>

      <div className="attendance-filters">
        <div className="filter-group">
          <label htmlFor="date-filter">Date</label>
          <input
            type="date"
            id="date-filter"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label htmlFor="module-filter">Module</label>
          <select
            id="module-filter"
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Modules</option>
            {modules.map(module => (
              <option key={module.id} value={module.name}>{module.name}</option>
            ))}
          </select>
        </div>
        {user?.role === 'admin' && (
          <button 
            className="btn-primary" 
            onClick={openMarkModal}
            aria-label="Mark attendance for a trainee"
          >
            📅 Mark Attendance
          </button>
        )}
      </div>

      <div className="attendance-stats">
        <div className="stat-box">
          <span className="stat-label">Total</span>
          <span className="stat-number">{filteredAttendance.length}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Present</span>
          <span className="stat-number" style={{ color: STATUS_COLORS.PRESENT.color }}>
            {filteredAttendance.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Absent</span>
          <span className="stat-number" style={{ color: STATUS_COLORS.ABSENT.color }}>
            {filteredAttendance.filter(a => a.status === ATTENDANCE_STATUS.ABSENT).length}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Late</span>
          <span className="stat-number" style={{ color: STATUS_COLORS.LATE.color }}>
            {filteredAttendance.filter(a => a.status === ATTENDANCE_STATUS.LATE).length}
          </span>
        </div>
      </div>

      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Module</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.length > 0 ? (
              filteredAttendance.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.traineeName || 'Unknown'}</strong></td>
                  <td>{item.module}</td>
                  <td>{formatDate(item.date)}</td>
                  <td>{item.time || '-'}</td>
                  <td>{getStatusBadge(item.status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No attendance records found for the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showMarkModal && (
        <div 
          className="modal-overlay" 
          onClick={() => !submitting && closeMarkModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendance-modal-title"
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
          >
            <h3 id="attendance-modal-title">Mark Attendance</h3>
            <form onSubmit={handleMarkAttendance}>
              <div className="form-group">
                <label>Trainee</label>
                <select
                  value={markFormData.traineeId}
                  onChange={(e) => setMarkFormData({ ...markFormData, traineeId: e.target.value })}
                  required
                  disabled={submitting}
                >
                  <option value="">Select trainee</option>
                  {trainees.map(trainee => (
                    <option key={trainee.id} value={trainee.id}>{trainee.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Module</label>
                <select
                  value={markFormData.module}
                  onChange={(e) => setMarkFormData({ ...markFormData, module: e.target.value })}
                  required
                  disabled={submitting}
                >
                  <option value="">Select module</option>
                  {modules.map(module => (
                    <option key={module.id} value={module.name}>{module.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={markFormData.status}
                  onChange={(e) => setMarkFormData({ ...markFormData, status: e.target.value })}
                  required
                  disabled={submitting}
                >
                  <option value={ATTENDANCE_STATUS.PRESENT}>{ATTENDANCE_STATUS.PRESENT}</option>
                  <option value={ATTENDANCE_STATUS.ABSENT}>{ATTENDANCE_STATUS.ABSENT}</option>
                  <option value={ATTENDANCE_STATUS.LATE}>{ATTENDANCE_STATUS.LATE}</option>
                </select>
              </div>
              <div className="form-group">
                <label>Time (optional)</label>
                <input
                  type="time"
                  value={markFormData.time}
                  onChange={(e) => setMarkFormData({ ...markFormData, time: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={closeMarkModal}
                  disabled={submitting}
                  aria-label="Cancel marking attendance"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {submitting ? (
                    <>
                      <LoadingSpinner size="small" text="" inline={true} />
                      <span>Marking...</span>
                    </>
                  ) : 'Mark Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

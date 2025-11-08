import React, { useState, useEffect } from 'react'
import { useError } from '../contexts/ErrorContext'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { updateUser } from '../services/firestore'
import './Settings.css'

export default function Settings() {
  const { user } = useAuth()
  const { showError, showSuccess, showErrorFromException } = useError()
  const { theme, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState({
    email: true,
    moduleCompletion: true,
    assessmentReminders: true,
    attendanceAlerts: false
  })
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (user?.notificationSettings) {
      setNotifications(user.notificationSettings)
    }
  }, [user])

  const handleNotificationToggle = async (key) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] }
    setNotifications(newNotifications)
    
    if (user?.uid) {
      setSaving(true)
      try {
        await updateUser(user.uid, { notificationSettings: newNotifications })
        setSaveMessage('Settings saved successfully!')
        setTimeout(() => setSaveMessage(''), 3000)
      } catch (error) {
        showErrorFromException(error, 'Failed to save settings. Please try again.')
        setSaveMessage('Failed to save settings')
        setTimeout(() => setSaveMessage(''), 3000)
        // Revert on error
        setNotifications(notifications)
      } finally {
        setSaving(false)
      }
    }
  }

  return (
    <div className="settings-page">
      <h2>Settings & Integrations</h2>

      <div className="settings-section">
        <h3>Theme Preferences</h3>
        <div className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Theme Mode</h4>
              <p>Toggle between light and dark theme</p>
            </div>
            <button className="theme-toggle-large" onClick={toggleTheme}>
              {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Notification Settings</h3>
        <div className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Email Notifications</h4>
              <p>Receive notifications via email</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={() => handleNotificationToggle('email')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Module Completion Alerts</h4>
              <p>Get notified when modules are completed</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.moduleCompletion}
                onChange={() => handleNotificationToggle('moduleCompletion')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Assessment Reminders</h4>
              <p>Receive reminders for upcoming assessments</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.assessmentReminders}
                onChange={() => handleNotificationToggle('assessmentReminders')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Attendance Alerts</h4>
              <p>Get alerts about attendance updates</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.attendanceAlerts}
                onChange={() => handleNotificationToggle('attendanceAlerts')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {saveMessage && (
        <div className={`save-message ${saveMessage.includes('successfully') ? 'success' : 'error'}`}>
          {saveMessage}
        </div>
      )}

      <div className="settings-section">
        <h3>Account Information</h3>
        <div className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Name</h4>
              <p>{user?.name || 'Not set'}</p>
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Email</h4>
              <p>{user?.email || 'Not set'}</p>
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Role</h4>
              <p>{user?.role === 'admin' ? 'Administrator' : 'Trainee'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


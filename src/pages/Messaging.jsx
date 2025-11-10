import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useError } from '../contexts/ErrorContext'
import { subscribeToMessages, sendMessage, markMessageAsRead, getTrainees } from '../services/firestore'
import { sanitizeString } from '../utils/validation'
import LoadingSpinner from '../components/LoadingSpinner'
import './Messaging.css'

export default function Messaging() {
  const { user, loading: authLoading } = useAuth()
  const { showError, showSuccess, showErrorFromException } = useError()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [composerData, setComposerData] = useState({ recipientId: '', subject: '', message: '' })
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [trainees, setTrainees] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Wait for authentication to complete
    if (authLoading || !user?.uid) {
      setLoading(true)
      return
    }

    const fetchTrainees = async () => {
      try {
        const traineesData = user?.role === 'admin' ? await getTrainees() : []
        setTrainees(traineesData)
      } catch (error) {
        showErrorFromException(error, 'Failed to load trainees. Please refresh the page.')
      }
    }

    fetchTrainees()

    const unsubscribe = subscribeToMessages(user.uid, (messagesData) => {
      setMessages(messagesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, authLoading, showErrorFromException])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    // Sanitize input
    const sanitizedData = {
      recipientId: composerData.recipientId,
      subject: sanitizeString(composerData.subject),
      message: sanitizeString(composerData.message)
    }
    
    if (!sanitizedData.recipientId) {
      showError('Please select a recipient')
      return
    }
    
    if (!sanitizedData.subject.trim()) {
      showError('Please enter a subject')
      return
    }
    
    if (!sanitizedData.message.trim()) {
      showError('Please enter a message')
      return
    }
    
    setSubmitting(true)
    try {
      // If sending to "all", send to all trainees
      if (sanitizedData.recipientId === 'all') {
        for (const trainee of trainees) {
          await sendMessage({
            senderId: user.uid,
            senderName: user.name || 'Admin',
            recipientId: trainee.id,
            recipientName: trainee.name,
            subject: sanitizedData.subject,
            content: sanitizedData.message
          })
        }
        showSuccess(`Message sent to all ${trainees.length} trainees`)
      } else {
        const recipient = trainees.find(t => t.id === sanitizedData.recipientId)
        await sendMessage({
          senderId: user.uid,
          senderName: user.name || 'Admin',
          recipientId: sanitizedData.recipientId,
          recipientName: recipient?.name || 'Unknown',
          subject: sanitizedData.subject,
          content: sanitizedData.message
        })
        showSuccess('Message sent successfully!')
      }

      // Messages will update automatically via real-time listener
      setShowComposer(false)
      setComposerData({ recipientId: '', subject: '', message: '' })
    } catch (error) {
      showErrorFromException(error, 'Failed to send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMessageSelect = async (message) => {
    setSelectedMessage(message)
    if (!message.read) {
      try {
        await markMessageAsRead(message.id)
        // Update local state
        setMessages(messages.map(m => 
          m.id === message.id ? { ...m, read: true } : m
        ))
      } catch (error) {
        // Silently fail - not critical if marking as read fails
        showErrorFromException(error)
      }
    }
  }

  const unreadCount = messages.filter(m => !m.read).length

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString()
    }
    return new Date(timestamp).toLocaleString()
  }

  const formatDateShort = (timestamp) => {
    if (!timestamp) return 'N/A'
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString()
    }
    return new Date(timestamp).toLocaleDateString()
  }

  if (loading) {
    return <LoadingSpinner size="large" text="Loading messages..." />
  }

  return (
    <div className="messaging-page">
      <div className="messaging-header">
        <h2>Messaging & Notifications</h2>
        <button className="btn-primary" onClick={() => setShowComposer(true)}>
          ✉️ Send Message
        </button>
      </div>

      <div className="messaging-layout">
        <div className="messages-list">
          <div className="messages-header-bar">
            <h3>Inbox ({unreadCount} unread)</h3>
          </div>
          <div className="messages-container">
            {messages.length > 0 ? (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`message-item ${!message.read ? 'unread' : ''} ${selectedMessage?.id === message.id ? 'selected' : ''}`}
                  onClick={() => handleMessageSelect(message)}
                >
                  <div className="message-header">
                    <span className="message-from">{message.senderName || 'Unknown'}</span>
                    <span className="message-date">{formatDateShort(message.date)}</span>
                  </div>
                  <div className="message-subject">{message.subject}</div>
                  {!message.read && <span className="unread-indicator" style={{ color: 'var(--green-icon)' }}>●</span>}
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No messages
              </div>
            )}
          </div>
        </div>

        <div className="message-view">
          {selectedMessage ? (
            <div className="message-detail">
              <div className="message-detail-header">
                <h3>{selectedMessage.subject}</h3>
                <span className="message-detail-date">{formatDate(selectedMessage.date)}</span>
              </div>
              <div className="message-detail-from">
                From: <strong>{selectedMessage.senderName || 'Unknown'}</strong>
              </div>
              <div className="message-detail-content">
                {selectedMessage.content}
              </div>
              <div className="message-detail-actions">
                <button className="btn-secondary">Reply</button>
                <button className="btn-secondary">Forward</button>
              </div>
            </div>
          ) : (
            <div className="message-placeholder">
              <span style={{ color: 'var(--green-icon)', fontSize: '48px' }}>💬</span>
              <p>Select a message to view</p>
            </div>
          )}
        </div>
      </div>

      {showComposer && (
        <div className="modal-overlay" onClick={() => !submitting && setShowComposer(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Send Message</h3>
            <form onSubmit={handleSendMessage}>
              <div className="form-group">
                <label>To</label>
                <select
                  value={composerData.recipientId}
                  onChange={(e) => setComposerData({ ...composerData, recipientId: e.target.value })}
                  required
                  disabled={submitting}
                >
                  <option value="">Select recipient</option>
                  {user?.role === 'admin' && (
                    <option value="all">All Trainees</option>
                  )}
                  {trainees.map(trainee => (
                    <option key={trainee.id} value={trainee.id}>{trainee.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={composerData.subject}
                  onChange={(e) => setComposerData({ ...composerData, subject: e.target.value })}
                  required
                  placeholder="Enter subject"
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={composerData.message}
                  onChange={(e) => setComposerData({ ...composerData, message: e.target.value })}
                  required
                  placeholder="Enter your message"
                  rows="6"
                  disabled={submitting}
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowComposer(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {submitting ? (
                    <>
                      <LoadingSpinner size="small" text="" inline={true} />
                      <span>Sending...</span>
                    </>
                  ) : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

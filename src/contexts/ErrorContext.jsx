import React, { createContext, useContext, useState, useCallback } from 'react'
import Toast from '../components/Toast'
import './ErrorContext.css'

const ErrorContext = createContext()

export function ErrorProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showError = useCallback((message, duration = 5000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type: 'error', duration }])
    return id
  }, [])

  const showSuccess = useCallback((message, duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type: 'success', duration }])
    return id
  }, [])

  const showWarning = useCallback((message, duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type: 'warning', duration }])
    return id
  }, [])

  const showInfo = useCallback((message, duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type: 'info', duration }])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  // Helper function to get user-friendly error messages
  const getErrorMessage = useCallback((error) => {
    if (typeof error === 'string') {
      return error
    }

    if (error?.message) {
      // Firebase error messages
      if (error.message.includes('auth/wrong-password')) {
        return 'Incorrect password. Please try again.'
      }
      if (error.message.includes('auth/user-not-found')) {
        return 'No account found with this email address.'
      }
      if (error.message.includes('auth/email-already-in-use')) {
        return 'An account with this email already exists.'
      }
      if (error.message.includes('auth/weak-password')) {
        return 'Password is too weak. Please use a stronger password.'
      }
      if (error.message.includes('auth/network-request-failed')) {
        return 'Network error. Please check your connection and try again.'
      }
      if (error.message.includes('permission-denied')) {
        return 'You do not have permission to perform this action.'
      }
      
      return error.message
    }

    return 'An unexpected error occurred. Please try again.'
  }, [])

  const showErrorFromException = useCallback((error, customMessage = null) => {
    const message = customMessage || getErrorMessage(error)
    return showError(message)
  }, [showError, getErrorMessage])

  return (
    <ErrorContext.Provider
      value={{
        showError,
        showSuccess,
        showWarning,
        showInfo,
        showErrorFromException,
        getErrorMessage
      }}
    >
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ErrorContext.Provider>
  )
}

export function useError() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}


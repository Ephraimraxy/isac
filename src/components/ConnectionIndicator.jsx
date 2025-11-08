import React from 'react'
import { useConnectionState } from '../hooks/useConnectionState'
import './ConnectionIndicator.css'

/**
 * Connection status indicator component
 * Shows online/offline status and connection quality
 */
export default function ConnectionIndicator() {
  const { isOnline, isConnected, connectionQuality, isOffline } = useConnectionState()

  if (!isOffline && connectionQuality === 'good') {
    return null // Don't show indicator when everything is good
  }

  return (
    <div 
      className={`connection-indicator ${isOffline ? 'offline' : connectionQuality}`}
      role="status"
      aria-live="polite"
      aria-label={isOffline ? 'Offline - Changes will sync when connection is restored' : 'Slow connection'}
    >
      <span className="connection-icon">
        {isOffline ? '🔴' : connectionQuality === 'slow' ? '🟡' : '🟢'}
      </span>
      <span className="connection-text">
        {isOffline 
          ? 'Offline - Changes will sync when connection is restored'
          : connectionQuality === 'slow'
          ? 'Slow connection'
          : 'Connected'
        }
      </span>
    </div>
  )
}


import { useState, useEffect } from 'react'

/**
 * Custom hook for managing Firebase connection state
 * Detects online/offline status and connection quality
 */
export function useConnectionState() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isConnected, setIsConnected] = useState(true)
  const [connectionQuality, setConnectionQuality] = useState('good') // 'good', 'slow', 'offline'

  useEffect(() => {
    // Browser online/offline detection
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => {
      setIsOnline(false)
      setConnectionQuality('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Firestore connection state (if available)
    // Note: Firestore doesn't have direct connection state API
    // We'll use network status as proxy
    
    // Monitor connection quality
    const checkConnection = async () => {
      try {
        const start = Date.now()
        await fetch('https://www.google.com/favicon.ico', { 
          mode: 'no-cors',
          cache: 'no-cache'
        })
        const latency = Date.now() - start
        
        if (latency > 2000) {
          setConnectionQuality('slow')
        } else {
          setConnectionQuality('good')
        }
        setIsConnected(true)
      } catch (error) {
        setConnectionQuality('offline')
        setIsConnected(false)
      }
    }

    // Check connection periodically
    const interval = setInterval(checkConnection, 30000) // Every 30 seconds
    checkConnection() // Initial check

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  return {
    isOnline,
    isConnected,
    connectionQuality,
    isOffline: !isOnline || !isConnected
  }
}


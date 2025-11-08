import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './SplashScreen.css'

export default function SplashScreen() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // If user is already authenticated, skip splash and go directly to dashboard
    if (!loading && user) {
      navigate('/', { replace: true })
      return
    }

    // Only show splash if user is not authenticated
    if (!loading && !user) {
      // Show splash for 2 seconds, then navigate to login
      const timer = setTimeout(() => {
        setFadeOut(true)
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 500) // Wait for fade animation
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [navigate, user, loading])

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <h1 className="splash-title">Training Management System</h1>
        <div className="splash-loader">
          <div className="splash-spinner"></div>
        </div>
      </div>
    </div>
  )
}


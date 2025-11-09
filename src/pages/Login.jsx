import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import LoadingSpinner from '../components/LoadingSpinner'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1 = email, 2 = password
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleEmailNext = (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    setError('')
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
    setError('')
  }

  const handleTopNavigation = () => {
    if (step === 1) {
      navigate('/')
    } else {
      handleBack()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) {
      setError('Please enter your password')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result.success) {
        navigate('/')
      } else {
        setError(result.error || 'Login failed')
        setStep(2) // Stay on password step if login fails
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="theme-toggle-top">
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
      <div className="auth-card">
        <div className="card-top-actions">
          <button
            type="button"
            className="btn-back"
            onClick={handleTopNavigation}
            disabled={loading}
          >
            {step === 1 ? '← Cancel' : '← Back'}
          </button>
        </div>
        <h2>Login</h2>
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Email</span>
          </div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Password</span>
          </div>
        </div>

        <form onSubmit={(e) => {
          if (step === 1) {
            handleEmailNext(e)
          } else {
            handleSubmit(e)
          }
        }}>
          <div className={`form-step ${step === 1 ? 'active' : step === 2 ? 'previous' : ''}`}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                required
                placeholder="Enter your email"
                disabled={loading || step === 2}
                autoFocus={step === 1}
                autoComplete="email"
              />
            </div>
            {step === 1 && (
              <button type="submit" className="btn-primary" disabled={loading || !email}>
                Next →
              </button>
            )}
          </div>

          <div className={`form-step ${step === 2 ? 'active' : ''}`}>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  required
                  placeholder="Enter your password"
                  disabled={loading}
                  autoFocus={step === 2}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  <span style={{ color: 'var(--green-icon)' }}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </span>
                </button>
              </div>
            </div>
            {step === 2 && (
              <button type="submit" className="btn-primary" disabled={loading || !password} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? (
                  <>
                    <LoadingSpinner size="small" text="" inline={true} />
                    <span>Logging in...</span>
                  </>
                ) : 'Login'}
              </button>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}

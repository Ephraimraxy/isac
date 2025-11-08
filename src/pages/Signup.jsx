import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import LoadingSpinner from '../components/LoadingSpinner'
import './Auth.css'

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1 = name, 2 = email, 3 = password, 4 = confirm password
  const { signup } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleTopNavigation = () => {
    if (step === 1) {
      navigate('/login')
    } else {
      handleBack()
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleNext = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')

    if (step === 1) {
      if (!formData.name || formData.name.trim().length < 2) {
        setError('Please enter your full name (at least 2 characters)')
        return false
      }
      setStep(2)
      return true
    } else if (step === 2) {
      if (!formData.email || !formData.email.includes('@')) {
        setError('Please enter a valid email address')
        return false
      }
      setStep(3)
      return true
    } else if (step === 3) {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return false
      }
      setStep(4)
      return true
    }
    return false
  }

  const handleBack = () => {
    setStep(step - 1)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const result = await signup(formData.email, formData.password, formData.name)
      if (result.success) {
        navigate('/', { replace: true })
      } else {
        setError(result.error || 'Signup failed')
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
            {step === 1 ? '← Back to Login' : '← Back'}
          </button>
        </div>
        <h2>Sign Up</h2>
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Name</span>
          </div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Email</span>
          </div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Password</span>
          </div>
          <div className={`step-line ${step >= 4 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 4 ? 'active' : ''}`}>
            <span className="step-number">4</span>
            <span className="step-label">Confirm</span>
          </div>
        </div>

        <form onSubmit={(e) => {
          if (step < 4) {
            handleNext(e)
          } else {
            handleSubmit(e)
          }
        }}>
          {/* Step 1: Name */}
          <div className={`form-step ${step === 1 ? 'active' : step > 1 ? 'previous' : ''}`}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                disabled={loading || step > 1}
                autoFocus={step === 1}
                autoComplete="name"
              />
            </div>
            {step === 1 && (
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading || !formData.name.trim()}
              >
                Next →
              </button>
            )}
          </div>

          {/* Step 2: Email */}
          <div className={`form-step ${step === 2 ? 'active' : step > 2 ? 'previous' : ''}`}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={loading || step > 2}
                autoFocus={step === 2}
                autoComplete="email"
              />
            </div>
            {step === 2 && (
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading || !formData.email}
              >
                Next →
              </button>
            )}
          </div>

          {/* Step 3: Password */}
          <div className={`form-step ${step === 3 ? 'active' : step > 3 ? 'previous' : ''}`}>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password (min 6 characters)"
                  disabled={loading || step > 3}
                  autoFocus={step === 3}
                  autoComplete="new-password"
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
            {step === 3 && (
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading || formData.password.length < 6}
              >
                Next →
              </button>
            )}
          </div>

          {/* Step 4: Confirm Password */}
          <div className={`form-step ${step === 4 ? 'active' : ''}`}>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                disabled={loading}
                autoFocus={step === 4}
                autoComplete="new-password"
              />
            </div>
            {step === 4 && (
              <button type="submit" className="btn-primary" disabled={loading || !formData.confirmPassword} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? (
                  <>
                    <LoadingSpinner size="small" text="" inline={true} />
                    <span>Signing up...</span>
                  </>
                ) : 'Sign Up'}
              </button>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}

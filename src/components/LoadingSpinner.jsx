import React from 'react'
import './LoadingSpinner.css'

export default function LoadingSpinner({ size = 'medium', text = 'Loading...', inline = false }) {
  const spinner = (
    <div className={`loading-spinner ${size}`}>
      <svg className="spinner-svg" viewBox="0 0 50 50">
        <circle
          className="spinner-path"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="31.416"
          strokeDashoffset="31.416"
        />
        <path
          className="spinner-arrow"
          d="M 25 5 L 30 10 L 25 8 L 20 10 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )

  if (inline) {
    return spinner
  }

  return (
    <div className="loading-spinner-container">
      {spinner}
      {text && <p className="loading-text">{text}</p>}
    </div>
  )
}


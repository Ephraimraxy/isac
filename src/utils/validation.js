/**
 * Validation utilities for form inputs and data sanitization
 */

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validates a password
 * @param {string} password - Password to validate
 * @param {number} minLength - Minimum length (default: 6)
 * @returns {{ valid: boolean, message: string }} - Validation result
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' }
  }

  if (password.length < minLength) {
    return { 
      valid: false, 
      message: `Password must be at least ${minLength} characters long` 
    }
  }

  return { valid: true, message: '' }
}

/**
 * Validates a name
 * @param {string} name - Name to validate
 * @param {number} minLength - Minimum length (default: 2)
 * @returns {{ valid: boolean, message: string }} - Validation result
 */
export const validateName = (name, minLength = 2) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Name is required' }
  }

  const trimmed = name.trim()
  if (trimmed.length < minLength) {
    return { 
      valid: false, 
      message: `Name must be at least ${minLength} characters long` 
    }
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s'-]+$/
  if (!nameRegex.test(trimmed)) {
    return { 
      valid: false, 
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes' 
    }
  }

  return { valid: true, message: '' }
}

/**
 * Sanitizes a string input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

/**
 * Sanitizes text for display (allows some HTML but removes scripts)
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return ''
  
  // Basic sanitization - in production, use a library like DOMPurify
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
}

/**
 * Validates a number
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value (optional)
 * @param {number} max - Maximum value (optional)
 * @returns {{ valid: boolean, message: string }} - Validation result
 */
export const validateNumber = (value, min = null, max = null) => {
  const num = Number(value)
  
  if (isNaN(num)) {
    return { valid: false, message: 'Must be a valid number' }
  }

  if (min !== null && num < min) {
    return { valid: false, message: `Must be at least ${min}` }
  }

  if (max !== null && num > max) {
    return { valid: false, message: `Must be at most ${max}` }
  }

  return { valid: true, message: '' }
}

/**
 * Validates required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field (for error message)
 * @returns {{ valid: boolean, message: string }} - Validation result
 */
export const validateRequired = (value, fieldName = 'Field') => {
  if (value === null || value === undefined || value === '') {
    return { valid: false, message: `${fieldName} is required` }
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return { valid: false, message: `${fieldName} is required` }
  }

  return { valid: true, message: '' }
}

/**
 * Validates module data
 * @param {object} moduleData - Module data to validate
 * @returns {{ valid: boolean, errors: string[] }} - Validation result
 */
export const validateModule = (moduleData) => {
  const errors = []

  const nameValidation = validateRequired(moduleData.name, 'Module name')
  if (!nameValidation.valid) errors.push(nameValidation.message)

  const descriptionValidation = validateRequired(moduleData.description, 'Description')
  if (!descriptionValidation.valid) errors.push(descriptionValidation.message)

  const durationValidation = validateNumber(moduleData.duration, 1, 1000)
  if (!durationValidation.valid) errors.push(durationValidation.message)

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Converts Firebase authentication error codes to user-friendly messages
 * @param {Error|string} error - Firebase error object or error message string
 * @returns {string} - User-friendly error message
 */
export const getFirebaseErrorMessage = (error) => {
  // If error is already a string, check if it contains Firebase error codes
  const errorMessage = typeof error === 'string' ? error : error?.message || error?.code || ''
  
  // Firebase Auth error code mappings
  const errorMappings = {
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/user-not-found': 'No account found with this email address. Please sign up first.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/email-already-in-use': 'An account with this email already exists. Please use a different email or try logging in.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password (at least 6 characters).',
    'auth/invalid-email': 'Invalid email address. Please enter a valid email.',
    'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
    'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups and try again.',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in method.',
    'auth/requires-recent-login': 'This operation requires recent authentication. Please log out and log back in.',
    'auth/invalid-verification-code': 'Invalid verification code. Please try again.',
    'auth/invalid-verification-id': 'Invalid verification ID. Please try again.',
    'auth/missing-verification-code': 'Verification code is missing. Please try again.',
    'auth/missing-verification-id': 'Verification ID is missing. Please try again.',
    'auth/code-expired': 'Verification code has expired. Please request a new one.',
  }

  // Check for exact error code matches
  for (const [code, message] of Object.entries(errorMappings)) {
    if (errorMessage.includes(code)) {
      return message
    }
  }

  // Check for error code in format "Firebase: Error (auth/xxx)"
  const codeMatch = errorMessage.match(/auth\/[\w-]+/)
  if (codeMatch) {
    const code = codeMatch[0]
    if (errorMappings[code]) {
      return errorMappings[code]
    }
  }

  // If no specific mapping found, return a generic message
  if (errorMessage.toLowerCase().includes('firebase')) {
    return 'An authentication error occurred. Please try again or contact support if the problem persists.'
  }

  // Return the original error message if it's user-friendly, otherwise return generic message
  if (errorMessage && !errorMessage.includes('Firebase:') && !errorMessage.includes('auth/')) {
    return errorMessage
  }

  return 'An unexpected error occurred. Please try again.'
}


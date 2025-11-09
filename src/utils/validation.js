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


/**
 * Application-wide constants
 * Centralizes magic strings and numbers for better maintainability
 */

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TRAINEE: 'trainee'
}

// Module Status
export const MODULE_STATUS = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed'
}

// Attendance Status
export const ATTENDANCE_STATUS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late'
}

// Collection Names (matching Firestore collections)
export const COLLECTIONS = {
  USERS: 'users',
  MODULES: 'modules',
  ATTENDANCE: 'attendance',
  ASSESSMENTS: 'assessments',
  GRADES: 'grades',
  MESSAGES: 'messages',
  TRAINEES: 'trainees'
}

// Query Limits (default values)
export const QUERY_LIMITS = {
  MODULES: 100,
  ATTENDANCE: 100,
  ASSESSMENTS: 100,
  GRADES: 100,
  MESSAGES: 50,
  TRAINEES: 1000
}

// Password Requirements
export const PASSWORD = {
  MIN_LENGTH: 6,
  MAX_LENGTH: 128
}

// Name Requirements
export const NAME = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 100
}

// Validation Messages
export const VALIDATION_MESSAGES = {
  REQUIRED: (fieldName) => `${fieldName} is required`,
  MIN_LENGTH: (fieldName, min) => `${fieldName} must be at least ${min} characters long`,
  MAX_LENGTH: (fieldName, max) => `${fieldName} must be at most ${max} characters long`,
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  WEAK_PASSWORD: 'Password is too weak. Please use a stronger password.'
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  GENERIC: 'An unexpected error occurred. Please try again.',
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  SIGNUP_FAILED: 'Signup failed. Please try again.'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  MODULE_CREATED: 'Module created successfully!',
  ATTENDANCE_MARKED: 'Attendance marked successfully!',
  GRADE_SUBMITTED: 'Grade submitted successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!'
}

// Routes
export const ROUTES = {
  SPLASH: '/splash',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/',
  MODULES: '/modules',
  ATTENDANCE: '/attendance',
  ASSESSMENTS: '/assessments',
  MESSAGING: '/messaging',
  SETTINGS: '/settings'
}

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_SETTINGS: 'userSettings',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
  THEME: 'theme'
}

// Toast Durations (in milliseconds)
export const TOAST_DURATION = {
  ERROR: 5000,
  SUCCESS: 3000,
  WARNING: 4000,
  INFO: 4000
}

// Status Badge Icons
export const STATUS_ICONS = {
  COMPLETED: '✅',
  IN_PROGRESS: '🔄',
  PRESENT: '✅',
  ABSENT: '❌',
  LATE: '⏰'
}

// Status Badge Colors
export const STATUS_COLORS = {
  PRESENT: { bg: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' },
  ABSENT: { bg: 'rgba(244, 67, 54, 0.1)', color: '#f44336' },
  LATE: { bg: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' },
  COMPLETED: { bg: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' },
  IN_PROGRESS: { bg: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }
}


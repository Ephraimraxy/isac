import { useState, useEffect } from 'react'
import { subscribeToModules, createModule } from '../services/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useError } from '../contexts/ErrorContext'
import { validateModule, sanitizeString } from '../utils/validation'
import { SUCCESS_MESSAGES } from '../constants'

/**
 * Custom hook for managing modules
 * Handles loading, creating, and real-time updates
 */
export function useModules() {
  const { user, loading: authLoading } = useAuth()
  const { showError, showSuccess, showErrorFromException } = useError()
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Don't subscribe until user is authenticated
    if (authLoading || !user) {
      setLoading(true)
      return
    }

    const unsubscribe = subscribeToModules((modulesData) => {
      setModules(modulesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, authLoading])

  const createNewModule = async (moduleData) => {
    // Validate and sanitize input
    const sanitizedData = {
      name: sanitizeString(moduleData.name),
      description: sanitizeString(moduleData.description),
      duration: moduleData.duration,
      status: moduleData.status
    }
    
    const validation = validateModule(sanitizedData)
    if (!validation.valid) {
      validation.errors.forEach(error => showError(error))
      return { success: false }
    }
    
    try {
      await createModule({
        name: sanitizedData.name,
        description: sanitizedData.description,
        duration: parseInt(sanitizedData.duration),
        status: sanitizedData.status,
        trainees: 0
      })
      showSuccess(SUCCESS_MESSAGES.MODULE_CREATED)
      return { success: true }
    } catch (error) {
      showErrorFromException(error, 'Failed to create module. Please try again.')
      return { success: false }
    }
  }

  return {
    modules,
    loading,
    createModule: createNewModule
  }
}


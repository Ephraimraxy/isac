import { useState, useEffect } from 'react'
import { subscribeToAttendance, subscribeToModules, markAttendance, getTrainees } from '../services/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useError } from '../contexts/ErrorContext'
import { SUCCESS_MESSAGES } from '../constants'

/**
 * Custom hook for managing attendance
 * Handles loading, filtering, and marking attendance
 */
export function useAttendance(selectedDate, selectedModule) {
  const { user, loading: authLoading } = useAuth()
  const { showError, showSuccess, showErrorFromException } = useError()
  const [attendance, setAttendance] = useState([])
  const [modules, setModules] = useState([])
  const [trainees, setTrainees] = useState([])
  const [loading, setLoading] = useState(true)

  // Load modules and trainees - wait for authentication
  useEffect(() => {
    // Don't subscribe until user is authenticated
    if (authLoading || !user) {
      setLoading(true)
      return
    }

    const fetchData = async () => {
      try {
        const traineesData = await getTrainees()
        setTrainees(traineesData)
      } catch (error) {
        showErrorFromException(error, 'Failed to load trainees. Please refresh the page.')
      }
    }
    fetchData()

    const unsubscribeModules = subscribeToModules((modulesData) => {
      setModules(modulesData)
    })

    return () => unsubscribeModules()
  }, [user, authLoading, showErrorFromException])

  // Load attendance with filters - wait for authentication
  useEffect(() => {
    // Don't subscribe until user is authenticated
    if (authLoading || !user) {
      setLoading(true)
      return
    }

    const filters = {}
    if (selectedDate) filters.date = selectedDate
    if (selectedModule !== 'all') filters.module = selectedModule

    const unsubscribe = subscribeToAttendance(filters, (attendanceData) => {
      setAttendance(attendanceData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, authLoading, selectedDate, selectedModule])

  const markNewAttendance = async (attendanceData) => {
    try {
      const trainee = trainees.find(t => t.id === attendanceData.traineeId)
      await markAttendance({
        traineeId: attendanceData.traineeId,
        traineeName: trainee?.name || 'Unknown',
        module: attendanceData.module,
        date: selectedDate,
        status: attendanceData.status,
        time: attendanceData.time || new Date().toLocaleTimeString(),
        markedBy: user?.uid
      })
      showSuccess(SUCCESS_MESSAGES.ATTENDANCE_MARKED)
      return { success: true }
    } catch (error) {
      showErrorFromException(error, 'Failed to mark attendance. Please try again.')
      return { success: false }
    }
  }

  return {
    attendance,
    modules,
    trainees,
    loading,
    markAttendance: markNewAttendance
  }
}


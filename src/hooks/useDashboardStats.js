import { useState, useEffect } from 'react'
import { subscribeToModules, subscribeToAttendance, getTrainees } from '../services/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useError } from '../contexts/ErrorContext'
import { MODULE_STATUS } from '../constants'

/**
 * Custom hook for real-time dashboard statistics
 * Calculates stats from real-time data streams
 */
export function useDashboardStats() {
  const { user, loading: authLoading } = useAuth()
  const { showErrorFromException } = useError()
  const [stats, setStats] = useState({
    totalTrainees: 0,
    activeModules: 0,
    attendanceRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    // Don't subscribe until user is authenticated
    if (authLoading || !user) {
      setLoading(true)
      return
    }

    let modulesUnsubscribe = null
    let attendanceUnsubscribe = null
    let traineesData = []
    let currentModules = []
    let currentAttendance = []

    const calculateStats = () => {
      const activeModules = currentModules.filter(m => m.status === MODULE_STATUS.IN_PROGRESS).length
      const totalAttendance = currentAttendance.length
      const presentCount = currentAttendance.filter(a => a.status === 'Present').length
      const attendanceRate = totalAttendance > 0 
        ? Math.round((presentCount / totalAttendance) * 100 * 10) / 10 
        : 0

      setStats({
        totalTrainees: traineesData.length,
        activeModules,
        attendanceRate
      })
    }

    const updateRecentActivity = () => {
      const activities = []
      
      // Add recent modules
      currentModules.slice(0, 2).forEach(module => {
        activities.push({
          type: 'module',
          message: `New module "${module.name}" created`,
          time: module.created?.toDate ? module.created.toDate() : new Date()
        })
      })

      // Add recent attendance
      currentAttendance.slice(0, 1).forEach(att => {
        activities.push({
          type: 'attendance',
          message: `${att.traineeName || 'Trainee'} marked attendance for ${att.module}`,
          time: att.timestamp?.toDate ? att.timestamp.toDate() : new Date()
        })
      })

      activities.sort((a, b) => b.time - a.time)
      setRecentActivity(activities.slice(0, 3))
    }

    // Load trainees once (they don't change as frequently)
    const loadTrainees = async () => {
      try {
        traineesData = await getTrainees()
        calculateStats()
        setLoading(false)
      } catch (error) {
        showErrorFromException(error, 'Failed to load trainees count.')
        setLoading(false)
      }
    }

    loadTrainees()

    // Subscribe to modules
    modulesUnsubscribe = subscribeToModules((modulesData) => {
      currentModules = modulesData
      calculateStats()
      updateRecentActivity()
    }, 100)

    // Subscribe to attendance
    attendanceUnsubscribe = subscribeToAttendance({}, (attendanceData) => {
      currentAttendance = attendanceData
      calculateStats()
      updateRecentActivity()
    }, 100)

    return () => {
      if (modulesUnsubscribe) modulesUnsubscribe()
      if (attendanceUnsubscribe) attendanceUnsubscribe()
    }
  }, [user, authLoading, showErrorFromException])

  return {
    stats,
    recentActivity,
    loading
  }
}


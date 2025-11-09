import { useState, useEffect } from 'react'
import { subscribeToModules, subscribeToAssessments, subscribeToGrades } from '../services/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useError } from '../contexts/ErrorContext'
import { MODULE_STATUS } from '../constants'

/**
 * Custom hook for real-time trainee dashboard data
 * Subscribes to modules, assessments, and grades for live updates
 */
export function useRealTimeTraineeDashboard() {
  const { user } = useAuth()
  const { showErrorFromException } = useError()
  const [progress, setProgress] = useState({
    overall: 0,
    completedModules: 0,
    totalModules: 0
  })
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [assessmentStats, setAssessmentStats] = useState({
    averageScore: 0,
    completed: 0,
    total: 0,
    pending: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return

    let modulesUnsubscribe = null
    let assessmentsUnsubscribe = null
    let gradesUnsubscribe = null

    const updateProgress = (modules) => {
      const completedModules = modules.filter(m => m.status === MODULE_STATUS.COMPLETED).length
      const totalModules = modules.length
      const overallProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0

      setProgress({
        overall: Math.round(overallProgress),
        completedModules,
        totalModules
      })

      // Get upcoming sessions (modules in progress)
      const upcoming = modules
        .filter(m => m.status === MODULE_STATUS.IN_PROGRESS)
        .slice(0, 2)
        .map(module => ({
          ...module,
          date: module.created?.toDate ? module.created.toDate() : new Date()
        }))
      setUpcomingSessions(upcoming)
    }

    const updateAssessmentStats = (assessments, grades) => {
      const completedAssessments = assessments.filter(a => a.status === 'Completed').length
      const totalAssessments = assessments.length
      const completedGrades = grades.filter(g => g.score !== null && g.score !== undefined)
      const averageScore = completedGrades.length > 0
        ? completedGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / completedGrades.length
        : 0

      setAssessmentStats({
        averageScore: Math.round(averageScore),
        completed: completedAssessments,
        total: totalAssessments,
        pending: totalAssessments - completedAssessments
      })
    }

    // Subscribe to modules
    modulesUnsubscribe = subscribeToModules((modulesData) => {
      updateProgress(modulesData)
      setLoading(false)
    }, 100)

    let currentAssessments = []
    let currentGrades = []

    // Subscribe to assessments
    assessmentsUnsubscribe = subscribeToAssessments(
      { traineeId: user.uid },
      (assessmentsData) => {
        currentAssessments = assessmentsData
        updateAssessmentStats(currentAssessments, currentGrades)
      },
      100
    )

    // Subscribe to grades
    gradesUnsubscribe = subscribeToGrades(
      { traineeId: user.uid },
      (gradesData) => {
        currentGrades = gradesData
        updateAssessmentStats(currentAssessments, currentGrades)
      },
      100
    )

    return () => {
      if (modulesUnsubscribe) modulesUnsubscribe()
      if (assessmentsUnsubscribe) assessmentsUnsubscribe()
      if (gradesUnsubscribe) gradesUnsubscribe()
    }
  }, [user, showErrorFromException])

  return {
    progress,
    upcomingSessions,
    assessmentStats,
    loading
  }
}


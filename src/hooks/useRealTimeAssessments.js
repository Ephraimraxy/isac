import { useState, useEffect } from 'react'
import { subscribeToAssessments, subscribeToGrades, getTrainees } from '../services/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useError } from '../contexts/ErrorContext'

/**
 * Custom hook for real-time assessments and grades
 * Subscribes to assessments and grades collections for live updates
 */
export function useRealTimeAssessments() {
  const { user } = useAuth()
  const { showErrorFromException } = useError()
  const [assessments, setAssessments] = useState([])
  const [grades, setGrades] = useState([])
  const [trainees, setTrainees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return

    let assessmentsUnsubscribe = null
    let gradesUnsubscribe = null

    // Load trainees once (for admin)
    const loadTrainees = async () => {
      if (user?.role === 'admin') {
        try {
          const traineesData = await getTrainees()
          setTrainees(traineesData)
        } catch (error) {
          showErrorFromException(error, 'Failed to load trainees.')
        }
      } else {
        setTrainees([])
      }
    }

    loadTrainees()

    // Subscribe to assessments
    const filters = user?.role === 'trainee' ? { traineeId: user.uid } : {}
    assessmentsUnsubscribe = subscribeToAssessments(filters, (assessmentsData) => {
      setAssessments(assessmentsData)
      setLoading(false)
    }, 100)

    // Subscribe to grades
    const gradeFilters = user?.role === 'trainee' ? { traineeId: user.uid } : {}
    gradesUnsubscribe = subscribeToGrades(gradeFilters, (gradesData) => {
      setGrades(gradesData)
    }, 100)

    return () => {
      if (assessmentsUnsubscribe) assessmentsUnsubscribe()
      if (gradesUnsubscribe) gradesUnsubscribe()
    }
  }, [user, showErrorFromException])

  return {
    assessments,
    grades,
    trainees,
    loading
  }
}


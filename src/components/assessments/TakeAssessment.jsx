import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'
import { useError } from '../../contexts/ErrorContext'
import { useModal } from '../../hooks/useModal'
import LoadingSpinner from '../LoadingSpinner'
import './TakeAssessment.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function TakeAssessment({ assessmentId, moduleId, assessmentName, onComplete }) {
  const { user } = useAuth()
  const { showError, showSuccess } = useError()
  const { isOpen: showModal, open: openModal, close: closeModal, modalRef } = useModal()
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore] = useState(null)

  useEffect(() => {
    if (showModal && moduleId) {
      loadQuestions()
    }
  }, [showModal, moduleId])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      if (!moduleId) {
        showError('Module ID is missing. Please try again.')
        setLoading(false)
        return
      }

      const questionsRef = collection(db, 'modules', moduleId, 'questions')
      const questionsSnapshot = await getDocs(questionsRef)
      
      const loadedQuestions = questionsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(q => q.question && q.options && Array.isArray(q.options) && q.options.length > 0)

      if (loadedQuestions.length === 0) {
        showError('No questions found for this assessment. Please contact your administrator.')
        setLoading(false)
        closeModal()
        return
      }

      setQuestions(loadedQuestions)
      
      // Initialize answers object
      const initialAnswers = {}
      loadedQuestions.forEach(q => {
        initialAnswers[q.id] = ''
      })
      setAnswers(initialAnswers)
    } catch (error) {
      console.error('Error loading questions:', error)
      showError('Failed to load questions. Please check your connection and try again.')
      closeModal()
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check if all questions are answered
    const unanswered = questions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      showError(`Please answer all questions. ${unanswered.length} question(s) remaining.`)
      return
    }

    setSubmitting(true)

    try {
      // Check if backend is available, otherwise score locally
      let calculatedScore = 0
      let maxScore = questions.length

      if (BACKEND_URL && BACKEND_URL !== 'http://localhost:8000') {
        try {
          // Send answers to backend for scoring with timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

          let response
          try {
            response = await fetch(`${BACKEND_URL}/score-assessment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                moduleId,
                assessmentId,
                traineeId: user.uid,
                answers: Object.entries(answers).map(([questionId, answer]) => ({
                  questionId,
                  answer
                }))
              }),
              signal: controller.signal
            })
            clearTimeout(timeoutId)
          } catch (fetchError) {
            clearTimeout(timeoutId)
            if (fetchError.name === 'AbortError') {
              throw new Error('Scoring request timed out. Scoring locally...')
            }
            throw fetchError
          }

          if (response.ok) {
            const data = await response.json()
            calculatedScore = data.score || 0
            maxScore = data.total || questions.length
          } else {
            throw new Error('Backend scoring failed, scoring locally...')
          }
        } catch (backendError) {
          console.warn('Backend scoring failed, using local scoring:', backendError)
          // Fallback to local scoring
          calculatedScore = scoreLocally()
        }
      } else {
        // No backend configured, score locally
        calculatedScore = scoreLocally()
      }

      function scoreLocally() {
        let score = 0
        questions.forEach(question => {
          const userAnswer = answers[question.id]
          if (userAnswer && userAnswer.trim().toLowerCase() === (question.correctAnswer || '').trim().toLowerCase()) {
            score++
          }
        })
        return score
      }

      // Save score to Firestore with error handling
      try {
        const assessmentResultRef = doc(db, 'users', user.uid, 'assessments', moduleId)
        await setDoc(assessmentResultRef, {
          assessmentId,
          moduleId,
          score: calculatedScore,
          maxScore,
          percentage: Math.round((calculatedScore / maxScore) * 100),
          submittedAt: serverTimestamp(),
          answers: answers
        })
      } catch (error) {
        console.error('Error saving assessment result:', error)
        // Continue even if save fails
      }

      // Also save to grades collection
      try {
        const gradesRef = collection(db, 'grades')
        await setDoc(doc(gradesRef), {
          assessmentId,
          traineeId: user.uid,
          score: calculatedScore,
          maxScore,
          module: assessmentName,
          submittedAt: serverTimestamp()
        })
      } catch (error) {
        console.error('Error saving grade:', error)
        // Continue even if save fails
      }

      setScore({
        score: calculatedScore,
        maxScore,
        percentage: Math.round((calculatedScore / maxScore) * 100)
      })

      showSuccess(`Assessment completed! Score: ${calculatedScore}/${maxScore} (${Math.round((calculatedScore / maxScore) * 100)}%)`)
      
      if (onComplete) {
        onComplete(calculatedScore, maxScore)
      }
    } catch (error) {
      console.error('Error submitting assessment:', error)
      showError(error.message || 'Failed to submit assessment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <LoadingSpinner size="large" text="Loading questions..." />
        </div>
      </div>
    )
  }

  return (
    <>
      <button 
        className="btn-primary" 
        onClick={openModal}
        style={{ color: 'var(--green-icon)' }}
      >
        📝 Take Assessment
      </button>

      {showModal && (
        <div 
          className="modal-overlay" 
          onClick={() => !submitting && closeModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="take-assessment-modal-title"
        >
          <div 
            className="modal-content take-assessment-modal" 
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
          >
            <h3 id="take-assessment-modal-title">{assessmentName}</h3>
            
            {score ? (
              <div className="score-display">
                <div className="score-circle">
                  <div className="score-value">{score.percentage}%</div>
                  <div className="score-label">Score</div>
                </div>
                <div className="score-details">
                  <p>You scored <strong>{score.score} out of {score.maxScore}</strong></p>
                  <p className={score.percentage >= 80 ? 'score-pass' : 'score-fail'}>
                    {score.percentage >= 80 ? '✅ Passed!' : '❌ Failed'}
                  </p>
                </div>
                <button 
                  className="btn-primary" 
                  onClick={closeModal}
                  style={{ marginTop: '20px' }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="questions-container">
                  {questions.map((question, index) => (
                    <div key={question.id} className="question-card">
                      <div className="question-header">
                        <span className="question-number">Question {index + 1}</span>
                        <span className="question-points">1 point</span>
                      </div>
                      <p className="question-text">{question.question}</p>
                      <div className="options-container">
                        {question.options && question.options.map((option, optIndex) => (
                          <label key={optIndex} className="option-label">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option}
                              checked={answers[question.id] === option}
                              onChange={() => handleAnswerChange(question.id, option)}
                              disabled={submitting}
                            />
                            <span className="option-text">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={submitting}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="small" text="" inline={true} />
                        <span>Submitting...</span>
                      </>
                    ) : 'Submit Assessment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}


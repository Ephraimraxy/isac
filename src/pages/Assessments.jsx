import React, { useState } from 'react'
import { useError } from '../contexts/ErrorContext'
import { useAuth } from '../contexts/AuthContext'
import { useRealTimeAssessments } from '../hooks/useRealTimeAssessments'
import { submitGrade, getModules } from '../services/firestore'
import { useModal } from '../hooks/useModal'
import { SUCCESS_MESSAGES } from '../constants'
import LoadingSpinner from '../components/LoadingSpinner'
import GenerateQuestions from '../components/assessments/GenerateQuestions'
import TakeAssessment from '../components/assessments/TakeAssessment'
import './Assessments.css'

export default function Assessments() {
  const { user } = useAuth()
  const { showError, showSuccess, showErrorFromException } = useError()
  const { assessments, grades, trainees, loading } = useRealTimeAssessments()
  const { isOpen: showGradeModal, open: openGradeModal, close: closeGradeModal, modalRef } = useModal()
  const { isOpen: showCreateModal, open: openCreateModal, close: closeCreateModal, modalRef: createModalRef } = useModal()
  const [selectedAssessment, setSelectedAssessment] = useState(null)
  const [gradeData, setGradeData] = useState({ traineeId: '', score: '' })
  const [submitting, setSubmitting] = useState(false)
  const [modules, setModules] = useState([])
  const [selectedModule, setSelectedModule] = useState(null)

  const averageScore = grades.length > 0
    ? grades
        .filter(g => g.score !== null && g.score !== undefined)
        .reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.filter(g => g.score !== null && g.score !== undefined).length
    : 0

  const handleEnterGrade = (assessment) => {
    setSelectedAssessment(assessment)
    openGradeModal()
  }

  const handleSubmitGrade = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitGrade({
        assessmentId: selectedAssessment.id,
        traineeId: gradeData.traineeId,
        score: parseInt(gradeData.score),
        maxScore: selectedAssessment.maxScore || 100,
        module: selectedAssessment.module
      })
      
      // Data will update automatically via real-time listeners
      closeGradeModal()
      setGradeData({ traineeId: '', score: '' })
      showSuccess(SUCCESS_MESSAGES.GRADE_SUBMITTED)
    } catch (error) {
      showErrorFromException(error, 'Failed to submit grade. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getAssessmentGrade = (assessmentId) => {
    return grades.find(g => g.assessmentId === assessmentId)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString()
    }
    return new Date(timestamp).toLocaleDateString()
  }

  React.useEffect(() => {
    const loadModules = async () => {
      try {
        const modulesData = await getModules()
        setModules(modulesData)
      } catch (error) {
        console.error('Error loading modules:', error)
      }
    }
    if (user?.role === 'admin') {
      loadModules()
    }
  }, [user])

  const handleCreateAssessment = () => {
    openCreateModal()
  }

  const handleQuestionsGenerated = () => {
    closeCreateModal()
    showSuccess('Questions generated successfully!')
  }

  if (loading) {
    return <LoadingSpinner size="large" text="Loading assessments..." />
  }

  return (
    <div className="assessments-page">
      <div className="assessments-header">
        <h2>Assessments & Grades</h2>
        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={handleCreateAssessment}>
            📝 Create Assessment
          </button>
        )}
      </div>

      {user?.role === 'trainee' && (
        <div className="grade-summary">
          <div className="summary-card">
            <div className="summary-icon" style={{ color: 'var(--green-icon)' }}>📊</div>
            <div>
              <h3>Average Score</h3>
              <p className="summary-value">{Math.round(averageScore)}%</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ color: 'var(--green-icon)' }}>✅</div>
            <div>
              <h3>Completed</h3>
              <p className="summary-value">
                {assessments.filter(a => a.status === 'Completed').length}/{assessments.length}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="assessments-list">
        {assessments.length > 0 ? (
          assessments.map(assessment => {
            const grade = getAssessmentGrade(assessment.id)
            const hasGrade = grade && grade.score !== null && grade.score !== undefined
            return (
              <div key={assessment.id} className="assessment-card">
                <div className="assessment-info">
                  <h3>{assessment.name}</h3>
                  <p className="assessment-module">{assessment.module}</p>
                  <div className="assessment-meta">
                    <span>Date: {formatDate(assessment.date)}</span>
                    {hasGrade && (
                      <span className="assessment-score">
                        Score: <strong>{grade.score}/{assessment.maxScore || 100}</strong>
                      </span>
                    )}
                  </div>
                </div>
                <div className="assessment-actions">
                  {hasGrade && (
                    <div className="progress-bar-container">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${(grade.score / (assessment.maxScore || 100)) * 100}%`,
                            backgroundColor: grade.score >= (assessment.maxScore || 100) * 0.8 ? 'var(--green-icon)' : 'var(--orange-primary)'
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <div className="action-buttons">
                    {user?.role === 'admin' && !hasGrade && (
                      <button
                        className="btn-grade"
                        onClick={() => handleEnterGrade(assessment)}
                      >
                        📝 Enter Grade
                      </button>
                    )}
                    {user?.role === 'trainee' && !hasGrade && assessment.moduleId && (
                      <TakeAssessment
                        assessmentId={assessment.id}
                        moduleId={assessment.moduleId}
                        assessmentName={assessment.name}
                        onComplete={(score, maxScore) => {
                          showSuccess(`Assessment completed! Score: ${score}/${maxScore}`)
                        }}
                      />
                    )}
                    <button className="btn-view" style={{ color: 'var(--green-icon)' }}>
                      👁️ View Details
                    </button>
                    {hasGrade && (
                      <button className="btn-download" style={{ color: 'var(--green-icon)' }}>
                        📥 Download Report
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No assessments found.
          </div>
        )}
      </div>

      {showGradeModal && (
        <div 
          className="modal-overlay" 
          onClick={() => !submitting && closeGradeModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="grade-modal-title"
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
          >
            <h3 id="grade-modal-title">Enter Grade for {selectedAssessment?.name}</h3>
            <form onSubmit={handleSubmitGrade}>
              <div className="form-group">
                <label>Trainee</label>
                <select
                  value={gradeData.traineeId}
                  onChange={(e) => setGradeData({ ...gradeData, traineeId: e.target.value })}
                  required
                  disabled={submitting}
                >
                  <option value="">Select trainee</option>
                  {trainees.map(trainee => (
                    <option key={trainee.id} value={trainee.id}>{trainee.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Score (out of {selectedAssessment?.maxScore || 100})</label>
                <input
                  type="number"
                  min="0"
                  max={selectedAssessment?.maxScore || 100}
                  value={gradeData.score}
                  onChange={(e) => setGradeData({ ...gradeData, score: e.target.value })}
                  required
                  placeholder="Enter score"
                  disabled={submitting}
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={closeGradeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {submitting ? (
                    <>
                      <LoadingSpinner size="small" text="" inline={true} />
                      <span>Submitting...</span>
                    </>
                  ) : 'Submit Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateModal && user?.role === 'admin' && (
        <div 
          className="modal-overlay" 
          onClick={closeCreateModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-assessment-modal-title"
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            ref={createModalRef}
          >
            <h3 id="create-assessment-modal-title">Create Assessment from PDF</h3>
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Select Module</label>
              <select
                value={selectedModule?.id || ''}
                onChange={(e) => {
                  const module = modules.find(m => m.id === e.target.value)
                  setSelectedModule(module)
                }}
              >
                <option value="">Select a module</option>
                {modules.map(module => (
                  <option key={module.id} value={module.id}>{module.name}</option>
                ))}
              </select>
            </div>
            {selectedModule && (
              <div style={{ marginTop: '20px' }}>
                <GenerateQuestions
                  moduleId={selectedModule.id}
                  moduleName={selectedModule.name}
                  onQuestionsGenerated={handleQuestionsGenerated}
                />
              </div>
            )}
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={closeCreateModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../../firebase/config'
import { doc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useError } from '../../contexts/ErrorContext'
import { useModal } from '../../hooks/useModal'
import LoadingSpinner from '../LoadingSpinner'
import './GenerateQuestions.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function GenerateQuestions({ moduleId, moduleName, onQuestionsGenerated }) {
  const { showError, showSuccess } = useError()
  const { isOpen: showModal, open: openModal, close: closeModal, modalRef } = useModal()
  const [pdfFile, setPdfFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        showError('Please select a PDF file')
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showError('File size must be less than 10MB')
        return
      }
      setPdfFile(file)
    }
  }

  const handleUploadPDF = async () => {
    if (!pdfFile || !moduleId) {
      showError('Please select a PDF file')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Upload PDF to Firebase Storage
      const storageRef = ref(storage, `modules/${moduleId}/material.pdf`)
      const uploadTask = uploadBytesResumable(storageRef, pdfFile)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(Math.round(progress))
        },
        (error) => {
          console.error('Upload error:', error)
          showError('Failed to upload PDF. Please try again.')
          setUploading(false)
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            setPdfUrl(downloadURL)

            // Update module document with PDF URL
            const moduleRef = doc(db, 'modules', moduleId)
            await updateDoc(moduleRef, {
              pdfUrl: downloadURL,
              updated: serverTimestamp()
            })

            showSuccess('PDF uploaded successfully!')
            setUploading(false)
          } catch (error) {
            console.error('Error getting download URL:', error)
            showError('Failed to get PDF URL. Please try again.')
            setUploading(false)
          }
        }
      )
    } catch (error) {
      console.error('Upload error:', error)
      showError('Failed to upload PDF. Please try again.')
      setUploading(false)
    }
  }

  const handleGenerateQuestions = async () => {
    if (!pdfUrl || !moduleId) {
      showError('Please upload a PDF first')
      return
    }

    setGenerating(true)

    try {
      // Check if backend URL is configured
      if (!BACKEND_URL || BACKEND_URL === 'http://localhost:8000') {
        showError('Backend server is not configured. Please set VITE_BACKEND_URL in your environment variables.')
        setGenerating(false)
        return
      }

      // Call Python backend to generate questions with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

      let response
      try {
        response = await fetch(`${BACKEND_URL}/generate-questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            moduleId,
            pdfUrl
          }),
          signal: controller.signal
        })
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The PDF might be too large. Please try with a smaller file.')
        }
        throw new Error('Failed to connect to backend server. Please ensure the server is running.')
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: response.status === 404 
            ? 'Backend endpoint not found. Please check the server configuration.'
            : response.status === 500
            ? 'Server error occurred. Please try again later.'
            : 'Failed to generate questions'
        }))
        throw new Error(errorData.error || errorData.detail || 'Failed to generate questions')
      }

      const data = await response.json()
      const questions = data.questions || []

      if (!questions || questions.length === 0) {
        showError('No questions were generated. Please try again or check if the PDF contains readable text.')
        setGenerating(false)
        return
      }

      // Validate question structure
      const validQuestions = questions.filter(q => 
        q.question && 
        q.options && 
        Array.isArray(q.options) && 
        q.options.length >= 2 && 
        q.correctAnswer
      )

      if (validQuestions.length === 0) {
        showError('Generated questions are invalid. Please try again.')
        setGenerating(false)
        return
      }

      // Save questions to Firestore
      const questionsRef = collection(db, 'modules', moduleId, 'questions')
      const savedQuestions = []

      for (const question of validQuestions) {
        try {
          const questionDoc = await addDoc(questionsRef, {
            question: question.question.trim(),
            options: (question.options || []).map(opt => opt.trim()).filter(opt => opt),
            correctAnswer: question.correctAnswer.trim(),
            createdAt: serverTimestamp()
          })
          savedQuestions.push({ id: questionDoc.id, ...question })
        } catch (error) {
          console.error('Error saving question:', error)
          // Continue with other questions
        }
      }

      if (savedQuestions.length === 0) {
        showError('Failed to save questions to database. Please try again.')
        setGenerating(false)
        return
      }

      // Create assessment document
      const assessmentRef = collection(db, 'assessments')
      const assessmentDoc = await addDoc(assessmentRef, {
        moduleId,
        module: moduleName,
        name: `${moduleName} Assessment`,
        questions: savedQuestions.map(q => q.id),
        questionCount: savedQuestions.length,
        maxScore: savedQuestions.length,
        date: serverTimestamp(),
        status: 'Active',
        createdAt: serverTimestamp()
      })

      showSuccess(`Successfully generated ${savedQuestions.length} questions!`)
      setGenerating(false)
      closeModal()
      
      if (onQuestionsGenerated) {
        onQuestionsGenerated(savedQuestions)
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      showError(error.message || 'Failed to generate questions. Please try again.')
      setGenerating(false)
    }
  }

  return (
    <>
      <button className="btn-primary" onClick={openModal}>
        📝 Generate Questions from PDF
      </button>

      {showModal && (
        <div 
          className="modal-overlay" 
          onClick={() => !uploading && !generating && closeModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="generate-questions-modal-title"
        >
          <div 
            className="modal-content generate-questions-modal" 
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
          >
            <h3 id="generate-questions-modal-title">Generate Questions from PDF</h3>
            <p className="modal-subtitle">Module: {moduleName}</p>

            <div className="generate-questions-steps">
              <div className="step-section">
                <h4>Step 1: Upload PDF</h4>
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="pdf-upload"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    disabled={uploading || generating}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="pdf-upload" className="file-upload-label">
                    {pdfFile ? pdfFile.name : '📄 Select PDF File'}
                  </label>
                </div>

                {pdfFile && !pdfUrl && (
                  <button
                    className="btn-primary"
                    onClick={handleUploadPDF}
                    disabled={uploading}
                    style={{ marginTop: '10px' }}
                  >
                    {uploading ? (
                      <>
                        <LoadingSpinner size="small" text="" inline={true} />
                        <span>Uploading... {uploadProgress}%</span>
                      </>
                    ) : 'Upload PDF'}
                  </button>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="progress-bar-container" style={{ marginTop: '10px' }}>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {pdfUrl && (
                  <div className="success-message" style={{ marginTop: '10px' }}>
                    ✅ PDF uploaded successfully!
                  </div>
                )}
              </div>

              <div className="step-section">
                <h4>Step 2: Generate Questions</h4>
                <p className="step-description">
                  Click the button below to automatically generate multiple choice questions from the uploaded PDF.
                </p>
                <button
                  className="btn-primary"
                  onClick={handleGenerateQuestions}
                  disabled={!pdfUrl || generating}
                  style={{ marginTop: '10px' }}
                >
                  {generating ? (
                    <>
                      <LoadingSpinner size="small" text="" inline={true} />
                      <span>Generating questions...</span>
                    </>
                  ) : '🤖 Generate Questions'}
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={closeModal}
                disabled={uploading || generating}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


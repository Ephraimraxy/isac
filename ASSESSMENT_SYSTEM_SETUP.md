# Assessment System Setup Guide

Complete guide for setting up the PDF-based assessment generation system.

## Overview

This system allows:
1. **Admin**: Upload PDF → Generate questions automatically
2. **Trainee**: Take assessment → Get automatic scoring

## Architecture

- **Frontend**: React components (`GenerateQuestions.jsx`, `TakeAssessment.jsx`)
- **Backend**: Python FastAPI (`backend/main.py`)
- **Storage**: Firebase Storage (PDFs)
- **Database**: Firestore (questions, assessments, scores)

## Frontend Setup

### 1. Environment Variables

Add to your `.env` file:

```env
# Backend URL (Python FastAPI server)
VITE_BACKEND_URL=http://localhost:8000

# Existing Firebase config...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# etc.
```

### 2. Components Created

- `src/components/assessments/GenerateQuestions.jsx` - Admin PDF upload & question generation
- `src/components/assessments/TakeAssessment.jsx` - Trainee assessment taking
- `src/components/assessments/GenerateQuestions.css` - Styles
- `src/components/assessments/TakeAssessment.css` - Styles

### 3. Integration

The components are already integrated into `src/pages/Assessments.jsx`:
- Admin sees "Create Assessment" button
- Trainees see "Take Assessment" button on each assessment

## Backend Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Firebase Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file securely
4. Set environment variable:

```bash
# Linux/Mac
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# Windows PowerShell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account-key.json"

# Windows CMD
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account-key.json
```

### 3. Run Backend Server

```bash
cd backend
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will run on `http://localhost:8000`

### 4. First Run Notes

- First time running will download the AI model (~500MB)
- This may take a few minutes
- Subsequent runs will be faster

## Firestore Structure

### Collections Created

```
modules/
  {moduleId}/
    title: string
    pdfUrl: string
    questions/
      {questionId}/
        question: string
        options: [string, string, string, string]
        correctAnswer: string
        createdAt: timestamp

assessments/
  {assessmentId}/
    moduleId: string
    module: string
    name: string
    questions: [questionId, ...]
    questionCount: number
    maxScore: number
    date: timestamp
    status: string

users/
  {userId}/
    assessments/
      {moduleId}/
        assessmentId: string
        score: number
        maxScore: number
        percentage: number
        submittedAt: timestamp
        answers: object

grades/
  {gradeId}/
    assessmentId: string
    traineeId: string
    score: number
    maxScore: number
    module: string
    submittedAt: timestamp
```

## Usage Flow

### Admin Flow

1. Go to Assessments page
2. Click "Create Assessment"
3. Select a module
4. Click "Generate Questions from PDF"
5. Upload PDF file (max 10MB)
6. Wait for upload to complete
7. Click "Generate Questions"
8. Wait for AI to generate questions (~30-60 seconds)
9. Questions are automatically saved to Firestore

### Trainee Flow

1. Go to Assessments page
2. Find an assessment
3. Click "Take Assessment"
4. Answer all multiple choice questions
5. Click "Submit Assessment"
6. View score immediately
7. Score is saved to Firestore

## API Endpoints

### POST /generate-questions

**Request:**
```json
{
  "moduleId": "abc123",
  "pdfUrl": "https://firebasestorage.googleapis.com/..."
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "What is mentioned in the text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A"
    }
  ]
}
```

### POST /score-assessment

**Request:**
```json
{
  "moduleId": "abc123",
  "assessmentId": "assessment123",
  "traineeId": "user123",
  "answers": [
    {
      "questionId": "q1",
      "answer": "Option A"
    }
  ]
}
```

**Response:**
```json
{
  "score": 8,
  "total": 10,
  "percentage": 80.0
}
```

## Troubleshooting

### Backend Issues

1. **Model download fails**: Check internet connection, model will download on first run
2. **Firestore connection fails**: Verify service account key is set correctly
3. **PDF extraction fails**: Ensure PDF is not password-protected or corrupted

### Frontend Issues

1. **Upload fails**: Check file size (max 10MB) and format (PDF only)
2. **Questions not generating**: Check backend is running and accessible
3. **Score not saving**: Check Firestore permissions and user authentication

### Common Errors

- **CORS errors**: Backend CORS is set to allow all origins (update for production)
- **Timeout errors**: Question generation can take 30-60 seconds for large PDFs
- **Model errors**: If AI model fails, system falls back to simple question generation

## Production Deployment

### Backend (Python)

1. Deploy to cloud service (Heroku, Railway, Render, etc.)
2. Set environment variables:
   - `GOOGLE_APPLICATION_CREDENTIALS` (or use service account in cloud)
   - Update CORS to allow only your frontend domain
3. Update `VITE_BACKEND_URL` in frontend `.env`

### Frontend

1. Build and deploy as usual (Netlify, Vercel, etc.)
2. Ensure `VITE_BACKEND_URL` points to production backend

## Security Notes

- ✅ PDFs stored securely in Firebase Storage
- ✅ Questions stored in Firestore with proper security rules
- ✅ Scores only accessible by trainee and admin
- ⚠️ Update CORS in production to restrict origins
- ⚠️ Use Firebase Security Rules to protect Firestore data
- ⚠️ Consider rate limiting for question generation endpoint

## Next Steps

1. Set up Firebase Security Rules for new collections
2. Add error handling for edge cases
3. Implement question review/edit functionality
4. Add analytics for assessment performance
5. Consider caching generated questions


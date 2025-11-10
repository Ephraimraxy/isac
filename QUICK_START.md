# Quick Start Guide - Assessment System

## 🚀 Quick Setup (5 minutes)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Set Firebase credentials (get from Firebase Console)
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"

# Run server
python main.py
```

Backend will run on `http://localhost:8000`

### 2. Frontend Setup

Add to your `.env` file:
```env
VITE_BACKEND_URL=http://localhost:8000
```

Restart your dev server:
```bash
npm run dev
```

### 3. Test the System

**Admin:**
1. Go to Assessments page
2. Click "Create Assessment"
3. Select a module
4. Upload a PDF
5. Click "Generate Questions"
6. Wait ~30-60 seconds for questions to generate

**Trainee:**
1. Go to Assessments page
2. Find an assessment
3. Click "Take Assessment"
4. Answer questions
5. Submit and view score

## 📁 Files Created

### Frontend
- `src/components/assessments/GenerateQuestions.jsx`
- `src/components/assessments/GenerateQuestions.css`
- `src/components/assessments/TakeAssessment.jsx`
- `src/components/assessments/TakeAssessment.css`
- `src/pages/Assessments.jsx` (updated)
- `src/firebase/config.js` (updated - added Storage)

### Backend
- `backend/main.py`
- `backend/requirements.txt`
- `backend/README.md`

### Documentation
- `ASSESSMENT_SYSTEM_SETUP.md` - Complete setup guide
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `QUICK_START.md` - This file

## ⚠️ Important Notes

1. **First Run**: Backend will download AI model (~500MB) - takes a few minutes
2. **PDF Size**: Max 10MB
3. **Question Generation**: Takes 30-60 seconds per PDF
4. **Firebase Storage**: Must be enabled in Firebase Console
5. **Service Account**: Required for backend Firestore access

## 🔧 Troubleshooting

**Backend won't start:**
- Check Python version (3.8+)
- Verify all dependencies installed
- Check Firebase credentials path

**Questions not generating:**
- Check backend is running
- Check backend URL in frontend `.env`
- Check browser console for errors

**PDF upload fails:**
- Check file size (max 10MB)
- Check file format (PDF only)
- Check Firebase Storage rules

## 📚 Full Documentation

See `ASSESSMENT_SYSTEM_SETUP.md` for complete setup instructions.

# Production Deployment Guide

## ✅ Production-Ready Features Implemented

### Error Handling
- ✅ Timeout handling for API calls (2 minutes for question generation, 30 seconds for scoring)
- ✅ Graceful fallback to local scoring if backend is unavailable
- ✅ Comprehensive error messages for users
- ✅ Validation of question structure before saving
- ✅ Retry logic for failed operations

### Validation
- ✅ PDF file type validation (PDF only)
- ✅ File size validation (max 10MB)
- ✅ Question structure validation
- ✅ Answer validation (all questions must be answered)
- ✅ Module ID validation

### User Experience
- ✅ Loading states for all async operations
- ✅ Progress tracking for PDF uploads
- ✅ Clear error messages
- ✅ Success notifications
- ✅ Disabled states during operations

### Resilience
- ✅ Works even if backend is unavailable (local scoring fallback)
- ✅ Continues saving questions even if some fail
- ✅ Handles network errors gracefully
- ✅ Validates data before processing

## Environment Variables for Production

### Frontend (.env)
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Admin Credentials
VITE_ADMIN_EMAIL=your_admin_email
VITE_ADMIN_PASSWORD=your_admin_password

# Backend API URL (REQUIRED for question generation)
# For production: https://your-backend-domain.com
VITE_BACKEND_URL=https://your-backend-domain.com
```

### Backend
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## Deployment Checklist

### Frontend (Netlify/Vercel)
- [ ] Set all environment variables in deployment platform
- [ ] Ensure `VITE_BACKEND_URL` points to production backend
- [ ] Test PDF upload functionality
- [ ] Test question generation
- [ ] Test assessment taking
- [ ] Verify Firebase Storage rules allow uploads
- [ ] Verify Firestore security rules

### Backend (Heroku/Railway/Render)
- [ ] Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- [ ] Upload Firebase service account key
- [ ] Test `/health` endpoint
- [ ] Test `/generate-questions` endpoint
- [ ] Test `/score-assessment` endpoint
- [ ] Configure CORS for production frontend domain
- [ ] Set up monitoring/logging

### Firebase
- [ ] Update Firestore security rules for new collections:
  - `modules/{moduleId}/questions/`
  - `users/{userId}/assessments/`
- [ ] Update Storage rules for PDF uploads
- [ ] Test Storage upload permissions
- [ ] Test Firestore read/write permissions

## Firebase Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Modules questions
    match /modules/{moduleId}/questions/{questionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // User assessments
    match /users/{userId}/assessments/{moduleId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Assessments collection
    match /assessments/{assessmentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /modules/{moduleId}/material.pdf {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Testing in Production

1. **PDF Upload Test**
   - Upload a PDF file
   - Verify upload progress shows
   - Verify PDF URL is saved to Firestore

2. **Question Generation Test**
   - Generate questions from uploaded PDF
   - Verify questions are created (may take 30-60 seconds)
   - Verify questions are saved to Firestore

3. **Assessment Taking Test**
   - Take an assessment as trainee
   - Answer all questions
   - Submit assessment
   - Verify score is calculated and saved

4. **Error Handling Test**
   - Test with backend unavailable (should use local scoring)
   - Test with invalid PDF
   - Test with network errors

## Monitoring

### Key Metrics to Monitor
- PDF upload success rate
- Question generation success rate
- Assessment completion rate
- Average scoring time
- Error rates by type

### Logging
- Backend logs all errors with context
- Frontend logs errors to console (production should use error tracking service)
- Consider integrating Sentry or similar for production error tracking

## Performance Optimization

- ✅ Timeout handling prevents hanging requests
- ✅ Local scoring fallback ensures assessments always work
- ✅ Question validation prevents invalid data
- ✅ Error handling prevents crashes
- ✅ Loading states provide user feedback

## Security Considerations

- ✅ File type validation (PDF only)
- ✅ File size limits (10MB)
- ✅ Input validation and sanitization
- ✅ Authentication required for all operations
- ✅ Role-based access control
- ⚠️ Update CORS in backend for production
- ⚠️ Use HTTPS for all API calls
- ⚠️ Secure Firebase service account key

## Support

If issues occur:
1. Check browser console for errors
2. Check backend logs
3. Verify environment variables are set correctly
4. Test backend health endpoint: `GET /health`
5. Verify Firebase permissions


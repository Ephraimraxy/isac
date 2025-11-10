# Deployment Checklist - What's Automatic vs Manual

## ✅ What Happens Automatically (After Setup)

Once you complete the manual setup below, these happen automatically:

- ✅ **Frontend Code Deploys**: When you push to GitHub, Netlify auto-deploys
- ✅ **PDF Upload**: Works automatically (if Firebase Storage is enabled)
- ✅ **Question Generation**: Works automatically (if backend is running)
- ✅ **Assessment Taking**: Works automatically
- ✅ **Auto-Grading**: Works automatically (with local fallback)

## 🔧 What You MUST Do Manually (One-Time Setup)

### 1. Netlify Environment Variables (REQUIRED)

Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables

Add these variables:

```env
VITE_BACKEND_URL=https://your-backend-domain.com
VITE_FIREBASE_API_KEY=AIzaSyCdexxefCbppelt2QvEK0SQ1Eay2fa6K2g
VITE_FIREBASE_AUTH_DOMAIN=trms-34e12.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=trms-34e12
VITE_FIREBASE_STORAGE_BUCKET=trms-34e12.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=611375232559
VITE_FIREBASE_APP_ID=1:611375232559:web:8c78e41a71b906869238da
VITE_FIREBASE_MEASUREMENT_ID=G-X84SXE8MJH
VITE_ADMIN_EMAIL=hoseaephraim50@gmail.com
VITE_ADMIN_PASSWORD=335533
```

**Important**: After adding variables, trigger a new deployment:
- Go to Deploys tab
- Click "Trigger deploy" → "Deploy site"

### 2. Deploy Python Backend (REQUIRED for Question Generation)

Choose one platform:

#### Option A: Railway (Easiest)
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select your repository
4. Add `backend` folder as root
5. Set environment variable:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
   ```
6. Railway will auto-deploy
7. Copy the URL (e.g., `https://your-app.railway.app`)
8. Update `VITE_BACKEND_URL` in Netlify with this URL

#### Option B: Render
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repository
4. Settings:
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && python main.py`
5. Add environment variable:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
   ```
6. Deploy
7. Copy URL and update Netlify

#### Option C: Heroku
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `cd backend`
4. `git subtree push --prefix backend heroku main`
5. Set environment variable in Heroku dashboard
6. Copy URL and update Netlify

### 3. Firebase Service Account Key (REQUIRED for Backend)

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download JSON file
4. Upload to your backend platform:
   - Railway: Add as environment variable or file
   - Render: Upload in dashboard
   - Heroku: Use config vars

### 4. Firebase Security Rules (REQUIRED)

Go to Firebase Console → Firestore Database → Rules

Paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Allow admins to read all users
      match /{document=**} {
        allow read: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      }
    }
    
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
    
    // Grades
    match /grades/{gradeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Existing collections
    match /modules/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /attendance/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /messages/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

Go to Firebase Console → Storage → Rules

Paste these rules:

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

### 5. Enable Firebase Storage (REQUIRED)

1. Go to Firebase Console → Storage
2. Click "Get Started"
3. Choose location (same as Firestore)
4. Start in test mode (rules above will secure it)

## 📋 Quick Setup Checklist

- [ ] Set all environment variables in Netlify
- [ ] Deploy Python backend to Railway/Render/Heroku
- [ ] Get backend URL and update `VITE_BACKEND_URL` in Netlify
- [ ] Download Firebase service account key
- [ ] Upload service account key to backend platform
- [ ] Update Firestore security rules
- [ ] Update Storage security rules
- [ ] Enable Firebase Storage
- [ ] Trigger new Netlify deployment
- [ ] Test PDF upload
- [ ] Test question generation
- [ ] Test assessment taking

## 🚀 After Setup - Everything is Automatic

Once you complete the checklist above:

1. **Push to GitHub** → Netlify auto-deploys frontend
2. **Admin uploads PDF** → Stored in Firebase Storage
3. **Admin clicks "Generate Questions"** → Backend generates questions automatically
4. **Trainee takes assessment** → Answers saved automatically
5. **System grades** → Score calculated and saved automatically
6. **Admin views results** → All scores visible in dashboard

## ⚠️ Important Notes

### Backend is Optional (Sort Of)
- **Question Generation**: REQUIRES backend (AI needs Python)
- **Grading**: Has local fallback (works without backend)
- **Recommendation**: Deploy backend for full functionality

### If Backend is Not Deployed
- PDF upload still works
- Question generation won't work (shows error)
- Assessment taking works (if questions exist)
- Grading works (uses local scoring)

### Testing Locally First
Before deploying, test locally:
1. Run backend: `cd backend && python main.py`
2. Run frontend: `npm run dev`
3. Test full workflow
4. Then deploy to production

## 🎯 Minimum Setup for Basic Functionality

If you want to test without backend:
- ✅ Set Firebase environment variables in Netlify
- ✅ Update Firestore/Storage rules
- ✅ Deploy frontend
- ❌ Backend not needed (but question generation won't work)

## 🎯 Full Setup for Complete Functionality

For everything to work:
- ✅ All environment variables in Netlify
- ✅ Backend deployed and running
- ✅ Backend URL set in Netlify
- ✅ Firebase rules updated
- ✅ Storage enabled

## 📞 Need Help?

1. Check browser console for errors
2. Check Netlify deployment logs
3. Check backend logs (Railway/Render/Heroku)
4. Verify environment variables are set
5. Test backend health: `GET https://your-backend-url/health`


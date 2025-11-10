# Console Errors Fix Guide

## Issues Identified

### 1. OAuth Domain Not Authorized ⚠️

**Error:**
```
The current domain is not authorized for OAuth operations. 
Add your domain (isac-tvet.netlify.app) to the OAuth redirect domains list
```

**Fix:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`trms-34e12`)
3. Navigate to **Authentication** → **Settings** → **Authorized domains** tab
4. Click **Add domain**
5. Add: `isac-tvet.netlify.app`
6. Click **Done**

**Note:** This is required for OAuth popup/redirect methods to work. If you're only using email/password auth, this warning won't break functionality but should still be fixed.

---

### 2. Firestore 400 Bad Request Errors 🔥

**Error:**
```
GET https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?... 400 (Bad Request)
```

**Root Cause:**
- Firestore listeners are being set up **before authentication completes**
- Security rules require authentication, so unauthenticated requests get rejected
- Components mount and subscribe to Firestore before user is logged in

**Solutions:**

#### Solution A: Wait for Authentication (Recommended)

Update hooks to check authentication before subscribing:

**Example Fix for `useAttendance.js`:**

```javascript
export function useAttendance(selectedDate, selectedModule) {
  const { user, loading: authLoading } = useAuth() // Get auth loading state
  // ... existing code ...

  // Load modules and trainees
  useEffect(() => {
    // Wait for auth to complete
    if (authLoading || !user) return

    const fetchData = async () => {
      // ... existing code ...
    }
    fetchData()

    const unsubscribeModules = subscribeToModules((modulesData) => {
      setModules(modulesData)
    })

    return () => unsubscribeModules()
  }, [user, authLoading, showErrorFromException]) // Add dependencies

  // Load attendance with filters
  useEffect(() => {
    // Wait for auth to complete
    if (authLoading || !user) return

    const filters = {}
    // ... existing code ...

    const unsubscribe = subscribeToAttendance(filters, (attendanceData) => {
      setAttendance(attendanceData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, authLoading, selectedDate, selectedModule]) // Add dependencies
}
```

#### Solution B: Update Firestore Security Rules

Ensure your Firestore security rules allow authenticated users. Go to Firebase Console → Firestore Database → Rules and verify you have rules like:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read modules
    match /modules/{moduleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Similar rules for other collections...
  }
}
```

See `FIRESTORE_SECURITY_RULES.md` for complete rules.

#### Solution C: Guard Listeners in Components

Update components to only subscribe when authenticated:

```javascript
useEffect(() => {
  // Don't subscribe if not authenticated
  if (!user || authLoading) {
    setLoading(false)
    return
  }

  const unsubscribe = subscribeToModules((data) => {
    setModules(data)
  })

  return () => unsubscribe()
}, [user, authLoading])
```

---

## Files That Need Updates

The following hooks/components need authentication guards:

1. ✅ `src/hooks/useRealTimeTraineeDashboard.js` - Already has guard (`if (!user?.uid) return`)
2. ❌ `src/hooks/useAttendance.js` - **Needs guard**
3. ❌ `src/hooks/useDashboardStats.js` - **Needs guard**
4. ❌ `src/pages/Attendance.jsx` - **Needs guard**
5. ❌ `src/hooks/useModules.js` - **Needs guard** (if it subscribes)
6. ❌ `src/hooks/useRealTimeAssessments.js` - **Needs guard** (if it subscribes)

---

## Quick Fix Checklist

- [ ] Add `isac-tvet.netlify.app` to Firebase Authorized Domains
- [ ] Verify Firestore Security Rules are published
- [ ] Add authentication guards to all Firestore subscription hooks
- [ ] Test login flow - errors should stop after authentication
- [ ] Verify no listeners are created before `user` is set

---

## Testing

After applying fixes:

1. **Clear browser cache** and reload
2. **Open browser console** (F12)
3. **Login** to your app
4. **Check console** - 400 errors should stop after login
5. **OAuth warning** should disappear after adding domain

---

## Why This Happens

1. **React components mount immediately** when the app loads
2. **useEffect hooks run** and set up Firestore listeners
3. **Authentication is async** - takes time to check Firebase Auth state
4. **Listeners try to connect** before user is authenticated
5. **Security rules reject** unauthenticated requests → 400 errors

The fix is to **wait for authentication** before setting up any Firestore listeners.

---

## Additional Notes

- The errors are **harmless** if you're not using OAuth (email/password works fine)
- However, they **clutter the console** and indicate a timing issue
- Fixing them will **improve app performance** and **reduce unnecessary network requests**
- The app should still function, but fixing these will make it more robust


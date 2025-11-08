# Firestore Security Rules

## ⚠️ Important: Fix 400 Bad Request Errors

The 400 Bad Request errors you're seeing are likely due to **missing or incorrect Firestore security rules**. 

## Required Security Rules

Add these rules to your Firestore Database in the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`trms-34e12`)
3. Navigate to **Firestore Database** → **Rules**
4. Replace the rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user is the document owner
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own data
      allow read: if isOwner(userId);
      // Admins can read all users
      allow read: if isAdmin();
      // Users can create their own document on signup
      allow create: if isAuthenticated() && isOwner(userId);
      // Only admins can update user data
      allow update: if isAdmin();
      // Only admins can delete users
      allow delete: if isAdmin();
    }
    
    // Modules collection
    match /modules/{moduleId} {
      // Everyone authenticated can read modules
      allow read: if isAuthenticated();
      // Only admins can create/update/delete modules
      allow create, update, delete: if isAdmin();
    }
    
    // Attendance collection
    match /attendance/{attendanceId} {
      // Users can read their own attendance
      allow read: if isAuthenticated() && 
                     (resource.data.traineeId == request.auth.uid || isAdmin());
      // Admins can create/update/delete attendance
      allow create, update, delete: if isAdmin();
    }
    
    // Assessments collection
    match /assessments/{assessmentId} {
      // Everyone authenticated can read assessments
      allow read: if isAuthenticated();
      // Only admins can create/update/delete assessments
      allow create, update, delete: if isAdmin();
    }
    
    // Grades collection
    match /grades/{gradeId} {
      // Users can read their own grades
      allow read: if isAuthenticated() && 
                     (resource.data.traineeId == request.auth.uid || isAdmin());
      // Only admins can create/update/delete grades
      allow create, update, delete: if isAdmin();
    }
    
    // Messages collection
    match /messages/{messageId} {
      // Users can read messages sent to them or sent by them
      allow read: if isAuthenticated() && 
                     (resource.data.recipientId == request.auth.uid || 
                      resource.data.senderId == request.auth.uid || 
                      isAdmin());
      // Authenticated users can create messages
      allow create: if isAuthenticated();
      // Users can update their own messages (e.g., mark as read)
      allow update: if isAuthenticated() && 
                       (resource.data.senderId == request.auth.uid || 
                        resource.data.recipientId == request.auth.uid);
      // Only admins can delete messages
      allow delete: if isAdmin();
    }
    
    // Trainees collection (if used)
    match /trainees/{traineeId} {
      // Users can read their own trainee data
      allow read: if isAuthenticated() && 
                     (isOwner(traineeId) || isAdmin());
      // Only admins can create/update/delete trainee records
      allow create, update, delete: if isAdmin();
    }
  }
}
```

## Alternative: Development Rules (Less Secure)

If you're in development and want to test quickly, you can use these **less secure** rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all authenticated users
    // ⚠️ WARNING: Only use this for development!
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ IMPORTANT:** Never use the development rules in production!

## Testing Your Rules

1. After updating the rules, click **Publish**
2. Wait a few seconds for the rules to propagate
3. Refresh your app
4. The 400 errors should stop

## Common Issues

### Issue: "Missing or insufficient permissions"
- **Cause:** Security rules are blocking the query
- **Fix:** Check that your rules allow the operation for authenticated users

### Issue: "Index required"
- **Cause:** Query needs a composite index
- **Fix:** Click the link in the error message to create the index, or see `FIRESTORE_INDEXES.md`

### Issue: "Permission denied"
- **Cause:** User doesn't have permission for the operation
- **Fix:** Verify the user is authenticated and has the correct role

## Security Best Practices

1. **Always require authentication** for read/write operations
2. **Use role-based access control** (admin vs trainee)
3. **Validate data** in security rules
4. **Test rules thoroughly** before deploying
5. **Never allow unauthenticated access** in production

## Need Help?

If you continue to see 400 errors after updating the rules:
1. Check the Firebase Console for specific error messages
2. Verify your user is authenticated
3. Check that the user document exists in Firestore
4. Verify the user's role is set correctly


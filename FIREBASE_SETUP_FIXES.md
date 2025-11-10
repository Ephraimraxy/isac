# Firebase Setup Fixes

## OAuth Domain Authorization

### Issue
You're seeing this warning:
```
The current domain is not authorized for OAuth operations. 
Add your domain (isac-tvet.netlify.app) to the OAuth redirect domains list
```

### Fix
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `trms-34e12`
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add: `isac-tvet.netlify.app`
6. Click **Add**

### Why This Matters
- Required for OAuth providers (Google, Facebook, etc.)
- Not critical if you only use email/password auth
- The warning won't affect email/password login

## Firestore 400 Errors

### Common Causes
1. **Missing Composite Indexes**: Queries with multiple `where` clauses + `orderBy` need indexes
2. **Security Rules**: Permission issues
3. **Network Issues**: Temporary connectivity problems

### Check for Missing Indexes
1. Go to Firebase Console → Firestore Database
2. Check the **Indexes** tab
3. Look for any "Create Index" links in error messages
4. Click to create missing indexes

### Common Indexes Needed
Based on your queries, you may need:
- `attendance` collection: `date` + `orderBy date`
- `attendance` collection: `module` + `date` + `orderBy date`
- `attendance` collection: `traineeId` + `date` + `orderBy date`
- `messages` collection: `recipientId` + `date` + `orderBy date`
- `assessments` collection: `traineeId` + `date` + `orderBy date`
- `grades` collection: `traineeId` + `submittedAt` + `orderBy submittedAt`

### Quick Fix
If you see a 400 error with a link to create an index:
1. Click the link in the error message
2. It will open Firebase Console with the index pre-configured
3. Click **Create Index**
4. Wait for index to build (usually 1-2 minutes)

## Error Suppression

The app now automatically:
- ✅ Suppresses 400 errors in production
- ✅ Stops retrying on permanent errors
- ✅ Only logs errors in development mode
- ✅ Handles timeouts gracefully

## Testing

After fixes:
1. Add OAuth domain (if using OAuth)
2. Create any missing indexes
3. Refresh the app
4. Check console - should be clean in production


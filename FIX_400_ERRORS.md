# How to Fix 400 Errors - Missing Firestore Indexes

## Why You're Seeing 400 Errors

The 400 (Bad Request) errors are happening because Firestore requires **composite indexes** for queries that combine `where` clauses with `orderBy`. These indexes need to be created in Firebase Console.

## Quick Fix - Create Missing Indexes

### Method 1: Automatic (Easiest)
1. Open your app in browser
2. Open Developer Tools (F12)
3. Look for 400 errors in Network tab
4. Click on a 400 error
5. Look for a link in the error response that says "Create Index"
6. Click the link - it opens Firebase Console
7. Click "Create Index"
8. Wait 1-2 minutes for index to build
9. Repeat for each unique error

### Method 2: Manual (If no link appears)
Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Firestore Database → Indexes

Create these indexes:

#### 1. Attendance Collection
- Collection: `attendance`
- Fields:
  - `date` (Ascending)
  - `date` (Descending) - for orderBy
- Query scope: Collection

#### 2. Attendance Collection (with traineeId)
- Collection: `attendance`
- Fields:
  - `traineeId` (Ascending)
  - `date` (Descending)
- Query scope: Collection

#### 3. Attendance Collection (with module)
- Collection: `attendance`
- Fields:
  - `module` (Ascending)
  - `date` (Descending)
- Query scope: Collection

#### 4. Messages Collection
- Collection: `messages`
- Fields:
  - `recipientId` (Ascending)
  - `date` (Descending)
- Query scope: Collection

#### 5. Assessments Collection
- Collection: `assessments`
- Fields:
  - `traineeId` (Ascending)
  - `date` (Descending)
- Query scope: Collection

#### 6. Grades Collection
- Collection: `grades`
- Fields:
  - `traineeId` (Ascending)
  - `submittedAt` (Descending)
- Query scope: Collection

#### 7. Grades Collection (with assessmentId)
- Collection: `grades`
- Fields:
  - `assessmentId` (Ascending)
  - `submittedAt` (Descending)
- Query scope: Collection

## About the OAuth Warning

The OAuth warning is **harmless** if you're only using email/password authentication. It only matters if you use:
- Google Sign-In
- Facebook Sign-In
- Other OAuth providers

### To Fix OAuth Warning (Optional)
1. Go to Firebase Console → Authentication → Settings
2. Click "Authorized domains" tab
3. Click "Add domain"
4. Add: `isac-tvet.netlify.app`
5. Click "Add"

## After Creating Indexes

1. Wait 1-2 minutes for indexes to build
2. Refresh your app
3. 400 errors should stop
4. App will work normally

## Temporary Workaround

The app is already configured to:
- ✅ Stop retrying on 400 errors
- ✅ Handle errors gracefully
- ✅ Continue working even with errors

So the app should still function, but some real-time updates might not work until indexes are created.

## Need Help?

If you see a specific error message with an index link, always click it - Firebase will pre-configure the index for you!


# Real-Time Implementation Plan

## Current Status

### ✅ Pages with Real-Time Listeners
1. **Modules** - Uses `subscribeToModules` ✅
2. **Attendance** - Uses `subscribeToAttendance` and `subscribeToModules` ✅
3. **Messaging** - Uses `subscribeToMessages` ✅

### ❌ Pages Missing Real-Time
1. **AdminDashboard** - Uses one-time `getDashboardStats`, `getModules`, `getAttendance`
2. **TraineeDashboard** - Uses one-time `getModules`, `getAssessments`, `getGrades`
3. **Assessments** - Uses one-time `getAssessments`, `getGrades`, `getTrainees`

## What Needs to be Implemented

### 1. Real-Time Dashboard Stats
- Subscribe to trainees, modules, and attendance collections
- Calculate stats in real-time as data changes
- Update dashboard cards automatically

### 2. Real-Time Assessments & Grades
- Subscribe to assessments collection
- Subscribe to grades collection
- Update assessment list and grades in real-time

### 3. Connection State Management
- Detect online/offline status
- Show connection indicator
- Handle reconnection automatically

### 4. Error Handling for Real-Time
- Handle snapshot errors
- Retry failed connections
- Show user-friendly error messages

### 5. Optimistic Updates
- Update UI immediately before server confirmation
- Rollback on error

### 6. Snapshot Metadata
- Use `metadata.hasPendingWrites` for optimistic updates
- Use `metadata.fromCache` to show cached data indicator

## Implementation Priority

1. **High Priority:**
   - Convert dashboards to real-time
   - Convert assessments to real-time
   - Add connection state management

2. **Medium Priority:**
   - Add error handling for real-time
   - Add optimistic updates
   - Add snapshot metadata handling

3. **Low Priority:**
   - Add connection retry logic
   - Add offline queue
   - Add data synchronization indicators


# Firestore Indexes Documentation

## Required Composite Indexes

Firestore requires composite indexes when you combine `where()` clauses with `orderBy()` on different fields. The following indexes need to be created in your Firebase Console.

### 1. Messages Collection
**Index Name:** `messages_recipientId_date_desc`

**Fields:**
- `recipientId` (Ascending)
- `date` (Descending)

**Collection:** `messages`

**Query:**
```javascript
query(
  collection(db, 'messages'),
  where('recipientId', '==', userId),
  orderBy('date', 'desc')
)
```

### 2. Attendance Collection
**Index Name:** `attendance_date_desc`

**Fields:**
- `date` (Descending)

**Collection:** `attendance`

**Note:** This may not require a composite index if only using `orderBy`, but if combined with `where()` filters, you'll need composite indexes.

**Possible Composite Indexes:**
- `attendance_date_module_desc` - if filtering by date and module
- `attendance_traineeId_date_desc` - if filtering by traineeId and date
- `attendance_module_date_desc` - if filtering by module and date

### 3. Assessments Collection
**Index Name:** `assessments_date_desc`

**Fields:**
- `date` (Descending)

**Collection:** `assessments`

**Possible Composite Indexes:**
- `assessments_traineeId_date_desc` - if filtering by traineeId and date
- `assessments_module_date_desc` - if filtering by module and date

### 4. Grades Collection
**Index Name:** `grades_submittedAt_desc`

**Fields:**
- `submittedAt` (Descending)

**Collection:** `grades`

**Possible Composite Indexes:**
- `grades_assessmentId_submittedAt_desc` - if filtering by assessmentId and submittedAt
- `grades_traineeId_submittedAt_desc` - if filtering by traineeId and submittedAt

## How to Create Indexes

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes**
4. Click **Create Index**
5. Enter the collection name
6. Add the fields in the order specified above
7. Set the sort order (Ascending/Descending) as specified
8. Click **Create**

Alternatively, Firebase will automatically prompt you to create indexes when you run queries that require them. You can click the link in the error message to create the index directly.

## Performance Notes

- All queries now include `limit()` clauses to prevent loading excessive data
- Default limits:
  - Modules: 100
  - Attendance: 100
  - Assessments: 100
  - Grades: 100
  - Messages: 50
- These limits can be adjusted by passing a `limitCount` parameter to the functions

## Query Optimization

1. **Use limits**: All queries now have default limits to prevent loading all data
2. **Index required queries**: Composite indexes are required for efficient queries with multiple filters
3. **Real-time listeners**: All subscription functions also include limits to prevent excessive data transfer


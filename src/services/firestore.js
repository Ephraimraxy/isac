import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db, isOnline } from '../firebase/config';

// Track active listeners to prevent duplicates
const activeListeners = new Map();

// Connection state
let connectionState = {
  isOnline: navigator.onLine,
  retryCount: 0,
  lastError: null,
  consecutiveErrors: 0,
  lastErrorTime: null
};

// Reset error tracking after successful operations
const resetErrorTracking = () => {
  connectionState.consecutiveErrors = 0;
  connectionState.lastErrorTime = null;
  connectionState.lastError = null;
};

// Update connection state
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    connectionState.isOnline = true;
    resetErrorTracking();
    enableNetwork(db).catch(() => {});
  });
  
  window.addEventListener('offline', () => {
    connectionState.isOnline = false;
    disableNetwork(db).catch(() => {});
  });
  
  // Reset error tracking periodically (every 30 seconds) if online
  setInterval(() => {
    if (connectionState.isOnline && connectionState.consecutiveErrors > 0) {
      const now = Date.now();
      // Reset if no errors in the last 30 seconds
      if (!connectionState.lastErrorTime || (now - connectionState.lastErrorTime) > 30000) {
        resetErrorTracking();
      }
    }
  }, 30000);
}

// Collections
const COLLECTIONS = {
  USERS: 'users',
  MODULES: 'modules',
  ATTENDANCE: 'attendance',
  ASSESSMENTS: 'assessments',
  GRADES: 'grades',
  MESSAGES: 'messages',
  TRAINEES: 'trainees'
};

// Users
export const getUser = async (userId) => {
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const updateUser = async (userId, data) => {
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(docRef, data);
};

// Modules
export const getModules = async (limitCount = 100) => {
  const q = query(
    collection(db, COLLECTIONS.MODULES), 
    orderBy('created', 'desc'),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getModule = async (moduleId) => {
  const docRef = doc(db, COLLECTIONS.MODULES, moduleId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const createModule = async (moduleData) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.MODULES), {
    ...moduleData,
    created: serverTimestamp(),
    updated: serverTimestamp()
  });
  return docRef.id;
};

export const updateModule = async (moduleId, data) => {
  const docRef = doc(db, COLLECTIONS.MODULES, moduleId);
  await updateDoc(docRef, {
    ...data,
    updated: serverTimestamp()
  });
};

export const deleteModule = async (moduleId) => {
  const docRef = doc(db, COLLECTIONS.MODULES, moduleId);
  await deleteDoc(docRef);
};

// Attendance
export const getAttendance = async (filters = {}, limitCount = 100) => {
  let q = query(collection(db, COLLECTIONS.ATTENDANCE));
  
  const hasFilters = filters.date || filters.module || filters.traineeId;
  
  if (filters.date) {
    q = query(q, where('date', '==', filters.date));
  }
  if (filters.module) {
    q = query(q, where('module', '==', filters.module));
  }
  if (filters.traineeId) {
    q = query(q, where('traineeId', '==', filters.traineeId));
  }
  
  // Only use orderBy if no filters (to avoid composite index requirement)
  if (!hasFilters) {
    q = query(q, orderBy('date', 'desc'), limit(limitCount));
  } else {
    q = query(q, limit(limitCount * 2)); // Get more to sort in memory
  }
  
  const querySnapshot = await getDocs(q);
  let results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Sort in memory if we have filters
  if (hasFilters) {
    results.sort((a, b) => {
      const dateA = a.date || a.timestamp?.toDate?.() || new Date(0);
      const dateB = b.date || b.timestamp?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
    results = results.slice(0, limitCount);
  }
  
  return results;
};

export const markAttendance = async (attendanceData) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.ATTENDANCE), {
    ...attendanceData,
    timestamp: serverTimestamp()
  });
  return docRef.id;
};

export const updateAttendance = async (attendanceId, data) => {
  const docRef = doc(db, COLLECTIONS.ATTENDANCE, attendanceId);
  await updateDoc(docRef, data);
};

// Assessments
export const getAssessments = async (filters = {}, limitCount = 100) => {
  let q = query(collection(db, COLLECTIONS.ASSESSMENTS));
  
  const hasFilters = filters.traineeId || filters.module;
  
  if (filters.traineeId) {
    q = query(q, where('traineeId', '==', filters.traineeId));
  }
  if (filters.module) {
    q = query(q, where('module', '==', filters.module));
  }
  
  // Only use orderBy if no filters (to avoid composite index requirement)
  if (!hasFilters) {
    q = query(q, orderBy('date', 'desc'), limit(limitCount));
  } else {
    q = query(q, limit(limitCount * 2)); // Get more to sort in memory
  }
  
  const querySnapshot = await getDocs(q);
  let results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Sort in memory if we have filters
  if (hasFilters) {
    results.sort((a, b) => {
      const dateA = a.date?.toDate?.() || a.created?.toDate?.() || new Date(0);
      const dateB = b.date?.toDate?.() || b.created?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
    results = results.slice(0, limitCount);
  }
  
  return results;
};

export const createAssessment = async (assessmentData) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.ASSESSMENTS), {
    ...assessmentData,
    created: serverTimestamp()
  });
  return docRef.id;
};

// Grades
export const getGrades = async (filters = {}, limitCount = 100) => {
  let q = query(collection(db, COLLECTIONS.GRADES));
  
  const hasFilters = filters.assessmentId || filters.traineeId;
  
  if (filters.assessmentId) {
    q = query(q, where('assessmentId', '==', filters.assessmentId));
  }
  if (filters.traineeId) {
    q = query(q, where('traineeId', '==', filters.traineeId));
  }
  
  // Only use orderBy if no filters (to avoid composite index requirement)
  if (!hasFilters) {
    q = query(q, orderBy('submittedAt', 'desc'), limit(limitCount));
  } else {
    q = query(q, limit(limitCount * 2)); // Get more to sort in memory
  }
  
  const querySnapshot = await getDocs(q);
  let results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Sort in memory if we have filters
  if (hasFilters) {
    results.sort((a, b) => {
      const dateA = a.submittedAt?.toDate?.() || a.timestamp?.toDate?.() || new Date(0);
      const dateB = b.submittedAt?.toDate?.() || b.timestamp?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
    results = results.slice(0, limitCount);
  }
  
  return results;
};

export const submitGrade = async (gradeData) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.GRADES), {
    ...gradeData,
    submittedAt: serverTimestamp()
  });
  return docRef.id;
};

// Messages
export const getMessages = async (userId, limitCount = 50) => {
  // Use where only, sort in memory to avoid composite index requirement
  const q = query(
    collection(db, COLLECTIONS.MESSAGES),
    where('recipientId', '==', userId),
    limit(limitCount * 2) // Get more to sort in memory
  );
  const querySnapshot = await getDocs(q);
  let results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Sort in memory by date
  results.sort((a, b) => {
    const dateA = a.date?.toDate?.() || a.timestamp?.toDate?.() || new Date(0);
    const dateB = b.date?.toDate?.() || b.timestamp?.toDate?.() || new Date(0);
    return dateB - dateA;
  });
  
  return results.slice(0, limitCount);
};

export const sendMessage = async (messageData) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.MESSAGES), {
    ...messageData,
    date: serverTimestamp(),
    read: false
  });
  return docRef.id;
};

export const markMessageAsRead = async (messageId) => {
  const docRef = doc(db, COLLECTIONS.MESSAGES, messageId);
  await updateDoc(docRef, { read: true });
};

// Trainees (from users collection with role='trainee')
export const getTrainees = async () => {
  const q = query(
    collection(db, COLLECTIONS.USERS), 
    where('role', '==', 'trainee')
  );
  const querySnapshot = await getDocs(q);
  const trainees = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Sort in memory to avoid composite index requirement
  return trainees.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

export const getTrainee = async (traineeId) => {
  const docRef = doc(db, COLLECTIONS.USERS, traineeId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

// Dashboard Stats
export const getDashboardStats = async () => {
  const [trainees, modules, attendance] = await Promise.all([
    getTrainees(),
    getModules(),
    getAttendance()
  ]);

  const activeModules = modules.filter(m => m.status === 'In Progress').length;
  const totalAttendance = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

  return {
    totalTrainees: trainees.length,
    activeModules,
    attendanceRate: Math.round(attendanceRate * 10) / 10
  };
};

// Console suppression is now handled in main.jsx (runs earlier)

// Helper to create safe listeners with error handling
const createSafeListener = (listenerKey, query, callback, errorContext = '') => {
  // Clean up existing listener if any
  const existingUnsubscribe = activeListeners.get(listenerKey);
  if (existingUnsubscribe) {
    try {
      existingUnsubscribe();
    } catch (e) {
      // Ignore cleanup errors
    }
    activeListeners.delete(listenerKey);
  }

  // Don't set up listener if offline or too many consecutive errors
  if (!connectionState.isOnline) {
    // Return a no-op unsubscribe function
    return () => {};
  }
  
  // Prevent setting up listeners if we've had too many consecutive errors recently
  const now = Date.now();
  if (connectionState.consecutiveErrors >= 5 && 
      connectionState.lastErrorTime && 
      (now - connectionState.lastErrorTime) < 10000) {
    // Too many errors in the last 10 seconds, skip this listener
    return () => {};
  }

  let errorCount = 0;
  const maxErrors = 2; // Reduced from 3 to fail faster

  let isUnsubscribed = false;
  
  const unsubscribe = onSnapshot(
    query,
    (snapshot) => {
      // Don't process if already unsubscribed
      if (isUnsubscribed) return;
      
      // Reset error count on success
      errorCount = 0;
      resetErrorTracking();
      
      try {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      } catch (err) {
        // Silently handle processing errors
      }
    },
    (error) => {
      // Don't process if already unsubscribed
      if (isUnsubscribed) return;
      
      errorCount++;
      connectionState.lastError = error;
      
      // Immediately stop on 400 errors (bad request) - these are usually permission/index issues
      const is400Error = error.code === 'permission-denied' || 
                        error.code === 'failed-precondition' || 
                        error.code === 'unavailable' ||
                        error.code === 'invalid-argument' ||
                        error.message?.includes('400') || 
                        error.message?.includes('Bad Request') ||
                        error.message?.includes('transport errored') ||
                        error.message?.includes('Listen/channel');
      
      if (is400Error) {
        // Mark as unsubscribed and cleanup immediately
        isUnsubscribed = true;
        connectionState.consecutiveErrors++;
        connectionState.lastErrorTime = Date.now();
        try {
          unsubscribe();
          activeListeners.delete(listenerKey);
        } catch (e) {
          // Ignore cleanup errors
        }
        // Completely silent - no logging, no retries
        return;
      }
      
      // Track consecutive errors
      connectionState.consecutiveErrors++;
      connectionState.lastErrorTime = Date.now();
      
      // For other errors, only log once in dev mode
      if (import.meta.env.DEV && errorCount === 1) {
        console.warn(`Firestore listener error (${errorContext}):`, error.code || error.message);
      }
      
      // If too many errors, disable network temporarily
      if (errorCount >= maxErrors) {
        isUnsubscribed = true;
        try {
          unsubscribe();
          activeListeners.delete(listenerKey);
        } catch (e) {
          // Ignore cleanup errors
        }
        connectionState.isOnline = false;
        disableNetwork(db).catch(() => {});
        // Re-enable after a delay
        setTimeout(() => {
          connectionState.isOnline = navigator.onLine;
          enableNetwork(db).catch(() => {});
        }, 5000);
      }
    }
  );

  activeListeners.set(listenerKey, unsubscribe);
  return unsubscribe;
};

// Real-time listeners
export const subscribeToModules = (callback, limitCount = 100) => {
  const listenerKey = `modules-${limitCount}`;
  const q = query(
    collection(db, COLLECTIONS.MODULES), 
    orderBy('created', 'desc'),
    limit(limitCount)
  );
  return createSafeListener(listenerKey, q, callback, 'subscribeToModules');
};

export const subscribeToAttendance = (filters = {}, callback, limitCount = 100) => {
  const listenerKey = `attendance-${JSON.stringify(filters)}-${limitCount}`;
  let q = query(collection(db, COLLECTIONS.ATTENDANCE));
  
  // Apply filters
  if (filters.date) {
    q = query(q, where('date', '==', filters.date));
  }
  if (filters.module) {
    q = query(q, where('module', '==', filters.module));
  }
  if (filters.traineeId) {
    q = query(q, where('traineeId', '==', filters.traineeId));
  }
  
  // Only add orderBy if no filters (to avoid index requirement)
  // If filters exist, we'll sort in memory
  const hasFilters = filters.date || filters.module || filters.traineeId;
  if (!hasFilters) {
    q = query(q, orderBy('date', 'desc'), limit(limitCount));
  } else {
    q = query(q, limit(limitCount * 2)); // Get more to sort in memory
  }
  
  const wrappedCallback = (data) => {
    // Sort in memory if we have filters
    if (hasFilters) {
      data.sort((a, b) => {
        const dateA = a.date || a.timestamp?.toDate?.() || new Date(0);
        const dateB = b.date || b.timestamp?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      data = data.slice(0, limitCount);
    }
    callback(data);
  };
  
  return createSafeListener(listenerKey, q, wrappedCallback, 'subscribeToAttendance');
};

export const subscribeToMessages = (userId, callback, limitCount = 50) => {
  const listenerKey = `messages-${userId}-${limitCount}`;
  // Use where only, sort in memory to avoid composite index requirement
  const q = query(
    collection(db, COLLECTIONS.MESSAGES),
    where('recipientId', '==', userId),
    limit(limitCount * 2) // Get more to sort in memory
  );
  
  const wrappedCallback = (data) => {
    // Sort in memory by date
    data.sort((a, b) => {
      const dateA = a.date?.toDate?.() || a.timestamp?.toDate?.() || new Date(0);
      const dateB = b.date?.toDate?.() || b.timestamp?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
    callback(data.slice(0, limitCount));
  };
  
  return createSafeListener(listenerKey, q, wrappedCallback, 'subscribeToMessages');
};

export const subscribeToAssessments = (filters = {}, callback, limitCount = 100) => {
  const listenerKey = `assessments-${JSON.stringify(filters)}-${limitCount}`;
  let q = query(collection(db, COLLECTIONS.ASSESSMENTS));
  
  const hasFilters = filters.traineeId || filters.module;
  
  if (filters.traineeId) {
    q = query(q, where('traineeId', '==', filters.traineeId));
  }
  if (filters.module) {
    q = query(q, where('module', '==', filters.module));
  }
  
  // Only use orderBy if no filters (to avoid composite index requirement)
  if (!hasFilters) {
    q = query(q, orderBy('date', 'desc'), limit(limitCount));
  } else {
    q = query(q, limit(limitCount * 2)); // Get more to sort in memory
  }
  
  const wrappedCallback = (data) => {
    // Sort in memory if we have filters
    if (hasFilters) {
      data.sort((a, b) => {
        const dateA = a.date?.toDate?.() || a.created?.toDate?.() || new Date(0);
        const dateB = b.date?.toDate?.() || b.created?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      data = data.slice(0, limitCount);
    }
    callback(data);
  };
  
  return createSafeListener(listenerKey, q, wrappedCallback, 'subscribeToAssessments');
};

export const subscribeToGrades = (filters = {}, callback, limitCount = 100) => {
  const listenerKey = `grades-${JSON.stringify(filters)}-${limitCount}`;
  let q = query(collection(db, COLLECTIONS.GRADES));
  
  const hasFilters = filters.assessmentId || filters.traineeId;
  
  if (filters.assessmentId) {
    q = query(q, where('assessmentId', '==', filters.assessmentId));
  }
  if (filters.traineeId) {
    q = query(q, where('traineeId', '==', filters.traineeId));
  }
  
  // Only use orderBy if no filters (to avoid composite index requirement)
  if (!hasFilters) {
    q = query(q, orderBy('submittedAt', 'desc'), limit(limitCount));
  } else {
    q = query(q, limit(limitCount * 2)); // Get more to sort in memory
  }
  
  const wrappedCallback = (data) => {
    // Sort in memory if we have filters
    if (hasFilters) {
      data.sort((a, b) => {
        const dateA = a.submittedAt?.toDate?.() || a.timestamp?.toDate?.() || new Date(0);
        const dateB = b.submittedAt?.toDate?.() || b.timestamp?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      data = data.slice(0, limitCount);
    }
    callback(data);
  };
  
  return createSafeListener(listenerKey, q, wrappedCallback, 'subscribeToGrades');
};

// Cleanup function to remove all listeners
export const cleanupAllListeners = () => {
  activeListeners.forEach((unsubscribe) => {
    try {
      unsubscribe();
    } catch (err) {
      // Silently handle cleanup errors
    }
  });
  activeListeners.clear();
};


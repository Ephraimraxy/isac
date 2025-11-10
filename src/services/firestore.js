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
  lastError: null
};

// Update connection state
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    connectionState.isOnline = true;
    connectionState.retryCount = 0;
    enableNetwork(db).catch(() => {});
  });
  
  window.addEventListener('offline', () => {
    connectionState.isOnline = false;
    disableNetwork(db).catch(() => {});
  });
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
  
  if (filters.date) {
    q = query(q, where('date', '==', filters.date));
  }
  if (filters.module) {
    q = query(q, where('module', '==', filters.module));
  }
  if (filters.traineeId) {
    q = query(q, where('traineeId', '==', filters.traineeId));
  }
  
  q = query(q, orderBy('date', 'desc'), limit(limitCount));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
  
  if (filters.traineeId) {
    q = query(q, where('traineeId', '==', filters.traineeId));
  }
  if (filters.module) {
    q = query(q, where('module', '==', filters.module));
  }
  
  q = query(q, orderBy('date', 'desc'), limit(limitCount));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
  
  if (filters.assessmentId) {
    q = query(q, where('assessmentId', '==', filters.assessmentId));
  }
  if (filters.traineeId) {
    q = query(q, where('traineeId', '==', filters.traineeId));
  }
  
  q = query(q, orderBy('submittedAt', 'desc'), limit(limitCount));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
  const q = query(
    collection(db, COLLECTIONS.MESSAGES),
    where('recipientId', '==', userId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

// Suppress Firestore console errors globally (production only)
if (typeof window !== 'undefined' && !import.meta.env.DEV) {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  const suppressedPatterns = [
    'WebChannelConnection',
    'transport errored',
    '400 (Bad Request)',
    'RPC',
    'Listen',
    'Write',
    'stream',
    'transport'
  ];
  
  const shouldSuppress = (message) => {
    const msg = typeof message === 'string' ? message : String(message);
    return suppressedPatterns.some(pattern => msg.includes(pattern));
  };
  
  // Override console.error
  console.error = (...args) => {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalConsoleError.apply(console, args);
    }
  };
  
  // Override console.warn for Firestore warnings
  console.warn = (...args) => {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalConsoleWarn.apply(console, args);
    }
  };
}

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

  // Don't set up listener if offline
  if (!connectionState.isOnline) {
    // Return a no-op unsubscribe function
    return () => {};
  }

  let errorCount = 0;
  const maxErrors = 2; // Reduced from 3 to fail faster

  const unsubscribe = onSnapshot(
    query,
    (snapshot) => {
      // Reset error count on success
      errorCount = 0;
      connectionState.retryCount = 0;
      connectionState.lastError = null;
      
      try {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      } catch (err) {
        // Silently handle processing errors
      }
    },
    (error) => {
      errorCount++;
      connectionState.lastError = error;
      
      // Immediately stop on 400 errors (bad request) - these are usually permission/index issues
      const is400Error = error.code === 'permission-denied' || 
                        error.code === 'failed-precondition' || 
                        error.code === 'unavailable' ||
                        error.message?.includes('400') || 
                        error.message?.includes('Bad Request') ||
                        error.message?.includes('transport errored');
      
      if (is400Error) {
        // Immediately unsubscribe on 400 errors - don't retry
        try {
          unsubscribe();
          activeListeners.delete(listenerKey);
        } catch (e) {
          // Ignore cleanup errors
        }
        // Completely silent - no logging
        return;
      }
      
      // For other errors, only log once in dev mode
      if (import.meta.env.DEV && errorCount === 1) {
        console.warn(`Firestore listener error (${errorContext}):`, error.code || error.message);
      }
      
      // If too many errors, disable network temporarily
      if (errorCount >= maxErrors) {
        connectionState.isOnline = false;
        disableNetwork(db).catch(() => {});
        // Re-enable after a delay
        setTimeout(() => {
          connectionState.isOnline = navigator.onLine;
          enableNetwork(db).catch(() => {});
        }, 3000); // Reduced from 5s to 3s
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
  const q = query(
    collection(db, COLLECTIONS.MESSAGES),
    where('recipientId', '==', userId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  
  return createSafeListener(listenerKey, q, callback, 'subscribeToMessages');
};

export const subscribeToAssessments = (filters = {}, callback, limitCount = 100) => {
  const listenerKey = `assessments-${JSON.stringify(filters)}-${limitCount}`;
  let q = query(collection(db, COLLECTIONS.ASSESSMENTS));
  
  if (filters.traineeId) {
    q = query(q, where('traineeId', '==', filters.traineeId));
  }
  if (filters.module) {
    q = query(q, where('module', '==', filters.module));
  }
  
  q = query(q, orderBy('date', 'desc'), limit(limitCount));
  
  return createSafeListener(listenerKey, q, callback, 'subscribeToAssessments');
};

export const subscribeToGrades = (filters = {}, callback, limitCount = 100) => {
  const listenerKey = `grades-${JSON.stringify(filters)}-${limitCount}`;
  let q = query(collection(db, COLLECTIONS.GRADES));
  
  if (filters.assessmentId) {
    q = query(q, where('assessmentId', '==', filters.assessmentId));
  }
  if (filters.traineeId) {
    q = query(q, where('traineeId', '==', filters.traineeId));
  }
  
  q = query(q, orderBy('submittedAt', 'desc'), limit(limitCount));
  
  return createSafeListener(listenerKey, q, callback, 'subscribeToGrades');
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


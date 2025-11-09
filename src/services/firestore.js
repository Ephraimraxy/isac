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
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';

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

// Real-time listeners
export const subscribeToModules = (callback, limitCount = 100) => {
  const q = query(
    collection(db, COLLECTIONS.MODULES), 
    orderBy('created', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snapshot) => {
    const modules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(modules);
  });
};

export const subscribeToAttendance = (filters = {}, callback, limitCount = 100) => {
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
  
  return onSnapshot(q, (snapshot) => {
    const attendance = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(attendance);
  });
};

export const subscribeToMessages = (userId, callback, limitCount = 50) => {
  const q = query(
    collection(db, COLLECTIONS.MESSAGES),
    where('recipientId', '==', userId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
};

export const subscribeToAssessments = (filters = {}, callback, limitCount = 100) => {
  let q = query(collection(db, COLLECTIONS.ASSESSMENTS));
  
  if (filters.traineeId) {
    q = query(q, where('traineeId', '==', filters.traineeId));
  }
  if (filters.module) {
    q = query(q, where('module', '==', filters.module));
  }
  
  q = query(q, orderBy('date', 'desc'), limit(limitCount));
  
  return onSnapshot(q, (snapshot) => {
    const assessments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(assessments);
  });
};

export const subscribeToGrades = (filters = {}, callback, limitCount = 100) => {
  let q = query(collection(db, COLLECTIONS.GRADES));
  
  if (filters.assessmentId) {
    q = query(q, where('assessmentId', '==', filters.assessmentId));
  }
  if (filters.traineeId) {
    q = query(q, where('traineeId', '==', filters.traineeId));
  }
  
  q = query(q, orderBy('submittedAt', 'desc'), limit(limitCount));
  
  return onSnapshot(q, (snapshot) => {
    const grades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(grades);
  });
};


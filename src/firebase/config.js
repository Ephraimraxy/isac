// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, inMemoryPersistence, signOut } from "firebase/auth";
import { getFirestore, disableNetwork, enableNetwork } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// Environment variables are loaded from .env file
// In Vite, environment variables must be prefixed with VITE_ to be exposed to the client
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate that all required environment variables are present
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error(
    'Missing Firebase configuration. Please check your .env file and ensure all VITE_FIREBASE_* variables are set.'
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

const authPersistenceReady = setPersistence(auth, inMemoryPersistence)
  .then(() => signOut(auth).catch(() => {}))
  .catch((error) => {
    console.warn('Failed to configure Firebase auth persistence:', error);
  });

// Initialize Firestore with optimized settings
const db = getFirestore(app);

// Connection state management
let isOnline = navigator.onLine;
let networkListeners = [];

const handleOnline = () => {
  isOnline = true;
  enableNetwork(db).catch(() => {
    // Silently handle - network will retry automatically
  });
};

const handleOffline = () => {
  isOnline = false;
  disableNetwork(db).catch(() => {
    // Silently handle
  });
};

// Set up network listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  networkListeners = [
    () => window.removeEventListener('online', handleOnline),
    () => window.removeEventListener('offline', handleOffline)
  ];
}

const storage = getStorage(app);

export { app, analytics, auth, db, storage, authPersistenceReady, isOnline };


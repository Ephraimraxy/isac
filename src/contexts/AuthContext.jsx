import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth, db, authPersistenceReady } from '../firebase/config'
import { doc, getDoc, setDoc, serverTimestamp, enableNetwork } from 'firebase/firestore'
import { getFirebaseErrorMessage } from '../utils/validation'

const AuthContext = createContext()

// Admin account credentials from environment variables
// These should be set in your .env file
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ''
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || ''

// Validate admin credentials are configured
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.warn(
    'Admin credentials not configured. Please set VITE_ADMIN_EMAIL and VITE_ADMIN_PASSWORD in your .env file.'
  )
}

// Helper function to safely get user document with timeout and fast retry logic
const getUserDocument = async (uid, retries = 2, timeout = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      // Try to enable network if it's disabled
      try {
        await enableNetwork(db)
      } catch (e) {
        // Network might already be enabled, ignore error
      }
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      })
      
      // Race between the Firestore request and timeout
      const userDoc = await Promise.race([
        getDoc(doc(db, 'users', uid)),
        timeoutPromise
      ])
      
      return userDoc
    } catch (error) {
      // Check if it's a network/offline error or timeout
      const isNetworkError = error.message.includes('offline') || 
                            error.message.includes('network') ||
                            error.message.includes('timeout') ||
                            error.message.includes('Failed to get') ||
                            error.code === 'unavailable'
      
      // If it's a network error or last retry, fail fast
      if (isNetworkError || i === retries - 1) {
        throw error
      }
      
      // Short wait before retrying (only 500ms for faster failure)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
}

// Helper function to safely set user document with timeout and fast retry logic
const setUserDocument = async (uid, userData, retries = 2, timeout = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      // Try to enable network if it's disabled
      try {
        await enableNetwork(db)
      } catch (e) {
        // Network might already be enabled, ignore error
      }
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      })
      
      // Race between the Firestore request and timeout
      await Promise.race([
        setDoc(doc(db, 'users', uid), userData),
        timeoutPromise
      ])
      
      return
    } catch (error) {
      // Check if it's a network/offline error or timeout
      const isNetworkError = error.message.includes('offline') || 
                            error.message.includes('network') ||
                            error.message.includes('timeout') ||
                            error.message.includes('Failed to') ||
                            error.code === 'unavailable'
      
      // If it's a network error or last retry, fail fast
      if (isNetworkError || i === retries - 1) {
        throw error
      }
      
      // Short wait before retrying (only 500ms for faster failure)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Note: Admin account initialization removed to prevent 400 errors
  // Admin will be automatically created on first login via the login() function
  // This avoids unauthenticated Firestore queries that trigger security rule errors

  useEffect(() => {
    let unsubscribe = () => {}

    const handleAuthChange = async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Only update if user state is not already set (to avoid overwriting login state)
          // This prevents race conditions where login sets user state and then onAuthStateChanged overwrites it
          const userDoc = await getUserDocument(firebaseUser.uid)
          
          if (userDoc.exists()) {
            const userData = { 
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userDoc.data() 
            }
            // Only update if user state is different or not set
            setUser(prevUser => {
              if (prevUser && prevUser.uid === userData.uid) {
                return prevUser // Keep existing state if it's the same user
              }
              return userData
            })
          } else {
            // Create user document if it doesn't exist (only for trainees)
            const isAdmin = firebaseUser.email === ADMIN_EMAIL
            const newUser = {
              email: firebaseUser.email,
              role: isAdmin ? 'admin' : 'trainee',
              name: isAdmin ? 'Admin' : (firebaseUser.email?.split('@')[0] || 'User'),
              createdAt: serverTimestamp()
            }
            await setUserDocument(firebaseUser.uid, newUser)
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: isAdmin ? 'admin' : 'trainee',
              name: isAdmin ? 'Admin' : (firebaseUser.email?.split('@')[0] || 'User'),
              createdAt: new Date()
            }
            setUser(prevUser => {
              if (prevUser && prevUser.uid === userData.uid) {
                return prevUser
              }
              return userData
            })
          }
        } catch (error) {
          // Only log non-timeout errors in dev mode
          if (import.meta.env.DEV && !error.message?.includes('timeout')) {
            console.warn('Error fetching user document:', error.message || error.code)
          }
          // If Firestore is offline or there's an error, set user with basic info from auth
          // This allows the app to continue functioning even if Firestore is unavailable
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: firebaseUser.email === ADMIN_EMAIL ? 'admin' : 'trainee',
            name: firebaseUser.email?.split('@')[0] || 'User'
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    authPersistenceReady
      .catch(() => {})
      .finally(() => {
        unsubscribe = onAuthStateChanged(auth, handleAuthChange)
      })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Immediately fetch and set user data from Firestore with fast timeout
      if (userCredential.user) {
        try {
          // Use shorter timeout for login (2 seconds) to fail fast
          const userDoc = await getUserDocument(userCredential.user.uid, 1, 2000)
          if (userDoc.exists()) {
            const userData = { 
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              ...userDoc.data() 
            }
            // Set user state immediately so ProtectedRoute can detect it
            setUser(userData)
            setLoading(false)
          } else {
            // If user doc doesn't exist, create it
            // For admin email, create as admin, otherwise trainee
            const isAdmin = email === ADMIN_EMAIL
            const newUserData = {
              email: userCredential.user.email,
              role: isAdmin ? 'admin' : 'trainee',
              name: isAdmin ? 'Admin' : (userCredential.user.email?.split('@')[0] || 'User'),
              createdAt: serverTimestamp()
            }
            // Try to create document, but don't wait if it fails
            setUserDocument(userCredential.user.uid, newUserData, 1, 2000).catch(() => {
              // Silently fail - document will be created later by onAuthStateChanged
            })
            // Create user data for state (without serverTimestamp placeholder)
            const userData = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              role: isAdmin ? 'admin' : 'trainee',
              name: isAdmin ? 'Admin' : (userCredential.user.email?.split('@')[0] || 'User'),
              createdAt: new Date()
            }
            setUser(userData)
            setLoading(false)
          }
        } catch (firestoreError) {
          // If Firestore is unavailable, set user with basic info from auth immediately
          // This allows login to succeed even if Firestore is temporarily unavailable
          const isAdmin = email === ADMIN_EMAIL
          setUser({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            role: isAdmin ? 'admin' : 'trainee',
            name: isAdmin ? 'Admin' : (userCredential.user.email?.split('@')[0] || 'User')
          })
          setLoading(false)
          // Firestore will sync in the background via onAuthStateChanged
        }
      }
      
      return { success: true }
    } catch (error) {
      setLoading(false)
      return { 
        success: false, 
        error: getFirebaseErrorMessage(error)
      }
    }
  }

  const signup = async (email, password, name) => {
    try {
      // Only allow trainee signups - admins can only login
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const userData = {
        email,
        role: 'trainee', // Always set to trainee for signups
        name: name || email.split('@')[0],
        createdAt: serverTimestamp()
      }
      // Create user document in Firestore
      try {
        await setUserDocument(userCredential.user.uid, userData)
      } catch (firestoreError) {
        console.error('Error creating user document after signup:', firestoreError)
        // Continue even if Firestore write fails - onAuthStateChanged will handle it
      }
      // User data will be set by onAuthStateChanged
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: getFirebaseErrorMessage(error)
      }
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

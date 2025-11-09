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

// Helper function to safely get user document with retry logic
const getUserDocument = async (uid, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      // Try to enable network if it's disabled
      try {
        await enableNetwork(db)
      } catch (e) {
        // Network might already be enabled, ignore error
      }
      
      const userDoc = await getDoc(doc(db, 'users', uid))
      return userDoc
    } catch (error) {
      console.warn(`Failed to get user document (attempt ${i + 1}/${retries}):`, error.message)
      
      // If it's the last retry, throw the error
      if (i === retries - 1) {
        throw error
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
}

// Helper function to safely set user document with retry logic
const setUserDocument = async (uid, userData, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      // Try to enable network if it's disabled
      try {
        await enableNetwork(db)
      } catch (e) {
        // Network might already be enabled, ignore error
      }
      
      await setDoc(doc(db, 'users', uid), userData)
      return
    } catch (error) {
      console.warn(`Failed to set user document (attempt ${i + 1}/${retries}):`, error.message)
      
      // If it's the last retry, throw the error
      if (i === retries - 1) {
        throw error
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
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
          console.error('Error fetching user document:', error)
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
      
      // Immediately fetch and set user data from Firestore
      if (userCredential.user) {
        try {
          const userDoc = await getUserDocument(userCredential.user.uid)
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
            await setUserDocument(userCredential.user.uid, newUserData)
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
          console.error('Error fetching user document after login:', firestoreError)
          // If Firestore is unavailable, set user with basic info from auth
          // This allows login to succeed even if Firestore is temporarily unavailable
          const isAdmin = email === ADMIN_EMAIL
          setUser({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            role: isAdmin ? 'admin' : 'trainee',
            name: isAdmin ? 'Admin' : (userCredential.user.email?.split('@')[0] || 'User')
          })
          setLoading(false)
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

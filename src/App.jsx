import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ErrorProvider } from './contexts/ErrorContext'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import ConnectionIndicator from './components/ConnectionIndicator'

// Lazy load components for code splitting
const SplashScreen = lazy(() => import('./components/SplashScreen'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Modules = lazy(() => import('./pages/Modules'))
const Attendance = lazy(() => import('./pages/Attendance'))
const Assessments = lazy(() => import('./pages/Assessments'))
const Messaging = lazy(() => import('./pages/Messaging'))
const Settings = lazy(() => import('./pages/Settings'))
const Layout = lazy(() => import('./components/Layout'))

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner size="large" text="Authenticating..." />
  }
  
  if (!user) {
    return <Navigate to="/splash" replace />
  }
  
  return children
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner size="large" text="Loading..." />}>
      <Routes>
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="modules" element={<Modules />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="messaging" element={<Messaging />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ErrorProvider>
          <AuthProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <ErrorBoundary>
                <AppRoutes />
                <ConnectionIndicator />
              </ErrorBoundary>
            </Router>
          </AuthProvider>
        </ErrorProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App

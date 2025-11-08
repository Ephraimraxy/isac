import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import AdminDashboard from '../components/dashboard/AdminDashboard'
import TraineeDashboard from '../components/dashboard/TraineeDashboard'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="dashboard">
      {user?.role === 'admin' ? <AdminDashboard /> : <TraineeDashboard />}
    </div>
  )
}


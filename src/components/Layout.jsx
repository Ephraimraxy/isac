import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import './Layout.css'

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false) // For mobile
  const [collapsed, setCollapsed] = useState(false) // For desktop collapse

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsed !== null) {
      setCollapsed(savedCollapsed === 'true')
    }
  }, [])

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed.toString())
  }, [collapsed])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊', ariaLabel: 'Navigate to dashboard' },
    { path: '/modules', label: 'Modules', icon: '📚', ariaLabel: 'Navigate to modules' },
    { path: '/attendance', label: 'Attendance', icon: '✅', ariaLabel: 'Navigate to attendance' },
    { path: '/assessments', label: 'Assessments', icon: '📝', ariaLabel: 'Navigate to assessments' },
    { path: '/messaging', label: 'Messaging', icon: '💬', ariaLabel: 'Navigate to messaging' },
    { path: '/settings', label: 'Settings', icon: '⚙️', ariaLabel: 'Navigate to settings' },
  ]

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className={`layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <button 
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            {!collapsed && <h2>Training System</h2>}
            {!collapsed && <p className="user-role">{user?.role === 'admin' ? '👨‍💼 Admin' : '👤 Trainee'}</p>}
          </div>
          <button 
            className="sidebar-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>
        <ul className="nav-menu">
          {navItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={handleNavClick}
                title={collapsed ? item.label : ''}
                aria-label={item.ariaLabel || item.label}
                aria-current={location.pathname === item.path ? 'page' : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            title={collapsed ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : ''}
          >
            <span className="footer-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
            {!collapsed && <span>{theme === 'light' ? 'Dark' : 'Light'} Mode</span>}
          </button>
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            title={collapsed ? 'Logout' : ''}
          >
            <span className="footer-icon">🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </nav>
      <main className="main-content">
        <header className="top-header">
          <h1>Welcome, {user?.name || 'User'}</h1>
        </header>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  )
}


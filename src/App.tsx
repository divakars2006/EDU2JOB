/* Existing imports */
import { useState, useEffect } from 'react'
import LandingPage from './pages/landingpage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/registerpage'
import Dashboard from './pages/dashboard'
import ProfilePage from './pages/profilepage'
import JobPredictor from './pages/JobPredictor'
import HistoryPage from './pages/HistoryPage'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import './App.css'
import { useAuth } from './authentication/AuthContext'

export function App() {
  const { isAuthenticated } = useAuth();

  const getCurrentPage = () => {
    const path = window.location.pathname
    if (path === '/login') return 'login'
    if (path === '/dashboard') return 'dashboard'
    if (path === '/register') return 'register'
    if (path === '/profile') return 'profile'
    if (path === '/job-predictor') return 'job-predictor'
    if (path === '/history') return 'history'
    if (path === '/admin/login') return 'admin-login'
    if (path === '/admin/dashboard') return 'admin-dashboard'
    return 'landing'
  }

  const [currentPage, setCurrentPage] = useState(getCurrentPage)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getCurrentPage())
    }

    const checkPath = () => {
      const newPage = getCurrentPage()
      if (newPage !== currentPage) {
        setCurrentPage(newPage)
      }
    }

    window.addEventListener('popstate', handlePopState)
    const interval = setInterval(checkPath, 100)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      clearInterval(interval)
    }
  }, [currentPage])

  // Protected Route Logic
  if ((currentPage === 'dashboard' || currentPage === 'profile' || currentPage === 'job-predictor' || currentPage === 'history') && !isAuthenticated) {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/login');
        return <LoginPage />;
      }
    }
  }

  // Admin Protected Route
  if (currentPage === 'admin-dashboard') {
    const isAdmin = localStorage.getItem('isAdminAuthenticated') === 'true';
    if (!isAdmin) {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/admin/login');
        return <AdminLogin />;
      }
    }
  }

  switch (currentPage) {
    case 'login':
      return <LoginPage />
    case 'register':
      return <RegisterPage />
    case 'dashboard':
      if (localStorage.getItem('isAuthenticated') !== 'true' && !isAuthenticated) return <LoginPage />
      return <Dashboard />
    case 'profile':
      if (localStorage.getItem('isAuthenticated') !== 'true' && !isAuthenticated) return <LoginPage />
      return <ProfilePage />
    case 'job-predictor':
      if (localStorage.getItem('isAuthenticated') !== 'true' && !isAuthenticated) return <LoginPage />
      return <JobPredictor />
    case 'history':
      if (localStorage.getItem('isAuthenticated') !== 'true' && !isAuthenticated) return <LoginPage />
      return <HistoryPage />
    case 'admin-login':
      return <AdminLogin />
    case 'admin-dashboard':
      return <AdminDashboard />
    case 'landing':
    default:
      return <LandingPage />
  }
}

// export default App



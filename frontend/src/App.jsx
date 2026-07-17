import React, { useEffect, useState } from 'react';
import { Sparkles, LogOut, User, BarChart2 } from 'lucide-react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard'); // dashboard, profile, login, register
  const [notification, setNotification] = useState(null);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      if (response.ok && data.authenticated) {
        setUser(data.user);
        setPage('dashboard');
      } else {
        setUser(null);
        setPage('login');
      }
    } catch (err) {
      console.error('Auth verification failed', err);
      setUser(null);
      setPage('login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    showNotification('Welcome back! You logged in successfully.');
    setPage('dashboard');
  };

  const handleRegisterSuccess = () => {
    showNotification('Registration successful! Please log in.');
    setPage('login');
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        setUser(null);
        showNotification('You logged out successfully.');
        setPage('login');
      } else {
        throw new Error('Logout failed');
      }
    } catch (err) {
      showNotification('Logout error: ' + err.message, true);
    }
  };

  const showNotification = (message, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Verifying session...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navbar (Only show when logged in) */}
      {user && (
        <nav className="navbar">
          <a href="#" className="brand-link" onClick={() => setPage('dashboard')}>
            <span className="brand-logo">🌱</span>
            <span>Smart Habit Tracker</span>
          </a>

          <div className="nav-links">
            <button
              className={`btn ${page === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPage('dashboard')}
            >
              <BarChart2 size={16} />
              Dashboard
            </button>
            
            <button
              className={`btn ${page === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPage('profile')}
            >
              <User size={16} />
              Profile
            </button>

            <button className="btn btn-danger" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </nav>
      )}

      {/* Global Notifications */}
      {notification && (
        <div className={`alert-banner ${notification.isError ? 'alert-banner-error' : ''}`}>
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="btn btn-secondary btn-icon"
            style={{ padding: '0.2rem', borderRadius: '50%' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Authentication and Content Views */}
      {!user ? (
        page === 'login' ? (
          <Login onLoginSuccess={handleLoginSuccess} onNavigate={setPage} />
        ) : (
          <Register onRegisterSuccess={handleRegisterSuccess} onNavigate={setPage} />
        )
      ) : page === 'dashboard' ? (
        <Dashboard />
      ) : (
        <Profile />
      )}
    </div>
  );
}

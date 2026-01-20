import { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';
import './loginpage.css';
import LoginForm from '../components/loginform';

const LoginPage = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleRegisterClick = () => {
    window.history.pushState({}, '', '/register');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className={`login-page ${theme}-theme`}>
      <div className="spline-background">
        <Spline scene="https://prod.spline.design/j0IcrWkJlj54s2XP/scene.splinecode" />
      </div>
      <header className="login-header">
        <div className="header-content">
          <h1 className="logo-text" onClick={() => window.location.href = '/'}>
            Job Predicting
          </h1>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="login-main">
        <div className="login-container">
          <div className="login-card">
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">Sign in to your account to continue</p>

            <LoginForm />

            <div className="login-footer">
              <p>
                Don't have an account?{' '}
                <span className="register-link" onClick={handleRegisterClick}>
                  Sign up
                </span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;


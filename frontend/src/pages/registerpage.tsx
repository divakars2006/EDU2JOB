import { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';
import './loginpage.css';
import RegisterForm from '../components/registerform';

const RegisterPage = () => {
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

  const handleLoginClick = () => {
    window.history.pushState({}, '', '/login');
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
            <h2 className="login-title">Create Account</h2>
            <p className="login-subtitle">Sign up to get started with Job Predicting</p>

            <RegisterForm />

            <div className="login-footer">
              <p>
                Already have an account?{' '}
                <span className="register-link" onClick={handleLoginClick}>
                  Sign in
                </span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;



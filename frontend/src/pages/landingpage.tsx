import { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';
import './landingpage.css';

const LandingPage = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const handleLoginClick = () => {
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className={`landing-page ${theme}-theme`}>
      <div className="spline-background">
        <Spline scene="https://prod.spline.design/j0IcrWkJlj54s2XP/scene.splinecode" />
      </div>
      <header className="landing-header">
        <div className="header-content">
          <h1 className="logo-text">Job Predicting</h1>
          <div className="header-buttons">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className="login-btn" onClick={handleLoginClick}>
              Login
            </button>
          </div>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Predict Your Next Career Move
            </h1>
            <p className="hero-subtitle">
              Harness the power of AI and data analytics to discover job opportunities
              that match your skills, experience, and career aspirations.
            </p>
            <div className="hero-features">
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Smart Matching</h3>
                <p>AI-powered algorithms analyze your profile and match you with the perfect job opportunities</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Career Insights</h3>
                <p>Get detailed analytics and predictions about your career trajectory and growth potential</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🚀</div>
                <h3>Future Ready</h3>
                <p>Stay ahead with predictions about emerging roles and skills in demand</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="about-content">
            <h2>About Job Predicting</h2>
            <p>
              Job Predicting is an innovative platform that combines machine learning and career analytics
              to help professionals make informed decisions about their career paths. Our advanced
              prediction models analyze market trends, skill requirements, and individual profiles
              to provide personalized job recommendations and career insights.
            </p>
            <p>
              Whether you're looking to advance in your current field or explore new opportunities,
              Job Predicting empowers you with data-driven insights to make confident career decisions.
            </p>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Transform Your Career?</h2>
            <p>Join thousands of professionals who are using Job Predicting to advance their careers</p>
            <button className="cta-button" onClick={handleLoginClick}>
              Get Started
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; 2024 Job Predicting. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;


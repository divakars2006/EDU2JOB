import { useState, useEffect } from 'react';
import './JobPredictor.css';
import './dashboard.css'; // Import dashboard styles for header/theme
import MatchScoreChart from '../components/MatchScoreChart';

const JobPredictor = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    document.documentElement.setAttribute('data-theme', theme);

    // Get user info from localStorage (simplified for this page)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleNavigation = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  /* State Updates */
  const [loading, setLoading] = useState<boolean>(false);
  const [resultData, setResultData] = useState<any>(null);

  const handlePredict = async () => {
    if (!user) {
      alert("Please login to get a prediction");
      return;
    }

    setLoading(true);
    try {
      // Prepare user data from profile structure
      // Ideally this should fetch refreshing data or use what's in 'user' state
      const userData = {
        degree: user.educations?.[0]?.degree || 'B.Tech',
        specialization: user.educations?.[0]?.specialization || 'Computer Science',
        skills: user.skills || [],
        placementStatus: user.placementStatus || [],
        certifications: user.certifications || [],
        project_count: 3, // Mock project count or derive
        cgpa: user.educations && user.educations.length > 0 && user.educations[0].cgpa
          ? parseFloat(user.educations[0].cgpa)
          : 7.5 // Fallback if no education or CGPA found
      };

      // Include user_id for history tracking
      const payload = {
        ...userData,
        user_id: user.id
      };

      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!result.error) {
        setResultData(result); // Save full rich result
      } else {
        alert("Prediction failed: " + (result.error || result.message));
      }
    } catch (error) {
      console.error("Prediction error", error);
      alert("Failed to connect to prediction service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`dashboard-page ${theme}-theme job-predictor-page`}>
      {/* Top Header - Reused from Dashboard */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-container">
            <span className="logo-icon">🎓</span>
            <h1 className="logo-text">Job Predicting</h1>
          </div>
        </div>
        <nav className="header-nav">
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/dashboard'); }}>Dashboard</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/profile'); }}>My Profile</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/job-predictor'); }} className="active">Job Predictor</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/history'); }}>History</a>
        </nav>
        <div className="header-right">
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="user-avatar">
            {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main prediction-container">

        {!resultData ? (
          /* Initial State */
          <div className="predict-cta-container">
            <div className="predict-card">
              <h1 className="predict-title">Career Path Prediction Engine</h1>
              <p className="predict-tagline">Leverage AI to analyze your skills and academic profile to find your perfect job role match.</p>

              <button className="predict-btn" onClick={handlePredict} disabled={loading}>
                {loading ? 'Analyzing Profile...' : 'Predict My Job Role'}
              </button>
            </div>
          </div>
        ) : (
          /* Result Dashboard State */
          <div className="results-dashboard">

            {/* 1. Visual Summary (Graph) */}
            <MatchScoreChart
              title="Prediction Confidence Summary"
              className="chart-card"
              data={resultData.probabilities?.slice(0, 4).map((item: any, index: number, arr: any[]) => ({
                role: item.role,
                score: item.score,
                x: arr.length > 1 ? (index / (arr.length - 1)) * 100 : 50
              }))}
            />

            {/* 2. Top Job Roles */}
            <div className="result-card top-roles-card">
              <h3>Top Recommended Roles</h3>
              <div className="roles-list">
                {resultData.probabilities?.slice(0, 3).map((item: any, index: number) => (
                  <div key={index} className="role-list-item">
                    <span className="role-name">{index + 1}. {item.role}</span>
                    <span className="role-score">{(item.score * 100).toFixed(0)}% Match</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <button
                  className="predict-btn"
                  style={{ fontSize: '0.9rem', padding: '0.5rem 1.5rem' }}
                  onClick={() => setResultData(null)}
                >
                  Predict Again
                </button>
              </div>
            </div>

            {/* Missing Skills Section */}
            <div className="result-card missing-skills-card">
              <h3>Missing Skills to Acquire</h3>
              {resultData.missing_skills && resultData.missing_skills.length > 0 ? (
                <div className="skills-tags">
                  {resultData.missing_skills.map((skill: string, index: number) => (
                    <span key={index} className="skill-tag missing">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="success-text">🎉 You have all the core skills for this role!</p>
              )}
            </div>

            {/* 3. Explanation & Insights */}
            <div className="result-card explanation-card">
              <div>
                <h3>Analysis Explanation</h3>
                <p className="explanation-text">{resultData.explanation}</p>
              </div>

              <div>
                <h3>Actionable Insights</h3>
                <ul className="insights-list">
                  {resultData.insights?.map((insight: string, index: number) => (
                    <li key={index} className="insight-item">
                      💡 {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
};

export default JobPredictor;

import { useState, useEffect } from 'react';
import './dashboard.css';
import TrendingJobRoles from '../components/TrendingJobRoles';
import { getUserById } from '../services/ApiService';

const Dashboard = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Get theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    document.documentElement.setAttribute('data-theme', theme);

    // Get user info from backend
    const fetchUserData = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.id) {
          try {
            // Import dynamically to avoid circular dependencies if any, or just standard import
            const result = await getUserById(parsedUser.id);
            if (result.success && result.data) {
              setUser(result.data);
              // Optionally update localStorage to keep it fresh
              localStorage.setItem('user', JSON.stringify(result.data));
            } else {
              // Fallback to local storage if fetch fails
              setUser(parsedUser);
            }
          } catch (error) {
            console.error("Failed to fetch user data", error);
            setUser(parsedUser);
          }
        } else {
          setUser(parsedUser);
        }
      }
    };

    fetchUserData();
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleNavigation = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className={`dashboard-page ${theme}-theme`}>
      {/* Top Navbar */}
      <header className="dashboard-header">
        {/* Logo – Left */}
        <div className="logo-container">
          <span className="logo-icon">🎓</span>
          <span className="logo-text">Job Predicting</span>
        </div>

        {/* Nav Links – Center */}
        <nav className={`header-nav${menuOpen ? ' nav-open' : ''}`} aria-label="Main navigation">
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/dashboard'); setMenuOpen(false); }} className="active">Dashboard</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/profile'); setMenuOpen(false); }}>My Profile</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/job-predictor'); setMenuOpen(false); }}>Job Predictor</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/history'); setMenuOpen(false); }}>History</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/feedback'); setMenuOpen(false); }}>Feedback</a>
        </nav>

        {/* Right – Avatar + Hamburger */}
        <div className="header-right">
          <div className="user-avatar" title={user?.email || 'User'}>
            {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </div>
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span className={`hamburger-line${menuOpen ? ' open' : ''}`}></span>
            <span className={`hamburger-line${menuOpen ? ' open' : ''}`}></span>
            <span className={`hamburger-line${menuOpen ? ' open' : ''}`}></span>
          </button>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Main Content */}
        <main className="dashboard-main">
          {/* Welcome Card */}
          <div className="welcome-card">
            <div className="welcome-content">
              <h2 className="welcome-title">
                Welcome back, {user?.name || (user?.email ? user.email.split('@')[0] : 'User')}!
              </h2>
              <p className="welcome-subtitle">
                {user?.educations && user.educations.length > 0
                  ? `${user.educations[0].degree} in ${user.educations[0].specialization}`
                  : 'Update your profile'}
              </p>
              <button className="edit-profile-btn" onClick={() => handleNavigation('/profile')}>
                EDIT PROFILE
              </button>
            </div>
            <div className="welcome-illustration">
              <div className="illustration-circle"></div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="cards-grid">
            {/* Academic Profile Card */}
            <div className="info-card">
              <div className="card-header">
                <span className="card-icon">🎓</span>
                <h3 className="card-title">Academic Profile</h3>
              </div>
              <div className="card-content">
                {user?.educations && user.educations.length > 0 ? (
                  <>
                    <div className="profile-item">
                      <span className="profile-label">Institution:</span>
                      <span className="profile-value" title={user.educations[0].university}>
                        {user.educations[0].university}
                      </span>
                    </div>
                    <div className="profile-item">
                      <span className="profile-label">Degree:</span>
                      <span className="profile-value">
                        {user.educations[0].degree} • {user.educations[0].year}
                      </span>
                    </div>
                    <div className="profile-item">
                      <span className="profile-label">CGPA:</span>
                      <span className="profile-value highlight">{user.educations[0].cgpa}</span>
                    </div>
                  </>
                ) : (
                  <p className="empty-message">No academic details added.</p>
                )}
              </div>
            </div>

            {/* Certifications Card */}
            <div className="info-card">
              <div className="card-header">
                <span className="card-icon">✅</span>
                <h3 className="card-title">Certifications</h3>
              </div>
              <div className="card-content">
                {user?.certifications && user.certifications.length > 0 ? (
                  <div className="cert-list-container">
                    {user.certifications.slice(0, 3).map((cert: any, index: number) => (
                      <div key={index} className="cert-item">
                        <span className="cert-badge">{cert.name}</span>
                        <span className="cert-name">{cert.organization}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">No certifications added.</p>
                )}
              </div>
            </div>

            {/* Skills Card */}
            <div className="info-card">
              <div className="card-header">
                <span className="card-icon">💼</span>
                <h3 className="card-title">Skills</h3>
              </div>
              <div className="card-content">
                {user?.skills && user.skills.length > 0 ? (
                  <div className="skills-list">
                    {user.skills.map((skill: string, index: number) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">No skills added.</p>
                )}
              </div>
            </div>

            {/* Job Predictions Card */}
            <div className="info-card">
              <div className="card-header">
                <span className="card-icon">🔮</span>
                <h3 className="card-title">Job Predictions</h3>
              </div>
              <div className="card-content">
                {user?.skills && user.skills.length > 0 ? (
                  <div className="predictions-list">
                    {/* Simple mock logic: if user has 'React', show Frontend Developer match */}
                    {user.skills.some((s: string) => s.toLowerCase().includes('react') || s.toLowerCase().includes('frontend') || s.toLowerCase().includes('javascript')) && (
                      <div className="prediction-item">
                        <span className="prediction-role">Frontend Developer</span>
                        <span className="prediction-score">95% Match</span>
                      </div>
                    )}

                    {user.skills.some((s: string) => s.toLowerCase().includes('design') || s.toLowerCase().includes('ui') || s.toLowerCase().includes('ux')) && (
                      <div className="prediction-item">
                        <span className="prediction-role">UI/UX Designer</span>
                        <span className="prediction-score">88% Match</span>
                      </div>
                    )}

                    {/* Default prediction if skills exist but don't match specific keywords */}
                    <div className="prediction-item">
                      <span className="prediction-role">Software Engineer</span>
                      <span className="prediction-score">80% Match</span>
                    </div>
                  </div>
                ) : (
                  <p className="empty-message">Add skills to get predictions.</p>
                )}
              </div>
            </div>
          </div>

          {/* Recently Trending Job Roles Section */}
          <TrendingJobRoles />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;


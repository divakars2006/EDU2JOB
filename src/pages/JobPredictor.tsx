import { useState, useEffect } from 'react';
import './JobPredictor.css';
import './dashboard.css'; // Import dashboard styles for header/theme
import MatchScoreChart from '../components/MatchScoreChart';
import FeedbackForm from '../components/FeedbackForm';

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
    const [showFeedback, setShowFeedback] = useState<boolean>(false);

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
                internships: user.internships || [],
                certifications: user.certifications || [],

                project_count: user.projects ? user.projects.length : (user.placementStatus ? user.placementStatus.length : 0), // Use real count
                cgpa: user.educations && user.educations.length > 0 && user.educations[0].cgpa
                    ? parseFloat(user.educations[0].cgpa)
                    : 7.5 // Fallback if no education or CGPA found
            };

            // Include user_id for history tracking
            const payload = {
                ...userData,
                user_id: user.id
            };

            const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500));
            const request = fetch('http://localhost:5000/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const [_, response] = await Promise.all([minLoadingTime, request]);

            const result = await response.json();
            if (!result.error) {
                setResultData(result); // Save full rich result
                // Save specific prediction ID and Role for feedback
                localStorage.setItem('lastPrediction', JSON.stringify({
                    role: result.role,
                    predictionId: result.prediction_id
                }));
                setShowFeedback(true);
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
                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/feedback'); }}>Feedback</a>
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
            <div className="dashboard-container">
                <main className="dashboard-main">

                    {!resultData ? (
                        /* Initial State - Welcome Card Style */
                        <div className="welcome-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                            <div className="welcome-content" style={{ width: '100%' }}>
                                <h1 className="welcome-title" style={{ background: 'linear-gradient(90deg, #00f260 0%, #0575e6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '1rem' }}>
                                    Career Path Prediction Engine
                                </h1>
                                <p className="welcome-subtitle">
                                    Leverage AI to analyze your skills and academic profile to find your perfect job role match.
                                </p>

                                <button className="predict-btn" onClick={handlePredict} disabled={loading} style={{ marginTop: '2rem' }}>
                                    {loading ? (
                                        <div className="loader">
                                            <div className="loader__bar"></div>
                                            <div className="loader__bar"></div>
                                            <div className="loader__bar"></div>
                                            <div className="loader__bar"></div>
                                            <div className="loader__bar"></div>
                                            <div className="loader__ball"></div>
                                        </div>
                                    ) : 'Predict My Job Role'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Result Dashboard State */
                        <div className="cards-grid">

                            {/* 1. Visual Summary (Graph) */}
                            <div className="info-card match-score-chart-card" style={{ gridColumn: '1 / -1' }}>
                                <div className="card-header">
                                    <span className="card-icon">📊</span>
                                    <h3 className="card-title">Prediction Confidence Summary</h3>
                                </div>
                                <div className="card-content">
                                    <MatchScoreChart
                                        title=""
                                        className=""
                                        disableCardStyle={true}
                                        data={resultData.probabilities?.slice(0, 4).map((item: any, index: number, arr: any[]) => ({
                                            role: item.role,
                                            score: item.score,
                                            x: arr.length > 1 ? (index / (arr.length - 1)) * 100 : 50
                                        }))}
                                    />
                                </div>
                            </div>

                            {/* 2. Top Job Roles */}
                            <div className="info-card">
                                <div className="card-header" style={{ justifyContent: 'center' }}>
                                    <h3 className="card-title" style={{ fontSize: '1.4rem' }}>Top Recommended Roles</h3>
                                </div>
                                <div className="card-content">
                                    <div className="predictions-list">
                                        {resultData.probabilities?.slice(0, 3).map((item: any, index: number) => (
                                            <div key={index} className="prediction-item" style={{ justifyContent: 'center', gap: '1.5rem', fontSize: '1.1rem' }}>
                                                <span className="prediction-role">{index + 1}. {item.role}</span>
                                                <span className="prediction-score">{(item.score * 100).toFixed(0)}% Match</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                        <button
                                            className="edit-profile-btn"
                                            onClick={() => setResultData(null)}
                                        >
                                            Predict Again
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Missing Skills Section */}
                            <div className="info-card">
                                <div className="card-header" style={{ justifyContent: 'center' }}>
                                    <h3 className="card-title" style={{ fontSize: '1.4rem' }}>Missing Skills to Acquire</h3>
                                </div>
                                <div className="card-content">
                                    {resultData.missing_skills && resultData.missing_skills.length > 0 ? (
                                        <div className="skills-list" style={{ justifyContent: 'center' }}>
                                            {resultData.missing_skills.map((skill: string, index: number) => (
                                                <span key={index} className="skill-tag" style={{ border: '1px solid #975d5dff', color: '#a54343ff', backgroundColor: 'rgba(201, 153, 153, 0.36)' }}>{skill}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="success-text" style={{ color: '#10b981', textAlign: 'center', width: '100%' }}>🎉 You have all the core skills for this role!</p>
                                    )}
                                </div>
                            </div>



                            {/* 3. Explanation & Insights */}
                            <div className="info-card" style={{ gridColumn: '1 / -1' }}>
                                <div className="card-header" style={{ justifyContent: 'center' }}>
                                    <h3 className="card-title" style={{ fontSize: '1.4rem' }}>Analysis & Insights</h3>
                                </div>
                                <div className="card-content" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '2rem' }}>
                                    <div style={{ flex: 1, minWidth: '300px' }}>
                                        <h4 style={{ marginBottom: '1rem', opacity: 0.9 }}>Analysis Explanation</h4>
                                        <p className="explanation-text" style={{ lineHeight: 1.6, opacity: 0.8 }}>{resultData.explanation}</p>
                                    </div>

                                    <div style={{ flex: 1, minWidth: '300px' }}>
                                        <h4 style={{ marginBottom: '1rem', opacity: 0.9 }}>Actionable Insights</h4>
                                        <ul className="insights-list" style={{ listStyle: 'none', padding: 0 }}>
                                            {resultData.insights?.map((insight: string, index: number) => (
                                                <li key={index} className="insight-item" style={{
                                                    background: 'rgba(255, 193, 7, 0.1)',
                                                    borderLeft: '4px solid #ffc107',
                                                    padding: '0.75rem 1rem',
                                                    marginBottom: '0.75rem',
                                                    borderRadius: '0 4px 4px 0',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {insight}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Feedback Form - Moved to Bottom */}
                            {showFeedback && (
                                <div style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
                                    <FeedbackForm
                                        predictedRole={resultData.role}
                                        userId={user?.id || 'anonymous'}
                                        predictionId={resultData.prediction_id}
                                        onClose={() => setShowFeedback(false)}
                                    />
                                </div>
                            )}

                        </div>
                    )}

                </main>
            </div>

        </div>
    );
};

export default JobPredictor;

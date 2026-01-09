import { useState, useEffect } from 'react';
import './dashboard.css'; // Reuse dashboard styles for header
import './JobPredictor.css'; // Reuse container styles or create new if needed

const HistoryPage = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Theme logic
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
        }
        document.documentElement.setAttribute('data-theme', theme);

        // User data
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
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

    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && user.id) {
            fetchHistory(user.id);
        }
    }, [user]);

    const fetchHistory = async (userId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/history/${userId}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setHistory(data);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`dashboard-page ${theme}-theme`}>
            {/* Top Header */}
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
                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/job-predictor'); }}>Job Predictor</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/history'); }} className="active">History</a>
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

            <div className="dashboard-container">
                {/* Main Content */}
                <main className="dashboard-main">
                    <h2 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: '700' }}>Prediction History</h2>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                    ) : history.length > 0 ? (
                        <div className="history-list" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                        }}>
                            {history.map((item) => (
                                <div key={item.id} className="info-card" style={{ width: '100%', boxSizing: 'border-box' }}>
                                    <div className="card-header" style={{ flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', alignItems: 'stretch' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <h3 className="card-title" style={{ fontSize: '1.4rem' }}>{item.role}</h3>
                                            </div>
                                            <span className="prediction-score" style={{ fontSize: '1.1rem' }}>
                                                {item.confidence ? `${(Number(item.confidence) * 100).toFixed(0)}% Match` : 'N/A'}
                                            </span>
                                        </div>
                                        {item.confidence && (
                                            <div style={{
                                                width: '100%',
                                                height: '16px', // "Big"
                                                background: 'rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                marginTop: '0.25rem'
                                            }}>
                                                <div style={{
                                                    width: `${Number(item.confidence) * 100}%`,
                                                    height: '100%',
                                                    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                                                    borderRadius: '8px',
                                                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="card-content">
                                        <p style={{ margin: 0, opacity: 0.8, lineHeight: '1.6' }}>{item.explanation}</p>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.5, textAlign: 'right' }}>
                                            {new Date(item.timestamp).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                            <div style={{ textAlign: 'center', opacity: 0.7 }}>
                                <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🕒</div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '500' }}>There is no history of prediction</h2>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default HistoryPage;

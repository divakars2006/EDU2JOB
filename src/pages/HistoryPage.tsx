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
            <main className="dashboard-main" style={{ padding: '2rem', paddingTop: '110px', minHeight: 'calc(100vh - 80px)' }}>
                <h2 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>Prediction History</h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                ) : history.length > 0 ? (
                    <div className="history-list" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {history.map((item) => (
                            <div key={item.id} className="history-card" style={{
                                background: 'var(--card-bg)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{new Date(item.timestamp).toLocaleDateString()}</span>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--accent-color)' }}>{item.confidence || 'N/A'}</span>
                                </div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{item.role}</h3>
                                <p style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: '1.4' }}>{item.explanation}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '5rem', marginBottom: '1.5rem', opacity: 0.7 }}>🕒</div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '500' }}>There is no history of prediction</h2>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default HistoryPage;

import { useState, useEffect } from 'react';
import './dashboard.css'; // Reuse user dashboard styles

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    // Dashboard Metrics
    const [stats, setStats] = useState<any>(null);

    // Logs
    const [logs, setLogs] = useState<any[]>([]);

    // Model Management
    const [file, setFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Set theme
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', theme);

        fetchStats();
        if (activeTab === 'logs' || activeTab === 'flagged') {
            fetchLogs();
        }
    }, [activeTab, theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:5000/admin/stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:5000/admin/predictions');
            const data = await res.json();
            setLogs(data);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFlag = async (id: number, currentStatus: number) => {
        try {
            const newStatus = currentStatus === 1 ? 0 : 1;
            await fetch('http://localhost:5000/admin/flag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, flagged: newStatus })
            });
            setLogs(logs.map(log => log.id === id ? { ...log, flagged: newStatus } : log));
            fetchStats();
        } catch (error) {
            console.error("Error flagging:", error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    const handleRetrain = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        setUploadStatus('Uploading...');
        try {
            const res = await fetch('http://localhost:5000/admin/retrain', { method: 'POST', body: formData });
            const data = await res.json();
            setUploadStatus(data.message || 'Done');
            setFile(null);
        } catch (error) {
            setUploadStatus('Error');
            console.error(error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        localStorage.removeItem('user'); // Clear any fake user data
        window.location.href = '/login'; // Unified login redirect
    };

    // Render Components
    const renderOverview = () => (
        <div className="cards-grid">
            <div className="info-card">
                <div className="card-header">
                    <span className="card-icon">👥</span>
                    <h3 className="card-title">Total Users</h3>
                </div>
                <div className="card-content">
                    <span className="profile-value highlight" style={{ fontSize: '2rem' }}>{stats?.total_users || 0}</span>
                </div>
            </div>

            <div className="info-card">
                <div className="card-header">
                    <span className="card-icon">🔮</span>
                    <h3 className="card-title">Predictions</h3>
                </div>
                <div className="card-content">
                    <span className="profile-value highlight" style={{ fontSize: '2rem' }}>{stats?.total_predictions || 0}</span>
                </div>
            </div>

            <div className="info-card">
                <div className="card-header">
                    <span className="card-icon">🚩</span>
                    <h3 className="card-title">Flagged</h3>
                </div>
                <div className="card-content">
                    <span className="profile-value highlight" style={{ fontSize: '2rem', color: '#ef4444' }}>{stats?.total_flagged || 0}</span>
                </div>
            </div>

            <div className="info-card">
                <div className="card-header">
                    <span className="card-icon">🧠</span>
                    <h3 className="card-title">Model Status</h3>
                </div>
                <div className="card-content">
                    <span className="profile-value">Active</span>
                    <span className="profile-label" style={{ display: 'block', marginTop: '5px' }}>
                        Last Trained: {stats?.last_trained || 'Unknown'}
                    </span>
                </div>
            </div>
        </div>
    );

    const renderDataSection = () => {
        if (activeTab === 'dashboard') return renderOverview();
        if (activeTab === 'model') return (
            <div className="info-card" style={{ maxWidth: '800px' }}>
                <div className="card-header">
                    <span className="card-icon">⚙️</span>
                    <h3 className="card-title">Model Retraining</h3>
                </div>
                <div className="card-content" style={{ gap: '1.5rem' }}>
                    <p style={{ opacity: 0.8 }}>Upload a new CSV/TSV dataset to retrain the underlying Machine Learning model.</p>
                    <input type="file" onChange={handleFileChange} accept=".csv, .tsv" style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button className="edit-profile-btn" onClick={handleRetrain} disabled={!file}>
                            Upload & Retrain
                        </button>
                        <span>{uploadStatus}</span>
                    </div>
                </div>
            </div>
        );

        // Logs Table
        const isFlaggedView = activeTab === 'flagged';
        const displayLogs = isFlaggedView ? logs.filter(l => l.flagged) : logs;

        return (
            <div className="info-card">
                <div className="card-header">
                    <span className="card-icon">{isFlaggedView ? '🚩' : '📝'}</span>
                    <h3 className="card-title">{isFlaggedView ? 'Flagged Records' : 'All Prediction Logs'}</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', color: 'inherit' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Time</th>
                                <th style={{ padding: '1rem' }}>Role</th>
                                <th style={{ padding: '1rem' }}>Conf.</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayLogs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem' }}>{new Date(log.timestamp).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>{log.role}</td>
                                    <td style={{ padding: '1rem' }}>{(log.confidence * 100).toFixed(0)}%</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px',
                                            background: log.flagged ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                            color: log.flagged ? '#ef4444' : '#22c55e'
                                        }}>
                                            {log.flagged ? 'Flagged' : 'OK'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            onClick={() => handleFlag(log.id, log.flagged)}
                                            style={{
                                                background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                                                color: 'inherit', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'
                                            }}
                                        >
                                            {log.flagged ? 'Unflag' : 'Flag'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {displayLogs.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No records found.</p>}
                </div>
            </div>
        );
    };

    return (
        <div className={`dashboard-page ${theme}-theme`}>
            {/* Admin Header - Reusing dashboard-header class */}
            <header className="dashboard-header">
                <div className="header-left">
                    <div className="logo-container">
                        <span className="logo-icon">🛡️</span>
                        <h1 className="logo-text">Admin Portal</h1>
                    </div>
                </div>
                <nav className="header-nav">
                    <a className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</a>
                    <a className={activeTab === 'model' ? 'active' : ''} onClick={() => setActiveTab('model')}>Model Management</a>
                    <a className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>Prediction Logs</a>
                    <a className={activeTab === 'flagged' ? 'active' : ''} onClick={() => setActiveTab('flagged')}>Flagged Records</a>
                </nav>
                <div className="header-right">
                    <button className="theme-toggle-btn" onClick={toggleTheme}>
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <button className="edit-profile-btn" onClick={handleLogout} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        Logout
                    </button>
                </div>
            </header>

            <div className="dashboard-container">
                <main className="dashboard-main">
                    {/* Welcome Section */}
                    <div className="welcome-card">
                        <div className="welcome-content">
                            <h2 className="welcome-title">System Administration</h2>
                            <p className="welcome-subtitle">Manage ML models, datasets, and prediction accuracy.</p>
                        </div>
                    </div>

                    {/* Content Section */}
                    {renderDataSection()}
                </main>
            </div>
        </div>
    );
}

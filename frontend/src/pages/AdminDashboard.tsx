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

    // Feedback
    const [feedbackLogs, setFeedbackLogs] = useState<any[]>([]);
    const [feedbackFilter, setFeedbackFilter] = useState({ rating: '', role: '', agreement: '', search: '' });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Set theme
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', theme);

        fetchStats();
        if (activeTab === 'logs' || activeTab === 'flagged') {
            fetchLogs();
        } else if (activeTab === 'feedback') {
            fetchFeedback();
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
            // Update both logs and feedbackLogs to ensure consistency
            setLogs(prev => prev.map(log => log.id === id ? { ...log, flagged: newStatus } : log));
            setFeedbackLogs(prev => prev.map(f => f.prediction_id === id ? { ...f, flagged: newStatus } : f));
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
            fetchStats(); // Refresh stats to show new model info
        } catch (error) {
            setUploadStatus('Error');
            console.error(error);
        }
    };

    const fetchFeedback = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:5000/admin/all_feedback');
            const data = await res.json();
            setFeedbackLogs(data);
        } catch (error) {
            console.error("Error fetching feedback:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFeedbackStatus = async (id: number, status: string) => {
        try {
            await fetch('http://localhost:5000/admin/feedback/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            setFeedbackLogs(prev => prev.map(f => f.id === id ? { ...f, status } : f));
        } catch (error) {
            console.error("Error updating status:", error);
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
                    <span className="profile-value" style={{
                        color: stats?.model_status === 'Active' ? '#22c55e' : '#ef4444'
                    }}>
                        {stats?.model_status || 'Unknown'}
                    </span>
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
            <div className="cards-grid">
                {/* Metrics Cards */}
                <div className="info-card">
                    <div className="card-header">
                        <span className="card-icon">📊</span>
                        <h3 className="card-title">Dataset Size</h3>
                    </div>
                    <div className="card-content">
                        <span className="profile-value highlight">{stats?.dataset_size || 'N/A'}</span>
                        <span className="profile-label">Total Rows</span>
                    </div>
                </div>

                <div className="info-card">
                    <div className="card-header">
                        <span className="card-icon">🎯</span>
                        <h3 className="card-title">Model Accuracy</h3>
                    </div>
                    <div className="card-content">
                        <span className="profile-value highlight">{stats?.accuracy || 'N/A'}</span>
                        <span className="profile-label">On Test Set</span>
                    </div>
                </div>

                <div className="info-card">
                    <div className="card-header">
                        <span className="card-icon">⏱️</span>
                        <h3 className="card-title">Last Training</h3>
                    </div>
                    <div className="card-content">
                        <span className="profile-value" style={{
                            color: stats?.training_status === 'Success' ? '#22c55e' : '#ef4444'
                        }}>
                            {stats?.training_status || 'Unknown'}
                        </span>
                        <span className="profile-label">{stats?.last_trained || '-'}</span>
                    </div>
                </div>

                {/* Upload Section (Full Width) */}
                <div className="info-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header">
                        <span className="card-icon">⚙️</span>
                        <h3 className="card-title">Retrain Model</h3>
                    </div>
                    <div className="card-content" style={{ gap: '1.5rem' }}>
                        <p style={{ opacity: 0.8 }}>Upload a new CSV/TSV dataset to retrain the underlying Machine Learning model.</p>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input type="file" onChange={handleFileChange} accept=".csv, .tsv" style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', flex: 1, minWidth: '250px' }} />
                            <button className="edit-profile-btn" onClick={handleRetrain} disabled={!file || uploadStatus === 'Uploading...'}>
                                {uploadStatus === 'Uploading...' ? 'Processing...' : 'Upload & Retrain'}
                            </button>
                        </div>
                        {uploadStatus && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                borderRadius: '8px',
                                background: uploadStatus.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                color: uploadStatus.includes('Error') ? '#ef4444' : '#22c55e'
                            }}>
                                {uploadStatus}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );



        if (activeTab === 'feedback') {
            const filteredFeedback = feedbackLogs.filter(f => {
                const matchRating = feedbackFilter.rating ? f.relevance_rating.toString() === feedbackFilter.rating : true;
                const matchRole = feedbackFilter.role ? f.predicted_role === feedbackFilter.role : true;
                const matchAgreement = feedbackFilter.agreement ? f.confidence_agreement === feedbackFilter.agreement : true;
                const matchSearch = feedbackFilter.search ?
                    (f.user_id?.toLowerCase().includes(feedbackFilter.search.toLowerCase()) || f.predicted_role?.toLowerCase().includes(feedbackFilter.search.toLowerCase())) : true;
                return matchRating && matchRole && matchAgreement && matchSearch;
            });

            return (
                <div className="info-card">
                    <div className="card-header">
                        <span className="card-icon">💬</span>
                        <h3 className="card-title">User Feedback Management</h3>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <select
                            value={feedbackFilter.rating}
                            onChange={(e) => setFeedbackFilter({ ...feedbackFilter, rating: e.target.value })}
                            style={{ padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'inherit', border: 'none' }}
                        >
                            <option value="">All Ratings</option>
                            {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Stars</option>)}
                        </select>
                        <select
                            value={feedbackFilter.agreement}
                            onChange={(e) => setFeedbackFilter({ ...feedbackFilter, agreement: e.target.value })}
                            style={{ padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'inherit', border: 'none' }}
                        >
                            <option value="">All Agreements</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="Somewhat">Somewhat</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Search User ID or Role..."
                            value={feedbackFilter.search}
                            onChange={(e) => setFeedbackFilter({ ...feedbackFilter, search: e.target.value })}
                            style={{ padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'inherit', border: 'none', flex: 1 }}
                        />
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', color: 'inherit' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', opacity: 0.7 }}>
                                    <th style={{ padding: '1rem' }}>Date</th>
                                    <th style={{ padding: '1rem' }}>User ID</th>
                                    <th style={{ padding: '1rem' }}>Role</th>
                                    <th style={{ padding: '1rem' }}>Rating</th>
                                    <th style={{ padding: '1rem' }}>Agreement</th>
                                    <th style={{ padding: '1rem' }}>Comments</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFeedback.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', whiteSpace: 'nowrap', fontSize: '0.85rem', opacity: 0.7 }}>
                                            {new Date(item.timestamp).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.user_id}>
                                            {item.user_id}
                                        </td>
                                        <td style={{ padding: '1rem' }}>{item.predicted_role}</td>
                                        <td style={{ padding: '1rem' }}>{'⭐'.repeat(item.relevance_rating)}</td>
                                        <td style={{ padding: '1rem' }}>{item.confidence_agreement || '-'}</td>
                                        <td style={{ padding: '1rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.comments}>
                                            {item.comments || '-'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem',
                                                background: item.status === 'Reviewed' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                                color: item.status === 'Reviewed' ? '#22c55e' : '#eab308'
                                            }}>
                                                {item.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            {item.status !== 'Reviewed' && (
                                                <button
                                                    onClick={() => handleFeedbackStatus(item.id, 'Reviewed')}
                                                    style={{ cursor: 'pointer', background: 'rgba(34, 197, 94, 0.2)', border: 'none', color: '#22c55e', padding: '4px 8px', borderRadius: '4px' }}
                                                    title="Mark as Reviewed"
                                                >
                                                    ✅
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleFlag(item.prediction_id, item.flagged ? 1 : 0)}
                                                style={{
                                                    cursor: 'pointer',
                                                    background: item.flagged ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)',
                                                    border: item.flagged ? '1px solid #ef4444' : 'none',
                                                    color: '#ef4444',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px'
                                                }}
                                                title={item.flagged ? "Unflag" : "Flag Prediction"}
                                            >
                                                {item.flagged ? '❌' : '🚩'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredFeedback.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No feedback found.</p>}
                    </div>
                </div>
            );
        }

        // Logs Table
        const isFlaggedView = activeTab === 'flagged';
        const displayLogs = isFlaggedView ? logs.filter(l => l.flagged) : logs;

        return (
            <div className="info-card">
                <div className="card-header">
                    <span className="card-icon">{isFlaggedView ? '🚩' : '📝'}</span>
                    <h3 className="card-title">{isFlaggedView ? 'Flagged Records Management' : 'All Prediction Logs'}</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', color: 'inherit' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Time</th>
                                <th style={{ padding: '1rem' }}>User ID</th>
                                <th style={{ padding: '1rem' }}>Background</th>
                                <th style={{ padding: '1rem' }}>Pred. Role</th>
                                <th style={{ padding: '1rem' }}>Rating</th>
                                <th style={{ padding: '1rem' }}>Conf.</th>
                                {isFlaggedView && <th style={{ padding: '1rem' }}>Reason</th>}
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayLogs.map(log => {
                                // Determine reason to show
                                let reasonDisplay = log.flag_reason || '-';
                                if (log.feedback_reason) {
                                    // Parse if JSON string
                                    let fbReasons = log.feedback_reason;
                                    try {
                                        if (typeof fbReasons === 'string') fbReasons = JSON.parse(fbReasons);
                                    } catch { }
                                    if (Array.isArray(fbReasons)) reasonDisplay = fbReasons.join(', ');
                                    else reasonDisplay = String(fbReasons);
                                } else if (log.comments) {
                                    reasonDisplay = log.comments;
                                }

                                return (
                                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', whiteSpace: 'nowrap', fontSize: '0.9rem', opacity: 0.7 }}>
                                            {new Date(log.timestamp).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td style={{ padding: '1rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.user_id}>
                                            {log.user_id}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.95rem' }}>{log.degree || '-'}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{log.specialization || '-'}</div>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>{log.role}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {log.rating ? '⭐'.repeat(log.rating) : '-'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>{(log.confidence * 100).toFixed(0)}%</td>

                                        {isFlaggedView && (
                                            <td style={{ padding: '1rem', maxWidth: '150px', fontSize: '0.9rem' }}>
                                                {reasonDisplay}
                                            </td>
                                        )}

                                        <td style={{ padding: '1rem' }}>
                                            {isFlaggedView ? (
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: '4px',
                                                    background: log.flag_status === 'Resolved' ? 'rgba(34, 197, 94, 0.2)' :
                                                        log.flag_status === 'Reviewed' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                                    color: log.flag_status === 'Resolved' ? '#22c55e' :
                                                        log.flag_status === 'Reviewed' ? '#3b82f6' : '#eab308',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {log.flag_status || 'Pending'}
                                                </span>
                                            ) : (
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: '4px',
                                                    background: log.flagged ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                                    color: log.flagged ? '#ef4444' : '#22c55e',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {log.flagged ? 'Flagged' : 'OK'}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {isFlaggedView ? (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {log.flag_status !== 'Resolved' && (
                                                        <button
                                                            onClick={() => {
                                                                fetch('http://localhost:5000/admin/flag', {
                                                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ id: log.id, status: 'Resolved' })
                                                                }).then(() => {
                                                                    setLogs(prev => prev.map(l => l.id === log.id ? { ...l, flag_status: 'Resolved' } : l));
                                                                    fetchStats();
                                                                });
                                                            }}
                                                            title="Resolve"
                                                            style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', color: '#22c55e', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            ✅
                                                        </button>
                                                    )}
                                                    {log.flag_status === 'Pending' && (
                                                        <button
                                                            onClick={() => {
                                                                fetch('http://localhost:5000/admin/flag', {
                                                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ id: log.id, status: 'Reviewed' })
                                                                }).then(() => {
                                                                    setLogs(prev => prev.map(l => l.id === log.id ? { ...l, flag_status: 'Reviewed' } : l));
                                                                    fetchStats();
                                                                });
                                                            }}
                                                            title="Mark as Reviewed"
                                                            style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', color: '#3b82f6', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            👁️
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleFlag(log.id, 1)} // 1 means currently flagged, so this toggles to 0
                                                        title="Dismiss / Unflag"
                                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        ❌
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleFlag(log.id, log.flagged)}
                                                    style={{
                                                        background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                                                        color: 'inherit', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem'
                                                    }}
                                                >
                                                    {log.flagged ? 'Unflag' : 'Flag'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
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
                    <a className={activeTab === 'feedback' ? 'active' : ''} onClick={() => setActiveTab('feedback')}>Feedback</a>
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

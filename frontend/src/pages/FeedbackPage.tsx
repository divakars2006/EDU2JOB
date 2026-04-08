import { useState, useEffect } from 'react';
import './dashboard.css'; // Reuse dashboard styles
import { useAuth } from '../authentication/AuthContext';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, "");

const FeedbackPage = () => {
    const { user } = useAuth();
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [relevanceRating, setRelevanceRating] = useState<number | null>(null);
    const [confidenceAgreement, setConfidenceAgreement] = useState<string>('');
    const [alternativeRole, setAlternativeRole] = useState<string>('');
    const [feedbackReason, setFeedbackReason] = useState<string[]>([]);
    const [comments, setComments] = useState<string>('');
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // Mock predicted role or retrieve from local storage/context
    // For now assuming we can getting it from a recent prediction we might store in localStorage
    // or just hardcoding the example "ML Engineer" if none found as per request visual
    const [predictedRole, setPredictedRole] = useState<string>('ML Engineer');
    const [predictionId, setPredictionId] = useState<number | undefined>(undefined);

    const jobRoles = [
        "Software Developer",
        "Data Analyst",
        "Data Scientist",
        "ML Engineer",
        "Business Analyst"
    ];

    const reasons = [
        "My skills do not match",
        "I lack required experience",
        "I am aiming for a different role",
        "Confidence score feels inaccurate",
        "Other"
    ];

    useEffect(() => {
        // Theme logic
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
        }
        document.documentElement.setAttribute('data-theme', theme);

        // Try to get last predicted role and ID
        const lastPred = localStorage.getItem('lastPrediction');
        if (lastPred) {
            try {
                const parsed = JSON.parse(lastPred);
                if (parsed.role) setPredictedRole(parsed.role);
                if (parsed.predictionId) setPredictionId(parsed.predictionId);
            } catch (e) { }
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

    const handleReasonChange = (reason: string) => {
        setFeedbackReason(prev =>
            prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!relevanceRating) {
            setError('Please rate the relevance of the recommendation.');
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user?.id || 'anonymous',
                    prediction_id: predictionId,
                    predicted_role: predictedRole,
                    relevance_rating: relevanceRating,
                    confidence_agreement: confidenceAgreement,
                    alternative_role: alternativeRole,
                    feedback_reason: feedbackReason,
                    comments: comments
                })
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                setError('Failed to submit feedback. Please try again.');
            }
        } catch (err) {
            setError('Server connection error.');
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
                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/history'); }}>History</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/feedback'); }} className="active">Feedback</a>
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
                <main className="dashboard-main" style={{
                    maxWidth: '700px',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <div className="info-card" style={{ padding: '2.5rem' }}>

                        {/* SECTION 1: Header */}
                        <div className="card-header" style={{ justifyContent: 'center', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem', borderBottom: 'none' }}>
                            <h3 className="card-title" style={{ fontSize: '1.8rem', margin: 0 }}>Detailed Feedback</h3>
                            <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Help us improve job recommendations</p>
                        </div>

                        {submitted ? (
                            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Thank You!</h3>
                                <p style={{ opacity: 0.8 }}>Your feedback helps us improve.</p>
                                <button
                                    onClick={() => {
                                        setSubmitted(false);
                                        setRelevanceRating(null);
                                        setComments('');
                                        setFeedbackReason([]);
                                        setConfidenceAgreement('');
                                    }}
                                    className="edit-profile-btn"
                                    style={{ marginTop: '2rem' }}
                                >
                                    Submit Another Response
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>

                                {/* SECTION 2: Relevance Rating */}
                                <div className="form-group" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '1.1rem', textAlign: 'left' }}>
                                        How relevant is this job recommendation to your profile? *
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', marginTop: '0.5rem' }}>
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setRelevanceRating(num)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    fontSize: '2.5rem',
                                                    cursor: 'pointer',
                                                    color: relevanceRating && relevanceRating >= num ? '#FFD700' : 'rgba(255, 255, 255, 0.3)',
                                                    transition: 'transform 0.1s',
                                                    padding: '0 5px'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '300px', margin: '0.5rem auto', opacity: 0.6, fontSize: '0.9rem' }}>
                                        <span>Not Relevant</span>
                                        <span>Very Relevant</span>
                                    </div>
                                </div>

                                {/* SECTION 3: Confidence Agreement */}
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '1.1rem' }}>
                                        Do you agree with the confidence score shown?
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {['Yes', 'Somewhat', 'No'].map(option => (
                                            <label key={option} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', opacity: 0.9 }}>
                                                <input
                                                    type="checkbox"
                                                    name="confidence"
                                                    value={option}
                                                    checked={confidenceAgreement === option}
                                                    onChange={() => setConfidenceAgreement(option)}
                                                    style={{
                                                        marginRight: '12px',
                                                        accentColor: '#9333ea',
                                                        width: '18px',
                                                        height: '18px',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                                <span style={{ fontSize: '1rem' }}>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* SECTION 4: Reason for Feedback */}
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '1.1rem' }}>
                                        Why do you feel this way? (Optional)
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {reasons.map(reason => (
                                            <label key={reason} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', opacity: 0.9 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={feedbackReason.includes(reason)}
                                                    onChange={() => handleReasonChange(reason)}
                                                    style={{
                                                        marginRight: '12px',
                                                        accentColor: '#9333ea',
                                                        width: '18px',
                                                        height: '18px',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                                {reason}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* SECTION 5: Additional Comments */}
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '1.1rem' }}>
                                        Additional Comments (Optional)
                                    </label>
                                    <textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Any additional thoughts..."
                                        maxLength={200}
                                        rows={4}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'inherit',
                                            resize: 'vertical',
                                            fontSize: '1rem',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                    <div style={{ textAlign: 'right', fontSize: '0.85rem', opacity: 0.5, marginTop: '0.25rem' }}>
                                        {comments.length}/200 characters
                                    </div>
                                </div>

                                {error && <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>{error}</div>}

                                {/* SECTION 6: Submit Button */}
                                <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                                    <button
                                        type="submit"
                                        style={{
                                            background: '#9333ea',
                                            color: 'white',
                                            padding: '0.8rem 3rem',
                                            border: 'none',
                                            borderRadius: '9999px',
                                            fontSize: '1.05rem',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            boxShadow: '0 4px 12px rgba(147, 51, 234, 0.4)',
                                            transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        Submit Feedback
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default FeedbackPage;

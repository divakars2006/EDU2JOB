import React, { useState } from 'react';
import './FeedbackForm.css';
import { submitFeedback } from '../services/ApiService';

interface FeedbackFormProps {
    predictedRole: string;
    userId: string;
    predictionId?: number;
    onClose: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ predictedRole, userId, predictionId, onClose }) => {
    const [relevanceRating, setRelevanceRating] = useState<number | null>(null);
    const [confidenceAgreement, setConfidenceAgreement] = useState<string>('');
    const [alternativeRole, setAlternativeRole] = useState<string>('');
    const [feedbackReason, setFeedbackReason] = useState<string[]>([]);
    const [comments, setComments] = useState<string>('');
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

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
            const response = await submitFeedback({
                user_id: userId,
                prediction_id: predictionId,
                predicted_role: predictedRole,
                relevance_rating: relevanceRating,
                confidence_agreement: confidenceAgreement,
                alternative_role: alternativeRole,
                feedback_reason: feedbackReason,
                comments: comments
            });

            if (response && !response.error) {
                setSubmitted(true);
                // Auto close after 3 seconds
                setTimeout(() => {
                    onClose();
                }, 3000);
            } else {
                setError('Failed to submit feedback. Please try again.');
            }
        } catch (err) {
            setError('Server connection error.');
        }
    };

    const [step, setStep] = useState<'initial' | 'form'>('initial');

    const handleInitialChoice = (isHelpful: boolean) => {
        setRelevanceRating(isHelpful ? 5 : 2);
        setStep('form');
    };

    if (submitted) {
        return (
            <div className="feedback-form-container success">
                <div className="success-icon">✅</div>
                <h3>Thank you for your feedback!</h3>
                <p>Your input helps us improve our predictions.</p>
            </div>
        );
    }

    if (step === 'initial') {
        return (
            <div className="feedback-form-container glass-panel fade-in">
                <header className="feedback-header">
                    <h3>Was this prediction helpful?</h3>
                </header>
                <div className="initial-choices">
                    <button
                        className="choice-btn yes-btn"
                        onClick={() => handleInitialChoice(true)}
                    >
                        <span className="icon">👍</span> YES, IT WAS
                    </button>
                    <button
                        className="choice-btn no-btn"
                        onClick={() => handleInitialChoice(false)}
                    >
                        <span className="icon">👎</span> NO, NOT REALLY
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="feedback-form-container glass-panel fade-in">
            <header className="feedback-header">
                {/* Header removed as per request */}
            </header>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        How would you rate your experience?
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', margin: '1rem 0' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRelevanceRating(star)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '2rem',
                                    cursor: 'pointer',
                                    opacity: relevanceRating && relevanceRating >= star ? 1 : 0.3,
                                    transition: 'opacity 0.2s',
                                    padding: '0 5px'
                                }}
                            >
                                ⭐
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Tell us what you think
                    </label>
                    <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="What do you love? What can we improve?"
                        rows={4}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'white',
                            resize: 'vertical'
                        }}
                    />
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                    <button
                        type="submit"
                        className="submit-feedback-btn"
                        disabled={!relevanceRating}
                        style={{ opacity: relevanceRating ? 1 : 0.7 }}
                    >
                        Submit Feedback
                    </button>
                    <button type="button" className="cancel-btn" onClick={() => setStep('initial')} style={{ marginLeft: '10px', background: 'transparent', border: '1px solid #aaa' }}>Back</button>
                </div>
            </form>
        </div>
    );
};

export default FeedbackForm;

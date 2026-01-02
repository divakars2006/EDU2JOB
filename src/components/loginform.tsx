import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../authentication/AuthContext';
import { loginUser, googleLogin } from '../services/ApiService';

interface LoginFormProps {
    className?: string;
}

const LoginForm = ({ className }: LoginFormProps) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [theme, setTheme] = useState<'light' | 'dark'>(() =>
        (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);

        try {
            const result = await loginUser({ email, password });

            if (result.success && result.data) {
                login(result.data, result.token);
                // Navigation is handled by the page or app router listening to auth state
                window.history.pushState({}, '', '/dashboard');
                window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
                setError(result.message || 'Login failed. Please try again.');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            setError(error.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        setError('');
        try {
            const result = await googleLogin(credentialResponse.credential);

            if (result.success && result.data) {
                login(result.data, result.token);
                window.history.pushState({}, '', '/dashboard');
                window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
                setError(result.message || 'Google Login failed.');
            }
        } catch (error: any) {
            console.error('Google Login Error:', error);
            setError('Google Login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className={`login-form ${className || ''}`} onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="form-options">
                <label className="remember-me">
                    <input type="checkbox" disabled={isLoading} />
                    <span>Remember me</span>
                </label>
                <a href="#" className="forgot-password" onClick={(e) => e.preventDefault()}>
                    Forgot password?
                </a>
            </div>

            <button type="submit" className="login-submit-btn" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="google-login-container">
                <div className="divider">
                    <span>OR</span>
                </div>
                <div className="google-btn-wrapper">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Login Failed')}
                        theme={theme === 'dark' ? 'filled_black' : 'outline'}
                        width="100%"
                    />
                </div>
            </div>
        </form>
    );
};

export default LoginForm;

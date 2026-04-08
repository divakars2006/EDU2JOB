import React, { useState } from 'react';
import { useAuth } from '../authentication/AuthContext';
import { registerUser, googleLogin } from '../services/ApiService';
import { useGoogleLogin } from '@react-oauth/google';

const RegisterPage = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        const userData = { name: formData.name, email: formData.email };
        login(userData);
        window.history.pushState({}, '', '/dashboard');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-Up
  const signUpWithGoogle = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      setError('');
      try {
        const result = await googleLogin(codeResponse.access_token);
        if (result.success && result.data) {
          login(result.data, result.token);
          window.history.pushState({}, '', '/dashboard');
          window.dispatchEvent(new PopStateEvent('popstate'));
        } else {
          setError(result.message || 'Google Sign-Up failed.');
        }
      } catch (err: any) {
        console.error('Google Sign-Up Error:', err);
        setError('Google Sign-Up failed.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError('Google Sign-Up Failed'),
  });

  const handleLoginClick = () => {
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4 font-sans tracking-wide">
      {/* Top Logo */}
      <h1
        className="text-3xl font-bold text-white mb-8 cursor-pointer hover:text-purple-400 transition-colors"
        onClick={() => {
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
      >
        Job Predicting
      </h1>

      {/* Register Card */}
      <div className="w-full max-w-md pt-8 pb-8 pl-5 pr-12 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-2xl">
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Create <span className="text-purple-600">Account</span>
        </h2>
        <p className="text-sm text-gray-400 text-center mb-8">
          Sign up to get started with Job Predicting
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col w-full gap-5">
          {/* Full Name */}
          <div className="w-full flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-300 text-left" htmlFor="name">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              required
            />
          </div>

          {/* Email */}
          <div className="w-full flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-300 text-left" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              required
            />
          </div>

          {/* Password */}
          <div className="w-full flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-300 text-left" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password (min. 6 characters)"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="w-full flex flex-col gap-1">
            <label
              className="text-sm font-medium text-gray-300 text-left"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2 mb-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors flex justify-center items-center relative left-3.5"
          >
            {isLoading ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center py-6">
          <div className="flex-grow border-t border-white/10" />
          <span className="flex-shrink-0 mx-4 text-xs text-gray-500">or continue with</span>
          <div className="flex-grow border-t border-white/10" />
        </div>

        {/* Google Sign-Up */}
        <div className="flex w-full">
          <button
            type="button"
            onClick={() => signUpWithGoogle()}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-sm text-gray-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign up with Google
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-sm text-gray-400">
        Already have an account?{' '}
        <span
          onClick={handleLoginClick}
          className="text-purple-400 hover:text-purple-300 font-medium cursor-pointer transition-colors"
        >
          Sign in.
        </span>
      </div>
    </div>
  );
};

export default RegisterPage;

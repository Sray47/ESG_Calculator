// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginCompany } from '../services/authService'; // Updated service
import './AuthForm.css';

function LoginPage() {
    const [email, setEmail] = useState(''); // Login with email for Supabase
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // loginCompany in authService now directly calls Supabase signInWithPassword
            const { data, error: supabaseError } = await loginCompany({ email, password });

            if (supabaseError) {
                // If Supabase returns an error object, use its message
                throw supabaseError;
            }

            // On successful Supabase login, data.user and data.session will be populated.
            // The authService's onAuthStateChange and initial header setup will handle token.
            if (data && data.user) { // Check if data and data.user exist
                navigate('/profile');
            } else {
                // This case should ideally be caught by supabaseError,
                // but as a fallback:
                setError('Login failed. Please check your credentials.');
            }
        } catch (err) {
            // err might be from Supabase (if thrown) or a network error
            setError(err.message || 'Failed to login. Please check your credentials.');
            console.error("Login Page Error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Company Login</h2>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="email">Email:</label> {/* Changed from CIN to Email */}
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={loading} className="auth-button">
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                <p className="switch-auth">
                    Don't have an account? <Link to="/register">Sign Up</Link>
                </p>
            </form>
        </div>
    );
}
export default LoginPage;
import React, { useState, useEffect, useContext } from 'react'; // Added useContext
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { fetchCompanyProfile } from '../services/authService';
// import { supabase } from '../services/supabaseClient'; // supabase client might not be directly needed here anymore
import './ProfilePage.css';
import { AuthContext } from '../main'; // Import AuthContext

function ProfilePage() {
    const [companyProfile, setCompanyProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true); // Renamed to avoid clash with loadingAuth
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { session, loadingAuth } = useContext(AuthContext); // Get session and loadingAuth from context

    useEffect(() => {
        // Only proceed if auth loading is complete
        if (!loadingAuth) {
            if (!session) {
                // If no session after auth check, redirect to login
                console.log('[ProfilePage] No session found, redirecting to login.');
                navigate('/login', { state: { from: '/profile' } });
            } else {
                // If session exists, load the company profile
                console.log('[ProfilePage] Session found, loading profile...');
                const loadProfileData = async () => {
                    try {
                        setLoadingProfile(true);
                        const data = await fetchCompanyProfile();
                        setCompanyProfile(data);
                        setError('');
                    } catch (err) {
                        setError(err.message || 'Failed to load company profile.');
                        console.error("ProfilePage data load error:", err);
                        if (err.message.includes('No active or valid session') || err.status === 401) {
                            // If fetchCompanyProfile itself fails due to auth, also redirect
                            navigate('/login', { state: { from: '/profile' } });
                        }
                    } finally {
                        setLoadingProfile(false);
                    }
                };
                loadProfileData();
            }
        }
    }, [session, loadingAuth, navigate]); // Dependencies for the effect

    // Show a generic loading message while auth state is being determined
    if (loadingAuth) {
        return <div className="profile-page-loading">Authenticating...</div>;
    }

    // If after auth check, there's no session, user will be redirected.
    // This state might be briefly visible or not at all if redirect is fast.
    // Or, if we are still here and no session, it means redirection is about to happen.
    if (!session) {
        return <div className="profile-page-loading">Redirecting to login...</div>;
    }

    // Show loading message for profile data fetching
    if (loadingProfile) {
        return <div className="profile-page-loading">Loading profile...</div>;
    }

    if (error) {
        return <div className="profile-page-error">Error: {error}</div>;
    }

    if (!companyProfile) {
        return <div className="profile-page-error">No company profile found.</div>;
    }

    return (
        <div className="profile-page-container">            <header className="profile-header">
                <h2>Welcome, {companyProfile.company_name}!</h2>
                <p>Manage your company's sustainability reporting and disclosures.</p>
            </header>

            <div className="profile-actions-grid">
                <Link to="/profile/edit-disclosures" className="action-card">
                    <div className="action-card-icon">📝</div>
                    <h3>Edit General Disclosures</h3>
                    <p>Update your company's general information.</p>
                </Link>

                <Link to="/reports/new" className="action-card">
                    <div className="action-card-icon">📄</div>
                    <h3>Generate New BRSR Report</h3>
                    <p>Start a new sustainability report for a financial year.</p>
                </Link>

                <Link to="/reports/history" className="action-card">
                    <div className="action-card-icon">📊</div>
                    <h3>View Previous Reports</h3>
                    <p>Access and review your past BRSR reports.</p>
                </Link>
            </div>
        </div>
    );
}

export default ProfilePage;
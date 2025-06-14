import React, { useState, useEffect, useContext } from 'react'; // Added useContext
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { fetchCompanyProfile } from '../services/authService';
// import { supabase } from '../services/supabaseClient'; // supabase client might not be directly needed here anymore
import './ProfilePage.css';
import { AuthContext } from '../main'; // Import AuthContext

const containerStyle = {
  maxWidth: 900,
  margin: '40px auto',
  padding: 32,
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  fontFamily: 'Inter, Arial, sans-serif',
};
const headerStyle = {
  borderBottom: '1px solid #e0e0e0',
  marginBottom: 32,
  paddingBottom: 16,
};
const h2Style = {
  fontSize: '2.2em',
  fontWeight: 700,
  color: '#222',
  marginBottom: 8,
};
const pStyle = {
  fontSize: '1.1em',
  color: '#555',
  marginBottom: 0,
};
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 28,
  marginTop: 24,
};
const cardStyle = {
  background: '#f8f9fa',
  borderRadius: 10,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  padding: 28,
  textAlign: 'center',
  transition: 'box-shadow 0.2s',
  fontSize: '1em',
  color: '#222',
  textDecoration: 'none',
  fontWeight: 500,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};
const cardIconStyle = {
  fontSize: '2.5em',
  marginBottom: 12,
};
const cardTitleStyle = {
  fontSize: '1.15em',
  fontWeight: 600,
  marginBottom: 6,
};
const cardDescStyle = {
  fontSize: '1em',
  color: '#666',
};

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
        <div style={containerStyle}>
            <header style={headerStyle}>
                <h2 style={h2Style}>Welcome, {companyProfile.company_name}!</h2>
                <p style={pStyle}>Manage your company's sustainability reporting and disclosures.</p>
            </header>

            <div className="profile-actions" style={{ display: 'flex', justifyContent: 'center', gap: 32, margin: '40px 0' }}>
                <Link to="/profile/edit-disclosures" style={{ ...cardStyle, display: 'inline-flex', alignItems: 'center', borderRadius: 24, padding: '14px 36px', fontSize: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <div style={cardIconStyle}>📝</div>
                    Edit Profile
                </Link>

                <Link to="/reports/new" style={{ ...cardStyle, display: 'inline-flex', alignItems: 'center', borderRadius: 24, padding: '14px 36px', fontSize: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <div style={cardIconStyle}>📄</div>
                    Generate New BRSR Report
                </Link>

                <Link to="/reports/history" style={{ ...cardStyle, display: 'inline-flex', alignItems: 'center', borderRadius: 24, padding: '14px 36px', fontSize: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <div style={cardIconStyle}>📊</div>
                    View Previous Reports
                </Link>
            </div>
        </div>
    );
}

export default ProfilePage;
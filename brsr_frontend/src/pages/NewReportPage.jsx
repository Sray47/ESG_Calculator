import React, { useContext, useEffect } from 'react'; // Added useContext, useEffect
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import './ProfilePage.css'; // Can re-use some styles or create a new one
import { AuthContext } from '../main'; // Adjusted path for AuthContext

function NewReportPage() {
    const { currentUser, loadingAuth } = useContext(AuthContext); // Get auth state
    const navigate = useNavigate();

    useEffect(() => {
        if (!loadingAuth && !currentUser) {
            navigate('/login', { state: { message: 'You must be logged in to generate a new report.' } });
        }
    }, [currentUser, loadingAuth, navigate]);

    if (loadingAuth) {
        return <div className="profile-page-container">Loading...</div>;
    }

    if (!currentUser) {
        // This will be shown briefly before navigation, or if navigation fails for some reason
        return <div className="profile-page-container">Redirecting to login...</div>;
    }

    return (
        <div className="profile-page-container"> {/* Using existing class for layout */} 
            <header className="profile-header">
                <h2>Generate New BRSR Report</h2>
                <p>This section is under construction.</p>
                <p>Here you will be able to start a new Business Responsibility and Sustainability Report for a selected financial year.</p>
            </header>
            
            <div style={{ marginTop: '20px' }}>
                <Link to="/profile" className="action-card-button">Back to Profile</Link>
            </div>
        </div>
    );
}

export default NewReportPage;

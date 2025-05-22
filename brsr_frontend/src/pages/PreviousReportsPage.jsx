import React, { useContext, useEffect } from 'react'; // Added useContext, useEffect
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import './ProfilePage.css'; // Can re-use some styles or create a new one for consistency
import { AuthContext } from '../main'; // Adjusted path for AuthContext

function PreviousReportsPage() {
    const { currentUser, loadingAuth } = useContext(AuthContext); // Get auth state
    const navigate = useNavigate();

    useEffect(() => {
        if (!loadingAuth && !currentUser) {
            navigate('/login', { state: { message: 'You must be logged in to view previous reports.' } });
        }
    }, [currentUser, loadingAuth, navigate]);

    if (loadingAuth) {
        return <div className="profile-page-container">Loading...</div>;
    }

    if (!currentUser) {
        // This will be shown briefly before navigation, or if navigation fails
        return <div className="profile-page-container">Redirecting to login...</div>;
    }

    return (
        <div className="profile-page-container"> {/* Using existing class for layout */}
            <header className="profile-header">
                <h2>View Previous BRSR Reports</h2>
                <p>This section is under construction.</p>
                <p>Here you will be able to view, search, and download your company's previously generated BRSR reports.</p>
            </header>

            {/* Placeholder for report list - to be implemented later */}
            <div style={{ margin: '20px 0', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', width: '100%', maxWidth: '800px' }}>
                <p style={{ textAlign: 'center', color: '#777' }}><i>Previous reports will be listed here.</i></p>
                {/* Example of how a report item might look (static for now) */}
                {/* 
                <div style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
                    <h4>BRSR Report - FY 2023-2024</h4>
                    <p>Status: Submitted</p>
                    <p>Submitted At: 2024-04-15</p>
                    <button className="action-card-button" style={{backgroundColor: '#6c757d'}}>View Details</button>
                </div> 
                */}
            </div>
            
            <div style={{ marginTop: '20px' }}>
                <Link to="/profile" className="action-card-button">Back to Profile</Link>
            </div>
        </div>
    );
}

export default PreviousReportsPage;

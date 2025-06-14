import React, { useContext, useEffect, useState } from 'react'; // Added useState
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import './ProfilePage.css'; // Can re-use some styles or create a new one for consistency
import { AuthContext } from '../main'; // Adjusted path for AuthContext
import { apiClient } from '../services/authService'; // Importing apiClient for making API calls

function PreviousReportsPage() {
    const { session, loadingAuth } = useContext(AuthContext); // Get auth state
    const navigate = useNavigate();
    const [reports, setReports] = useState([]); // State to store reports
    const [loading, setLoading] = useState(true); // Loading state for reports
    const [error, setError] = useState(''); // Error state for handling API errors

    useEffect(() => {
        if (!loadingAuth && !session) {
            navigate('/login', { state: { message: 'You must be logged in to view previous reports.' } });
        }
    }, [session, loadingAuth, navigate]);

    useEffect(() => {
        if (!loadingAuth && session) {
            setLoading(true);
            apiClient.get('/reports')
                .then(res => {
                    setReports(res.data);
                    setError('');
                })
                .catch(err => {
                    setError(err.response?.data?.message || err.message || 'Failed to fetch reports');
                })
                .finally(() => setLoading(false));
        }
    }, [session, loadingAuth]);

    if (loadingAuth || loading) {
        return <div className="profile-page-container">Loading...</div>;
    }

    if (!session) {
        // This will be shown briefly before navigation, or if navigation fails
        return <div className="profile-page-container">Redirecting to login...</div>;
    }

    return (
        <div className="profile-page-container"> {/* Using existing class for layout */}
            <header className="profile-header">
                <h2>View Previous BRSR Reports</h2>
                {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
                <p>Below are your company's previously generated BRSR reports. Click a row to view details.</p>
            </header>
            <div style={{ margin: '20px 0', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', width: '100%', maxWidth: '800px' }}>
                {reports.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#777' }}><i>No previous reports found.</i></p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa' }}>
                                <th style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Financial Year</th>
                                <th style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Reporting Boundary</th>
                                <th style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Status</th>
                                <th style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Last Updated</th>
                                <th style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(report => (
                                <tr key={report.id} style={{ cursor: 'pointer' }}>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{report.financial_year}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{report.reporting_boundary}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{report.status}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{new Date(report.updated_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                        <button className="action-card-button" style={{ backgroundColor: '#6c757d' }} onClick={() => navigate(`/report-wizard/${report.id}/section-a`, { state: { readOnly: true } })}>
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <div style={{ marginTop: '20px' }}>
                <Link to="/profile" className="action-card-button">Back to Profile</Link>
            </div>
        </div>
    );
}

export default PreviousReportsPage;

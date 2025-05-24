import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../main';
import { initiateBrSrReport } from '../services/authService'; // Assuming this will be created
import './ProfilePage.css'; // Re-use styles for now

function NewReportPage() {
    const { session, loadingAuth } = useContext(AuthContext); // Changed from currentUser to session for consistency
    const navigate = useNavigate();

    const [financialYear, setFinancialYear] = useState('');
    const [reportingBoundary, setReportingBoundary] = useState('Standalone');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!loadingAuth && !session) {
            navigate('/login', { state: { message: 'You must be logged in to generate a new report.' } });
        }
    }, [session, loadingAuth, navigate]);

    const handleStartReport = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!financialYear) {
            setError('Financial Year is required.');
            setIsLoading(false);
            return;
        }
        // Basic validation for financial year format (e.g., YYYY-YYYY)
        if (!/^\d{4}-\d{4}$/.test(financialYear)) {
            setError('Please enter Financial Year in YYYY-YYYY format (e.g., 2023-2024).');
            setIsLoading(false);
            return;
        }

        try {
            const reportData = { financial_year: financialYear, reporting_boundary: reportingBoundary };
            // The company_id will be implicitly handled by the backend using the authenticated user's session
            const newReport = await initiateBrSrReport(reportData);
            if (newReport && newReport.id) {
                navigate(`/report-wizard/${newReport.id}/section-a`); // Navigate to the first step of the wizard
            } else {
                setError('Failed to initiate report. No report ID received.');
            }
        } catch (err) {
            console.error("Error initiating BRSR report:", err);
            setError(err.response?.data?.message || err.message || 'Failed to start new report.');
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingAuth) {
        return <div className="profile-page-container">Loading authentication...</div>;
    }

    if (!session) {
        return <div className="profile-page-container">Redirecting to login...</div>;
    }

    // Generate financial year options for the last 5 years
    const currentYear = new Date().getFullYear();
    const financialYearOptions = Array.from({ length: 5 }, (_, i) => {
        const year = currentYear - i;
        return `${year - 1}-${year}`;
    });
    financialYearOptions.unshift(`${currentYear}-${currentYear + 1}`); // Add next FY

    return (
        <div className="profile-page-container">
            <header className="profile-header">
                <h2>Generate New BRSR Report</h2>
                <p>Select the financial year and reporting type to begin your report.</p>
            </header>

            {error && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

            <form onSubmit={handleStartReport} className="auth-form" style={{ maxWidth: '500px', margin: '20px auto' }}>
                <div className="form-group">
                    <label htmlFor="financialYear">Financial Year (e.g., 2023-2024)</label>
                    <select
                        id="financialYear"
                        value={financialYear}
                        onChange={(e) => setFinancialYear(e.target.value)}
                        required
                    >
                        <option value="">Select Financial Year</option>
                        {financialYearOptions.map(fy => (
                            <option key={fy} value={fy}>{fy}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        id="financialYearCustom"
                        value={financialYear}
                        onChange={(e) => setFinancialYear(e.target.value)}
                        placeholder="Or type YYYY-YYYY"
                        style={{marginTop: "5px"}}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="reportingBoundary">Reporting Boundary</label>
                    <select
                        id="reportingBoundary"
                        value={reportingBoundary}
                        onChange={(e) => setReportingBoundary(e.target.value)}
                        required
                    >
                        <option value="Standalone">Standalone</option>
                        <option value="Consolidated">Consolidated</option>
                    </select>
                </div>

                <button type="submit" className="form-button" disabled={isLoading}>
                    {isLoading ? 'Starting...' : 'Start Report'}
                </button>
            </form>
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link to="/profile" className="action-card-button" style={{ textDecoration: 'none' }}>Back to Profile</Link>
            </div>
        </div>
    );
}

export default NewReportPage;

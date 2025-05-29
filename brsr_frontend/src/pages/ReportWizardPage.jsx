// c:\Users\USER\ESG_Calculator\brsr_frontend\src\pages\ReportWizardPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../main';
import { fetchBrSrReportDetails, updateBrSrReport } from '../services/authService'; // Assuming updateBrSrReport exists
// import './ReportWizardPage.css'; // TODO: Create and import CSS

function ReportWizardPage() {
    const { reportId, section } = useParams(); // Get section from URL param
    const navigate = useNavigate();
    const location = useLocation();
    const { session, loadingAuth } = useContext(AuthContext);

    const [reportData, setReportData] = useState(null);
    const [currentSection, setCurrentSection] = useState(section || 'section-a'); // Initialize with URL section or default
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Update currentSection if the URL param changes
        setCurrentSection(section || 'section-a');
    }, [section]);    useEffect(() => {
        if (loadingAuth) return;

        if (!session) {
            navigate('/login', { state: { message: 'You must be logged in to access the report wizard.' } });
            return;
        }        if (reportId) {
            setIsLoading(true);
            setError('');
            fetchBrSrReportDetails(reportId)
                .then(data => {
                    setReportData(data);
                    // Only redirect to section-a if the current URL doesn't have any section parameter
                    // This prevents automatic redirection when navigating to Section B/C
                    const currentPath = location.pathname;
                    const hasSection = currentPath.includes('/section-') || currentPath.includes('/review-submit');
                    if (!hasSection && data) {
                        navigate(`/report-wizard/${reportId}/section-a`, { replace: true });
                    }
                })
                .catch(err => {
                    console.error("Error fetching report details:", err);
                    setError(err.message || 'Failed to load report data.');
                    if (err.message === 'Report not found.') {
                        navigate('/reports/history', {state: {message: `Report with ID ${reportId} not found.`}});
                    }
                })
                .finally(() => setIsLoading(false));
        }
    }, [reportId, session, loadingAuth, navigate, location]); // Added location to dependency array

    const handleSaveProgress = async (sectionOrPayload, sectionPayloadIfProvided) => {
        if (!reportData || reportData.status === 'submitted') {
            setError("Cannot save a submitted report or no report data loaded.");
            return false;
        }
        setIsLoading(true); // Indicate saving
        try {
            let updateData;
            if (sectionPayloadIfProvided === undefined && typeof sectionOrPayload === 'object' && sectionOrPayload !== null) {
                // This handles the case for Section C where the payload is passed as the first argument
                // e.g., handleSaveProgress({ sc_p1_essential_indicators: data, sc_p1_leadership_indicators: data })
                updateData = sectionOrPayload;
            } else if (typeof sectionOrPayload === 'string' && sectionPayloadIfProvided !== undefined) {
                // This handles the original case for Section A and B
                // e.g., handleSaveProgress('section_a_data', { ... })
                updateData = { [sectionOrPayload]: sectionPayloadIfProvided };
            } else {
                console.error("Invalid arguments passed to handleSaveProgress:", sectionOrPayload, sectionPayloadIfProvided);
                setError("Invalid save operation. Check arguments.");
                setIsLoading(false);
                return false;
            }

            const updatedReport = await updateBrSrReport(reportId, updateData);
            setReportData(updatedReport); // Update local state with the full updated report from backend
            setError(''); // Clear previous errors
            // Consider a more subtle success notification
            // alert('Progress saved!'); 
            setIsLoading(false);
            return true;
        } catch (err) {
            console.error("Error saving report progress:", err);
            setError(err.message || 'Failed to save progress.');
            setIsLoading(false);
            return false;
        }
    };
    
    const getSectionName = (key) => {
        const names = {
            'section-a': 'Section A: General Disclosures',
            'section-b': 'Section B: Management and Process Disclosures',
            'section-c-p1': 'Section C: Principle 1 - Environmental',
            'section-c-p2': 'Section C: Principle 2 - Social (Employees)',
            'section-c-p3': 'Section C: Principle 3 - Social (Community)',
            'section-c-p4': 'Section C: Principle 4 - Social (Consumers)',
            'section-c-p5': 'Section C: Principle 5 - Governance (Ethics)',
            'section-c-p6': 'Section C: Principle 6 - Environmental (Circular Economy)',
            'section-c-p7': 'Section C: Principle 7 - Social (Human Rights)',
            'section-c-p8': 'Section C: Principle 8 - Governance (Anti-Corruption)',
            'section-c-p9': 'Section C: Principle 9 - Governance (Responsible Business Conduct)',
            'review-submit': 'Review & Submit'
        };
        return names[key] || 'Unknown Section';
    }

    if (loadingAuth || (isLoading && !reportData)) { // Show loading if auth is loading OR if report data is loading
        return <div className="wizard-container" style={{ padding: '20px', textAlign: 'center' }}>Loading report data...</div>;
    }

    if (error && !reportData) { // If error and no report data (e.g. report not found)
        return <div className="wizard-container error-message" style={{color: 'red', padding: '20px', textAlign: 'center'}}>{error} <Link to="/profile">Go to Profile</Link></div>;
    }

    if (!reportData) {
        // This case should ideally be handled by the error block or redirect if reportId is invalid
        return <div className="wizard-container" style={{ padding: '20px', textAlign: 'center' }}>No report data found. This might be an invalid report ID. <Link to="/reports/history">View Reports</Link></div>;
    }
    
    const reportSections = [
        { key: 'section-a', label: 'Sec A: General' },
        { key: 'section-b', label: 'Sec B: Mgmt & Process' },
        { key: 'section-c-p1', label: 'P1 Env.' },
        { key: 'section-c-p2', label: 'P2 Social Emp.' },
        { key: 'section-c-p3', label: 'P3 Social Comm.' },
        { key: 'section-c-p4', label: 'P4 Social Cons.' },
        { key: 'section-c-p5', label: 'P5 Gov. Ethics' },
        { key: 'section-c-p6', label: 'P6 Env. Circular' },
        { key: 'section-c-p7', label: 'P7 Social HR' },
        { key: 'section-c-p8', label: 'P8 Gov. Anti-Corr.' },
        { key: 'section-c-p9', label: 'P9 Gov. Resp. Biz.' },
        { key: 'review-submit', label: 'Review & Submit' },
    ];

    return (
        <div className="report-wizard-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h2>BRSR Report Wizard - FY: {reportData.financial_year} ({reportData.reporting_boundary})</h2>
                    <Link to="/reports/history" style={{ textDecoration: 'none' }}>Back to Report List</Link>
                </div>
                <p>Report Status: <strong style={{color: reportData.status === 'submitted' ? 'green' : 'orange'}}>{reportData.status}</strong></p>
                <p>Current Section: <strong>{getSectionName(currentSection)}</strong></p>
                {reportData.status === 'submitted' && <p style={{color: 'green', fontWeight: 'bold'}}>This report has been submitted and is read-only.</p>}
            </header>

            <nav style={{ marginBottom: '20px', display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {reportSections.map(sec => (
                    <Link 
                        key={sec.key} 
                        to={`/report-wizard/${reportId}/${sec.key}`}
                        style={{
                            padding: '8px 12px',
                            textDecoration: 'none',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: currentSection === sec.key ? '#007bff' : '#f8f9fa',
                            color: currentSection === sec.key ? 'white' : '#007bff',
                            fontSize: '0.9em'
                        }}
                    >
                        {sec.label}
                    </Link>
                ))}
            </nav>

            {error && <p className="error-message" style={{ color: 'red', backgroundColor: '#ffe0e0', border: '1px solid red', padding: '10px', borderRadius: '4px' }}>Error: {error}</p>}
            
            <div className="wizard-content" style={{ border: '1px solid #eee', padding: '20px', borderRadius: '5px', backgroundColor: '#fff' }}>
                <Outlet context={{ 
                    reportData, 
                    reportId, 
                    handleSaveProgress, 
                    isSubmitted: reportData.status === 'submitted',
                    isLoadingSave: isLoading && reportData, // Pass a flag for when saving is in progress
                    setError // Allow child to set global error
                }} />
            </div>

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <Link to="/profile" className="action-card-button" style={{ textDecoration: 'none' }}>Back to Profile</Link>
            </div>
        </div>
    );
}

export default ReportWizardPage;


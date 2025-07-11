// c:\Users\USER\ESG_Calculator\brsr_frontend\src\pages\ReportWizardPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../main';
import { fetchBrSrReportDetails, updateBrSrReport } from '../services/authService'; // Assuming updateBrSrReport exists
import { FormStateProvider } from '../context/FormStateContext';
import { NavigationGuard } from '../components/shared';
import NavigationGuardZustand from '../components/shared/NavigationGuardZustand';
import { useFormStore } from '../store/formStore';
import './ReportWizardPage.css';

function ReportWizardPage() {
    const { reportId } = useParams(); // Remove section from params since it's not in the URL structure anymore
    const navigate = useNavigate();
    const location = useLocation();
    const { session, loadingAuth } = useContext(AuthContext);
    const { setReportId, reset } = useFormStore();

    // Extract current section from the pathname
    const getCurrentSection = () => {
        const path = location.pathname;
        const segments = path.split('/');
        const lastSegment = segments[segments.length - 1];
        
        // If the last segment matches one of our section keys, return it
        const sectionKeys = [
            'section-a', 'section-b', 'section-c-p1', 'section-c-p2', 'section-c-p3',
            'section-c-p4', 'section-c-p5', 'section-c-p6', 'section-c-p7', 
            'section-c-p8', 'section-c-p9', 'review-submit'
        ];
        
        if (sectionKeys.includes(lastSegment)) {
            return lastSegment;
        }
        
        return 'section-a'; // Default fallback
    };

    const currentSection = getCurrentSection();

    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');    useEffect(() => {
        if (loadingAuth) return;

        if (!session) {
            navigate('/login', { state: { message: 'You must be logged in to access the report wizard.' } });
            return;
        }
        if (reportId) {
            setIsLoading(true);
            setError('');
            setReportId(reportId); // Set report ID in Zustand store
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
                    }                })
                .finally(() => setIsLoading(false));
        }
        
        // Cleanup function to reset store when leaving the wizard
        return () => {
            if (!reportId) {
                reset();
            }
        };
    }, [reportId, session, loadingAuth, navigate, location, setReportId, reset]); // Added store dependencies

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

    // Determine read-only mode: if report is submitted OR if location.state?.readOnly is true
    const isReadOnly = reportData?.status === 'submitted' || location.state?.readOnly;
    return (
        <NavigationGuardZustand>
            <div className="main-content">
                <div className="header-section">
                    <h1>BRSR Report Wizard - FY: {reportData.financial_year} <span className="subtitle">({reportData.reporting_boundary})</span></h1>
                    <p className="status-text">Report Status: <span className={reportData.status === 'submitted' ? 'status-submitted' : 'status-inprogress'}>{reportData.status}</span></p>
                    <p className="section-text">Current Section: <strong>{getSectionName(currentSection)}</strong></p>
                    {isReadOnly && <p style={{color: '#43a047', fontWeight: 'bold', marginTop: 8}}>This report is in read-only mode.</p>}
                    {/* ESG Scorecard Display */}
                    {reportData.total_esg_score !== undefined && (
                        <div className="esg-scorecard-card">
                            <h3 style={{margin: 0, fontSize: '1.3em', color: '#1a237e', fontWeight: 600}}>ESG Scorecard</h3>
                            <div style={{display: 'flex', gap: 48, alignItems: 'center', marginTop: 12}}>
                                <div>
                                    <div style={{fontWeight: 600, color: '#1976d2'}}>Total ESG Score</div>
                                    <div className="esg-score">{reportData.total_esg_score} / 6900</div>
                                </div>
                                {reportData.previous_year_score !== undefined && reportData.previous_year_score !== null && (
                                    <div>
                                        <div style={{fontWeight: 600, color: '#607d8b'}}>Previous Year</div>
                                        <div style={{fontSize: '1.5em', color: '#90a4ae', fontWeight: 600}}>{reportData.previous_year_score} / 6900</div>
                                        <div style={{fontSize: '1.1em', color: (reportData.total_esg_score - reportData.previous_year_score) >= 0 ? '#43a047' : '#e53935', fontWeight: 600}}>
                                            YoY Δ: {(reportData.total_esg_score - reportData.previous_year_score) >= 0 ? '+' : ''}{reportData.total_esg_score - reportData.previous_year_score}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <nav style={{ marginBottom: '28px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: '18px 0' }}>
                    {reportSections.map(sec => (
                        <Link 
                            key={sec.key} 
                            to={`/report-wizard/${reportId}/${sec.key}`}
                            style={{
                                padding: '12px 22px',
                                textDecoration: 'none',
                                border: 'none',
                                borderRadius: '24px',
                                background: currentSection === sec.key ? 'linear-gradient(90deg,#1976d2 60%,#43a047 100%)' : '#f4f7fb',
                                color: currentSection === sec.key ? 'white' : '#1976d2',
                                fontWeight: currentSection === sec.key ? 700 : 500,
                                fontSize: '1.05em',
                                boxShadow: currentSection === sec.key ? '0 2px 8px rgba(25,118,210,0.10)' : 'none',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                outline: currentSection === sec.key ? '2px solid #1976d2' : 'none',
                            }}
                        >
                            {sec.label}
                        </Link>
                    ))}
                </nav>

                {error && <p className="error-message" style={{ color: '#e53935', backgroundColor: '#fff3e0', border: '1px solid #e53935', padding: '12px', borderRadius: '6px', fontWeight: 500, fontSize: '1.05em' }}>Error: {error}</p>}
                
                <div className="wizard-content" style={{ border: '1px solid #e3e8ee', padding: '32px', borderRadius: '12px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <Outlet context={{ 
                        reportData, 
                        reportId, 
                        handleSaveProgress: isReadOnly ? undefined : handleSaveProgress, 
                        isSubmitted: isReadOnly,
                        isLoadingSave: isLoading && reportData,                    setError                }} />
                </div>            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <Link to="/profile" className="action-card-button" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 600, fontSize: '1.1em', background: '#e3e8ee', padding: '12px 32px', borderRadius: '24px', boxShadow: '0 2px 8px rgba(25,118,210,0.06)' }}>Back to Profile</Link>
                </div>
                </div>
        </NavigationGuardZustand>
    );
}

export default ReportWizardPage;


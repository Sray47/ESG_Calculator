import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { fetchBrSrReportDetails } from '../../services/authService'; // To re-fetch report data after submit

// Helper function to get completion status (simple check)
function getSectionChecklist(reportData) {
    // This checklist is based on the assumption that if the top-level JSONB object for a section/principle
    // exists and is not empty, it's considered "complete" for frontend navigation purposes.
    // A more robust check would involve backend validation of all required fields.
    const checklist = [
        { key: 'section-a', label: 'Section A: General Disclosures', status: !!reportData.section_a_data && Object.keys(reportData.section_a_data).length > 0 },
        { key: 'section-b', label: 'Section B: Management & Process', status: !!reportData.section_b_data && Object.keys(reportData.section_b_data).length > 0 },
        // For Section C, check if the principle data exists within section_c_data
        { key: 'section-c-p1', label: 'Principle 1', status: !!reportData.section_c_data?.principle_1 && Object.keys(reportData.section_c_data.principle_1).length > 0 },
        { key: 'section-c-p2', label: 'Principle 2', status: !!reportData.section_c_data?.principle_2 && Object.keys(reportData.section_c_data.principle_2).length > 0 },
        { key: 'section-c-p3', label: 'Principle 3', status: !!reportData.section_c_data?.principle_3 && Object.keys(reportData.section_c_data.principle_3).length > 0 },
        { key: 'section-c-p4', label: 'Principle 4', status: !!reportData.section_c_data?.principle_4 && Object.keys(reportData.section_c_data.principle_4).length > 0 },
        { key: 'section-c-p5', label: 'Principle 5', status: !!reportData.section_c_data?.principle_5 && Object.keys(reportData.section_c_data.principle_5).length > 0 },
        { key: 'section-c-p6', label: 'Principle 6', status: !!reportData.section_c_data?.principle_6 && Object.keys(reportData.section_c_data.principle_6).length > 0 },
        { key: 'section-c-p7', label: 'Principle 7', status: !!reportData.section_c_data?.principle_7 && Object.keys(reportData.section_c_data.principle_7).length > 0 },
        { key: 'section-c-p8', label: 'Principle 8', status: !!reportData.section_c_data?.principle_8 && Object.keys(reportData.section_c_data.principle_8).length > 0 },
        { key: 'section-c-p9', label: 'Principle 9', status: !!reportData.section_c_data?.principle_9 && Object.keys(reportData.section_c_data.principle_9).length > 0 },
    ];
    return checklist;
}

// A simple utility to render nested objects/arrays for review
// In a real app, this would be a sophisticated component that formats BRSR data beautifully
const ReportSummaryViewer = ({ data }) => {
    if (!data) return <p>No data to display for this section.</p>;

    const renderValue = (value) => {
        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                if (value.length === 0) return '[]';
                return (
                    <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                        {value.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: 5, borderBottom: '1px dashed #eee', paddingBottom: 5 }}>
                                <span style={{ fontWeight: 'bold' }}>Item {idx + 1}:</span>
                                <div style={{ marginLeft: 15 }}><ReportSummaryViewer data={item} /></div>
                            </li>
                        ))}
                    </ul>
                );
            }
            return (
                <ul style={{ listStyle: 'none', paddingLeft: 15, margin: 0 }}>
                    {Object.entries(value).map(([key, val]) => (
                        <li key={key} style={{ marginBottom: 5 }}>
                            <span style={{ fontWeight: 'bold' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</span>{' '}
                            {renderValue(val)}
                        </li>
                    ))}
                </ul>
            );
        }
        return String(value);
    };

    return (
        <div style={{ fontSize: '0.9em' }}>
            {Object.entries(data).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 5 }}>
                    <span style={{ fontWeight: 'bold', color: '#1e5f74' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</span>{' '}
                    {renderValue(value)}
                </div>
            ))}
        </div>
    );
};


function ReviewSubmitPage() {
    // reportData here is the full report object from the parent ReportWizardPage
    const { reportData, reportId, isSubmitted: initialIsSubmitted, setError: setWizardError } = useOutletContext();
    const navigate = useNavigate();
    
    // Internal state to manage submission status and PDF URL
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [currentReportStatus, setCurrentReportStatus] = useState(reportData?.status || 'draft');

    // Derived state for checklist and overall completeness
    const checklist = getSectionChecklist(reportData);
    const allComplete = checklist.every(item => item.status);

    // Update internal status when reportData changes (e.g., after initial fetch or save)
    useEffect(() => {
        if (reportData?.status) {
            setCurrentReportStatus(reportData.status);
            // If the report is already submitted and has a PDF link, set it
            if (reportData.status === 'submitted' && reportData.pdf_generated) {
                setPdfUrl(`http://localhost:3050/api/reports/${reportId}/pdf`);
            }
        }
    }, [reportData, reportId]);


    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError('');
        setSubmitSuccess(false);
        setPdfUrl('');
        setWizardError(''); // Clear global wizard errors

        try {
            // Include credentials to ensure the authMiddleware works
            const res = await fetch(`http://localhost:3050/api/reports/${reportId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Pass the Authorization header explicitly from localStorage if not handled by axios client global config
                    'Authorization': `Bearer ${localStorage.getItem('session') ? JSON.parse(localStorage.getItem('session')).access_token : ''}`
                },
                // Removed `credentials: 'include'` as it sometimes causes issues with custom auth headers
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to submit report. Server responded with error.');
            }

            const responseData = await res.json();
            
            // Update local state to reflect successful submission
            setSubmitSuccess(true);
            setPdfUrl(responseData.pdfUrl || `http://localhost:3050/api/reports/${reportId}/pdf`); // Use responseData.pdfUrl if provided
            setCurrentReportStatus('submitted'); // Manually update status in UI

            // Optionally, re-fetch the report data to fully sync state
            // const updatedReportData = await fetchBrSrReportDetails(reportId);
            // setReportData(updatedReportData); // If you have a setReportData in the parent's outlet context
            
        } catch (err) {
            console.error('Submission error:', err);
            setSubmitError(err.message || 'Failed to submit report. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Determine if the form should be disabled for submission
    const isReportSubmitted = currentReportStatus === 'submitted';

    return (
        <div className="review-submit-page">
            <h2>Review & Submit BRSR Report</h2>
            
            {/* Display overall report status */}
            <p style={{textAlign: 'center', marginBottom: '20px'}}>Report Status: <strong style={{color: isReportSubmitted ? 'green' : 'orange'}}>{currentReportStatus.toUpperCase()}</strong></p>

            <h4>Section Completion Checklist</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {checklist.map(item => (
                    <li key={item.key} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dotted #eee' }}>
                        <span style={{ fontWeight: 500 }}>{item.label}:</span>
                        <span style={{ color: item.status ? 'green' : 'red', marginLeft: 8 }}>
                            {item.status ? 'Complete' : 'Incomplete'}
                        </span>
                        {!isReportSubmitted && (
                            <button className="btn btn-sm btn-light" style={{ marginLeft: 16 }} onClick={() => navigate(`/report-wizard/${reportId}/${item.key}`)}>
                                Edit
                            </button>
                        )}
                        {isReportSubmitted && <span className="text-muted text-sm">Read-Only</span>}
                    </li>
                ))}
            </ul>
            <hr />

            {/* Display all entered data for review */}
            <div className="review-data-summary" style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#f9f9f9', marginBottom: '20px' }}>
                <h4>Full Report Data Overview</h4>
                {reportData ? (
                    <ReportSummaryViewer data={reportData} />
                ) : (
                    <p>No data loaded for review.</p>
                )}
            </div>
            <hr/>

            {isReportSubmitted ? (
                <>
                    <p style={{ color: 'green', fontWeight: 'bold', textAlign: 'center' }}>This report has been submitted.</p>
                    {pdfUrl ? (
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="form-button" style={{ marginTop: 16 }}>
                            Download BRSR PDF
                        </a>
                    ) : (
                        <p style={{textAlign: 'center', marginTop: '10px'}}>PDF generation initiated. Please check the history page or try downloading later.</p>
                    )}
                </>
            ) : (
                <>
                    <button
                        className="form-button"
                        style={{ marginTop: 16 }}
                        onClick={handleSubmit}
                        disabled={!allComplete || submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit & Generate PDF'}
                    </button>
                    {submitError && <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>{submitError}</p>}
                    {submitSuccess && pdfUrl && (
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="form-button" style={{ marginTop: 16 }}>
                            Download BRSR PDF
                        </a>
                    )}
                    {!allComplete && <p style={{ color: 'orange', marginTop: 8, textAlign: 'center' }}>Please complete all sections before submitting.</p>}
                </>
            )}
        </div>
    );
}

export default ReviewSubmitPage;
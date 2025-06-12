import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { fetchBrSrReportDetails, apiClient } from '../../services/authService'; // To re-fetch report data after submit

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3050';

// Robust validation function to check section completion
function getSectionChecklist(reportData) {
    // Section C Principle keys and their flat DB keys
    const principleKeys = [
        { key: 'section-c-p1', label: 'Principle 1: Ethics and Transparency', dbKey: 'sc_p1_ethical_conduct', requiredFields: ['essential_indicators'] },
        { key: 'section-c-p2', label: 'Principle 2: Product Lifecycle Sustainability', dbKey: 'sc_p2_sustainable_safe_goods', requiredFields: ['essential_indicators'] },
        { key: 'section-c-p3', label: 'Principle 3: Employee Well-being', dbKey: 'sc_p3_employee_wellbeing', requiredFields: ['essential_indicators'] },
        { key: 'section-c-p4', label: 'Principle 4: Stakeholder Engagement', dbKey: 'sc_p4_stakeholder_responsiveness', requiredFields: ['essential_indicators'] },
        { key: 'section-c-p5', label: 'Principle 5: Human Rights', dbKey: 'sc_p5_human_rights', requiredFields: ['essential_indicators'] },
        { key: 'section-c-p6', label: 'Principle 6: Environment Protection', dbKey: 'sc_p6_environment_protection', requiredFields: ['essential_indicators'] },
        { key: 'section-c-p7', label: 'Principle 7: Policy Advocacy', dbKey: 'sc_p7_policy_advocacy', requiredFields: ['essential_indicators'] },
        { key: 'section-c-p8', label: 'Principle 8: Inclusive Development', dbKey: 'sc_p8_inclusive_growth', requiredFields: ['essential_indicators'] },
        { key: 'section-c-p9', label: 'Principle 9: Customer Value', dbKey: 'sc_p9_consumer_value', requiredFields: ['essential_indicators'] },
    ];    const checklist = [
        { 
            key: 'section-a', 
            label: 'Section A: General Disclosures', 
            status: validateSectionA(reportData.section_a_data),
            requiredFields: ['sa_business_activities_turnover', 'sa_product_services_turnover', 'sa_employee_details', 'sa_locations_plants_offices']
        },
        { 
            key: 'section-b', 
            label: 'Section B: Management & Process', 
            status: validateSectionB(reportData.section_b_data),
            requiredFields: ['sb_director_statement', 'sb_esg_responsible_individual']
        },
        ...principleKeys.map(pr => ({
            key: pr.key,
            label: pr.label,
            status: validateSectionCPrinciple(reportData[pr.dbKey]),
            requiredFields: pr.requiredFields
        }))
    ];
    return checklist;
}

// Validation functions for each section
function validateSectionA(data) {
    if (!data) return false;
    // Check for key required Section A BRSR fields (not company fields)
    // Company info is separate and always available from the companies table
    // Section A BRSR fields are what need to be validated for completion
    return !!(data.sa_business_activities_turnover && Array.isArray(data.sa_business_activities_turnover) && data.sa_business_activities_turnover.length > 0 &&
              data.sa_product_services_turnover && Array.isArray(data.sa_product_services_turnover) && data.sa_product_services_turnover.length > 0 &&
              data.sa_employee_details && Object.keys(data.sa_employee_details).length > 0 &&
              data.sa_locations_plants_offices && Object.keys(data.sa_locations_plants_offices).length > 0);
}

function validateSectionB(data) {
    if (!data) return false;
    // Section B data is stored as a JSON blob, check if it has meaningful content
    return !!(data && typeof data === 'object' && Object.keys(data).length > 0 &&
              (data.sb_director_statement || data.sb_esg_responsible_individual || data.sb_sustainability_committee ||
               data.sb_principle_policies || data.sb_ngrbc_company_review || data.sb_external_policy_assessment));
}

// Validation for Section C Principle (flat DB key)
function validateSectionCPrinciple(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Check if there are any meaningful fields in the principle data
    // Section C data is stored as JSON objects with various fields
    const hasContent = Object.keys(data).some(key => {
        const value = data[key];
        if (value === null || value === undefined || value === '') return false;
        
        // For objects, check if they have any non-empty values
        if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(subValue => 
                subValue !== null && subValue !== undefined && subValue !== '' && subValue !== false
            );
        }
        
        // For primitive values, check if they're meaningful
        return value !== false && value !== 0;
    });
    
    return hasContent;
}


// Enhanced Report Summary Viewer with better formatting and structure
const ReportSummaryViewer = ({ data }) => {
    if (!data) return <div className="no-data-message">No data to display for this section.</div>;

    const renderFormattedValue = (value, key) => {
        // Handle null, undefined, or empty values
        if (value === null || value === undefined || value === '') {
            return <span className="empty-value">Not provided</span>;
        }

        // Handle boolean values
        if (typeof value === 'boolean') {
            return <span className={`boolean-value ${value ? 'yes' : 'no'}`}>
                {value ? 'Yes' : 'No'}
            </span>;
        }

        // Handle arrays
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <span className="empty-array">No items</span>;
            }
            return (
                <div className="array-container">
                    {value.map((item, idx) => (
                        <div key={idx} className="array-item">
                            <div className="array-item-header">
                                <span className="item-number">Item {idx + 1}</span>
                            </div>
                            <div className="array-item-content">
                                <ReportSummaryViewer data={item} />
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // Handle objects
        if (typeof value === 'object' && value !== null) {
            return (
                <div className="object-container">
                    {Object.entries(value).map(([nestedKey, nestedVal]) => (
                        <div key={nestedKey} className="object-field">
                            <span className="field-label">
                                {formatFieldName(nestedKey)}:
                            </span>
                            <span className="field-value">
                                {renderFormattedValue(nestedVal, nestedKey)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }

        // Handle numbers - format based on field name
        if (typeof value === 'number') {
            if (key && (key.includes('percent') || key.includes('rate'))) {
                return <span className="percentage-value">{value}%</span>;
            }
            if (key && (key.includes('amount') || key.includes('inr') || key.includes('turnover'))) {
                return <span className="currency-value">₹{value.toLocaleString('en-IN')}</span>;
            }
            return <span className="number-value">{value.toLocaleString()}</span>;
        }

        // Handle dates
        if (key && (key.includes('date') || key.includes('_at')) && typeof value === 'string') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return <span className="date-value">{date.toLocaleDateString('en-IN')}</span>;
            }
        }

        // Handle URLs
        if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('www'))) {
            return (
                <a href={value} target="_blank" rel="noopener noreferrer" className="url-value">
                    {value}
                </a>
            );
        }

        // Default string handling
        return <span className="text-value">{String(value)}</span>;
    };

    const formatFieldName = (fieldName) => {
        return fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .replace(/\bFy\b/g, 'FY')
            .replace(/\bInr\b/g, 'INR')
            .replace(/\bPaf\b/g, 'PAF')
            .replace(/\bRr\b/g, 'R&R')
            .replace(/\bCsr\b/g, 'CSR')
            .replace(/\bEsg\b/g, 'ESG');
    };

    const getSectionTitle = (key) => {
        const titleMap = {
            'section_a_data': 'Section A: General Disclosures',
            'section_b_data': 'Section B: Management & Process Disclosures',
            'section_c_data': 'Section C: Principle-wise Performance Disclosure',
            'essential_indicators': 'Essential Indicators',
            'leadership_indicators': 'Leadership Indicators',
            'principle_1': 'Principle 1: Ethics and Transparency',
            'principle_2': 'Principle 2: Product Lifecycle Sustainability',
            'principle_3': 'Principle 3: Employee Well-being',
            'principle_4': 'Principle 4: Stakeholder Engagement',
            'principle_5': 'Principle 5: Human Rights',
            'principle_6': 'Principle 6: Environment Protection',
            'principle_7': 'Principle 7: Policy Advocacy',
            'principle_8': 'Principle 8: Inclusive Development',
            'principle_9': 'Principle 9: Customer Value'
        };
        return titleMap[key] || formatFieldName(key);
    };

    return (
        <div className="report-summary-viewer">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="summary-section">
                    <div className="section-header">
                        <h4 className="section-title">{getSectionTitle(key)}</h4>
                    </div>
                    <div className="section-content">
                        {renderFormattedValue(value, key)}
                    </div>
                </div>
            ))}
            
            <style jsx>{`
                .report-summary-viewer {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                }
                
                .summary-section {
                    margin-bottom: 24px;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .section-header {
                    background: linear-gradient(135deg, #1e5f74 0%, #2d7589 100%);
                    padding: 12px 16px;
                }
                
                .section-title {
                    color: white;
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                }
                
                .section-content {
                    padding: 16px;
                    background: #fff;
                }
                
                .object-field {
                    display: flex;
                    margin-bottom: 8px;
                    align-items: flex-start;
                }
                
                .field-label {
                    font-weight: 600;
                    color: #2d7589;
                    min-width: 200px;
                    margin-right: 12px;
                }
                
                .field-value {
                    flex: 1;
                }
                
                .array-container {
                    border-left: 3px solid #e0e0e0;
                    padding-left: 16px;
                    margin-top: 8px;
                }
                
                .array-item {
                    margin-bottom: 16px;
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border: 1px solid #e9ecef;
                }
                
                .array-item-header {
                    margin-bottom: 8px;
                }
                
                .item-number {
                    background: #2d7589;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                
                .empty-value {
                    color: #6c757d;
                    font-style: italic;
                }
                
                .boolean-value.yes {
                    color: #28a745;
                    font-weight: 600;
                }
                
                .boolean-value.no {
                    color: #dc3545;
                    font-weight: 600;
                }
                
                .percentage-value {
                    color: #6f42c1;
                    font-weight: 600;
                }
                
                .currency-value {
                    color: #28a745;
                    font-weight: 600;
                }
                
                .number-value {
                    color: #007bff;
                    font-weight: 600;
                }
                
                .date-value {
                    color: #fd7e14;
                    font-weight: 600;
                }
                
                .url-value {
                    color: #007bff;
                    text-decoration: none;
                    font-weight: 500;
                }
                
                .url-value:hover {
                    text-decoration: underline;
                }
                
                .text-value {
                    color: #212529;
                }
                
                .empty-array {
                    color: #6c757d;
                    font-style: italic;
                }
                
                .no-data-message {
                    padding: 20px;
                    text-align: center;
                    color: #6c757d;
                    font-style: italic;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                }
            `}</style>
        </div>
    );
};


function ReviewSubmitPage() {
    // reportData here is the full report object from the parent ReportWizardPage
    const { reportData, reportId, isSubmitted: initialIsSubmitted, setError: setWizardError, setReportData } = useOutletContext();
    const navigate = useNavigate();
    
    // Internal state to manage submission status and PDF URL
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [currentReportStatus, setCurrentReportStatus] = useState(reportData?.status || 'draft');
    const [refreshing, setRefreshing] = useState(false);

    // Derived state for checklist and overall completeness
    const checklist = getSectionChecklist(reportData);
    const allComplete = checklist.every(item => item.status);

    // Update internal status when reportData changes (e.g., after initial fetch or save)
    useEffect(() => {
        if (reportData?.status) {
            setCurrentReportStatus(reportData.status);
            // If the report is already submitted and has a PDF link, set it
            if (reportData.status === 'submitted' && reportData.pdf_generated) {
                setPdfUrl(`${API_BASE_URL}/api/reports/${reportId}/pdf`);
            }
        }
    }, [reportData, reportId]);

    // Function to re-fetch report data
    const refreshReportData = async () => {
        if (!reportId) return;
        
        setRefreshing(true);
        try {
            const updatedReportData = await fetchBrSrReportDetails(reportId);
            if (setReportData) {
                setReportData(updatedReportData);
            }
            setCurrentReportStatus(updatedReportData.status || 'draft');
            
            // Update PDF URL if report is submitted
            if (updatedReportData.status === 'submitted' && updatedReportData.pdf_generated) {
                setPdfUrl(`${API_BASE_URL}/api/reports/${reportId}/pdf`);
            }
        } catch (error) {
            console.error('Failed to refresh report data:', error);
            setWizardError('Failed to refresh report data. Please reload the page.');
        } finally {
            setRefreshing(false);
        }
    };
    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError('');
        setSubmitSuccess(false);
        setPdfUrl('');
        setWizardError(''); // Clear global wizard errors

        try {
            // Use the configured apiClient which already has authorization headers set
            const response = await apiClient.post(`/reports/${reportId}/submit`);
            
            const responseData = response.data;
            
            // Update local state to reflect successful submission
            setSubmitSuccess(true);
            setPdfUrl(responseData.pdfUrl || `${API_BASE_URL}/api/reports/${reportId}/pdf`);
            setCurrentReportStatus('submitted');

            // Re-fetch the report data to fully sync state with backend
            await refreshReportData();
            
        } catch (err) {
            console.error('Submission error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to submit report. Please try again.';
            setSubmitError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // Determine if the form should be disabled for submission
    const isReportSubmitted = currentReportStatus === 'submitted';    return (
        <div className="review-submit-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Review & Submit BRSR Report</h2>
                <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={refreshReportData}
                    disabled={refreshing}
                    style={{ fontSize: '0.875rem' }}
                >
                    {refreshing ? 'Refreshing...' : '🔄 Refresh Data'}
                </button>
            </div>
            
            {/* Display overall report status */}
            <p style={{textAlign: 'center', marginBottom: '20px'}}>
                Report Status: <strong style={{color: isReportSubmitted ? 'green' : 'orange'}}>{currentReportStatus.toUpperCase()}</strong>
            </p>

            <h4>Section Completion Checklist</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {checklist.map(item => (
                    <li key={item.key} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #eee', backgroundColor: item.status ? '#f8f9fa' : '#fff3cd' }}>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 500 }}>{item.label}</span>
                            <div style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '2px' }}>
                                Required: {item.requiredFields.join(', ')}
                            </div>
                        </div>
                        <span style={{ color: item.status ? 'green' : 'red', marginLeft: 8, fontWeight: 600 }}>
                            {item.status ? '✓ Complete' : '⚠ Incomplete'}
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
            <hr/>            {isReportSubmitted ? (
                <>
                    <p style={{ color: 'green', fontWeight: 'bold', textAlign: 'center' }}>This report has been submitted.</p>
                    {pdfUrl ? (
                        <button 
                            className="form-button" 
                            style={{ marginTop: 16 }}
                            onClick={async () => {
                                try {
                                    const response = await apiClient.get(`/reports/${reportId}/pdf`, {
                                        responseType: 'blob'
                                    });
                                    
                                    const blob = new Blob([response.data], { type: 'application/pdf' });
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `BRSR_Report_${reportId}.pdf`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                } catch (error) {
                                    console.error('PDF download failed:', error);
                                    setSubmitError('Failed to download PDF. Please try again.');
                                }
                            }}
                        >
                            Download BRSR PDF
                        </button>
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
                    </button>                    {submitError && <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>{submitError}</p>}
                    {submitSuccess && pdfUrl && (
                        <button 
                            className="form-button" 
                            style={{ marginTop: 16 }}
                            onClick={async () => {
                                try {
                                    const response = await apiClient.get(`/reports/${reportId}/pdf`, {
                                        responseType: 'blob'
                                    });
                                    
                                    const blob = new Blob([response.data], { type: 'application/pdf' });
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `BRSR_Report_${reportId}.pdf`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                } catch (error) {
                                    console.error('PDF download failed:', error);
                                    setSubmitError('Failed to download PDF. Please try again.');
                                }
                            }}
                        >
                            Download BRSR PDF
                        </button>
                    )}
                    {!allComplete && (
                        <div style={{ backgroundColor: '#fff3cd', padding: '12px', borderRadius: '8px', marginTop: '12px', border: '1px solid #ffeaa7' }}>
                            <p style={{ color: '#856404', margin: 0, textAlign: 'center', fontWeight: 500 }}>
                                ⚠ Please complete all sections before submitting. Check the items marked as "Incomplete" above.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default ReviewSubmitPage;
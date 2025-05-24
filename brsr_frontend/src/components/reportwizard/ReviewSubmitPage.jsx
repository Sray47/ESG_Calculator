import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';

function getSectionChecklist(reportData) {
    // Returns an array of { key, label, status } for each section
    const checklist = [
        { key: 'section-a', label: 'Section A: General Disclosures', status: !!reportData.section_a_data },
        { key: 'section-b', label: 'Section B: Management & Process', status: !!reportData.section_b_data },
        { key: 'section-c-p1', label: 'Principle 1', status: !!reportData.section_c_data?.principle_1 },
        { key: 'section-c-p2', label: 'Principle 2', status: !!reportData.section_c_data?.principle_2 },
        { key: 'section-c-p3', label: 'Principle 3', status: !!reportData.section_c_data?.principle_3 },
        { key: 'section-c-p4', label: 'Principle 4', status: !!reportData.section_c_data?.principle_4 },
        { key: 'section-c-p5', label: 'Principle 5', status: !!reportData.section_c_data?.principle_5 },
        { key: 'section-c-p6', label: 'Principle 6', status: !!reportData.section_c_data?.principle_6 },
        { key: 'section-c-p7', label: 'Principle 7', status: !!reportData.section_c_data?.principle_7 },
        { key: 'section-c-p8', label: 'Principle 8', status: !!reportData.section_c_data?.principle_8 },
        { key: 'section-c-p9', label: 'Principle 9', status: !!reportData.section_c_data?.principle_9 },
    ];
    return checklist;
}

function ReviewSubmitPage() {
    const { reportData, reportId, isSubmitted } = useOutletContext();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const checklist = getSectionChecklist(reportData);
    const allComplete = checklist.every(item => item.status);

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError('');
        setSubmitSuccess(false);
        setPdfUrl('');
        try {
            const res = await fetch(`http://localhost:3050/api/reports/${reportId}/submit`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!res.ok) throw new Error('Failed to submit report.');
            setSubmitSuccess(true);
            setPdfUrl(`http://localhost:3050/api/reports/${reportId}/pdf`);
        } catch (err) {
            setSubmitError(err.message || 'Failed to submit report.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="review-submit-page">
            <h2>Review & Submit BRSR Report</h2>
            <h4>Section Completion Checklist</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {checklist.map(item => (
                    <li key={item.key} style={{ marginBottom: 8 }}>
                        <span style={{ fontWeight: 500 }}>{item.label}:</span>
                        <span style={{ color: item.status ? 'green' : 'red', marginLeft: 8 }}>
                            {item.status ? 'Complete' : 'Incomplete'}
                        </span>
                        {!isSubmitted && (
                            <button style={{ marginLeft: 16 }} onClick={() => navigate(`/report-wizard/${reportId}/${item.key}`)}>
                                Edit
                            </button>
                        )}
                    </li>
                ))}
            </ul>
            <hr />
            {isSubmitted ? (
                <>
                    <p style={{ color: 'green', fontWeight: 'bold' }}>This report has been submitted.</p>
                    {pdfUrl || reportData.pdf_generated ? (
                        <a href={pdfUrl || `http://localhost:3050/api/reports/${reportId}/pdf`} target="_blank" rel="noopener noreferrer" className="form-button" style={{ marginTop: 16 }}>
                            Download BRSR PDF
                        </a>
                    ) : (
                        <p>PDF will be available soon.</p>
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
                    {submitError && <p style={{ color: 'red' }}>{submitError}</p>}
                    {submitSuccess && pdfUrl && (
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="form-button" style={{ marginTop: 16 }}>
                            Download BRSR PDF
                        </a>
                    )}
                    {!allComplete && <p style={{ color: 'orange', marginTop: 8 }}>Please complete all sections before submitting.</p>}
                </>
            )}
        </div>
    );
}

export default ReviewSubmitPage;

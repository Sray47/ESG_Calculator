import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

// Essential Indicators for Principle 4
const initialP4EssentialIndicators = {
    stakeholder_consultation_mechanisms: '', // EI 1
    stakeholder_complaints_received_count: null, // EI 2
    stakeholder_complaints_resolved_count: null,
    stakeholder_complaints_pending_count: null,
    stakeholder_complaints_remarks: '',
};
// Leadership Indicators for Principle 4
const initialP4LeadershipIndicators = {
    consultation_process_with_board_path: '', // LI 1
    consultation_used_for_esg_topics: null, // LI 2 (boolean: Yes/No)
    consultation_esg_details: '', // Details if yes
    vulnerable_group_engagement_details: '', // LI 3
};

const initialSectionCPrinciple4Data = {
    essential_indicators: initialP4EssentialIndicators,
    leadership_indicators: initialP4LeadershipIndicators,
};

function SectionCPrinciple4Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialSectionCPrinciple4Data);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {
        if (reportData) {
            setFormData({
                essential_indicators: { ...initialP4EssentialIndicators, ...(reportData.sc_p4_essential_indicators || {}) },
                leadership_indicators: { ...initialP4LeadershipIndicators, ...(reportData.sc_p4_leadership_indicators || {}) },
            });
        } else {
            setFormData(initialSectionCPrinciple4Data);
        }
    }, [reportData]);

    const handleNestedChange = (indicatorType, path, value, type, checked) => {
        setFormData(prev => {
            const keys = path.split('.');
            let currentSection = { ...prev[indicatorType] };
            let objRef = currentSection;
            for (let i = 0; i < keys.length - 1; i++) {
                objRef[keys[i]] = { ...(objRef[keys[i]] || {}) };
                objRef = objRef[keys[i]];
            }
            objRef[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
            return { ...prev, [indicatorType]: currentSection };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError('');
        const payload = {
            sc_p4_essential_indicators: formData.essential_indicators,
            sc_p4_leadership_indicators: formData.leadership_indicators,
        };
        const success = await handleSaveProgress(payload);
        if (success) {
            setLocalSuccess('Section C, Principle 4 saved successfully!');
        } else {
            setLocalError('Failed to save Section C, Principle 4.');
        }
    };

    if (!reportData) return <p>Loading Section C, Principle 4 data...</p>;
    const disabled = isSubmitted || isLoadingSave;

    return (
        <form onSubmit={handleSubmit} className="profile-form section-c-form">
            <h3>Section C: Principle-wise Performance</h3>
            <h4>Principle 4: Businesses should respect the interests of and be responsive to all their stakeholders.</h4>
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}

            <h5>Essential Indicators</h5>
            <div className="form-group">
                <label>1. Describe the mechanisms in place to receive and respond to stakeholder consultations and grievances:</label>
                <textarea value={formData.essential_indicators.stakeholder_consultation_mechanisms || ''} onChange={e => handleNestedChange('essential_indicators', 'stakeholder_consultation_mechanisms', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <h5>2. Complaints/grievances received from stakeholders (other than investors/shareholders):</h5>
                <label>Received during the year:</label>
                <input type="number" value={formData.essential_indicators.stakeholder_complaints_received_count ?? ''} onChange={e => handleNestedChange('essential_indicators', 'stakeholder_complaints_received_count', parseInt(e.target.value) || null)} disabled={disabled} />
                <label>Resolved during the year:</label>
                <input type="number" value={formData.essential_indicators.stakeholder_complaints_resolved_count ?? ''} onChange={e => handleNestedChange('essential_indicators', 'stakeholder_complaints_resolved_count', parseInt(e.target.value) || null)} disabled={disabled} />
                <label>Pending resolution at year end:</label>
                <input type="number" value={formData.essential_indicators.stakeholder_complaints_pending_count ?? ''} onChange={e => handleNestedChange('essential_indicators', 'stakeholder_complaints_pending_count', parseInt(e.target.value) || null)} disabled={disabled} />
                <label>Remarks:</label>
                <textarea value={formData.essential_indicators.stakeholder_complaints_remarks || ''} onChange={e => handleNestedChange('essential_indicators', 'stakeholder_complaints_remarks', e.target.value)} disabled={disabled} rows={2} />
            </div>

            <h5>Leadership Indicators</h5>
            <div className="form-group">
                <label>1. Provide the processes for consultation between stakeholders and the Board:</label>
                <textarea value={formData.leadership_indicators.consultation_process_with_board_path || ''} onChange={e => handleNestedChange('leadership_indicators', 'consultation_process_with_board_path', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>2. Was stakeholder consultation used to support identification/management of environmental and social topics?</label>
                <div>
                    <label><input type="radio" name="p4_li_consultation_used_for_esg_topics" value="true" checked={formData.leadership_indicators.consultation_used_for_esg_topics === true} onChange={e => handleNestedChange('leadership_indicators', 'consultation_used_for_esg_topics', true, 'radio')} disabled={disabled} /> Yes</label>
                    <label><input type="radio" name="p4_li_consultation_used_for_esg_topics" value="false" checked={formData.leadership_indicators.consultation_used_for_esg_topics === false} onChange={e => handleNestedChange('leadership_indicators', 'consultation_used_for_esg_topics', false, 'radio')} disabled={disabled} /> No</label>
                </div>
                {formData.leadership_indicators.consultation_used_for_esg_topics === true && (
                    <textarea placeholder="Provide details of how inputs were incorporated." value={formData.leadership_indicators.consultation_esg_details || ''} onChange={e => handleNestedChange('leadership_indicators', 'consultation_esg_details', e.target.value)} disabled={disabled} rows={3} />
                )}
            </div>
            <div className="form-group">
                <label>3. Provide details of engagement with, and actions taken to address concerns of vulnerable/marginalized stakeholder groups:</label>
                <textarea value={formData.leadership_indicators.vulnerable_group_engagement_details || ''} onChange={e => handleNestedChange('leadership_indicators', 'vulnerable_group_engagement_details', e.target.value)} disabled={disabled} rows={3} />
            </div>

            <hr />
            {!isSubmitted && (
                <button type="submit" className="form-button" disabled={isLoadingSave}>
                    {isLoadingSave ? 'Saving...' : 'Save Principle 4'}
                </button>
            )}
            {isSubmitted && <p>This section is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionCPrinciple4Form;

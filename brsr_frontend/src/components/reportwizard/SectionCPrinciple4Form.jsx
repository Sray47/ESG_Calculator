import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

// Essential Indicators for Principle 4
const initialP4EssentialIndicators = {
    // EI 1 from image: "Describe the processes for identifying key stakeholder groups of the entity."
    processes_for_identifying_stakeholder_groups: '', 

    // EI 2 from image: "List stakeholder groups identified as key for your entity and the frequency of engagement with each stakeholder group."
    stakeholder_engagement_data: [], // Array of objects
};
// Leadership Indicators for Principle 4
const initialP4LeadershipIndicators = {
    consultation_process_with_board_path: null, // LI 1
    consultation_used_for_esg_topics: null, // LI 2 (boolean: Yes/No)
    consultation_esg_details: null, // Details if yes
    vulnerable_group_engagement_details: null, // LI 3
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
            const essIndicatorsFromReport = reportData.sc_p4_essential_indicators || {};
            const leadershipIndicatorsFromReport = reportData.sc_p4_leadership_indicators || {};
            setFormData({
                essential_indicators: { 
                    ...initialP4EssentialIndicators, 
                    ...essIndicatorsFromReport,
                    // Ensure stakeholder_engagement_data is always an array
                    stakeholder_engagement_data: Array.isArray(essIndicatorsFromReport.stakeholder_engagement_data) 
                        ? essIndicatorsFromReport.stakeholder_engagement_data 
                        : initialP4EssentialIndicators.stakeholder_engagement_data,
                },
                leadership_indicators: { ...initialP4LeadershipIndicators, ...leadershipIndicatorsFromReport },
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

    // Handlers for stakeholder_engagement_data array
    const handleStakeholderGroupChange = (index, field, value) => {
        setFormData(prev => {
            const updatedEngagementData = prev.essential_indicators.stakeholder_engagement_data.map((item, i) => {
                if (i === index) {
                    return { ...item, [field]: value };
                }
                return item;
            });
            return {
                ...prev,
                essential_indicators: {
                    ...prev.essential_indicators,
                    stakeholder_engagement_data: updatedEngagementData,
                },
            };
        });
    };

    const addStakeholderGroup = () => {
        setFormData(prev => ({
            ...prev,
            essential_indicators: {
                ...prev.essential_indicators,
                stakeholder_engagement_data: [
                    ...(prev.essential_indicators.stakeholder_engagement_data || []),
                    {
                        stakeholder_group_name: '',
                        is_vulnerable_marginalized: null, // null, true, or false
                        channels_of_communication: '',
                        frequency_of_engagement: '',
                        purpose_scope_of_engagement: '',
                    }
                ]
            }
        }));
    };

    const removeStakeholderGroup = (index) => {
        setFormData(prev => {
            const updatedEngagementData = prev.essential_indicators.stakeholder_engagement_data.filter((_, i) => i !== index);
            return {
                ...prev,
                essential_indicators: {
                    ...prev.essential_indicators,
                    stakeholder_engagement_data: updatedEngagementData,
                },
            };
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
                <label>1. Describe the processes for identifying key stakeholder groups of the entity.</label>
                <textarea 
                    value={formData.essential_indicators.processes_for_identifying_stakeholder_groups || ''} 
                    onChange={e => handleNestedChange('essential_indicators', 'processes_for_identifying_stakeholder_groups', e.target.value)} 
                    disabled={disabled} 
                    rows={3} 
                />
            </div>

            <div className="form-group">
                <label>2. List stakeholder groups identified as key for your entity and the frequency of engagement with each stakeholder group.</label>
                {formData.essential_indicators.stakeholder_engagement_data && formData.essential_indicators.stakeholder_engagement_data.map((group, index) => (
                    <div key={index} className="stakeholder-group-entry" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
                        <h5>Stakeholder Group {index + 1}</h5>
                        <label>Stakeholder Group Name:</label>
                        <input 
                            type="text" 
                            value={group.stakeholder_group_name || ''} 
                            onChange={e => handleStakeholderGroupChange(index, 'stakeholder_group_name', e.target.value)} 
                            disabled={disabled} 
                        />
                        
                        <label>Whether identified as Vulnerable & Marginalized Group (Yes/No):</label>
                        <div>
                            <label><input type="radio" name={`is_vulnerable_marginalized_${index}`} value="true" checked={group.is_vulnerable_marginalized === true} onChange={e => handleStakeholderGroupChange(index, 'is_vulnerable_marginalized', true)} disabled={disabled} /> Yes</label>
                            <label><input type="radio" name={`is_vulnerable_marginalized_${index}`} value="false" checked={group.is_vulnerable_marginalized === false} onChange={e => handleStakeholderGroupChange(index, 'is_vulnerable_marginalized', false)} disabled={disabled} /> No</label>
                            <label><input type="radio" name={`is_vulnerable_marginalized_${index}`} value="null" checked={group.is_vulnerable_marginalized === null} onChange={e => handleStakeholderGroupChange(index, 'is_vulnerable_marginalized', null)} disabled={disabled} /> Not Specified</label>
                        </div>

                        <label>Channels of communication (Email, SMS, Newspaper, Pamphlets, Advertisement, Community Meetings, Notice Board, Website), Other:</label>
                        <textarea 
                            value={group.channels_of_communication || ''} 
                            onChange={e => handleStakeholderGroupChange(index, 'channels_of_communication', e.target.value)} 
                            disabled={disabled} 
                            rows={2}
                        />

                        <label>Frequency of engagement (Annually/ Half yearly/ Quarterly / others - please specify):</label>
                        <input 
                            type="text" 
                            value={group.frequency_of_engagement || ''} 
                            onChange={e => handleStakeholderGroupChange(index, 'frequency_of_engagement', e.target.value)} 
                            disabled={disabled} 
                        />

                        <label>Purpose and scope of engagement including key topics and concerns raised during such engagement:</label>
                        <textarea 
                            value={group.purpose_scope_of_engagement || ''} 
                            onChange={e => handleStakeholderGroupChange(index, 'purpose_scope_of_engagement', e.target.value)} 
                            disabled={disabled} 
                            rows={3}
                        />
                        <button type="button" onClick={() => removeStakeholderGroup(index)} disabled={disabled} style={{marginTop: '5px'}}>Remove Group</button>
                    </div>
                ))}
                <button type="button" onClick={addStakeholderGroup} disabled={disabled} style={{marginTop: '10px'}}>Add Stakeholder Group</button>
            </div>
              <h5>Leadership Indicators</h5>
            <p className="leadership-indicators-note">
                <em>Leadership indicators are optional and help demonstrate advanced ESG practices beyond basic compliance.</em>
            </p>
            <div className="form-group">
                <label>1. Provide the processes for consultation between stakeholders and the Board:</label>
                <textarea 
                    value={formData.leadership_indicators.consultation_process_with_board_path || ''} 
                    onChange={e => handleNestedChange('leadership_indicators', 'consultation_process_with_board_path', e.target.value || null)} 
                    disabled={disabled} 
                    rows={3} 
                    placeholder="Optional: Describe consultation processes between stakeholders and the Board"
                />
            </div>
            <div className="form-group">
                <label>2. Was stakeholder consultation used to support identification/management of environmental and social topics?</label>
                <div>
                    <label><input type="radio" name="p4_li_consultation_used_for_esg_topics" value="true" checked={formData.leadership_indicators.consultation_used_for_esg_topics === true} onChange={e => handleNestedChange('leadership_indicators', 'consultation_used_for_esg_topics', true, 'radio')} disabled={disabled} /> Yes</label>
                    <label><input type="radio" name="p4_li_consultation_used_for_esg_topics" value="false" checked={formData.leadership_indicators.consultation_used_for_esg_topics === false} onChange={e => handleNestedChange('leadership_indicators', 'consultation_used_for_esg_topics', false, 'radio')} disabled={disabled} /> No</label>
                    <label><input type="radio" name="p4_li_consultation_used_for_esg_topics" value="null" checked={formData.leadership_indicators.consultation_used_for_esg_topics === null} onChange={e => handleNestedChange('leadership_indicators', 'consultation_used_for_esg_topics', null, 'radio')} disabled={disabled} /> Not Answered</label>
                </div>
                {formData.leadership_indicators.consultation_used_for_esg_topics === true && (
                    <textarea 
                        placeholder="Optional: Provide details of how inputs were incorporated." 
                        value={formData.leadership_indicators.consultation_esg_details || ''} 
                        onChange={e => handleNestedChange('leadership_indicators', 'consultation_esg_details', e.target.value || null)} 
                        disabled={disabled} 
                        rows={3} 
                    />
                )}
            </div>
            <div className="form-group">
                <label>3. Provide details of engagement with, and actions taken to address concerns of vulnerable/marginalized stakeholder groups:</label>
                <textarea 
                    value={formData.leadership_indicators.vulnerable_group_engagement_details || ''} 
                    onChange={e => handleNestedChange('leadership_indicators', 'vulnerable_group_engagement_details', e.target.value || null)} 
                    disabled={disabled} 
                    rows={3} 
                    placeholder="Optional: Describe engagement with vulnerable/marginalized stakeholder groups"
                />
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

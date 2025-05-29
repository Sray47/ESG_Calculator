import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

// Essential Indicators for Principle 7
const initialP7EssentialIndicators = {
    // Details of affiliations with trade and industry chambers/associations
    trade_associations_affiliations: [
        // { name: '', reach: '' } // reach: National, Regional, Global
    ],
    // Details of public policy positions advocated and participation in policy making
    public_policy_advocacy_details: [
        // { subject: '', method: '', alignment_with_ndc: '' } // method: Direct, Indirect; alignment: Yes/No/Partially/NA
    ],
    // Details of anti-competitive conduct proceedings
    anti_competitive_conduct_proceedings_details: '',
};
// Leadership Indicators for Principle 7
const initialP7LeadershipIndicators = {
    // Details of public policy positions advocated that are not covered in essential indicators
    additional_public_policy_advocacy_details: '',
    // How the entity ensures its policy advocacy is consistent with its sustainability goals
    advocacy_consistency_with_sustainability_goals: '',
    // Frequency of review of policy advocacy positions by the Board
    board_review_frequency_policy_advocacy: '',
};

const initialSectionCPrinciple7Data = {
    essential_indicators: initialP7EssentialIndicators,
    leadership_indicators: initialP7LeadershipIndicators,
};

function SectionCPrinciple7Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialSectionCPrinciple7Data);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {
        if (reportData) {
            const essentialData = { ...initialP7EssentialIndicators, ...(reportData.sc_p7_policy_advocacy?.essential_indicators || {}) };
            const leadershipData = { ...initialP7LeadershipIndicators, ...(reportData.sc_p7_policy_advocacy?.leadership_indicators || {}) };
            
            // Migration from old structure if necessary
            if (reportData.sc_p7_essential_indicators) { // Check if old flat structure exists
                const oldEI = reportData.sc_p7_essential_indicators;
                if (oldEI.memberships_associations && !essentialData.trade_associations_affiliations?.length) {
                    essentialData.trade_associations_affiliations = [{ name: oldEI.memberships_associations, reach: '' }];
                }
                if (oldEI.policy_advocacy_involvement && !essentialData.public_policy_advocacy_details?.length) {
                    essentialData.public_policy_advocacy_details = [{ subject: oldEI.policy_advocacy_involvement, method: '', alignment_with_ndc: '' }];
                }
                // Clean up old top-level fields from the essentialData if they are not part of the new structure
                delete essentialData.policy_advocacy_involvement;
                delete essentialData.memberships_associations;
                delete essentialData.policy_advocacy_issues;
                delete essentialData.policy_advocacy_contributions;
            }
            if (reportData.sc_p7_leadership_indicators) { // Check if old flat structure exists
                 const oldLI = reportData.sc_p7_leadership_indicators;
                 if (oldLI.policy_advocacy_beyond_compliance && !leadershipData.additional_public_policy_advocacy_details) {
                    leadershipData.additional_public_policy_advocacy_details = oldLI.policy_advocacy_beyond_compliance;
                 }
                 // Clean up old top-level fields
                 delete leadershipData.policy_advocacy_beyond_compliance;
                 delete leadershipData.policy_advocacy_impact;
                 delete leadershipData.stakeholder_engagement_policy_advocacy;
            }

            setFormData({
                essential_indicators: essentialData,
                leadership_indicators: leadershipData,
            });
        } else {
            setFormData(initialSectionCPrinciple7Data);
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

    const handleArrayChange = (indicatorType, arrayName, index, field, value) => {
        setFormData(prev => {
            const newArray = [...(prev[indicatorType][arrayName] || [])];
            newArray[index] = { ...newArray[index], [field]: value };
            return {
                ...prev,
                [indicatorType]: {
                    ...prev[indicatorType],
                    [arrayName]: newArray,
                },
            };
        });
    };

    const addArrayItem = (indicatorType, arrayName, itemTemplate) => {
        setFormData(prev => ({
            ...prev,
            [indicatorType]: {
                ...prev[indicatorType],
                [arrayName]: [...(prev[indicatorType][arrayName] || []), { ...itemTemplate }],
            },
        }));
    };

    const removeArrayItem = (indicatorType, arrayName, index) => {
        setFormData(prev => ({
            ...prev,
            [indicatorType]: {
                ...prev[indicatorType],
                [arrayName]: prev[indicatorType][arrayName].filter((_, i) => i !== index),
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError('');
        const payload = {
            sc_p7_policy_advocacy: { // Ensure payload structure matches backend expectation
                essential_indicators: formData.essential_indicators,
                leadership_indicators: formData.leadership_indicators,
            }
        };
        const success = await handleSaveProgress(payload);
        if (success) {
            setLocalSuccess('Section C, Principle 7 saved successfully!');
        } else {
            setLocalError('Failed to save Section C, Principle 7.');
        }
    };

    if (!reportData) return <p>Loading Section C, Principle 7 data...</p>;
    const disabled = isSubmitted || isLoadingSave;

    return (
        <form onSubmit={handleSubmit} className="profile-form section-c-form">
            <h3>Section C: Principle-wise Performance</h3>
            <h4>Principle 7: Businesses, when engaging in influencing public and regulatory policy, should do so in a manner that is responsible and transparent.</h4>
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}

            <h5>Essential Indicators</h5>
            <div className="form-group">
                <label>1. Details of affiliations with trade and industry chambers/associations. Add rows as needed.</label>
                {(formData.essential_indicators.trade_associations_affiliations || []).map((item, index) => (
                    <div key={index} className="array-item">
                        <input type="text" placeholder="Name of Association" value={item.name || ''} onChange={e => handleArrayChange('essential_indicators', 'trade_associations_affiliations', index, 'name', e.target.value)} disabled={disabled} />
                        <select value={item.reach || ''} onChange={e => handleArrayChange('essential_indicators', 'trade_associations_affiliations', index, 'reach', e.target.value)} disabled={disabled}>
                            <option value="">Select Reach</option>
                            <option value="National">National</option>
                            <option value="Regional">Regional</option>
                            <option value="Global">Global</option>
                        </select>
                        {!disabled && <button type="button" onClick={() => removeArrayItem('essential_indicators', 'trade_associations_affiliations', index)} className="remove-button">Remove</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('essential_indicators', 'trade_associations_affiliations', { name: '', reach: '' })} className="add-button">Add Affiliation</button>}
            </div>

            <div className="form-group">
                <label>2. Details of public policy positions advocated and participation in policy making. Add rows as needed.</label>
                {(formData.essential_indicators.public_policy_advocacy_details || []).map((item, index) => (
                    <div key={index} className="array-item">
                        <textarea placeholder="Subject/Issue of Policy Advocacy" value={item.subject || ''} onChange={e => handleArrayChange('essential_indicators', 'public_policy_advocacy_details', index, 'subject', e.target.value)} disabled={disabled} rows={2}/>
                        <select value={item.method || ''} onChange={e => handleArrayChange('essential_indicators', 'public_policy_advocacy_details', index, 'method', e.target.value)} disabled={disabled}>
                            <option value="">Select Method</option>
                            <option value="Direct">Direct Engagement</option>
                            <option value="Indirect">Indirect (via Trade Org.)</option>
                        </select>
                        <select value={item.alignment_with_ndc || ''} onChange={e => handleArrayChange('essential_indicators', 'public_policy_advocacy_details', index, 'alignment_with_ndc', e.target.value)} disabled={disabled}>
                            <option value="">Alignment with NDCs/Sustainability Goals</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="Partially">Partially</option>
                            <option value="NA">Not Applicable</option>
                        </select>
                        {!disabled && <button type="button" onClick={() => removeArrayItem('essential_indicators', 'public_policy_advocacy_details', index)} className="remove-button">Remove</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('essential_indicators', 'public_policy_advocacy_details', { subject: '', method: '', alignment_with_ndc: '' })} className="add-button">Add Policy Advocacy Detail</button>}
            </div>

            <div className="form-group">
                <label>3. Details of any anti-competitive conduct proceedings against the entity by any competition authority (National/International) and corrective action taken, if any.</label>
                <textarea value={formData.essential_indicators.anti_competitive_conduct_proceedings_details || ''} onChange={e => handleNestedChange('essential_indicators', 'anti_competitive_conduct_proceedings_details', e.target.value)} disabled={disabled} rows={3} />
            </div>

            <h5>Leadership Indicators</h5>
            <div className="form-group">
                <label>1. Details of public policy positions advocated by the entity that are not covered in essential indicators (e.g., on emerging issues, international agreements).</label>
                <textarea value={formData.leadership_indicators.additional_public_policy_advocacy_details || ''} onChange={e => handleNestedChange('leadership_indicators', 'additional_public_policy_advocacy_details', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>2. How does the entity ensure that its policy advocacy is consistent with its overall sustainability goals and principles?</label>
                <textarea value={formData.leadership_indicators.advocacy_consistency_with_sustainability_goals || ''} onChange={e => handleNestedChange('leadership_indicators', 'advocacy_consistency_with_sustainability_goals', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>3. Frequency of review of policy advocacy positions by the Board of Directors (or equivalent).</label>
                <input type="text" placeholder="e.g., Annually, Quarterly" value={formData.leadership_indicators.board_review_frequency_policy_advocacy || ''} onChange={e => handleNestedChange('leadership_indicators', 'board_review_frequency_policy_advocacy', e.target.value)} disabled={disabled} />
            </div>

            <hr />
            {!isSubmitted && (
                <button type="submit" className="form-button" disabled={isLoadingSave}>
                    {isLoadingSave ? 'Saving...' : 'Save Principle 7'}
                </button>
            )}
            {isSubmitted && <p>This section is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionCPrinciple7Form;

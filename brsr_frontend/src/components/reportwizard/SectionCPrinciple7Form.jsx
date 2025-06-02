import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { deepMerge } from '../../utils/objectUtils';
import './SectionCPrinciple7Form.css';

// Essential Indicators for Principle 7
const initialP7EssentialIndicators = {
    number_of_affiliations: null, // Changed to number type for consistency
    trade_and_industry_chambers_associations: [ // EI 1.b as per image (table for top 10)
        // { name: '', reach: '' } // Removed serial_no as it's auto-generated during display
    ],
    anti_competitive_conduct_corrective_actions: [ // EI 2 as per image (table)
        // { name_of_authority: '', brief_of_case: '', corrective_action_taken: '' }
    ],
};

// Leadership Indicators for Principle 7
const initialP7LeadershipIndicators = {
    public_policy_positions_advocated: [ // LI 1 as per image (table)
        // { policy_advocated: null, method_of_advocacy: null, info_in_public_domain: 'No', board_review_frequency: null, web_link: null } // Removed serial_no
    ],
};

const initialSectionCPrinciple7Data = {
    essential_indicators: initialP7EssentialIndicators,
    leadership_indicators: initialP7LeadershipIndicators,
};

function SectionCPrinciple7Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialSectionCPrinciple7Data);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');    useEffect(() => {
        if (reportData && (reportData.sc_p7_policy_advocacy || reportData.sc_p7_essential_indicators || reportData.sc_p7_leadership_indicators)) {
            try {
                // Start with fresh initial state
                let essentialData = { ...initialP7EssentialIndicators };
                let leadershipData = { ...initialP7LeadershipIndicators };

                // Merge new structure data if it exists
                if (reportData.sc_p7_policy_advocacy) {
                    essentialData = deepMerge(essentialData, reportData.sc_p7_policy_advocacy.essential_indicators || {});
                    leadershipData = deepMerge(leadershipData, reportData.sc_p7_policy_advocacy.leadership_indicators || {});
                }

                // Migration from old flat structure if necessary
                if (reportData.sc_p7_essential_indicators) {
                    const oldEI = reportData.sc_p7_essential_indicators;
                    
                    // Migrate number_of_affiliations
                    if (oldEI.number_of_affiliations !== undefined && essentialData.number_of_affiliations === null) {
                        essentialData.number_of_affiliations = parseFloat(oldEI.number_of_affiliations) || null;
                    }
                    
                    // Migrate memberships_associations to trade_and_industry_chambers_associations
                    if (oldEI.memberships_associations && (!essentialData.trade_and_industry_chambers_associations || essentialData.trade_and_industry_chambers_associations.length === 0)) {
                        essentialData.trade_and_industry_chambers_associations = [{ 
                            name: oldEI.memberships_associations, 
                            reach: '' 
                        }];
                    }
                    
                    // Migrate policy_advocacy_involvement to leadership indicators
                    if (oldEI.policy_advocacy_involvement && (!leadershipData.public_policy_positions_advocated || leadershipData.public_policy_positions_advocated.length === 0)) {
                        leadershipData.public_policy_positions_advocated = [{ 
                            policy_advocated: oldEI.policy_advocacy_involvement, 
                            method_of_advocacy: '', 
                            info_in_public_domain: 'No', 
                            board_review_frequency: '', 
                            web_link: '' 
                        }];
                    }
                }
                
                // Migration from old leadership indicators if necessary
                if (reportData.sc_p7_leadership_indicators) {
                    const oldLI = reportData.sc_p7_leadership_indicators;
                    
                    // Migrate policy_advocacy_beyond_compliance to public_policy_positions_advocated
                    if (oldLI.policy_advocacy_beyond_compliance && (!leadershipData.public_policy_positions_advocated || leadershipData.public_policy_positions_advocated.length === 0)) {
                        leadershipData.public_policy_positions_advocated = [{ 
                            policy_advocated: oldLI.policy_advocacy_beyond_compliance, 
                            method_of_advocacy: '', 
                            info_in_public_domain: 'No', 
                            board_review_frequency: '', 
                            web_link: '' 
                        }];
                    }
                }

                setFormData({
                    essential_indicators: essentialData,
                    leadership_indicators: leadershipData,
                });
            } catch (error) {
                console.error('Error merging P7 report data:', error);
                setFormData(initialSectionCPrinciple7Data);
            }
        } else if (reportData) {
            // reportData exists but doesn't have P7 data, use initial state
            setFormData(initialSectionCPrinciple7Data);
        }
        // If reportData is null/undefined, wait for it to load
    }, [reportData]);    // Validation function for form data
    const validateFormData = (data) => {
        const errors = [];
        const warnings = [];

        // Validate Essential Indicators
        const ei = data.essential_indicators;

        // Validate number_of_affiliations is a non-negative number if provided
        if (ei.number_of_affiliations !== null && ei.number_of_affiliations !== undefined && ei.number_of_affiliations !== '') {
            if (isNaN(ei.number_of_affiliations) || ei.number_of_affiliations < 0) {
                errors.push('Number of affiliations must be a non-negative number');
            }
        }

        // Validate trade and industry chambers associations
        if (ei.trade_and_industry_chambers_associations && ei.trade_and_industry_chambers_associations.length > 0) {
            ei.trade_and_industry_chambers_associations.forEach((item, index) => {
                if (!item.name || item.name.trim() === '') {
                    warnings.push(`Association #${index + 1}: Name is required`);
                }
                if (!item.reach || item.reach === '') {
                    warnings.push(`Association #${index + 1}: Reach (State/National) should be specified`);
                }
            });
        }

        // Validate anti-competitive conduct actions
        if (ei.anti_competitive_conduct_corrective_actions && ei.anti_competitive_conduct_corrective_actions.length > 0) {
            ei.anti_competitive_conduct_corrective_actions.forEach((item, index) => {
                if (!item.name_of_authority || item.name_of_authority.trim() === '') {
                    warnings.push(`Anti-competitive Action #${index + 1}: Name of Authority is required`);
                }
                if (!item.brief_of_case || item.brief_of_case.trim() === '') {
                    warnings.push(`Anti-competitive Action #${index + 1}: Brief of Case is required`);
                }
            });
        }

        // Validate Leadership Indicators
        const li = data.leadership_indicators;

        // Validate public policy positions
        if (li.public_policy_positions_advocated && li.public_policy_positions_advocated.length > 0) {
            li.public_policy_positions_advocated.forEach((item, index) => {
                if (!item.policy_advocated || item.policy_advocated.trim() === '') {
                    warnings.push(`Policy Position #${index + 1}: Policy Advocated is required`);
                }
                if (!item.method_of_advocacy || item.method_of_advocacy === '') {
                    warnings.push(`Policy Position #${index + 1}: Method of Advocacy should be specified`);
                }
            });
        }

        return { errors, warnings };
    };

    const handleNestedChange = (indicatorType, path, value, type, checked) => {
        setFormData(prev => {
            try {
                const keys = path.split('.');
                let currentSection = { ...prev[indicatorType] };
                let objRef = currentSection;
                
                // Navigate to the nested object, creating intermediate objects as needed
                for (let i = 0; i < keys.length - 1; i++) {
                    const key = keys[i];
                    if (!objRef[key] || typeof objRef[key] !== 'object') {
                        objRef[key] = {};
                    }
                    objRef[key] = { ...objRef[key] };
                    objRef = objRef[key];
                }

                let processedValue = value;
                if (type === 'checkbox') {
                    processedValue = checked;
                } else if (type === 'radio') {
                    processedValue = value === 'true' ? true : (value === 'false' ? false : null);
                } else if (type === 'number') {
                    if (value === '' || value === null || value === undefined) {
                        processedValue = null;
                    } else {
                        processedValue = parseFloat(value);
                        if (isNaN(processedValue)) {
                            console.warn(`Invalid number value for ${path}: ${value}`);
                            processedValue = null;
                        }
                    }
                }

                objRef[keys[keys.length - 1]] = processedValue;
                return { ...prev, [indicatorType]: currentSection };
            } catch (error) {
                console.error('Error updating nested value:', error, { indicatorType, path, value, type });
                return prev; // Return unchanged state on error
            }
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
    };    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError('');

        // Validate form data
        const validation = validateFormData(formData);
        
        // If there are errors, prevent submission
        if (validation.errors.length > 0) {
            setLocalError(`Please fix the following errors before submitting:\n${validation.errors.join('\n')}`);
            return;
        }

        // If there are warnings, ask for confirmation
        if (validation.warnings.length > 0) {
            const warningMessage = `The following warnings were found:\n${validation.warnings.join('\n')}\n\nDo you want to continue saving?`;
            if (!window.confirm(warningMessage)) {
                return;
            }
        }

        const payload = {
            sc_p7_policy_advocacy: { // Ensure payload structure matches backend expectation
                essential_indicators: formData.essential_indicators,
                leadership_indicators: formData.leadership_indicators,
            }
        };
        
        try {
            const success = await handleSaveProgress(payload);
            if (success) {
                setLocalSuccess('Section C, Principle 7 saved successfully!');
                if (validation.warnings.length > 0) {
                    setLocalSuccess('Section C, Principle 7 saved successfully! (with warnings acknowledged)');
                }
            } else {
                setLocalError('Failed to save Section C, Principle 7.');
            }
        } catch (error) {
            console.error('Error saving P7 form:', error);
            setLocalError('An error occurred while saving. Please try again.');
        }
    };

    if (!reportData) return <p>Loading Section C, Principle 7 data...</p>;
    const disabled = isSubmitted || isLoadingSave;

    return (
        <form onSubmit={handleSubmit} className="profile-form section-c-form">
            <h3>Section C: Principle-wise Performance</h3>
            <h4>Principle 7: Businesses, when engaging in influencing public and regulatory policy, should do so in a manner that is responsible and transparent.</h4>
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}            <h5>Essential Indicators</h5>
            <div className="form-group">
                <label htmlFor="p7_number_of_affiliations">1. Number of affiliations with trade and industry chambers/associations:</label>
                <input 
                    type="number" 
                    id="p7_number_of_affiliations"
                    value={formData.essential_indicators.number_of_affiliations ?? ''} 
                    onChange={e => handleNestedChange('essential_indicators', 'number_of_affiliations', e.target.value, 'number')} 
                    disabled={disabled}
                    min="0"
                    aria-label="Number of affiliations"
                />
            </div>
            
            <div className="form-group">
                <label>2. Details of affiliations with trade and industry chambers/associations:</label>
                <div className="array-container">
                    {(formData.essential_indicators.trade_and_industry_chambers_associations || []).length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Name of Association</th>
                                    <th>Reach</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(formData.essential_indicators.trade_and_industry_chambers_associations || []).map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <input 
                                                type="text" 
                                                placeholder="Name of Association" 
                                                value={item.name || ''} 
                                                onChange={e => handleArrayChange('essential_indicators', 'trade_and_industry_chambers_associations', index, 'name', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`Association ${index + 1} name`}
                                            />
                                        </td>
                                        <td>
                                            <select 
                                                value={item.reach || ''} 
                                                onChange={e => handleArrayChange('essential_indicators', 'trade_and_industry_chambers_associations', index, 'reach', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`Association ${index + 1} reach`}
                                            >
                                                <option value="">Select Reach</option>
                                                <option value="State">State</option>
                                                <option value="National">National</option>
                                            </select>
                                        </td>
                                        <td>
                                            {!disabled && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeArrayItem('essential_indicators', 'trade_and_industry_chambers_associations', index)} 
                                                    className="remove-button"
                                                    aria-label={`Remove association ${index + 1}`}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No affiliations added yet.</p>
                    )}
                    {!disabled && (
                        <button 
                            type="button" 
                            onClick={() => addArrayItem('essential_indicators', 'trade_and_industry_chambers_associations', { name: '', reach: '' })} 
                            className="add-button"
                        >
                            Add Affiliation
                        </button>
                    )}
                </div>
            </div>            <div className="form-group">
                <label>3. Details of any anti-competitive conduct proceedings against the entity by any competition authority (National/International) and corrective action taken, if any:</label>
                <div className="array-container">
                    {(formData.essential_indicators.anti_competitive_conduct_corrective_actions || []).length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Name of Authority</th>
                                    <th>Brief of Case</th>
                                    <th>Corrective Action Taken</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(formData.essential_indicators.anti_competitive_conduct_corrective_actions || []).map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <input 
                                                type="text" 
                                                placeholder="Name of Authority" 
                                                value={item.name_of_authority || ''} 
                                                onChange={e => handleArrayChange('essential_indicators', 'anti_competitive_conduct_corrective_actions', index, 'name_of_authority', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`Authority ${index + 1} name`}
                                            />
                                        </td>
                                        <td>
                                            <textarea 
                                                placeholder="Brief of Case" 
                                                value={item.brief_of_case || ''} 
                                                onChange={e => handleArrayChange('essential_indicators', 'anti_competitive_conduct_corrective_actions', index, 'brief_of_case', e.target.value)} 
                                                disabled={disabled}
                                                rows={2}
                                                aria-label={`Case ${index + 1} brief`}
                                            />
                                        </td>
                                        <td>
                                            <textarea 
                                                placeholder="Corrective Action Taken" 
                                                value={item.corrective_action_taken || ''} 
                                                onChange={e => handleArrayChange('essential_indicators', 'anti_competitive_conduct_corrective_actions', index, 'corrective_action_taken', e.target.value)} 
                                                disabled={disabled}
                                                rows={2}
                                                aria-label={`Corrective action ${index + 1}`}
                                            />
                                        </td>
                                        <td>
                                            {!disabled && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeArrayItem('essential_indicators', 'anti_competitive_conduct_corrective_actions', index)} 
                                                    className="remove-button"
                                                    aria-label={`Remove case ${index + 1}`}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No anti-competitive conduct cases reported.</p>
                    )}
                    {!disabled && (
                        <button 
                            type="button" 
                            onClick={() => addArrayItem('essential_indicators', 'anti_competitive_conduct_corrective_actions', { name_of_authority: '', brief_of_case: '', corrective_action_taken: '' })} 
                            className="add-button"
                        >
                            Add Case
                        </button>
                    )}
                </div>
            </div>            <h5>Leadership Indicators</h5>
            <p className="leadership-indicators-note">
                <em>Leadership indicators are optional and help demonstrate advanced ESG practices beyond basic compliance.</em>
            </p>
            <div className="form-group">
                <label>1. Details of public policy positions advocated by the entity that are not covered in essential indicators (e.g., on emerging issues, international agreements):</label>
                <p><em>Optional: Add public policy positions if your organization actively advocates on policy matters.</em></p>
                <div className="array-container">
                    {(formData.leadership_indicators.public_policy_positions_advocated || []).length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Policy Advocated</th>
                                    <th>Method of Advocacy</th>
                                    <th>Board Review Frequency</th>
                                    <th>Web Link (if any)</th>
                                    <th>Info in Public Domain</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(formData.leadership_indicators.public_policy_positions_advocated || []).map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <textarea 
                                                placeholder="Policy Advocated" 
                                                value={item.policy_advocated || ''} 
                                                onChange={e => handleArrayChange('leadership_indicators', 'public_policy_positions_advocated', index, 'policy_advocated', e.target.value)} 
                                                disabled={disabled}
                                                rows={2}
                                                aria-label={`Policy ${index + 1} advocated`}
                                            />
                                        </td>
                                        <td>
                                            <select 
                                                value={item.method_of_advocacy || ''} 
                                                onChange={e => handleArrayChange('leadership_indicators', 'public_policy_positions_advocated', index, 'method_of_advocacy', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`Method of advocacy ${index + 1}`}
                                            >
                                                <option value="">Select Method</option>
                                                <option value="Direct">Direct Engagement</option>
                                                <option value="Indirect">Indirect (via Trade Org.)</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                placeholder="Board Review Frequency" 
                                                value={item.board_review_frequency || ''} 
                                                onChange={e => handleArrayChange('leadership_indicators', 'public_policy_positions_advocated', index, 'board_review_frequency', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`Board review frequency ${index + 1}`}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="url" 
                                                placeholder="Web Link (if any)" 
                                                value={item.web_link || ''} 
                                                onChange={e => handleArrayChange('leadership_indicators', 'public_policy_positions_advocated', index, 'web_link', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`Web link ${index + 1}`}
                                            />
                                        </td>
                                        <td>
                                            <select 
                                                value={item.info_in_public_domain || 'No'} 
                                                onChange={e => handleArrayChange('leadership_indicators', 'public_policy_positions_advocated', index, 'info_in_public_domain', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`Info in public domain ${index + 1}`}
                                            >
                                                <option value="No">Not in Public Domain</option>
                                                <option value="Yes">In Public Domain</option>
                                            </select>
                                        </td>
                                        <td>
                                            {!disabled && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeArrayItem('leadership_indicators', 'public_policy_positions_advocated', index)} 
                                                    className="remove-button"
                                                    aria-label={`Remove policy ${index + 1}`}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No public policy positions added yet.</p>
                    )}
                    {!disabled && (                        <button 
                            type="button" 
                            onClick={() => addArrayItem('leadership_indicators', 'public_policy_positions_advocated', { policy_advocated: null, method_of_advocacy: null, info_in_public_domain: 'No', board_review_frequency: null, web_link: null })} 
                            className="add-button"
                        >
                            Add Policy Position
                        </button>
                    )}
                </div>
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

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const initialP1EssentialIndicators = {
    anti_corruption_policy: {
        has_policy: false,
        details: '',
        weblink: '',
    },
    concerns_reporting_process: {
        has_process: false,
        process_details: '',
    },
    disciplinary_actions_corruption: { // New: Essential Indicator 5
        count_fy: null,
        count_prev_fy: null,
        remarks: '',
    },
    corrective_actions_corruption: { // New: Essential Indicator 5 (part 2)
        details: '',
    },
    fines_penalties_corruption: { // New: Essential Indicator 6
        fy: { count: null, amount: null, details: '' },
        prev_fy: { count: null, amount: null, details: '' },
    },
    appeals_fines_corruption: { // New: Essential Indicator 6 (part 2)
        details: '',
    }
};

const initialP1LeadershipIndicators = {
    conflict_of_interest_policy_communication: {
        communicated: false,
        how_communicated: '',
        reasons_if_not: '',
    },
    conflict_of_interest_training: { // New: Leadership Indicator 2
        covered_directors: false,
        covered_kmps: false,
        covered_employees: false,
        fy_training_details: '',
    },
    anti_corruption_policy_communication: { // New: Leadership Indicator 3
        communicated_directors: false,
        communicated_kmps: false,
        communicated_employees: false,
        communicated_value_chain: false,
        fy_communication_details: '',
    },
    anti_corruption_training: { // New: Leadership Indicator 4
        covered_directors: false,
        covered_kmps: false,
        covered_employees: false,
        covered_value_chain: false,
        fy_training_details: '',
    }
};

const initialSectionCPrinciple1Data = {
    essential_indicators: initialP1EssentialIndicators,
    leadership_indicators: initialP1LeadershipIndicators,
};

function SectionCPrinciple1Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialSectionCPrinciple1Data);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {
        if (reportData) {
            setFormData({
                essential_indicators: {
                    ...initialP1EssentialIndicators,
                    ...(reportData.sc_p1_essential_indicators || {}),
                },
                leadership_indicators: {
                    ...initialP1LeadershipIndicators,
                    ...(reportData.sc_p1_leadership_indicators || {}),
                },
            });
        } else {
            // Set to initial if reportData is not yet available or doesn't have section C data
             setFormData({
                essential_indicators: initialP1EssentialIndicators,
                leadership_indicators: initialP1LeadershipIndicators,
            });
        }
    }, [reportData]);

    const handleNestedChange = (indicatorType, path, value, type, checked) => {
        setFormData(prev => {
            const keys = path.split('.');
            let currentSection = { ...prev[indicatorType] };
            let objRef = currentSection;

            for (let i = 0; i < keys.length - 1; i++) {
                objRef[keys[i]] = { ...(objRef[keys[i]] || {}) }; // Ensure new object for path
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
            sc_p1_essential_indicators: formData.essential_indicators,
            sc_p1_leadership_indicators: formData.leadership_indicators,
        };

        const success = await handleSaveProgress(payload);
        if (success) {
            setLocalSuccess('Section C, Principle 1 saved successfully!');
        } else {
            setLocalError('Failed to save Section C, Principle 1. Check wizard errors or console.');
        }
    };

    if (!reportData) return <p>Loading Section C, Principle 1 data...</p>;
    const disabled = isSubmitted || isLoadingSave;

    return (
        <form onSubmit={handleSubmit} className="profile-form section-c-form">
            <h3>Section C: Principle-wise Performance</h3>
            <h4>Principle 1: Businesses should conduct and govern themselves with integrity, and in a manner that is Ethical, Transparent and Accountable.</h4>
            
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}

            <h5>Essential Indicators</h5>
            {/* Q1. (mapped to Q4 in PDF) Anti-corruption/anti-bribery policy */}
            <div className="form-group">
                <label>
                    1. Does the entity have an anti-corruption or anti-bribery policy? If yes, provide details in brief and a weblink to the policy.
                    <input 
                        type="checkbox" 
                        checked={formData.essential_indicators?.anti_corruption_policy?.has_policy || false} 
                        onChange={e => handleNestedChange('essential_indicators', 'anti_corruption_policy.has_policy', e.target.value, 'checkbox', e.target.checked)} 
                        disabled={disabled} 
                    />
                </label>
                {formData.essential_indicators?.anti_corruption_policy?.has_policy && (
                    <>
                        <label>Details in brief:</label>
                        <textarea 
                            value={formData.essential_indicators?.anti_corruption_policy?.details || ''} 
                            onChange={e => handleNestedChange('essential_indicators', 'anti_corruption_policy.details', e.target.value)} 
                            disabled={disabled} 
                            rows={3}
                        ></textarea>
                        <label>Weblink to policy (if available):</label>
                        <input 
                            type="url" 
                            value={formData.essential_indicators?.anti_corruption_policy?.weblink || ''} 
                            onChange={e => handleNestedChange('essential_indicators', 'anti_corruption_policy.weblink', e.target.value)} 
                            disabled={disabled} 
                        />
                    </>
                )}
            </div>

            {/* Q2. (mapped to Q7 in PDF) Concerns reporting process */}
            <div className="form-group">
                <label>
                    2. Does the entity have processes in place through which Directors, KMPs and employees can report concerns? If yes, provide details of the process.
                    <input 
                        type="checkbox" 
                        checked={formData.essential_indicators?.concerns_reporting_process?.has_process || false} 
                        onChange={e => handleNestedChange('essential_indicators', 'concerns_reporting_process.has_process', e.target.value, 'checkbox', e.target.checked)} 
                        disabled={disabled} 
                    />
                </label>
                {formData.essential_indicators?.concerns_reporting_process?.has_process && (
                    <>
                        <label>Details of the process:</label>
                        <textarea 
                            value={formData.essential_indicators?.concerns_reporting_process?.process_details || ''} 
                            onChange={e => handleNestedChange('essential_indicators', 'concerns_reporting_process.process_details', e.target.value)} 
                            disabled={disabled} 
                            rows={3}
                        ></textarea>
                    </>
                )}
            </div>

            {/* Q3. (mapped to Q5 in PDF) Disciplinary actions and corrective actions on corruption */}
            <div className="form-group">
                <label>3. Number of Directors/KMPs/employees/workers against whom disciplinary action was taken by any law enforcement agency for cases of corruption and bribery:</label>
                <div>
                    <label>Current Financial Year (FY): <input type="number" value={formData.essential_indicators?.disciplinary_actions_corruption?.count_fy ?? ''} onChange={e => handleNestedChange('essential_indicators', 'disciplinary_actions_corruption.count_fy', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Previous Financial Year: <input type="number" value={formData.essential_indicators?.disciplinary_actions_corruption?.count_prev_fy ?? ''} onChange={e => handleNestedChange('essential_indicators', 'disciplinary_actions_corruption.count_prev_fy', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Remarks:</label>
                    <textarea value={formData.essential_indicators?.disciplinary_actions_corruption?.remarks || ''} onChange={e => handleNestedChange('essential_indicators', 'disciplinary_actions_corruption.remarks', e.target.value)} disabled={disabled} rows={2}></textarea>
                </div>
                <label>Details of corrective actions taken by the entity:</label>
                <textarea value={formData.essential_indicators?.corrective_actions_corruption?.details || ''} onChange={e => handleNestedChange('essential_indicators', 'corrective_actions_corruption.details', e.target.value)} disabled={disabled} rows={3}></textarea>
            </div>

            {/* Q4. (mapped to Q6 in PDF) Fines/Penalties for corruption */}
            <div className="form-group">
                <label>4. Details of fines / penalties / punishment / award / compounding fees / settlement amount paid in proceedings (by the entity or by directors / KMPs) with regulators/ law enforcement agencies/ judicial institutions, in the current financial year and previous financial year, for cases of corruption and bribery:</label>
                <div>
                    <strong>Current FY:</strong>
                    <label>No. of cases: <input type="number" value={formData.essential_indicators?.fines_penalties_corruption?.fy?.count ?? ''} onChange={e => handleNestedChange('essential_indicators', 'fines_penalties_corruption.fy.count', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Total Amount (INR): <input type="number" value={formData.essential_indicators?.fines_penalties_corruption?.fy?.amount ?? ''} onChange={e => handleNestedChange('essential_indicators', 'fines_penalties_corruption.fy.amount', parseFloat(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Details:</label>
                    <textarea value={formData.essential_indicators?.fines_penalties_corruption?.fy?.details || ''} onChange={e => handleNestedChange('essential_indicators', 'fines_penalties_corruption.fy.details', e.target.value)} disabled={disabled} rows={2}></textarea>
                </div>
                <div>
                    <strong>Previous FY:</strong>
                    <label>No. of cases: <input type="number" value={formData.essential_indicators?.fines_penalties_corruption?.prev_fy?.count ?? ''} onChange={e => handleNestedChange('essential_indicators', 'fines_penalties_corruption.prev_fy.count', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Total Amount (INR): <input type="number" value={formData.essential_indicators?.fines_penalties_corruption?.prev_fy?.amount ?? ''} onChange={e => handleNestedChange('essential_indicators', 'fines_penalties_corruption.prev_fy.amount', parseFloat(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Details:</label>
                    <textarea value={formData.essential_indicators?.fines_penalties_corruption?.prev_fy?.details || ''} onChange={e => handleNestedChange('essential_indicators', 'fines_penalties_corruption.prev_fy.details', e.target.value)} disabled={disabled} rows={2}></textarea>
                </div>
                <label>Details of any appeal against such orders:</label>
                <textarea value={formData.essential_indicators?.appeals_fines_corruption?.details || ''} onChange={e => handleNestedChange('essential_indicators', 'appeals_fines_corruption.details', e.target.value)} disabled={disabled} rows={3}></textarea>
            </div>


            <hr />
            <h5>Leadership Indicators</h5>
            {/* Q1. Conflict of interest policy communication */}
            <div className="form-group">
                <label>
                    1. Has the entity’s policy on conflict of interest been communicated to all Directors, KMPs, and other employees? If not, reasons therefor.
                    <input 
                        type="checkbox" 
                        checked={formData.leadership_indicators?.conflict_of_interest_policy_communication?.communicated || false} 
                        onChange={e => handleNestedChange('leadership_indicators', 'conflict_of_interest_policy_communication.communicated', e.target.value, 'checkbox', e.target.checked)} 
                        disabled={disabled} 
                    />
                </label>
                {formData.leadership_indicators?.conflict_of_interest_policy_communication?.communicated ? (
                    <>
                        <label>How was it communicated?</label>
                        <textarea 
                            value={formData.leadership_indicators?.conflict_of_interest_policy_communication?.how_communicated || ''} 
                            onChange={e => handleNestedChange('leadership_indicators', 'conflict_of_interest_policy_communication.how_communicated', e.target.value)} 
                            disabled={disabled} 
                            rows={3}
                        ></textarea>
                    </>
                ) : (
                    <>
                        <label>Reasons for not communicating (if applicable):</label>
                        <textarea 
                            value={formData.leadership_indicators?.conflict_of_interest_policy_communication?.reasons_if_not || ''} 
                            onChange={e => handleNestedChange('leadership_indicators', 'conflict_of_interest_policy_communication.reasons_if_not', e.target.value)} 
                            disabled={disabled} 
                            rows={3}
                        ></textarea>
                    </>
                )}
            </div>

            {/* Q2. Training on conflict of interest */}
            <div className="form-group">
                <label>2. Provide details of training/awareness programmes conducted on conflict of interest during the financial year:</label>
                <div>
                    <label><input type="checkbox" checked={formData.leadership_indicators?.conflict_of_interest_training?.covered_directors || false} onChange={e => handleNestedChange('leadership_indicators', 'conflict_of_interest_training.covered_directors', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> Directors</label>
                    <label><input type="checkbox" checked={formData.leadership_indicators?.conflict_of_interest_training?.covered_kmps || false} onChange={e => handleNestedChange('leadership_indicators', 'conflict_of_interest_training.covered_kmps', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> KMPs</label>
                    <label><input type="checkbox" checked={formData.leadership_indicators?.conflict_of_interest_training?.covered_employees || false} onChange={e => handleNestedChange('leadership_indicators', 'conflict_of_interest_training.covered_employees', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> Other Employees</label>
                </div>
                <label>Details of training conducted (topics, duration, mode):</label>
                <textarea value={formData.leadership_indicators?.conflict_of_interest_training?.fy_training_details || ''} onChange={e => handleNestedChange('leadership_indicators', 'conflict_of_interest_training.fy_training_details', e.target.value)} disabled={disabled} rows={3}></textarea>
            </div>

            {/* Q3. Communication of anti-corruption/anti-bribery policy */}
            <div className="form-group">
                <label>3. Has the entity’s anti-corruption/anti-bribery policy been communicated to all Directors, KMPs, other employees and business partners? If not, reasons therefor.</label>
                <div>
                    <label><input type="checkbox" checked={formData.leadership_indicators?.anti_corruption_policy_communication?.communicated_directors || false} onChange={e => handleNestedChange('leadership_indicators', 'anti_corruption_policy_communication.communicated_directors', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> Directors</label>
                    <label><input type="checkbox" checked={formData.leadership_indicators?.anti_corruption_policy_communication?.communicated_kmps || false} onChange={e => handleNestedChange('leadership_indicators', 'anti_corruption_policy_communication.communicated_kmps', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> KMPs</label>
                    <label><input type="checkbox" checked={formData.leadership_indicators?.anti_corruption_policy_communication?.communicated_employees || false} onChange={e => handleNestedChange('leadership_indicators', 'anti_corruption_policy_communication.communicated_employees', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> Other Employees</label>
                    <label><input type="checkbox" checked={formData.leadership_indicators?.anti_corruption_policy_communication?.communicated_value_chain || false} onChange={e => handleNestedChange('leadership_indicators', 'anti_corruption_policy_communication.communicated_value_chain', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> Business Partners (Value Chain)</label>
                </div>
                <label>Details of communication (how, when, reasons if not to certain groups):</label>
                <textarea value={formData.leadership_indicators?.anti_corruption_policy_communication?.fy_communication_details || ''} onChange={e => handleNestedChange('leadership_indicators', 'anti_corruption_policy_communication.fy_communication_details', e.target.value)} disabled={disabled} rows={3}></textarea>
            </div>

            {/* Q4. Training on anti-corruption/anti-bribery */}
            <div className="form-group">
                <label>4. Provide details of training/awareness programmes conducted on anti-corruption/anti-bribery during the financial year:</label>
                <div>
                    <label><input type="checkbox" checked={formData.leadership_indicators?.anti_corruption_training?.covered_directors || false} onChange={e => handleNestedChange('leadership_indicators', 'anti_corruption_training.covered_directors', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> Directors</label>
                    <label><input type="checkbox" checked={formData.leadership_indicators?.anti_corruption_training?.covered_kmps || false} onChange={e => handleNestedChange('leadership_indicators', 'anti_corruption_training.covered_kmps', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> KMPs</label>
                    <label><input type="checkbox" checked={formData.leadership_indicators?.anti_corruption_training?.covered_employees || false} onChange={e => handleNestedChange('leadership_indicators', 'anti_corruption_training.covered_employees', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> Other Employees</label>
                    <label><input type="checkbox" checked={formData.leadership_indicators?.anti_corruption_training?.covered_value_chain || false} onChange={e => handleNestedChange('leadership_indicators', 'anti_corruption_training.covered_value_chain', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> Business Partners (Value Chain)</label>
                </div>
                <label>Details of training conducted (topics, duration, mode):</label>
                <textarea value={formData.leadership_indicators?.anti_corruption_training?.fy_training_details || ''} onChange={e => handleNestedChange('leadership_indicators', 'anti_corruption_training.fy_training_details', e.target.value)} disabled={disabled} rows={3}></textarea>
            </div>
            
            <hr />
            {!isSubmitted && (
                <button type="submit" className="form-button" disabled={isLoadingSave}>
                    {isLoadingSave ? 'Saving...' : 'Save Principle 1'}
                </button>
            )}
            {isSubmitted && <p>This principle is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionCPrinciple1Form;

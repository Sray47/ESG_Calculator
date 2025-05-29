import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const initialP1EssentialIndicators = {
    // Based on Image 1, Q4
    anti_corruption_policy: {
        has_policy: false,
        details: '',
        weblink: '',
    },
    // concerns_reporting_process: removed
    // Based on Image 1, Q5 (Number of Directors/KMPs/employees/workers against whom disciplinary action was taken)
    disciplinary_actions_by_le_agencies: { // LE = Law Enforcement
        fy_2022_23: { directors: null, kmps: null, employees_executives: null, workers_non_executives: null },
        fy_2021_22: { directors: null, kmps: null, employees_executives: null, workers_non_executives: null },
    },
    // Based on Image 1, Q6 (Details of complaints with regard to conflict of interest) - MODIFIED for single FY
    complaints_conflict_of_interest: {
        directors_number: null, directors_remarks: '',
        kmps_number: null, kmps_remarks: '',
    },
    // Based on Image 1, Q7 (Details of any corrective action taken or underway on issues related to fines / penalties / action taken by regulators... on cases of corruption and conflicts of interest)
    corrective_actions_on_corruption_coi: { // Replaces corrective_actions_corruption
        details: '',
    },
    // Based on Image 2, Essential Indicator 1 (Percentage coverage by training and awareness programmes)
    p1_training_coverage: {
        board_of_directors: { programs_held: null, topics_principles: '', percent_covered: null },
        kmp: { programs_held: null, topics_principles: '', percent_covered: null },
        employees_other_than_bod_kmp_executives: { programs_held: null, topics_principles: '', percent_covered: null },
        workers: { programs_held: null, topics_principles: '', percent_covered: null },
    },
    // Based on Image 2, Essential Indicator 2 (Details of fines / penalties /punishment/ award/ compounding fees/ settlement amount paid)
    p1_fines_penalties_paid: { // Replaces fines_penalties_corruption
        monetary_details: '', 
        non_monetary_details: '', 
    },
    // Based on Image 2, Essential Indicator 3 (Details of the Appeal/ Revision preferred)
    p1_appeal_details_for_fines_penalties: { // Replaces appeals_fines_corruption
        details: '', 
    }
};

const initialP1LeadershipIndicators = { // This section remains as per your existing code
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
    // ... The rest of your existing leadership indicators if any
    // For this example, I'm assuming the two you showed are the ones to keep.
    // If you had anti_corruption_policy_communication and anti_corruption_training, they would also be here.
    // Based on your visible code, these are the two:
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
    leadership_indicators: initialP1LeadershipIndicators, // Restored
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
                leadership_indicators: { // Restored
                    ...initialP1LeadershipIndicators,
                    ...(reportData.sc_p1_leadership_indicators || {}),
                },
            });
        } else {
             setFormData(initialSectionCPrinciple1Data); // Ensure both are set
        }
    }, [reportData]);

    const handleNestedChange = (indicatorType, path, value, type, checked) => {
        setFormData(prev => {
            const keys = path.split('.');
            // indicatorType can be 'essential_indicators' or 'leadership_indicators'
            if (!prev[indicatorType]) return prev; // Should not happen if initial state is correct

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
            sc_p1_essential_indicators: formData.essential_indicators,
            sc_p1_leadership_indicators: formData.leadership_indicators, // Restored
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

            {/* Q1 (was Q1, from Image 1, Q4) Anti-corruption/anti-bribery policy */}
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

            {/* Q2 (was Q3 part 1, from Image 1, Q5) Disciplinary actions by Law Enforcement Agencies for corruption/bribery */}
            <div className="form-group">
                <label>2. Number of Directors/KMPs/employees/workers against whom disciplinary action was taken by any law enforcement agency for the charges of bribery/corruption:</label>
                <div>
                    <strong>FY 2022-23:</strong>
                    <label>Directors: <input type="number" value={formData.essential_indicators?.disciplinary_actions_by_le_agencies?.fy_2022_23?.directors ?? ''} onChange={e => handleNestedChange('essential_indicators', 'disciplinary_actions_by_le_agencies.fy_2022_23.directors', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>KMPs: <input type="number" value={formData.essential_indicators?.disciplinary_actions_by_le_agencies?.fy_2022_23?.kmps ?? ''} onChange={e => handleNestedChange('essential_indicators', 'disciplinary_actions_by_le_agencies.fy_2022_23.kmps', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Employees (Executives): <input type="number" value={formData.essential_indicators?.disciplinary_actions_by_le_agencies?.fy_2022_23?.employees_executives ?? ''} onChange={e => handleNestedChange('essential_indicators', 'disciplinary_actions_by_le_agencies.fy_2022_23.employees_executives', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Workers (Non-Executives): <input type="number" value={formData.essential_indicators?.disciplinary_actions_by_le_agencies?.fy_2022_23?.workers_non_executives ?? ''} onChange={e => handleNestedChange('essential_indicators', 'disciplinary_actions_by_le_agencies.fy_2022_23.workers_non_executives', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                </div>
                <div>
                    <strong>FY 2021-22:</strong>
                    <label>Directors: <input type="number" value={formData.essential_indicators?.disciplinary_actions_by_le_agencies?.fy_2021_22?.directors ?? ''} onChange={e => handleNestedChange('essential_indicators', 'disciplinary_actions_by_le_agencies.fy_2021_22.directors', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>KMPs: <input type="number" value={formData.essential_indicators?.disciplinary_actions_by_le_agencies?.fy_2021_22?.kmps ?? ''} onChange={e => handleNestedChange('essential_indicators', 'disciplinary_actions_by_le_agencies.fy_2021_22.kmps', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Employees (Executives): <input type="number" value={formData.essential_indicators?.disciplinary_actions_by_le_agencies?.fy_2021_22?.employees_executives ?? ''} onChange={e => handleNestedChange('essential_indicators', 'disciplinary_actions_by_le_agencies.fy_2021_22.employees_executives', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Workers (Non-Executives): <input type="number" value={formData.essential_indicators?.disciplinary_actions_by_le_agencies?.fy_2021_22?.workers_non_executives ?? ''} onChange={e => handleNestedChange('essential_indicators', 'disciplinary_actions_by_le_agencies.fy_2021_22.workers_non_executives', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                </div>
            </div>

            {/* Q3 (New, from Image 1, Q6) Details of complaints with regard to conflict of interest - MODIFIED for single FY */}
            <div className="form-group">
                <label>3. Details of complaints with regard to conflict of interest (Current FY):</label>
                <div>
                    <label>Number of complaints (Directors): <input type="number" value={formData.essential_indicators?.complaints_conflict_of_interest?.directors_number ?? ''} onChange={e => handleNestedChange('essential_indicators', 'complaints_conflict_of_interest.directors_number', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Remarks (Directors): <textarea value={formData.essential_indicators?.complaints_conflict_of_interest?.directors_remarks || ''} onChange={e => handleNestedChange('essential_indicators', 'complaints_conflict_of_interest.directors_remarks', e.target.value)} disabled={disabled} rows={2}></textarea></label>
                </div>
                <div>
                    <label>Number of complaints (KMPs): <input type="number" value={formData.essential_indicators?.complaints_conflict_of_interest?.kmps_number ?? ''} onChange={e => handleNestedChange('essential_indicators', 'complaints_conflict_of_interest.kmps_number', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Remarks (KMPs): <textarea value={formData.essential_indicators?.complaints_conflict_of_interest?.kmps_remarks || ''} onChange={e => handleNestedChange('essential_indicators', 'complaints_conflict_of_interest.kmps_remarks', e.target.value)} disabled={disabled} rows={2}></textarea></label>
                </div>
            </div>

            {/* Q4 (was Q3 part 2, from Image 1, Q7) Corrective action on fines/penalties/corruption/COI */}
            <div className="form-group">
                <label>4. Provide details of any corrective action taken or underway on issues related to fines / penalties / action taken by regulators/ law enforcement agencies/ judicial institutions, on cases of corruption and conflicts of interest:</label>
                <textarea 
                    value={formData.essential_indicators?.corrective_actions_on_corruption_coi?.details || ''} 
                    onChange={e => handleNestedChange('essential_indicators', 'corrective_actions_on_corruption_coi.details', e.target.value)} 
                    disabled={disabled} 
                    rows={3}
                    placeholder="Enter details (or N.A.)"
                ></textarea>
            </div>

            {/* Q5 (New, from Image 2, EI 1) Training coverage on principles */}
            <div className="form-group">
                <label>5. Percentage coverage by training and awareness programmes on any of the principles during the financial year:</label>
                <div>
                    <strong>Board of Directors:</strong>
                    <label>Total programmes held: <input type="number" value={formData.essential_indicators?.p1_training_coverage?.board_of_directors?.programs_held ?? ''} onChange={e => handleNestedChange('essential_indicators', 'p1_training_coverage.board_of_directors.programs_held', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Topics/principles covered: <input type="text" value={formData.essential_indicators?.p1_training_coverage?.board_of_directors?.topics_principles || ''} onChange={e => handleNestedChange('essential_indicators', 'p1_training_coverage.board_of_directors.topics_principles', e.target.value)} disabled={disabled} /></label>
                    <label>% Age of persons covered: <input type="number" step="0.1" value={formData.essential_indicators?.p1_training_coverage?.board_of_directors?.percent_covered ?? ''} onChange={e => handleNestedChange('essential_indicators', 'p1_training_coverage.board_of_directors.percent_covered', parseFloat(e.target.value) || null)} disabled={disabled} /></label>
                </div>
                 <div>
                    <strong>Key Managerial Personnel (KMP):</strong>
                    <label>Total programmes held: <input type="number" value={formData.essential_indicators?.p1_training_coverage?.kmp?.programs_held ?? ''} onChange={e => handleNestedChange('essential_indicators', 'p1_training_coverage.kmp.programs_held', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Topics/principles covered: <input type="text" value={formData.essential_indicators?.p1_training_coverage?.kmp?.topics_principles || ''} onChange={e => handleNestedChange('essential_indicators', 'p1_training_coverage.kmp.topics_principles', e.target.value)} disabled={disabled} /></label>
                    <label>% Age of persons covered: <input type="number" step="0.1" value={formData.essential_indicators?.p1_training_coverage?.kmp?.percent_covered ?? ''} onChange={e => handleNestedChange('essential_indicators', 'p1_training_coverage.kmp.percent_covered', parseFloat(e.target.value) || null)} disabled={disabled} /></label>
                </div>
                <div>
                    <strong>Employees other than BoD and KMPs (Executives):</strong>
                    <label>Total programmes held: <input type="number" value={formData.essential_indicators?.p1_training_coverage?.employees_other_than_bod_kmp_executives?.programs_held ?? ''} onChange={e => handleNestedChange('essential_indicators', 'p1_training_coverage.employees_other_than_bod_kmp_executives.programs_held', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Topics/principles covered: <input type="text" value={formData.essential_indicators?.p1_training_coverage?.employees_other_than_bod_kmp_executives?.topics_principles || ''} onChange={e => handleNestedChange('essential_indicators', 'p1_training_coverage.employees_other_than_bod_kmp_executives.topics_principles', e.target.value)} disabled={disabled} /></label>
                    <label>% Age of persons covered: <input type="number" step="0.1" value={formData.essential_indicators?.p1_training_coverage?.employees_other_than_bod_kmp_executives?.percent_covered ?? ''} onChange={e => handleNestedChange('essential_indicators', 'p1_training_coverage.employees_other_than_bod_kmp_executives.percent_covered', parseFloat(e.target.value) || null)} disabled={disabled} /></label>
                </div>
                <div>
                    <strong>Workers:</strong>
                    <label>Total programmes held: <input type="number" value={formData.essential_indicators?.p1_training_coverage?.workers?.programs_held ?? ''} onChange={e => handleNestedChange('essential_indicators', 'p1_training_coverage.workers.programs_held', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                    <label>Topics/principles covered: <input type="text" value={formData.essential_indicators?.p1_training_coverage?.workers?.topics_principles || ''} onChange={e => handleNestedChange('essential_indicators', 'p1_training_coverage.workers.topics_principles', e.target.value)} disabled={disabled} /></label>
                    <label>% Age of persons covered: <input type="number" step="0.1" value={formData.essential_indicators?.p1_training_coverage?.workers?.percent_covered ?? ''} onChange={e => handleNestedChange('essential_indicators', 'p1_training_coverage.workers.percent_covered', parseFloat(e.target.value) || null)} disabled={disabled} /></label>
                </div>
            </div>

            {/* Q6 (was Q4, from Image 2, EI 2) Details of fines/penalties paid */}
            <div className="form-group">
                <label>6. Details of fines / penalties /punishment/ award/ compounding fees/ settlement amount paid in proceedings (by the entity or by directors / KMPs) with regulators/ law enforcement agencies/ judicial institutions, in the current financial year:</label>
                <p style={{fontSize: '0.9em', color: 'gray'}}>For multiple entries, please list them clearly. A more dynamic input will be added later.</p>
                <div>
                    <strong>Monetary:</strong> (Types: Penalty/Fine, Settlement, Compounding fee)
                    <textarea 
                        value={formData.essential_indicators?.p1_fines_penalties_paid?.monetary_details || ''} 
                        onChange={e => handleNestedChange('essential_indicators', 'p1_fines_penalties_paid.monetary_details', e.target.value)} 
                        disabled={disabled} 
                        rows={5}
                        placeholder="List each monetary penalty: Type, NGRBC Principle, Regulator Name, Amount (INR), Brief of Case, Appeal Preferred (Yes/No)"
                    ></textarea>
                </div>
                <div>
                    <strong>Non-Monetary:</strong> (Types: Imprisonment, Punishment)
                     <textarea 
                        value={formData.essential_indicators?.p1_fines_penalties_paid?.non_monetary_details || ''} 
                        onChange={e => handleNestedChange('essential_indicators', 'p1_fines_penalties_paid.non_monetary_details', e.target.value)} 
                        disabled={disabled} 
                        rows={5}
                        placeholder="List each non-monetary penalty: Type, NGRBC Principle, Regulator Name, Brief of Case, Appeal Preferred (Yes/No)"
                    ></textarea>
                </div>
            </div>

            {/* Q7 (New, from Image 2, EI 3) Appeal details for fines/penalties */}
            <div className="form-group">
                <label>7. Of the instances disclosed in Question 6 above, details of the Appeal/ Revision preferred in cases where monetary or non-monetary action has been appealed:</label>
                 <textarea 
                    value={formData.essential_indicators?.p1_appeal_details_for_fines_penalties?.details || ''} 
                    onChange={e => handleNestedChange('essential_indicators', 'p1_appeal_details_for_fines_penalties.details', e.target.value)} 
                    disabled={disabled} 
                    rows={4}
                    placeholder="List appeal details: Case Details, Name of the regulatory/enforcement agencies/judicial institutions"
                ></textarea>
            </div>
            
            <hr />
            <h5>Leadership Indicators</h5>
            {/* Q1. Conflict of interest policy communication */}
            {/* This section and its questions will remain as they are in your current code */}
            {/* For example, if you have Q1 and Q2 for leadership: */}
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

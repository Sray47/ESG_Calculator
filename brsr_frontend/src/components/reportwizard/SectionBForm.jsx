import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { deepMerge } from '../../utils/objectUtils'; // Import deepMerge
import '../../pages/ProfilePage.css'; // Re-use styles

const initialPrinciplePolicy = (principleNumber) => ({
    principle: principleNumber,
    has_policy: false,
    is_board_approved: false,
    policy_text_or_url: '',
    translated_to_procedures: false,
    extends_to_value_chain: false,
    adopted_standards: '',
    specific_commitments_goals_targets: '',
    performance_against_targets: '',
    // NEW: Fields for Q12 reasons
    reason_q12_not_material: false,
    reason_q12_not_at_stage: false,
    reason_q12_no_resources: false,
    reason_q12_planned_next_year: false,
    reason_q12_other_text: '',
    // REMOVE: reason_not_covered: '',
});

const initialSectionBData = {
    // Form Q1. Statement from Director (maps to OCR2 Sl.No.7)
    sb_director_statement: '',

    // Form Q2. Details of highest responsible individual (maps to OCR2 Sl.No.8)
    sb_esg_responsible_individual: {
        name: '',                       // OCR2 Sl.No.8 Name
        designation: '',                // OCR2 Sl.No.8 Designation
        din_if_director: '',            // OCR2 Sl.No.8 DIN
        email: '',                      // OCR2 Sl.No.8 Email Id
        phone: '',                      // OCR2 Sl.No.8 Contact No.
    },

    // Form Q3. Policies for NGRBC Principles (maps to OCR2 Sl.No.1-6 for sub-questions, and OCR1 Q12)
    sb_principle_policies: Array.from({ length: 9 }, (_, i) => initialPrinciplePolicy(i + 1)),

    // New structure for OCR1 Q9 / OCR2 Sl.No.9
    sb_sustainability_committee: {
        has_committee: false, 
        details: ''           
    },

    // Modified structure for OCR1 Q10
    sb_ngrbc_company_review: {
        performance_review_yn: false, // NEW: For "Performance against above policies and follow up action (Y/N)"
        compliance_review_yn: false,  // NEW: For "Compliance with statutory requirements... (Y/N)"
        review_undertaken_by: '',     // Kept: Text input for who undertook the review
        frequency: '',                // Kept: Text input for "Frequency (Annually/Half yearly/...)"
    },

    // New structure for OCR1 Q11
    sb_external_policy_assessment: {
        conducted: false, 
        agency_name: ''   
    }
};

function SectionBForm() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();    const [formData, setFormData] = useState(initialSectionBData);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
      useEffect(() => {
        if (reportData && reportData.section_b_data) {
            // Ensure deepMerge handles the potentially new structure of initialSectionBData
            const currentInitialData = initialSectionBData;
            const mergedData = deepMerge(currentInitialData, reportData.section_b_data);
            
            // Ensure sb_principle_policies array is properly initialized
            if (!Array.isArray(mergedData.sb_principle_policies) || mergedData.sb_principle_policies.length !== 9) {
                mergedData.sb_principle_policies = Array.from({ length: 9 }, (_, i) => ({
                    ...initialPrinciplePolicy(i + 1),
                    ...(mergedData.sb_principle_policies?.[i] || {})
                }));
            }
            
            setFormData(mergedData);
        } else if (reportData) {
            setFormData(initialSectionBData);
        }
    }, [reportData]);    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };    const handleNestedChange = (path, value, type, checked) => {
        // Clear validation error for nested fields
        const fieldKey = path.split('.').pop();
        if (validationErrors[fieldKey]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldKey];
                return newErrors;
            });
        }
        
        setFormData(prev => {
            const keys = path.split('.');
            let current = { ...prev };
            let objRef = current;
            
            // Navigate to nested object and clone each level for immutability
            for (let i = 0; i < keys.length - 1; i++) {
                if (!objRef[keys[i]] || typeof objRef[keys[i]] !== 'object') {
                    objRef[keys[i]] = {};
                } else {
                    objRef[keys[i]] = { ...objRef[keys[i]] };
                }
                objRef = objRef[keys[i]];
            }
            
            // Set the final value with proper type handling
            const finalValue = type === 'checkbox' ? checked : value;
            objRef[keys[keys.length - 1]] = finalValue;
            
            return current;
        });
    };// Simplified handleArrayObjectChange for sb_principle_policies array
    const handleArrayObjectChange = (arrayName, index, fieldName, value, type, checked) => {
        setFormData(prev => {
            // For sb_principle_policies, it's a direct array under formData
            if (arrayName === 'sb_principle_policies') {
                const newArray = [...prev.sb_principle_policies];
                
                // Ensure the item exists at the index
                if (!newArray[index]) {
                    newArray[index] = initialPrinciplePolicy(index + 1);
                } else {
                    newArray[index] = { ...newArray[index] };
                }
                
                // Set the value with proper type handling
                newArray[index][fieldName] = type === 'checkbox' ? checked : value;
                
                return {
                    ...prev,
                    sb_principle_policies: newArray
                };
            }
            
            // For other potential nested arrays (fallback - though none exist currently)
            const keys = arrayName.split('.');
            let current = { ...prev };
            let objRef = current;

            // Navigate to the parent object of the array
            for (let i = 0; i < keys.length - 1; i++) {
                if (!objRef[keys[i]] || typeof objRef[keys[i]] !== 'object') {
                    objRef[keys[i]] = {};
                } else {
                    objRef[keys[i]] = { ...objRef[keys[i]] };
                }
                objRef = objRef[keys[i]];
            }

            const finalArrayName = keys[keys.length - 1];

            // Ensure the target is an array
            if (!Array.isArray(objRef[finalArrayName])) {
                objRef[finalArrayName] = [];
            } else {
                objRef[finalArrayName] = [...objRef[finalArrayName]];
            }

            // Ensure the item at the index exists
            if (index >= objRef[finalArrayName].length) {
                objRef[finalArrayName][index] = {};
            } else {
                objRef[finalArrayName][index] = { ...objRef[finalArrayName][index] };
            }
            
            // Set the value
            objRef[finalArrayName][index][fieldName] = type === 'checkbox' ? checked : value;
            
            return current;
        });
    };    const validate = () => {
        const errors = [];
        if (!formData.sb_director_statement?.trim()) {
            errors.push("Director's statement (Sl.No.7) is required.");
        }
        if (!formData.sb_esg_responsible_individual?.name?.trim()) {
            errors.push("ESG Responsible Individual's name (Sl.No.8) is required.");
        }
        if (!formData.sb_esg_responsible_individual?.designation?.trim()) {
            errors.push("ESG Responsible Individual's designation (Sl.No.8) is required.");
        }
        if (formData.sb_esg_responsible_individual?.email && 
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.sb_esg_responsible_individual.email)) {
            errors.push("Please enter a valid email address for ESG Responsible Individual.");
        }
        
        // Validate that at least one principle has a policy
        const hasPolicies = formData.sb_principle_policies?.some(policy => policy.has_policy);
        if (!hasPolicies) {
            errors.push("At least one principle must have a policy defined.");
        }
        
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError('');
        const validationErrors = validate();
        if (validationErrors.length > 0) {
            setLocalError(validationErrors.join(' '));
            // Set field-level validation errors
            const fieldErrors = {};
            validationErrors.forEach(error => {
                if (error.includes("Director's statement")) {
                    fieldErrors.sb_director_statement = "Director's statement is required";
                }
                if (error.includes("Individual's name")) {
                    fieldErrors.name = "Name is required";
                }
                if (error.includes("Individual's designation")) {
                    fieldErrors.designation = "Designation is required";
                }
                if (error.includes("valid email")) {
                    fieldErrors.email = "Please enter a valid email address";
                }
                if (error.includes("principle must have")) {
                    fieldErrors.principles = "At least one principle must have a policy";
                }
            });
            setValidationErrors(fieldErrors);
            return;
        }
        // SEND Section B data as a single JSON object under sb_policy_management (matches backend allowedFields)
        const payload = { sb_policy_management: formData };
        const success = await handleSaveProgress(payload);
        if (success) {
            setLocalSuccess('Section B saved successfully!');
            setValidationErrors({}); // Clear validation errors on successful save
        } else {
            setLocalError('Failed to save Section B. Check wizard errors or console.');
        }
    };

    if (!reportData) return <p>Loading Section B data...</p>;
    const disabled = isSubmitted || isLoadingSave;

    const getPrincipleName = (number) => {
        const names = [
            "Social: Human Rights", // P1
            "Environmental: Natural Capital", // P2
            "Social: Employee Well-being", // P3
            "Social: Stakeholder Engagement", // P4
            "Governance: Ethical Conduct", // P5
            "Environmental: Circular Economy", // P6
            "Governance: Policy Advocacy", // P7
            "Social: Inclusive Development", // P8
            "Social: Customer Value" // P9
        ];
        return names[number-1] || `Principle ${number}`;
    }

    return (
        <form onSubmit={handleSubmit} className="profile-form section-b-form">
            <h3 className="section-title">Section B: Policies and Governance</h3>
            <p>This section covers the company’s governance, strategy, policies, and processes for ESG, based on provided report excerpts.</p>
            
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}            {/* OCR2 Sl.No.7: Statement from Director */}
            <div className="form-group">
                <label htmlFor="sb_director_statement">1. Statement by director responsible for the business responsibility report (OCR2 Sl.No.7): *</label>
                <textarea 
                    id="sb_director_statement" 
                    name="sb_director_statement" 
                    value={formData.sb_director_statement || ''} 
                    onChange={handleChange} 
                    disabled={disabled} 
                    rows={5} 
                    placeholder="Highlight ESG related challenges, targets, achievements..."
                    style={{ borderColor: validationErrors.sb_director_statement ? 'red' : '#ccc' }}
                    required
                />
                {validationErrors.sb_director_statement && (
                    <small style={{ color: 'red' }}>{validationErrors.sb_director_statement}</small>
                )}
            </div>            {/* OCR2 Sl.No.8: Details of highest responsible individual for ESG */}
            <h4>2. Details of the highest authority responsible for implementation and oversight of the Business Responsibility policy(ies) (OCR2 Sl.No.8):</h4>
            <div className="form-group">
                <label>Name: * 
                    <input 
                        type="text" 
                        value={formData.sb_esg_responsible_individual?.name || ''} 
                        onChange={e => handleNestedChange('sb_esg_responsible_individual.name', e.target.value)} 
                        disabled={disabled} 
                        style={{ borderColor: validationErrors.name ? 'red' : '#ccc' }}
                        required
                    />
                    {validationErrors.name && (
                        <small style={{ color: 'red', display: 'block' }}>{validationErrors.name}</small>
                    )}
                </label>
                <label>Designation: * 
                    <input 
                        type="text" 
                        value={formData.sb_esg_responsible_individual?.designation || ''} 
                        onChange={e => handleNestedChange('sb_esg_responsible_individual.designation', e.target.value)} 
                        disabled={disabled}
                        style={{ borderColor: validationErrors.designation ? 'red' : '#ccc' }}
                        required
                    />
                    {validationErrors.designation && (
                        <small style={{ color: 'red', display: 'block' }}>{validationErrors.designation}</small>
                    )}
                </label>
                <label>DIN (if Director): 
                    <input 
                        type="text" 
                        value={formData.sb_esg_responsible_individual?.din_if_director || ''} 
                        onChange={e => handleNestedChange('sb_esg_responsible_individual.din_if_director', e.target.value)} 
                        disabled={disabled} 
                    />
                </label>
                <label>Email Id: 
                    <input 
                        type="email" 
                        value={formData.sb_esg_responsible_individual?.email || ''} 
                        onChange={e => handleNestedChange('sb_esg_responsible_individual.email', e.target.value)} 
                        disabled={disabled}
                        style={{ borderColor: validationErrors.email ? 'red' : '#ccc' }}
                    />
                    {validationErrors.email && (
                        <small style={{ color: 'red', display: 'block' }}>{validationErrors.email}</small>
                    )}
                </label>
                <label>Contact No. (Phone): 
                    <input 
                        type="tel" 
                        value={formData.sb_esg_responsible_individual?.phone || ''} 
                        onChange={e => handleNestedChange('sb_esg_responsible_individual.phone', e.target.value)} 
                        disabled={disabled} 
                    />
                </label>
            </div>            {/* OCR2 Sl.No.1-6 & OCR1 Q12: Policies for NGRBC Principles */}
            <h4>3. Policy and management processes for NGRBC Principles:</h4>
            {validationErrors.principles && (
                <div style={{ color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '5px' }}>
                    {validationErrors.principles}
                </div>
            )}
            {(formData.sb_principle_policies && Array.isArray(formData.sb_principle_policies) ? formData.sb_principle_policies : []).map((policy, index) => (
                <div key={policy.principle || index} className="form-section principle-policy-item card mb-lg">
                    <h5 className="sub-title">Principle {policy.principle}: {getPrincipleName(policy.principle)}</h5>
                    <div className="form-group">
                        <label>
                            <input type="checkbox" checked={policy.has_policy || false} onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'has_policy', e.target.checked, 'checkbox', e.target.checked)} disabled={disabled} />
                            a. Does your entity's policy/policies cover this principle and its core elements?
                        </label>
                    </div>
                    
                    <div className="form-group" style={{marginLeft: '10px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px'}}>
                        <h6>Details for this Principle's Policy:</h6>
                        <label>
                            <input type="checkbox" 
                                   checked={policy.is_board_approved || false} 
                                   onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'is_board_approved', e.target.checked, 'checkbox', e.target.checked)} 
                                   disabled={disabled} />
                            b. Has the policy been approved by the Board? (Yes/No) (OCR2 Sl.No.1b)
                        </label>
                        <div className="form-group">
                            <label>c. Web Link of the Policy, if available (OCR2 Sl.No.1c):</label>
                            <input type="text" value={policy.policy_text_or_url || ''} onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'policy_text_or_url', e.target.value)} disabled={disabled} placeholder="https://example.com/policy"/>
                        </div>
                        <label>
                            <input type="checkbox" 
                                   checked={policy.translated_to_procedures || false} 
                                   onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'translated_to_procedures', e.target.checked, 'checkbox', e.target.checked)} 
                                   disabled={disabled} />
                            Has the entity translated the policy into procedures? (Yes/No) (OCR2 Sl.No.2)
                        </label>
                        <label>
                            <input type="checkbox" 
                                   checked={policy.extends_to_value_chain || false} 
                                   onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'extends_to_value_chain', e.target.checked, 'checkbox', e.target.checked)} 
                                   disabled={disabled} />
                            Do the enlisted policies extend to your value chain partners? (Yes/No) (OCR2 Sl.No.3)
                        </label>
                        <div className="form-group">
                            <label>Name of the national and international codes/certifications/labels/standards adopted and mapped to this principle (OCR2 Sl.No.4):</label>
                            <input type="text" 
                                   value={policy.adopted_standards || ''} 
                                   onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'adopted_standards', e.target.value)} 
                                   disabled={disabled} 
                                   placeholder="e.g., ISO 9001, SA 8000 (comma-separated)" />
                        </div>
                    </div>
                    
                    {policy.has_policy && (
                        <>
                            <div className="form-group">
                                <label>Specific commitments, goals and targets set by the entity with defined timelines, if any (OCR2 Sl.No.5):</label>
                                <textarea value={policy.specific_commitments_goals_targets || ''} onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'specific_commitments_goals_targets', e.target.value)} disabled={disabled} rows={3}></textarea>
                            </div>
                            <div className="form-group">
                                <label>Performance of the entity against the specific commitments, goals and targets along-with reasons in case the same are not met (OCR2 Sl.No.6):</label>
                                <textarea value={policy.performance_against_targets || ''} onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'performance_against_targets', e.target.value)} disabled={disabled} rows={3}></textarea>
                            </div>
                        </>
                    )}
                    
                    {!policy.has_policy && (
                        <div className="form-group" style={{marginLeft: '20px', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '5px', border: '1px solid #ffeaa7'}}>
                            <h6>If answer to question (1) above is “No” i.e., not all Principles are covered by a policy, reasons to be stated (OCR1 Q12):</h6>
                            <p style={{fontWeight: 'bold', marginTop: '10px', marginBottom: '5px'}}>Questions</p>
                            <label>
                                <input type="checkbox" checked={policy.reason_q12_not_material || false} onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'reason_q12_not_material', e.target.checked, 'checkbox', e.target.checked)} disabled={disabled} />
                                The entity does not consider the principles material to its business (Yes/No)
                            </label>
                            <label>
                                <input type="checkbox" checked={policy.reason_q12_not_at_stage || false} onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'reason_q12_not_at_stage', e.target.checked, 'checkbox', e.target.checked)} disabled={disabled} />
                                The entity is not at a stage where it is in a position to formulate and implement the policies on specified principles (Yes/No)
                            </label>
                            <label>
                                <input type="checkbox" checked={policy.reason_q12_no_resources || false} onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'reason_q12_no_resources', e.target.checked, 'checkbox', e.target.checked)} disabled={disabled} />
                                The entity does not have the financial or/human and technical resources available for the task (Yes/No)
                            </label>
                            <label>
                                <input type="checkbox" checked={policy.reason_q12_planned_next_year || false} onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'reason_q12_planned_next_year', e.target.checked, 'checkbox', e.target.checked)} disabled={disabled} />
                                It is planned to be done in the next financial year (Yes/No)
                            </label>
                            <div className="form-group" style={{marginTop: '10px'}}>
                                <label>Any other reason (please specify):</label>
                                <textarea value={policy.reason_q12_other_text || ''} onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'reason_q12_other_text', e.target.value)} disabled={disabled} rows={2} placeholder="Specify other reasons"></textarea>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Governance, Leadership, and Oversight Section Heading (as per OCR2) */}
            <h3>Governance, Leadership, and Oversight</h3>

            {/* OCR1 Q9 / OCR2 Sl.No.9: Committee for Sustainability Decision Making */}
            <h4>9. Committee for Sustainability Decision Making (OCR1 Q9 / OCR2 Sl.No.9)</h4>
            <div className="form-group">
                <label>
                    <input type="checkbox" checked={formData.sb_sustainability_committee?.has_committee || false} onChange={e => handleNestedChange('sb_sustainability_committee.has_committee', e.target.checked, 'checkbox', e.target.checked)} disabled={disabled} />
                    Does the entity have a specified Committee of the Board/ Director responsible for decision making on sustainability related issues? (Yes/No)
                </label>
                {formData.sb_sustainability_committee?.has_committee === true && (
                    <div className="form-group" style={{marginLeft: '20px'}}>
                        <label>If yes, provide details (e.g., Committee Name and Composition):</label>
                        <textarea value={formData.sb_sustainability_committee?.details || ''} onChange={e => handleNestedChange('sb_sustainability_committee.details', e.target.value)} disabled={disabled} rows={3} placeholder="e.g., CSR and Sustainability Development Committee, members..."></textarea>
                    </div>
                )}
            </div>

            {/* OCR1 Q10: Details of Review of NGRBCs by the Company */}
            <h4>10. Details of Review of NGRBCs by the Company (OCR1 Q10)</h4>
            <div className="form-group">
                <label>
                    <input type="checkbox" 
                           checked={formData.sb_ngrbc_company_review?.performance_review_yn || false} 
                           onChange={e => handleNestedChange('sb_ngrbc_company_review.performance_review_yn', e.target.checked, 'checkbox', e.target.checked)} 
                           disabled={disabled} />
                    Performance against above policies and follow up action (Yes/No)
                </label>
            </div>
            <div className="form-group">
                <label>
                    <input type="checkbox" 
                           checked={formData.sb_ngrbc_company_review?.compliance_review_yn || false} 
                           onChange={e => handleNestedChange('sb_ngrbc_company_review.compliance_review_yn', e.target.checked, 'checkbox', e.target.checked)} 
                           disabled={disabled} />
                    Compliance with statutory requirements of relevance to the principles, and rectification of any non-compliances (Yes/No)
                </label>
            </div>
            <div className="form-group">
                <label>Review undertaken by (Director Committee/Other):</label>
                <input type="text" 
                       value={formData.sb_ngrbc_company_review?.review_undertaken_by || ''} 
                       onChange={e => handleNestedChange('sb_ngrbc_company_review.review_undertaken_by', e.target.value)} 
                       disabled={disabled} 
                       placeholder="e.g., Board Committee, Internal Audit"/>
            </div>
            <div className="form-group">
                <label>Frequency of Review (e.g., Annually, Half yearly, Quarterly, Any other - please specify):</label>
                <input type="text" 
                       value={formData.sb_ngrbc_company_review?.frequency || ''} 
                       onChange={e => handleNestedChange('sb_ngrbc_company_review.frequency', e.target.value)} 
                       disabled={disabled} 
                       placeholder="e.g., Annually"/>
            </div>

            {/* OCR1 Q11: Independent Assessment/Evaluation of Policies by External Agency */}
            <h4>11. Independent Assessment/Evaluation of Policies by External Agency (OCR1 Q11)</h4>
            <div className="form-group">
                <label>
                    <input type="checkbox" checked={formData.sb_external_policy_assessment?.conducted || false} onChange={e => handleNestedChange('sb_external_policy_assessment.conducted', e.target.checked, 'checkbox', e.target.checked)} disabled={disabled} />
                    Has the entity carried out independent assessment/ evaluation of the working of its policies by an external agency? (Yes/No)
                </label>
                {formData.sb_external_policy_assessment?.conducted === true && (
                    <div className="form-group" style={{marginLeft: '20px'}}>
                        <label>If yes, provide name of the agency:</label>
                        <input type="text" value={formData.sb_external_policy_assessment?.agency_name || ''} onChange={e => handleNestedChange('sb_external_policy_assessment.agency_name', e.target.value)} disabled={disabled} />
                    </div>
                )}
            </div>
            <hr />
            {!isSubmitted && (
                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={disabled || isLoadingSave}>
                        {isLoadingSave ? 'Saving...' : 'Save Section B'}
                    </button>
                </div>
            )}
            {isSubmitted && <p>This section is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionBForm;

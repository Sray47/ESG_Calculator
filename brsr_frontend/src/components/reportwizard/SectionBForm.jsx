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
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialSectionBData);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');
    
    useEffect(() => {
        if (reportData && reportData.section_b_data) {
            // Ensure deepMerge handles the potentially new structure of initialSectionBData
            const currentInitialData = initialSectionBData; // Use the current definition
            const mergedData = deepMerge(currentInitialData, reportData.section_b_data);
            setFormData(mergedData);
        } else if (reportData) {
            setFormData(initialSectionBData);
        }
    }, [reportData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };    const handleNestedChange = (path, value, type, checked) => {
        setFormData(prev => {
            const keys = path.split('.');
            let current = { ...prev };
            let objRef = current;
            
            // Ensure all nested objects exist and are properly cloned for immutability
            for (let i = 0; i < keys.length - 1; i++) {
                // Handle null/undefined values and ensure proper object cloning
                if (!objRef[keys[i]] || typeof objRef[keys[i]] !== 'object' || Array.isArray(objRef[keys[i]])) {
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
    };
    // Fix for handleArrayObjectChange logic
    const handleArrayObjectChange = (path, index, fieldName, value, type, checked) => {
        setFormData(prev => {
            const keys = path.split('.');
            let ref = { ...prev };
            let obj = ref;

            // Navigate to the parent object of the array
            for (let i = 0; i < keys.length -1; i++) { // Iterate until the second to last key
                if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') {
                    obj[keys[i]] = {}; // Create object if it doesn't exist
                } else {
                    obj[keys[i]] = { ...obj[keys[i]] }; // Clone object for immutability
                }
                obj = obj[keys[i]];
            }

            const arrayName = keys[keys.length - 1]; // The last key is the array name

            // Ensure the target is an array
            if (!Array.isArray(obj[arrayName])) {
                obj[arrayName] = []; // Initialize as array if it's not
            }
            
            // Clone the array for immutability
            const newArray = [...obj[arrayName]];

            // Ensure the item at the index exists, or create it if it's a new item
            if (index >= newArray.length) {
                 newArray[index] = {}; // Initialize new item if index is out of bounds (for adding new items)
            } else {
                newArray[index] = { ...newArray[index] }; // Clone existing item
            }
            
            // Set the value
            newArray[index][fieldName] = type === 'checkbox' ? checked : value;
            obj[arrayName] = newArray;
            return ref;
        });
    };

    // addArrayItem and removeArrayItem might be unused if no dynamic arrays are left that use them.
    // For sb_principle_policies, it's fixed at 9.
    // If they are truly unused, they can be removed. For now, keeping them.
    const addArrayItem = (arrayPath, itemStructure) => {
        setFormData(prev => ({
            ...prev,
            [arrayPath]: [...(prev[arrayPath] || []), { ...itemStructure }]
        }));
    };
    const removeArrayItem = (arrayName, index) => {
        setFormData(prev => {
            const keys = arrayName.split('.');
            let current = { ...prev };
            let objRef = current;

            for (let i = 0; i < keys.length - 1; i++) {
                objRef[keys[i]] = Array.isArray(objRef[keys[i]]) ? [...objRef[keys[i]]] : { ...objRef[keys[i]] };
                objRef = objRef[keys[i]];
            }
            
            const finalArrayName = keys[keys.length - 1];
            const targetArray = objRef[finalArrayName];

            if (Array.isArray(targetArray)) {
                objRef[finalArrayName] = targetArray.filter((_, i) => i !== index);
            }
            
            return current;
        });
    };

    const validate = () => {
        const errors = [];
        if (!formData.sb_director_statement) errors.push("Director's statement (Sl.No.7) is required.");
        if (!formData.sb_esg_responsible_individual?.name) errors.push("ESG Responsible Individual's name (Sl.No.8) is required.");
        // Add more validation based on OCR requirements if needed
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
            return;
        }

        const success = await handleSaveProgress('section_b_data', formData);
        if (success) {
            setLocalSuccess('Section B saved successfully!');
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
            <h3>Section B: Management and Process Disclosures</h3>
            <p>This section covers the company’s governance, strategy, policies, and processes for ESG, based on provided report excerpts.</p>
            
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}

            {/* OCR2 Sl.No.7: Statement from Director */}
            <div className="form-group">
                <label htmlFor="sb_director_statement">1. Statement by director responsible for the business responsibility report (OCR2 Sl.No.7):</label>
                <textarea id="sb_director_statement" name="sb_director_statement" value={formData.sb_director_statement || ''} onChange={handleChange} disabled={disabled} rows={5} placeholder="Highlight ESG related challenges, targets, achievements..."></textarea>
            </div>

            {/* OCR2 Sl.No.8: Details of highest responsible individual for ESG */}
            <h4>2. Details of the highest authority responsible for implementation and oversight of the Business Responsibility policy(ies) (OCR2 Sl.No.8):</h4>
            <div className="form-group">
                <label>Name: <input type="text" value={formData.sb_esg_responsible_individual?.name || ''} onChange={e => handleNestedChange('sb_esg_responsible_individual.name', e.target.value)} disabled={disabled} /></label>
                <label>Designation: <input type="text" value={formData.sb_esg_responsible_individual?.designation || ''} onChange={e => handleNestedChange('sb_esg_responsible_individual.designation', e.target.value)} disabled={disabled} /></label>
                <label>DIN (if Director): <input type="text" value={formData.sb_esg_responsible_individual?.din_if_director || ''} onChange={e => handleNestedChange('sb_esg_responsible_individual.din_if_director', e.target.value)} disabled={disabled} /></label>
                <label>Email Id: <input type="email" value={formData.sb_esg_responsible_individual?.email || ''} onChange={e => handleNestedChange('sb_esg_responsible_individual.email', e.target.value)} disabled={disabled} /></label>
                <label>Contact No. (Phone): <input type="tel" value={formData.sb_esg_responsible_individual?.phone || ''} onChange={e => handleNestedChange('sb_esg_responsible_individual.phone', e.target.value)} disabled={disabled} /></label>
            </div>

            {/* OCR2 Sl.No.1-6 & OCR1 Q12: Policies for NGRBC Principles */}
            <h4>3. Policy and management processes for NGRBC Principles:</h4>
            {(formData.sb_principle_policies && Array.isArray(formData.sb_principle_policies) ? formData.sb_principle_policies : []).map((policy, index) => (
                <div key={policy.principle || index} className="principle-policy-item" style={{border: '1px solid #eee', padding: '15px', marginBottom:'15px', borderRadius: '5px'}}>
                    <h5>Principle {policy.principle}: {getPrincipleName(policy.principle)}</h5>
                    <label>
                        <input type="checkbox" checked={policy.has_policy || false} onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'has_policy', e.target.checked, 'checkbox', e.target.checked)} disabled={disabled} />
                        a. Does your entity's policy/policies cover this principle and its core elements? (OCR2 Sl.No.1a)
                    </label>
                    
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
                <button type="submit" className="form-button" disabled={isLoadingSave}>
                    {isLoadingSave ? 'Saving...' : 'Save Section B'}
                </button>
            )}
            {isSubmitted && <p>This section is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionBForm;

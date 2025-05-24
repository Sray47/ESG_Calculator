import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../../pages/ProfilePage.css'; // Re-use styles

const initialPrinciplePolicy = (principleNumber) => ({
    principle: principleNumber,
    has_policy: false,
    policy_text_or_url: '',
    specific_commitments_goals_targets: '',
    performance_against_targets: ''
});

const initialSectionBData = {
    sb_director_statement: '',
    sb_esg_responsible_individual: {
        name: '', designation: '', din_if_director: '', email: '', phone: ''
    },
    sb_principle_policies: Array.from({ length: 9 }, (_, i) => initialPrinciplePolicy(i + 1)),
    sb_brsr_governance: {
        reviewed_by_board_committee: false,
        committee_name: '',
        frequency_of_review: ''
    },
    sb_stakeholder_engagement: {
        identification_process: '',
        stakeholder_groups: [{ name: '', identification_rationale: '' }],
        consultation_channels: [{ stakeholder_group: '', channel: '', frequency: '' }],
        consulted_on_esg: false,
        consultation_details: ''
    },
    sb_materiality_assessment: {
        conducted: false,
        process_description: '',
        material_issues: [{ issue: '', rationale: '', management_approach: '' }]
    },
    sb_grievance_mechanisms: {
        covers_ngrbe_principles: false,
        details_for_stakeholders: '',
        policy_url: ''
    },
    sb_sustainability_training: {
        board_awareness_programs: false, board_training_details: '',
        kmp_awareness_programs: false, kmp_training_details: '',
        employee_awareness_programs: false, employee_training_details: ''
    },
    sb_risk_management: {
        esg_risks_embedded: false, esg_risk_embedding_details: '',
        esg_risk_assessment_details: ''
    },
    sb_value_chain_esg: {
        significant_risks_opportunities: '',
        management_actions: ''
    },
    sb_business_continuity_esg: {
        impact_on_continuity: ''
    }
};

function SectionBForm() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialSectionBData);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {
        if (reportData && reportData.section_b_data) {
            // Deep merge, ensuring arrays and nested objects are handled correctly
            const fetchedBData = reportData.section_b_data;
            const mergedData = {
                ...initialSectionBData,
                ...fetchedBData,
                sb_esg_responsible_individual: { ...initialSectionBData.sb_esg_responsible_individual, ...(fetchedBData.sb_esg_responsible_individual || {}) },
                sb_principle_policies: fetchedBData.sb_principle_policies && fetchedBData.sb_principle_policies.length === 9
                    ? fetchedBData.sb_principle_policies.map((p, i) => ({ ...initialPrinciplePolicy(i + 1), ...p }))
                    : Array.from({ length: 9 }, (_, i) => initialPrinciplePolicy(i + 1)),
                sb_brsr_governance: { ...initialSectionBData.sb_brsr_governance, ...(fetchedBData.sb_brsr_governance || {}) },
                sb_stakeholder_engagement: {
                    ...initialSectionBData.sb_stakeholder_engagement,
                    ...(fetchedBData.sb_stakeholder_engagement || {}),
                    stakeholder_groups: fetchedBData.sb_stakeholder_engagement?.stakeholder_groups?.length > 0 
                        ? fetchedBData.sb_stakeholder_engagement.stakeholder_groups 
                        : initialSectionBData.sb_stakeholder_engagement.stakeholder_groups,
                    consultation_channels: fetchedBData.sb_stakeholder_engagement?.consultation_channels?.length > 0
                        ? fetchedBData.sb_stakeholder_engagement.consultation_channels
                        : initialSectionBData.sb_stakeholder_engagement.consultation_channels,
                },
                sb_materiality_assessment: {
                    ...initialSectionBData.sb_materiality_assessment,
                    ...(fetchedBData.sb_materiality_assessment || {}),
                    material_issues: fetchedBData.sb_materiality_assessment?.material_issues?.length > 0
                        ? fetchedBData.sb_materiality_assessment.material_issues
                        : initialSectionBData.sb_materiality_assessment.material_issues,
                },
                sb_grievance_mechanisms: { ...initialSectionBData.sb_grievance_mechanisms, ...(fetchedBData.sb_grievance_mechanisms || {}) },
                sb_sustainability_training: { ...initialSectionBData.sb_sustainability_training, ...(fetchedBData.sb_sustainability_training || {}) },
                sb_risk_management: { ...initialSectionBData.sb_risk_management, ...(fetchedBData.sb_risk_management || {}) },
                sb_value_chain_esg: { ...initialSectionBData.sb_value_chain_esg, ...(fetchedBData.sb_value_chain_esg || {}) },
                sb_business_continuity_esg: { ...initialSectionBData.sb_business_continuity_esg, ...(fetchedBData.sb_business_continuity_esg || {}) },
            };
            setFormData(mergedData);
        } else if (reportData) {
            setFormData(initialSectionBData);
        }
    }, [reportData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleNestedChange = (path, value, type, checked) => {
        setFormData(prev => {
            const keys = path.split('.');
            let current = { ...prev };
            let objRef = current;
            for (let i = 0; i < keys.length - 1; i++) {
                objRef[keys[i]] = { ...objRef[keys[i]] }; // Ensure new object for path
                objRef = objRef[keys[i]];
            }
            objRef[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
            return current;
        });
    };

    const handleArrayObjectChange = (arrayName, index, fieldName, value, type, checked) => {
        setFormData(prev => {
            const newArray = [...prev[arrayName]];
            newArray[index] = { ...newArray[index], [fieldName]: type === 'checkbox' ? checked : value };
            return { ...prev, [arrayName]: newArray };
        });
    };

    const addArrayItem = (arrayName, itemStructure) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: [...(prev[arrayName] || []), { ...itemStructure }]
        }));
    };

    const removeArrayItem = (arrayName, index) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError('');
        const success = await handleSaveProgress('section_b_data', formData);
        if (success) {
            setLocalSuccess('Section B saved successfully!');
        } else {
            setLocalError('Failed to save Section B. Check wizard errors or console.');
        }
    };

    if (!reportData) return <p>Loading Section B data...</p>;
    const disabled = isSubmitted || isLoadingSave;

    // Helper for principle names
    const getPrincipleName = (number) => {
        const names = [
            "Social: Human Rights", // P1 in NGRBCs, often mapped to Env in BRSR structure
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
            <p>This section covers the company’s governance, strategy, policies, and processes for ESG.</p>
            
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}

            {/* Q1. Statement from Director */}
            <div className="form-group">
                <label htmlFor="sb_director_statement">1. Statement from Director responsible for BRSR:</label>
                <textarea id="sb_director_statement" name="sb_director_statement" value={formData.sb_director_statement || ''} onChange={handleChange} disabled={disabled} rows={5}></textarea>
            </div>

            {/* Q2. Details of highest responsible individual for ESG */}
            <h4>2. Details of the highest responsible individual for ESG:</h4>
            <div className="form-group">
                <label>Name: <input type="text" value={formData.sb_esg_responsible_individual?.name || ''} onChange={e => handleNestedChange('sb_esg_responsible_individual.name', e.target.value)} disabled={disabled} /></label>
                <label>Designation: <input type="text" value={formData.sb_esg_responsible_individual?.designation || ''} onChange={e => handleNestedChange('sb_esg_responsible_individual.designation', e.target.value)} disabled={disabled} /></label>
                <label>DIN (if Director): <input type="text" value={formData.sb_esg_responsible_individual?.din_if_director || ''} onChange={e => handleNestedChange('sb_esg_responsible_individual.din_if_director', e.target.value)} disabled={disabled} /></label>
                <label>Email: <input type="email" value={formData.sb_esg_responsible_individual?.email || ''} onChange={e => handleNestedChange('sb_esg_responsible_individual.email', e.target.value)} disabled={disabled} /></label>
                <label>Phone: <input type="tel" value={formData.sb_esg_responsible_individual?.phone || ''} onChange={e => handleNestedChange('sb_esg_responsible_individual.phone', e.target.value)} disabled={disabled} /></label>
            </div>

            {/* Q3. Policies for NGRBC Principles */}
            <h4>3. Policies for National Guidelines on Responsible Business Conduct (NGRBC) Principles:</h4>
            {formData.sb_principle_policies && formData.sb_principle_policies.map((policy, index) => (
                <div key={index} className="principle-policy-item" style={{border: '1px solid #eee', padding: '10px', marginBottom:'10px'}}>
                    <h5>Principle {policy.principle}: {getPrincipleName(policy.principle)}</h5>
                    <label>
                        <input type="checkbox" checked={policy.has_policy || false} onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'has_policy', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} />
                        Does the entity have a policy for this principle?
                    </label>
                    {policy.has_policy && (
                        <>
                            <div className="form-group">
                                <label>Weblink to policy / Text reference:</label>
                                <input type="text" value={policy.policy_text_or_url || ''} onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'policy_text_or_url', e.target.value)} disabled={disabled} />
                            </div>
                            <div className="form-group">
                                <label>Specific commitments, goals, and targets set (if any):</label>
                                <textarea value={policy.specific_commitments_goals_targets || ''} onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'specific_commitments_goals_targets', e.target.value)} disabled={disabled} rows={3}></textarea>
                            </div>
                            <div className="form-group">
                                <label>Performance of the entity against specified commitments and targets during the year:</label>
                                <textarea value={policy.performance_against_targets || ''} onChange={e => handleArrayObjectChange('sb_principle_policies', index, 'performance_against_targets', e.target.value)} disabled={disabled} rows={3}></textarea>
                            </div>
                        </>
                    )}
                </div>
            ))}

            {/* Q4. Governance of BRSR */}
            <h4>4. Governance of BRSR:</h4>
            <div className="form-group">
                <label>
                    <input type="checkbox" checked={formData.sb_brsr_governance?.reviewed_by_board_committee || false} onChange={e => handleNestedChange('sb_brsr_governance.reviewed_by_board_committee', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} />
                    Has the BRSR been reviewed by the Board or a Committee of the Board?
                </label>
                {formData.sb_brsr_governance?.reviewed_by_board_committee && (
                    <>
                        <label>Name of Committee: <input type="text" value={formData.sb_brsr_governance?.committee_name || ''} onChange={e => handleNestedChange('sb_brsr_governance.committee_name', e.target.value)} disabled={disabled} /></label>
                        <label>Frequency of Review: <input type="text" placeholder="e.g., Quarterly, Annually" value={formData.sb_brsr_governance?.frequency_of_review || ''} onChange={e => handleNestedChange('sb_brsr_governance.frequency_of_review', e.target.value)} disabled={disabled} /></label>
                    </>
                )}
            </div>

            {/* Q5. Stakeholder Engagement */}
            <h4>5. Stakeholder Engagement:</h4>
            <div className="form-group">
                <label>Process for identifying key stakeholder groups:</label>
                <textarea value={formData.sb_stakeholder_engagement?.identification_process || ''} onChange={e => handleNestedChange('sb_stakeholder_engagement.identification_process', e.target.value)} disabled={disabled} rows={3}></textarea>
            </div>
            <h5>Key Stakeholder Groups:</h5>
            {formData.sb_stakeholder_engagement?.stakeholder_groups.map((group, index) => (
                <div key={index} className="array-item">
                    <input type="text" placeholder="Stakeholder Group Name" value={group.name || ''} onChange={e => handleArrayObjectChange('sb_stakeholder_engagement.stakeholder_groups', index, 'name', e.target.value)} disabled={disabled} />
                    <input type="text" placeholder="Rationale for Identification" value={group.identification_rationale || ''} onChange={e => handleArrayObjectChange('sb_stakeholder_engagement.stakeholder_groups', index, 'identification_rationale', e.target.value)} disabled={disabled} />
                    {!disabled && <button type="button" onClick={() => removeArrayItem('sb_stakeholder_engagement.stakeholder_groups', index)}>Remove</button>}
                </div>
            ))}
            {!disabled && <button type="button" onClick={() => addArrayItem('sb_stakeholder_engagement.stakeholder_groups', { name: '', identification_rationale: '' })}>Add Stakeholder Group</button>}
            
            <h5>Consultation Channels & Frequency:</h5>
            {formData.sb_stakeholder_engagement?.consultation_channels.map((item, index) => (
                <div key={index} className="array-item">
                    <input type="text" placeholder="Stakeholder Group" value={item.stakeholder_group || ''} onChange={e => handleArrayObjectChange('sb_stakeholder_engagement.consultation_channels', index, 'stakeholder_group', e.target.value)} disabled={disabled} />
                    <input type="text" placeholder="Channel of Communication" value={item.channel || ''} onChange={e => handleArrayObjectChange('sb_stakeholder_engagement.consultation_channels', index, 'channel', e.target.value)} disabled={disabled} />
                    <input type="text" placeholder="Frequency" value={item.frequency || ''} onChange={e => handleArrayObjectChange('sb_stakeholder_engagement.consultation_channels', index, 'frequency', e.target.value)} disabled={disabled} />
                    {!disabled && <button type="button" onClick={() => removeArrayItem('sb_stakeholder_engagement.consultation_channels', index)}>Remove</button>}
                </div>
            ))}
            {!disabled && <button type="button" onClick={() => addArrayItem('sb_stakeholder_engagement.consultation_channels', { stakeholder_group: '', channel: '', frequency: '' })}>Add Channel</button>}

            <div className="form-group">
                <label>
                    <input type="checkbox" checked={formData.sb_stakeholder_engagement?.consulted_on_esg || false} onChange={e => handleNestedChange('sb_stakeholder_engagement.consulted_on_esg', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} />
                    Were stakeholder groups consulted on ESG issues?
                </label>
                {formData.sb_stakeholder_engagement?.consulted_on_esg && (
                    <textarea placeholder="Details of consultation" value={formData.sb_stakeholder_engagement?.consultation_details || ''} onChange={e => handleNestedChange('sb_stakeholder_engagement.consultation_details', e.target.value)} disabled={disabled} rows={3}></textarea>
                )}
            </div>

            {/* Q6. Materiality Assessment */}
            <h4>6. Materiality Assessment (if conducted):</h4>
            <div className="form-group">
                <label>
                    <input type="checkbox" checked={formData.sb_materiality_assessment?.conducted || false} onChange={e => handleNestedChange('sb_materiality_assessment.conducted', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} />
                    Has the entity carried out a materiality assessment?
                </label>
                {formData.sb_materiality_assessment?.conducted && (
                    <>
                        <label>Describe the process for identifying material ESG issues:</label>
                        <textarea value={formData.sb_materiality_assessment?.process_description || ''} onChange={e => handleNestedChange('sb_materiality_assessment.process_description', e.target.value)} disabled={disabled} rows={3}></textarea>
                        <h5>Material ESG Issues Identified:</h5>
                        {formData.sb_materiality_assessment?.material_issues.map((issue, index) => (
                            <div key={index} className="array-item">
                                <input type="text" placeholder="Material Issue" value={issue.issue || ''} onChange={e => handleArrayObjectChange('sb_materiality_assessment.material_issues', index, 'issue', e.target.value)} disabled={disabled} />
                                <textarea placeholder="Rationale for materiality" value={issue.rationale || ''} onChange={e => handleArrayObjectChange('sb_materiality_assessment.material_issues', index, 'rationale', e.target.value)} disabled={disabled} rows={2}></textarea>
                                <textarea placeholder="Management Approach" value={issue.management_approach || ''} onChange={e => handleArrayObjectChange('sb_materiality_assessment.material_issues', index, 'management_approach', e.target.value)} disabled={disabled} rows={2}></textarea>
                                {!disabled && <button type="button" onClick={() => removeArrayItem('sb_materiality_assessment.material_issues', index)}>Remove</button>}
                            </div>
                        ))}
                        {!disabled && <button type="button" onClick={() => addArrayItem('sb_materiality_assessment.material_issues', { issue: '', rationale: '', management_approach: '' })}>Add Material Issue</button>}
                    </>
                )}
            </div>
            
            {/* Q7. Grievance Mechanisms */}
            <h4>7. Grievance Mechanisms:</h4>
            <div className="form-group">
                <label>
                    <input type="checkbox" checked={formData.sb_grievance_mechanisms?.covers_ngrbe_principles || false} onChange={e => handleNestedChange('sb_grievance_mechanisms.covers_ngrbe_principles', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} />
                    Does the entity have grievance mechanisms covering NGRBC principles?
                </label>
            </div>
            <div className="form-group">
                <label>Details of grievance mechanisms for stakeholder groups:</label>
                <textarea value={formData.sb_grievance_mechanisms?.details_for_stakeholders || ''} onChange={e => handleNestedChange('sb_grievance_mechanisms.details_for_stakeholders', e.target.value)} disabled={disabled} rows={4}></textarea>
            </div>
            <div className="form-group">
                <label>Weblink to grievance policy (if any):</label>
                <input type="url" value={formData.sb_grievance_mechanisms?.policy_url || ''} onChange={e => handleNestedChange('sb_grievance_mechanisms.policy_url', e.target.value)} disabled={disabled} />
            </div>

            {/* Q8. Sustainability-specific training */}
            <h4>8. Sustainability-Specific Training:</h4>
            <div className="form-group">
                <label><input type="checkbox" checked={formData.sb_sustainability_training?.board_awareness_programs || false} onChange={e => handleNestedChange('sb_sustainability_training.board_awareness_programs', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> Awareness programs for Board?</label>
                {formData.sb_sustainability_training?.board_awareness_programs && <textarea placeholder="Details of Board training" value={formData.sb_sustainability_training?.board_training_details || ''} onChange={e => handleNestedChange('sb_sustainability_training.board_training_details', e.target.value)} disabled={disabled} rows={2}></textarea>}
            </div>
            <div className="form-group">
                <label><input type="checkbox" checked={formData.sb_sustainability_training?.kmp_awareness_programs || false} onChange={e => handleNestedChange('sb_sustainability_training.kmp_awareness_programs', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> Awareness programs for KMPs?</label>
                {formData.sb_sustainability_training?.kmp_awareness_programs && <textarea placeholder="Details of KMP training" value={formData.sb_sustainability_training?.kmp_training_details || ''} onChange={e => handleNestedChange('sb_sustainability_training.kmp_training_details', e.target.value)} disabled={disabled} rows={2}></textarea>}
            </div>
            <div className="form-group">
                <label><input type="checkbox" checked={formData.sb_sustainability_training?.employee_awareness_programs || false} onChange={e => handleNestedChange('sb_sustainability_training.employee_awareness_programs', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> Awareness programs for Employees?</label>
                {formData.sb_sustainability_training?.employee_awareness_programs && <textarea placeholder="Details of Employee training" value={formData.sb_sustainability_training?.employee_training_details || ''} onChange={e => handleNestedChange('sb_sustainability_training.employee_training_details', e.target.value)} disabled={disabled} rows={2}></textarea>}
            </div>

            {/* Q9. Risk Management */}
            <h4>9. Risk Management:</h4>
            <div className="form-group">
                <label><input type="checkbox" checked={formData.sb_risk_management?.esg_risks_embedded || false} onChange={e => handleNestedChange('sb_risk_management.esg_risks_embedded', e.target.value, 'checkbox', e.target.checked)} disabled={disabled} /> Are ESG risks embedded in overall risk management?</label>
                {formData.sb_risk_management?.esg_risks_embedded && <textarea placeholder="Details of embedding ESG risks" value={formData.sb_risk_management?.esg_risk_embedding_details || ''} onChange={e => handleNestedChange('sb_risk_management.esg_risk_embedding_details', e.target.value)} disabled={disabled} rows={3}></textarea>}
            </div>
            <div className="form-group">
                <label>Details of ESG risk identification, assessment, and management:</label>
                <textarea value={formData.sb_risk_management?.esg_risk_assessment_details || ''} onChange={e => handleNestedChange('sb_risk_management.esg_risk_assessment_details', e.target.value)} disabled={disabled} rows={4}></textarea>
            </div>

            {/* Q10. Value Chain ESG */}
            <h4>10. Value Chain ESG:</h4>
            <div className="form-group">
                <label>Significant ESG risks/opportunities in the value chain:</label>
                <textarea value={formData.sb_value_chain_esg?.significant_risks_opportunities || ''} onChange={e => handleNestedChange('sb_value_chain_esg.significant_risks_opportunities', e.target.value)} disabled={disabled} rows={4}></textarea>
            </div>
            <div className="form-group">
                <label>Actions taken to manage/mitigate these risks/opportunities:</label>
                <textarea value={formData.sb_value_chain_esg?.management_actions || ''} onChange={e => handleNestedChange('sb_value_chain_esg.management_actions', e.target.value)} disabled={disabled} rows={4}></textarea>
            </div>

            {/* Q11. Business Continuity & ESG */}
            <h4>11. Business Continuity & ESG:</h4>
            <div className="form-group">
                <label>Impact of ESG issues on business continuity:</label>
                <textarea value={formData.sb_business_continuity_esg?.impact_on_continuity || ''} onChange={e => handleNestedChange('sb_business_continuity_esg.impact_on_continuity', e.target.value)} disabled={disabled} rows={4}></textarea>
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

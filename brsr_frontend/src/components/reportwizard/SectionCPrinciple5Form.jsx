import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

// Essential Indicators for Principle 5
const initialP5EssentialIndicators = {
    human_rights_policy: '', // Policy on human rights
    human_rights_training_coverage_employees: '', // % of employees
    human_rights_training_coverage_workers: '', // % of workers
    
    // Minimum Wages (Male / Female for Employees, Workers, Other)
    min_wages_employees_male: '',
    min_wages_employees_female: '',
    min_wages_workers_male: '',
    min_wages_workers_female: '',
    // Remuneration/Salary/Wages (Male / Female for Employees, Workers, Other)
    // Median remuneration/salary/wage
    remuneration_employees_male: '',
    remuneration_employees_female: '',
    remuneration_workers_male: '',
    remuneration_workers_female: '',

    // Complaints related to human rights issues
    complaints_child_labour: { filed: null, pending: null, resolved: null, remarks: '' },
    complaints_forced_labour: { filed: null, pending: null, resolved: null, remarks: '' },
    complaints_sexual_harassment: { filed: null, pending: null, resolved: null, remarks: '' },
    complaints_discrimination: { filed: null, pending: null, resolved: null, remarks: '' },
    complaints_wages: { filed: null, pending: null, resolved: null, remarks: '' },
    complaints_other_hr: { filed: null, pending: null, resolved: null, remarks: '' }, // Mapped from old general complaints

    // Mechanisms to prevent adverse impacts on human rights in value chain
    value_chain_hr_impact_prevention_mechanisms: '',
    // Percentage of value chain partners covered by human rights due diligence
    value_chain_hr_due_diligence_percentage: '',
};

// Leadership Indicators for Principle 5
const initialP5LeadershipIndicators = {
    // Mechanisms for redressal of grievances of individuals/communities adversely impacted
    grievance_redressal_mechanisms_community: '',
    // Details of training on human rights to value chain partners
    value_chain_human_rights_training: '', // Existing
    // Details of business relationships with entities in the value chain that have faced human rights-related complaints
    value_chain_entities_hr_complaints_details: '', // Renamed from value_chain_human_rights_incidents
    // Corrective actions taken to address human rights negative impacts (direct or indirect)
    corrective_actions_hr_impacts: '',
    // How human rights considerations are integrated into business decision-making
    hr_integration_in_business_decisions: '',
    // Engagement with vulnerable/marginalized groups on human rights issues (already exists in provided skeleton, keeping)
    vulnerable_group_engagement: '',
    // Human rights policy for value chain partners (already exists in provided skeleton, keeping)
    value_chain_human_rights_policy: '',
};

const initialSectionCPrinciple5Data = {
    essential_indicators: initialP5EssentialIndicators,
    leadership_indicators: initialP5LeadershipIndicators,
};

function SectionCPrinciple5Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialSectionCPrinciple5Data);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {
        if (reportData) {
            // Map old general complaint fields to the new 'complaints_other_hr' structure if they exist
            const essentialData = { ...initialP5EssentialIndicators, ...(reportData.sc_p5_essential_indicators || {}) };
            if (reportData.sc_p5_essential_indicators) {
                const oldComplaints = reportData.sc_p5_essential_indicators;
                if (oldComplaints.complaints_received !== undefined) { // Check if old structure exists
                    essentialData.complaints_other_hr = {
                        filed: oldComplaints.complaints_received ?? null,
                        resolved: oldComplaints.complaints_resolved ?? null,
                        pending: oldComplaints.complaints_pending ?? null,
                        remarks: oldComplaints.complaints_remarks || ''
                    };
                    // Remove old top-level fields to avoid confusion if they are not part of initialP5EssentialIndicators
                    delete essentialData.complaints_received;
                    delete essentialData.complaints_resolved;
                    delete essentialData.complaints_pending;
                    delete essentialData.complaints_remarks;
                    delete essentialData.child_forced_involuntary_labour_incidents;
                    delete essentialData.sexual_harassment_cases;
                    delete essentialData.discrimination_cases;
                }
            }

            setFormData({
                essential_indicators: essentialData,
                leadership_indicators: { ...initialP5LeadershipIndicators, ...(reportData.sc_p5_leadership_indicators || {}) },
            });
        } else {
            setFormData(initialSectionCPrinciple5Data);
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
            sc_p5_essential_indicators: formData.essential_indicators,
            sc_p5_leadership_indicators: formData.leadership_indicators,
        };
        const success = await handleSaveProgress(payload);
        if (success) {
            setLocalSuccess('Section C, Principle 5 saved successfully!');
        } else {
            setLocalError('Failed to save Section C, Principle 5.');
        }
    };

    if (!reportData) return <p>Loading Section C, Principle 5 data...</p>;
    const disabled = isSubmitted || isLoadingSave;

    return (
        <form onSubmit={handleSubmit} className="profile-form section-c-form">
            <h3>Section C: Principle-wise Performance</h3>
            <h4>Principle 5: Businesses should respect and promote human rights.</h4>
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}

            <h5>Essential Indicators</h5>
            <div className="form-group">
                <label>1. Does the entity have a policy on human rights? If yes, provide a web link or details.</label>
                <textarea value={formData.essential_indicators.human_rights_policy || ''} onChange={e => handleNestedChange('essential_indicators', 'human_rights_policy', e.target.value)} disabled={disabled} rows={3} />
            </div>
            
            <div className="form-group">
                <label>2. Coverage of human rights training:</label>
                <label htmlFor="p5_ei_hr_training_employees">Percentage of employees covered:</label>
                <input id="p5_ei_hr_training_employees" type="text" placeholder="e.g., 90% or 500/550" value={formData.essential_indicators.human_rights_training_coverage_employees || ''} onChange={e => handleNestedChange('essential_indicators', 'human_rights_training_coverage_employees', e.target.value)} disabled={disabled} />
                <label htmlFor="p5_ei_hr_training_workers">Percentage of workers covered:</label>
                <input id="p5_ei_hr_training_workers" type="text" placeholder="e.g., 100% or 1000/1000" value={formData.essential_indicators.human_rights_training_coverage_workers || ''} onChange={e => handleNestedChange('essential_indicators', 'human_rights_training_coverage_workers', e.target.value)} disabled={disabled} />
            </div>

            <div className="form-group">
                <label>3. Details of minimum wages paid (FY):</label>
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Male (No. / Minimum Wage (INR))</th>
                            <th>Female (No. / Minimum Wage (INR))</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Employees</td>
                            <td><input type="text" placeholder="No. / Wage" value={formData.essential_indicators.min_wages_employees_male || ''} onChange={e => handleNestedChange('essential_indicators', 'min_wages_employees_male', e.target.value)} disabled={disabled} /></td>
                            <td><input type="text" placeholder="No. / Wage" value={formData.essential_indicators.min_wages_employees_female || ''} onChange={e => handleNestedChange('essential_indicators', 'min_wages_employees_female', e.target.value)} disabled={disabled} /></td>
                        </tr>
                        <tr>
                            <td>Workers</td>
                            <td><input type="text" placeholder="No. / Wage" value={formData.essential_indicators.min_wages_workers_male || ''} onChange={e => handleNestedChange('essential_indicators', 'min_wages_workers_male', e.target.value)} disabled={disabled} /></td>
                            <td><input type="text" placeholder="No. / Wage" value={formData.essential_indicators.min_wages_workers_female || ''} onChange={e => handleNestedChange('essential_indicators', 'min_wages_workers_female', e.target.value)} disabled={disabled} /></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="form-group">
                <label>4. Details of remuneration/salary/wages (Median for FY):</label>
                 <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Male (Median Remuneration (INR))</th>
                            <th>Female (Median Remuneration (INR))</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Employees</td>
                            <td><input type="text" placeholder="Median INR" value={formData.essential_indicators.remuneration_employees_male || ''} onChange={e => handleNestedChange('essential_indicators', 'remuneration_employees_male', e.target.value)} disabled={disabled} /></td>
                            <td><input type="text" placeholder="Median INR" value={formData.essential_indicators.remuneration_employees_female || ''} onChange={e => handleNestedChange('essential_indicators', 'remuneration_employees_female', e.target.value)} disabled={disabled} /></td>
                        </tr>
                        <tr>
                            <td>Workers</td>
                            <td><input type="text" placeholder="Median INR" value={formData.essential_indicators.remuneration_workers_male || ''} onChange={e => handleNestedChange('essential_indicators', 'remuneration_workers_male', e.target.value)} disabled={disabled} /></td>
                            <td><input type="text" placeholder="Median INR" value={formData.essential_indicators.remuneration_workers_female || ''} onChange={e => handleNestedChange('essential_indicators', 'remuneration_workers_female', e.target.value)} disabled={disabled} /></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="form-group">
                <label>5. Complaints / Grievances on human rights issues during the financial year:</label>
                {Object.keys(formData.essential_indicators)
                    .filter(key => key.startsWith('complaints_'))
                    .map(complaintKey => {
                        const type = complaintKey.replace('complaints_', '').replace('_', ' ').replace('hr', 'Human Rights').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        return (
                            <div key={complaintKey} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
                                <strong>{type}:</strong>
                                <div><label>Filed during year:</label> <input type="number" value={formData.essential_indicators[complaintKey].filed ?? ''} onChange={e => handleNestedChange('essential_indicators', `${complaintKey}.filed`, parseInt(e.target.value) || null)} disabled={disabled} /></div>
                                <div><label>Pending at year end:</label> <input type="number" value={formData.essential_indicators[complaintKey].pending ?? ''} onChange={e => handleNestedChange('essential_indicators', `${complaintKey}.pending`, parseInt(e.target.value) || null)} disabled={disabled} /></div>
                                <div><label>Resolved during year:</label> <input type="number" value={formData.essential_indicators[complaintKey].resolved ?? ''} onChange={e => handleNestedChange('essential_indicators', `${complaintKey}.resolved`, parseInt(e.target.value) || null)} disabled={disabled} /></div>
                                <div><label>Remarks:</label> <textarea value={formData.essential_indicators[complaintKey].remarks || ''} onChange={e => handleNestedChange('essential_indicators', `${complaintKey}.remarks`, e.target.value)} disabled={disabled} rows={2} /></div>
                            </div>
                        );
                })}
            </div>
            
            <div className="form-group">
                <label>6. Mechanisms to prevent adverse impacts on human rights in your value chain:</label>
                <textarea value={formData.essential_indicators.value_chain_hr_impact_prevention_mechanisms || ''} onChange={e => handleNestedChange('essential_indicators', 'value_chain_hr_impact_prevention_mechanisms', e.target.value)} disabled={disabled} rows={3} />
            </div>

            <div className="form-group">
                <label>7. Percentage of value chain partners (by value of business done with such partners) covered by human rights due diligence:</label>
                <input type="text" placeholder="e.g., 75% or 'All critical suppliers'" value={formData.essential_indicators.value_chain_hr_due_diligence_percentage || ''} onChange={e => handleNestedChange('essential_indicators', 'value_chain_hr_due_diligence_percentage', e.target.value)} disabled={disabled} />
            </div>

            <h5>Leadership Indicators</h5>
            <div className="form-group">
                <label>1. Mechanisms for redressal of grievances of individuals/communities who may be adversely impacted by the entity’s operations (beyond statutory requirements):</label>
                <textarea value={formData.leadership_indicators.grievance_redressal_mechanisms_community || ''} onChange={e => handleNestedChange('leadership_indicators', 'grievance_redressal_mechanisms_community', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>2. Details of training on human rights provided to value chain partners:</label>
                <textarea value={formData.leadership_indicators.value_chain_human_rights_training || ''} onChange={e => handleNestedChange('leadership_indicators', 'value_chain_human_rights_training', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>3. Details of business relationships with entities in the value chain that have faced human rights-related complaints, investigations or litigation:</label>
                <textarea value={formData.leadership_indicators.value_chain_entities_hr_complaints_details || ''} onChange={e => handleNestedChange('leadership_indicators', 'value_chain_entities_hr_complaints_details', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>4. Corrective actions taken by the entity to address human rights negative impacts (direct or indirect) by its business:</label>
                <textarea value={formData.leadership_indicators.corrective_actions_hr_impacts || ''} onChange={e => handleNestedChange('leadership_indicators', 'corrective_actions_hr_impacts', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>5. How are human rights considerations integrated into your business decision-making processes?</label>
                <textarea value={formData.leadership_indicators.hr_integration_in_business_decisions || ''} onChange={e => handleNestedChange('leadership_indicators', 'hr_integration_in_business_decisions', e.target.value)} disabled={disabled} rows={3} />
            </div>
             <div className="form-group">
                <label>6. Does the entity have a human rights policy for its value chain partners? If yes, provide details/link:</label>
                <textarea value={formData.leadership_indicators.value_chain_human_rights_policy || ''} onChange={e => handleNestedChange('leadership_indicators', 'value_chain_human_rights_policy', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>7. Details of engagement with vulnerable/marginalized groups on human rights issues:</label>
                <textarea value={formData.leadership_indicators.vulnerable_group_engagement || ''} onChange={e => handleNestedChange('leadership_indicators', 'vulnerable_group_engagement', e.target.value)} disabled={disabled} rows={3} />
            </div>
            
            <hr />
            {!isSubmitted && (
                <button type="submit" className="form-button" disabled={isLoadingSave}>
                    {isLoadingSave ? 'Saving...' : 'Save Principle 5'}
                </button>
            )}
            {isSubmitted && <p>This section is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionCPrinciple5Form;

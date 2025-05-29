import React, { useState, useEffect } from 'react'; // Added React import
import { useOutletContext } from 'react-router-dom'; // Added useOutletContext import
import { deepMerge } from '../../utils/objectUtils';

// Initial structure for new dynamic array items
const initialSIAItem = { notification_no: '', date: '', external_agency: '', results_communicated: '', weblink: '' };
const initialRAndRItem = { project_name: '', state: '', district: '', num_pafs: null, percent_covered: null, amount_paid: null };
const initialMitigationActionItem = { negative_impact: '', corrective_action: '' };
const initialAspirationalDistrictItem = { state: '', district: '', amount_spent: null };
const initialBenefitsIPItem = { ip_name: '', owned_acquired: null, benefit_shared: '', basis_calculation: '' };
const initialIPDisputeItem = { authority_name: '', case_brief: '', corrective_action: '' };
const initialCSRBeneficiaryItem = { project_name: '', num_beneficiaries: null, percent_vulnerable: null };
const initialOtherBenefitItem = { name: '', count: '', percentage: '' }; // Re-using from P3 if applicable

// Define initial data structure for Principle 8
const initialP8EssentialIndicators = {
    social_impact_assessments: [], // Array for Q1
    rehab_resettlement_projects: [], // Array for Q2
    community_grievance_mechanisms: '', // Q3 (Qualitative)
    input_material_sourcing: { // Q4
        mse_direct_percent: null,
        district_neighboring_direct_percent: null,
    },
    // Existing fields from the original code (now mapped to specific BRSR elements or integrated)
    // The original `policy_advocacy_initiatives`, `inclusive_development_programs`, `beneficiaries_count`, `impact_assessment`
    // will be integrated into more specific fields or seen as general qualitative data.
};

const initialP8LeadershipIndicators = {
    social_impact_mitigation_actions: [], // LI1
    csr_aspirational_districts_projects: [], // LI2
    preferential_procurement: { // LI3
        has_policy: null, // Yes/No
        marginalized_groups: [], // e.g., ["MSEs", "SC/ST", "Women Entrepreneurs"]
        total_procurement_from_groups_percent: null,
    },
    intellectual_property_benefits: [], // LI4
    ip_disputes_corrective_actions: [], // LI5
    csr_project_beneficiaries: [], // LI6
    // Existing fields from the original code:
    // `beyond_compliance_initiatives`, `partnerships_with_ngo`, `innovative_inclusive_projects`
    // will be integrated into other specific fields or seen as general qualitative data.
};

const initialSectionCPrinciple8Data = {
    essential_indicators: initialP8EssentialIndicators,
    leadership_indicators: initialP8LeadershipIndicators,
};

function SectionCPrinciple8Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialSectionCPrinciple8Data);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {
        if (reportData?.sc_p8_inclusive_development) {
            setFormData(prev => deepMerge(prev, reportData.sc_p8_inclusive_development));
        } else {
            setFormData(initialSectionCPrinciple8Data);
        }
    }, [reportData]);

    const handleChange = (path, value, type, checked) => {
        setFormData(prevData => {
            const keys = path.split('.');
            let current = { ...prevData };
            let objRef = current;
            for (let i = 0; i < keys.length - 1; i++) {
                objRef[keys[i]] = typeof objRef[keys[i]] === 'object' && objRef[keys[i]] !== null ? { ...objRef[keys[i]] } : {};
                objRef = objRef[keys[i]];
            }
            if (type === 'number') {
                objRef[keys[keys.length - 1]] = parseFloat(value) || null;
            } else if (type === 'checkbox') {
                objRef[keys[keys.length - 1]] = checked;
            } else {
                objRef[keys[keys.length - 1]] = value;
            }
            return current;
        });
    };

    const handleArrayObjectChange = (arrayName, index, fieldName, value, type) => {
        setFormData(prevData => {
            let arrayToUpdate;
            let isEssential = true;
            let parentKey = 'essential_indicators';

            if (prevData.essential_indicators && prevData.essential_indicators.hasOwnProperty(arrayName)) {
                arrayToUpdate = prevData.essential_indicators[arrayName];
            } else if (prevData.leadership_indicators && prevData.leadership_indicators.hasOwnProperty(arrayName)) {
                arrayToUpdate = prevData.leadership_indicators[arrayName];
                isEssential = false;
                parentKey = 'leadership_indicators';
            } else {
                console.error(`Array ${arrayName} not found in essential or leadership indicators.`);
                setLocalError(`Configuration error: Array ${arrayName} not found.`);
                return prevData; // Return previous data if array not found
            }

            if (!Array.isArray(arrayToUpdate)) {
                console.error(`Expected an array for ${arrayName}, but got:`, arrayToUpdate);
                setLocalError(`Data structure error for ${arrayName}.`);
                return prevData;
            }

            const updatedArray = [...arrayToUpdate];

            if (updatedArray[index]) {
                let val = value;
                if (type === 'number') {
                    val = value === '' ? null : parseFloat(value);
                    if (isNaN(val)) val = null; // Ensure NaN is not stored, store null instead
                } else if (type === 'checkbox') {
                    val = checked;
                }
                updatedArray[index] = { ...updatedArray[index], [fieldName]: val };

                return {
                    ...prevData,
                    [parentKey]: {
                        ...prevData[parentKey],
                        [arrayName]: updatedArray
                    }
                };
            }
            return prevData; // If index is out of bounds, return previous data
        });
    };

    const addArrayItem = (arrayName, itemStructure) => {
        setFormData(prevData => {
            // Determine if it's an essential or leadership indicator array
            if (initialP8EssentialIndicators.hasOwnProperty(arrayName)) {
                return {
                    ...prevData,
                    essential_indicators: {
                        ...prevData.essential_indicators,
                        [arrayName]: [...(prevData.essential_indicators[arrayName] || []), { ...itemStructure }],
                    },
                };
            } else if (initialP8LeadershipIndicators.hasOwnProperty(arrayName)) {
                return {
                    ...prevData,
                    leadership_indicators: {
                        ...prevData.leadership_indicators,
                        [arrayName]: [...(prevData.leadership_indicators[arrayName] || []), { ...itemStructure }],
                    },
                };
            }
            return prevData; // Should not happen
        });
    };

    const removeArrayItem = (arrayName, index) => {
        setFormData(prevData => {
            // Determine if it's an essential or leadership indicator array
            if (initialP8EssentialIndicators.hasOwnProperty(arrayName)) {
                const currentArray = prevData.essential_indicators[arrayName] || [];
                return {
                    ...prevData,
                    essential_indicators: {
                        ...prevData.essential_indicators,
                        [arrayName]: currentArray.filter((_, i) => i !== index),
                    },
                };
            } else if (initialP8LeadershipIndicators.hasOwnProperty(arrayName)) {
                const currentArray = prevData.leadership_indicators[arrayName] || [];
                return {
                    ...prevData,
                    leadership_indicators: {
                        ...prevData.leadership_indicators,
                        [arrayName]: currentArray.filter((_, i) => i !== index),
                    },
                };
            }
            return prevData; // Should not happen
        });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError('');
        const payload = { sc_p8_inclusive_development: formData };
        const success = await handleSaveProgress(payload);
        if (success) {
            setLocalSuccess('Section C, Principle 8 saved successfully!');
        } else {
            setLocalError('Failed to save Section C, Principle 8. Check wizard errors or console.');
        }
    };

    if (!reportData) return null; // Corrected incomplete if statement
    const disabled = isSubmitted || isLoadingSave;

    return (
        <form onSubmit={handleSubmit} className="profile-form section-c-form">
            <h3>Section C: Principle-wise Performance</h3>
            <h4>Principle 8: Businesses should promote inclusive growth and equitable development.</h4>
            {localError && <p className="error-message" style={{ color: 'red' }}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{ color: 'green' }}>{localSuccess}</p>}

            <h5>Essential Indicators</h5>

            {/* Q1: Social Impact Assessments */}
            <div className="form-group array-group">
                <label>1. Details of Social Impact Assessments (SIA) conducted by the entity for projects undertaken in the year:</label>
                {formData.essential_indicators.social_impact_assessments?.map((item, index) => (
                    <div key={index} className="array-item">
                        <input type="text" placeholder="SIA Notification No." value={item.notification_no || ''} onChange={e => handleArrayObjectChange('social_impact_assessments', index, 'notification_no', e.target.value)} disabled={disabled} />
                        <input type="date" placeholder="Date of SIA" value={item.date || ''} onChange={e => handleArrayObjectChange('social_impact_assessments', index, 'date', e.target.value)} disabled={disabled} />
                        <input type="text" placeholder="External Agency" value={item.external_agency || ''} onChange={e => handleArrayObjectChange('social_impact_assessments', index, 'external_agency', e.target.value)} disabled={disabled} />
                        <textarea placeholder="Results Communicated (how)" value={item.results_communicated || ''} onChange={e => handleArrayObjectChange('social_impact_assessments', index, 'results_communicated', e.target.value)} disabled={disabled} rows={2}/>
                        <input type="url" placeholder="Weblink" value={item.weblink || ''} onChange={e => handleArrayObjectChange('social_impact_assessments', index, 'weblink', e.target.value)} disabled={disabled} />
                        {!disabled && <button type="button" onClick={() => removeArrayItem('social_impact_assessments', index)} className="remove-item-button">Remove SIA</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('social_impact_assessments', initialSIAItem)} className="add-item-button">Add SIA</button>}
            </div>

            {/* Q2: Rehabilitation and Resettlement Projects */}
            <div className="form-group array-group">
                <label>2. Provide information on project(s) for which R&R is ongoing:</label>
                {formData.essential_indicators.rehab_resettlement_projects?.map((item, index) => (
                    <div key={index} className="array-item">
                        <input type="text" placeholder="Project Name" value={item.project_name || ''} onChange={e => handleArrayObjectChange('rehab_resettlement_projects', index, 'project_name', e.target.value)} disabled={disabled} />
                        <input type="text" placeholder="State" value={item.state || ''} onChange={e => handleArrayObjectChange('rehab_resettlement_projects', index, 'state', e.target.value)} disabled={disabled} />
                        <input type="text" placeholder="District" value={item.district || ''} onChange={e => handleArrayObjectChange('rehab_resettlement_projects', index, 'district', e.target.value)} disabled={disabled} />
                        <input type="number" placeholder="No. of PAFs" value={item.num_pafs ?? ''} onChange={e => handleArrayObjectChange('rehab_resettlement_projects', index, 'num_pafs', e.target.value, 'number')} disabled={disabled} />
                        <input type="number" step="0.01" placeholder="% PAFs covered" value={item.percent_covered ?? ''} onChange={e => handleArrayObjectChange('rehab_resettlement_projects', index, 'percent_covered', e.target.value, 'number')} disabled={disabled} />
                        <input type="number" step="0.01" placeholder="Amount Paid (INR)" value={item.amount_paid ?? ''} onChange={e => handleArrayObjectChange('rehab_resettlement_projects', index, 'amount_paid', e.target.value, 'number')} disabled={disabled} />
                        {!disabled && <button type="button" onClick={() => removeArrayItem('rehab_resettlement_projects', index)} className="remove-item-button">Remove Project</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('rehab_resettlement_projects', initialRAndRItem)} className="add-item-button">Add R&R Project</button>}
            </div>

            {/* Q3: Community Grievance Mechanisms */}
            <div className="form-group">
                <label>3. Describe the mechanisms to receive and redress grievances of the community:</label>
                <textarea value={formData.essential_indicators.community_grievance_mechanisms || ''} onChange={e => handleChange('essential_indicators.community_grievance_mechanisms', e.target.value)} disabled={disabled} rows={3} />
            </div>

            {/* Q4: Input Material Sourcing */}
            <div className="form-group">
                <label>4. Percentage of input material (by value) sourced from suppliers:</label>
                <div>
                    <label>a. Directly from MSMEs / small producers (%):</label>
                    <input type="number" step="0.01" value={formData.essential_indicators.input_material_sourcing?.mse_direct_percent ?? ''} onChange={e => handleChange('essential_indicators.input_material_sourcing.mse_direct_percent', e.target.value, 'number')} disabled={disabled} />
                </div>
                <div>
                    <label>b. From within the district and neighbouring districts (%):</label>
                    <input type="number" step="0.01" value={formData.essential_indicators.input_material_sourcing?.district_neighboring_direct_percent ?? ''} onChange={e => handleChange('essential_indicators.input_material_sourcing.district_neighboring_direct_percent', e.target.value, 'number')} disabled={disabled} />
                </div>
            </div>

            <h5>Leadership Indicators</h5>

            {/* LI1: Social Impact Mitigation Actions */}
            <div className="form-group array-group">
                <label>1. Provide details of actions taken to mitigate any negative social impacts identified in the SIA:</label>
                {formData.leadership_indicators.social_impact_mitigation_actions?.map((item, index) => (
                    <div key={index} className="array-item">
                        <textarea placeholder="Negative Impact Identified" value={item.negative_impact || ''} onChange={e => handleArrayObjectChange('social_impact_mitigation_actions', index, 'negative_impact', e.target.value)} disabled={disabled} rows={2}/>
                        <textarea placeholder="Corrective Action Taken" value={item.corrective_action || ''} onChange={e => handleArrayObjectChange('social_impact_mitigation_actions', index, 'corrective_action', e.target.value)} disabled={disabled} rows={2}/>
                        {!disabled && <button type="button" onClick={() => removeArrayItem('social_impact_mitigation_actions', index)} className="remove-item-button">Remove Action</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('social_impact_mitigation_actions', initialMitigationActionItem)} className="add-item-button">Add Mitigation Action</button>}
            </div>

            {/* LI2: CSR Aspirational Districts Projects */}
            <div className="form-group array-group">
                <label>2. Details of CSR projects in aspirational districts:</label>
                {formData.leadership_indicators.csr_aspirational_districts_projects?.map((item, index) => (
                    <div key={index} className="array-item">
                        <input type="text" placeholder="State" value={item.state || ''} onChange={e => handleArrayObjectChange('csr_aspirational_districts_projects', index, 'state', e.target.value)} disabled={disabled} />
                        <input type="text" placeholder="Aspirational District" value={item.district || ''} onChange={e => handleArrayObjectChange('csr_aspirational_districts_projects', index, 'district', e.target.value)} disabled={disabled} />
                        <input type="number" step="0.01" placeholder="Amount Spent (INR)" value={item.amount_spent ?? ''} onChange={e => handleArrayObjectChange('csr_aspirational_districts_projects', index, 'amount_spent', e.target.value, 'number')} disabled={disabled} />
                        {!disabled && <button type="button" onClick={() => removeArrayItem('csr_aspirational_districts_projects', index)} className="remove-item-button">Remove Project</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('csr_aspirational_districts_projects', initialAspirationalDistrictItem)} className="add-item-button">Add CSR Project</button>}
            </div>
            
            {/* LI3: Preferential Procurement */}
            <div className="form-group">
                <label>3. Does the entity have a preferential procurement policy? </label>
                <select value={formData.leadership_indicators.preferential_procurement?.has_policy === null ? '' : String(formData.leadership_indicators.preferential_procurement?.has_policy)} onChange={e => handleChange('leadership_indicators.preferential_procurement.has_policy', e.target.value === 'true' ? true : e.target.value === 'false' ? false : null)} disabled={disabled}>
                    <option value="">Select Yes/No</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
                {formData.leadership_indicators.preferential_procurement?.has_policy && (
                    <>
                        <div>
                            <label>If yes, specify the % of total procurement from marginalized/vulnerable groups:</label>
                            <input type="number" step="0.01" placeholder="% of total procurement" value={formData.leadership_indicators.preferential_procurement?.total_procurement_from_groups_percent ?? ''} onChange={e => handleChange('leadership_indicators.preferential_procurement.total_procurement_from_groups_percent', e.target.value, 'number')} disabled={disabled} />
                        </div>
                        <div>
                            <label>Specify groups covered (e.g., MSEs, SC/ST, Women Entrepreneurs - comma separated):</label>
                            <input 
                                type="text" 
                                placeholder="MSEs, SC/ST, Women Entrepreneurs" 
                                value={formData.leadership_indicators.preferential_procurement?.marginalized_groups?.join(', ') || ''} 
                                onChange={e => handleChange('leadership_indicators.preferential_procurement.marginalized_groups', e.target.value.split(',').map(s => s.trim()).filter(s => s))} 
                                disabled={disabled} 
                            />
                        </div>
                    </>
                )}
            </div>

            {/* LI4: Intellectual Property Benefits */}
            <div className="form-group array-group">
                <label>4. Details of benefits derived and shared from Intellectual Properties (IPs):</label>
                {formData.leadership_indicators.intellectual_property_benefits?.map((item, index) => (
                    <div key={index} className="array-item">
                        <input type="text" placeholder="Name of IP" value={item.ip_name || ''} onChange={e => handleArrayObjectChange('intellectual_property_benefits', index, 'ip_name', e.target.value)} disabled={disabled} />
                        <select value={item.owned_acquired === null ? '' : String(item.owned_acquired)} onChange={e => handleArrayObjectChange('intellectual_property_benefits', index, 'owned_acquired', e.target.value === 'owned' ? 'owned' : e.target.value === 'acquired' ? 'acquired' : null )} disabled={disabled}>
                            <option value="">Owned/Acquired?</option>
                            <option value="owned">Owned by entity</option>
                            <option value="acquired">Acquired from other sources</option>
                        </select>
                        <textarea placeholder="Benefit shared with stakeholders" value={item.benefit_shared || ''} onChange={e => handleArrayObjectChange('intellectual_property_benefits', index, 'benefit_shared', e.target.value)} disabled={disabled} rows={2}/>
                        <textarea placeholder="Basis of calculation" value={item.basis_calculation || ''} onChange={e => handleArrayObjectChange('intellectual_property_benefits', index, 'basis_calculation', e.target.value)} disabled={disabled} rows={2}/>
                        {!disabled && <button type="button" onClick={() => removeArrayItem('intellectual_property_benefits', index)} className="remove-item-button">Remove IP Benefit</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('intellectual_property_benefits', initialBenefitsIPItem)} className="add-item-button">Add IP Benefit</button>}
            </div>

            {/* LI5: IP Disputes Corrective Actions */}
            <div className="form-group array-group">
                <label>5. Details of corrective actions taken to address IP related disputes:</label>
                {formData.leadership_indicators.ip_disputes_corrective_actions?.map((item, index) => (
                    <div key={index} className="array-item">
                        <input type="text" placeholder="Name of Authority" value={item.authority_name || ''} onChange={e => handleArrayObjectChange('ip_disputes_corrective_actions', index, 'authority_name', e.target.value)} disabled={disabled} />
                        <textarea placeholder="Brief of the case" value={item.case_brief || ''} onChange={e => handleArrayObjectChange('ip_disputes_corrective_actions', index, 'case_brief', e.target.value)} disabled={disabled} rows={2}/>
                        <textarea placeholder="Corrective action taken" value={item.corrective_action || ''} onChange={e => handleArrayObjectChange('ip_disputes_corrective_actions', index, 'corrective_action', e.target.value)} disabled={disabled} rows={2}/>
                        {!disabled && <button type="button" onClick={() => removeArrayItem('ip_disputes_corrective_actions', index)} className="remove-item-button">Remove Dispute Action</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('ip_disputes_corrective_actions', initialIPDisputeItem)} className="add-item-button">Add IP Dispute Action</button>}
            </div>

            {/* LI6: CSR Project Beneficiaries */}
            <div className="form-group array-group">
                <label>6. Details of beneficiaries of CSR Projects:</label>
                {formData.leadership_indicators.csr_project_beneficiaries?.map((item, index) => (
                    <div key={index} className="array-item">
                        <input type="text" placeholder="Project Name/Focus Area" value={item.project_name || ''} onChange={e => handleArrayObjectChange('csr_project_beneficiaries', index, 'project_name', e.target.value)} disabled={disabled} />
                        <input type="number" placeholder="No. of Beneficiaries" value={item.num_beneficiaries ?? ''} onChange={e => handleArrayObjectChange('csr_project_beneficiaries', index, 'num_beneficiaries', e.target.value, 'number')} disabled={disabled} />
                        <input type="number" step="0.01" placeholder="% Vulnerable/Marginalized" value={item.percent_vulnerable ?? ''} onChange={e => handleArrayObjectChange('csr_project_beneficiaries', index, 'percent_vulnerable', e.target.value, 'number')} disabled={disabled} />
                        {!disabled && <button type="button" onClick={() => removeArrayItem('csr_project_beneficiaries', index)} className="remove-item-button">Remove Beneficiary Group</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('csr_project_beneficiaries', initialCSRBeneficiaryItem)} className="add-item-button">Add CSR Beneficiary Group</button>}
            </div>
            
            {/* Placeholder for other qualitative leadership indicators if needed */}
            {/* For example, general text areas for `beyond_compliance_initiatives`, `partnerships_with_ngo`, `innovative_inclusive_projects` could be added here if not covered by specific array items */}


            <hr />
            {!isSubmitted && (
                <button type="submit" className="form-button" disabled={isLoadingSave}>
                    {isLoadingSave ? 'Saving...' : 'Save Principle 8'}
                </button>
            )}
            {isSubmitted && <p>This section is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionCPrinciple8Form;
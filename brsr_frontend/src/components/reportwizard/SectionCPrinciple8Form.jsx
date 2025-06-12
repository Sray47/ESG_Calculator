import React, { useState, useEffect, useCallback } from 'react'; // Added React import
import { useOutletContext } from 'react-router-dom'; // Added useOutletContext import
import { deepMerge } from '../../utils/objectUtils';
import './SectionCPrinciple8Form.css';

// Define initial data structures based on images for Principle 8 (Current FY only)

// Essential Indicators Item Structures
const initialSIADetailItem = {
    s_no: '', 
    project_details: '', 
    sia_notification_no: '', 
    date_of_notification: '',
    conducted_by_independent_agency: null, // boolean (Yes/No)
    results_in_public_domain: null, // boolean (Yes/No)
    relevant_web_link: ''
};

const initialRRProjectItem = {
    s_no: '',
    name_of_project_ongoing_rr: '',
    state: '',
    district: '',
    no_of_paf: null,
    percent_pafs_covered_by_rr: null,
    amounts_paid_to_pafs_fy_inr: null
};

// Leadership Indicators Item Structures
const initialLI1ActionItem = {
    // s_no is not in the image for LI1
    negative_social_impact_identified: null, 
    corrective_action_taken: null
};

const initialLI2CSRItem = {
    s_no: null,
    state: null,
    aspirational_district: null,
    amount_spent_inr: null
};

const initialLI4IPBenefitItem = {
    s_no: null,
    ip_based_on_traditional_knowledge: null,
    owned_acquired: null, // 'owned' or 'acquired'
    benefit_shared_yes_no: null, // boolean
    basis_of_calculating_benefit_share: null
};

const initialLI5IPDisputeItem = {
    // s_no is not in the image for LI5
    name_of_authority: null,
    brief_of_case: null,
    corrective_action_taken: null
};

const initialLI6CSRBeneficiaryItem = {
    s_no: null,
    csr_project: null,
    persons_benefitted_from_csr: null,
    percent_beneficiaries_vulnerable_marginalized: null
};

// Main Initial State for Principle 8
const initialSectionCPrinciple8Data = {
    essential_indicators: {
        social_impact_assessments: [], // Array of initialSIADetailItem
        rehab_resettlement_projects: [], // Array of initialRRProjectItem
        community_grievance_mechanisms: '', // Text area for EI Q3
        input_material_sourcing: { // EI Q4 - Current FY only
            current_fy: {
                directly_from_msme_small_producers_percent: null,
                directly_from_district_neighbouring_percent: null,
            }
        }
    },
    leadership_indicators: {
        social_impact_mitigation_actions: [], // Array of initialLI1ActionItem (LI Q1)
        csr_aspirational_districts_projects: [], // Array of initialLI2CSRItem (LI Q2)
        preferential_procurement: { // LI Q3
            has_policy: null, // boolean Yes/No
            marginalized_vulnerable_groups_procured_from: [], // array of strings for "From which marginalized..."
            percentage_total_procurement_by_value: null, // number for "What percentage..."
        },
        ip_traditional_knowledge_benefits: [], // Array of initialLI4IPBenefitItem (LI Q4)
        ip_disputes_traditional_knowledge_actions: [], // Array of initialLI5IPDisputeItem (LI Q5)
        csr_project_beneficiaries_details: [], // Array of initialLI6CSRBeneficiaryItem (LI Q6)
    }
};


function SectionCPrinciple8Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialSectionCPrinciple8Data);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {        if (reportData?.sc_p8_inclusive_growth) {
            setFormData(deepMerge(initialSectionCPrinciple8Data, reportData.sc_p8_inclusive_growth));
        } else {
            setFormData(initialSectionCPrinciple8Data);
        }
    }, [reportData]);    // Validation function for form data
    const validateFormData = (data) => {
        const errors = [];
        const warnings = [];

        // Validate Essential Indicators
        const ei = data.essential_indicators;

        // Validate Social Impact Assessments
        if (ei.social_impact_assessments && ei.social_impact_assessments.length > 0) {
            ei.social_impact_assessments.forEach((item, index) => {
                if (!item.project_details || item.project_details.trim() === '') {
                    warnings.push(`SIA #${index + 1}: Project details are required`);
                }
                if (!item.sia_notification_no || item.sia_notification_no.trim() === '') {
                    warnings.push(`SIA #${index + 1}: SIA Notification No. is required`);
                }
                if (!item.date_of_notification) {
                    warnings.push(`SIA #${index + 1}: Date of notification is required`);
                }
            });
        }

        // Validate R&R Projects
        if (ei.rehab_resettlement_projects && ei.rehab_resettlement_projects.length > 0) {
            ei.rehab_resettlement_projects.forEach((item, index) => {
                if (!item.name_of_project_ongoing_rr || item.name_of_project_ongoing_rr.trim() === '') {
                    warnings.push(`R&R Project #${index + 1}: Project name is required`);
                }
                if (!item.state || item.state.trim() === '') {
                    warnings.push(`R&R Project #${index + 1}: State is required`);
                }
                if (!item.district || item.district.trim() === '') {
                    warnings.push(`R&R Project #${index + 1}: District is required`);
                }
                if (item.no_of_paf !== null && item.no_of_paf < 0) {
                    errors.push(`R&R Project #${index + 1}: Number of PAFs cannot be negative`);
                }
                if (item.percent_pafs_covered_by_rr !== null && (item.percent_pafs_covered_by_rr < 0 || item.percent_pafs_covered_by_rr > 100)) {
                    errors.push(`R&R Project #${index + 1}: Percentage of PAFs covered must be between 0 and 100`);
                }
                if (item.amounts_paid_to_pafs_fy_inr !== null && item.amounts_paid_to_pafs_fy_inr < 0) {
                    errors.push(`R&R Project #${index + 1}: Amount paid cannot be negative`);
                }
            });
        }

        // Validate input material sourcing percentages
        if (ei.input_material_sourcing?.current_fy) {
            const currentFy = ei.input_material_sourcing.current_fy;
            if (currentFy.directly_from_msme_small_producers_percent !== null && 
                (currentFy.directly_from_msme_small_producers_percent < 0 || currentFy.directly_from_msme_small_producers_percent > 100)) {
                errors.push('MSME sourcing percentage must be between 0 and 100');
            }
            if (currentFy.directly_from_district_neighbouring_percent !== null && 
                (currentFy.directly_from_district_neighbouring_percent < 0 || currentFy.directly_from_district_neighbouring_percent > 100)) {
                errors.push('District sourcing percentage must be between 0 and 100');
            }
        }

        // Validate Leadership Indicators
        const li = data.leadership_indicators;

        // Validate CSR projects
        if (li.csr_aspirational_districts_projects && li.csr_aspirational_districts_projects.length > 0) {
            li.csr_aspirational_districts_projects.forEach((item, index) => {
                if (!item.state || item.state.trim() === '') {
                    warnings.push(`CSR Project #${index + 1}: State is required`);
                }
                if (!item.aspirational_district || item.aspirational_district.trim() === '') {
                    warnings.push(`CSR Project #${index + 1}: Aspirational district is required`);
                }
                if (item.amount_spent_inr !== null && item.amount_spent_inr < 0) {
                    errors.push(`CSR Project #${index + 1}: Amount spent cannot be negative`);
                }
            });
        }

        // Validate preferential procurement
        if (li.preferential_procurement?.percentage_total_procurement_by_value !== null && 
            (li.preferential_procurement.percentage_total_procurement_by_value < 0 || li.preferential_procurement.percentage_total_procurement_by_value > 100)) {
            errors.push('Preferential procurement percentage must be between 0 and 100');
        }

        return { errors, warnings };
    };

    const handleChange = useCallback((path, value, type, checked) => {
        setFormData(prevData => {
            try {
                const keys = path.split('.');
                let current = { ...prevData };
                let objRef = current;
                for (let i = 0; i < keys.length - 1; i++) {
                    objRef[keys[i]] = typeof objRef[keys[i]] === 'object' && objRef[keys[i]] !== null ? { ...objRef[keys[i]] } : {};
                    objRef = objRef[keys[i]];
                }
                
                let processedValue = value;
                if (type === 'number') {
                    if (value === '' || value === null || value === undefined) {
                        processedValue = null;
                    } else {
                        processedValue = parseFloat(value);
                        if (isNaN(processedValue)) {
                            console.warn(`Invalid number value for ${path}: ${value}`);
                            processedValue = null;
                        }
                    }
                } else if (type === 'checkbox') {
                    processedValue = checked;
                } else if (type === 'radio') {
                    processedValue = value === 'true' ? true : (value === 'false' ? false : null);
                } else {
                    // Handle string 'true'/'false' from Yes/No selects
                    if (value === 'true') {
                        processedValue = true;
                    } else if (value === 'false') {
                        processedValue = false;
                    } else if (value === '' && (path.includes('has_policy') || path.includes('conducted_by_independent_agency') || path.includes('results_in_public_domain'))) {
                        processedValue = null;
                    } else {
                        processedValue = value;
                    }
                }

                objRef[keys[keys.length - 1]] = processedValue;
                return current;
            } catch (error) {
                console.error('Error updating value:', error, { path, value, type });
                return prevData; // Return unchanged state on error
            }
        });
    }, []);

    const handleArrayObjectChange = useCallback((arrayName, index, fieldName, value, type) => {
        setFormData(prevData => {
            let arrayToUpdate;
            let parentKey;

            if (initialSectionCPrinciple8Data.essential_indicators.hasOwnProperty(arrayName)) {
                parentKey = 'essential_indicators';
                arrayToUpdate = prevData.essential_indicators[arrayName];
            } else if (initialSectionCPrinciple8Data.leadership_indicators.hasOwnProperty(arrayName)) {
                parentKey = 'leadership_indicators';
                arrayToUpdate = prevData.leadership_indicators[arrayName];
            } else {
                console.error(`Array ${arrayName} not found.`);
                setLocalError(`Configuration error: Array ${arrayName} not found.`);
                return prevData;
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
                    if (isNaN(val)) val = null;
                }
                // For select Yes/No, value will be 'true', 'false', or ''. Convert to boolean or null.
                else if (value === 'true') val = true;
                else if (value === 'false') val = false;
                else if (value === '' && (fieldName.endsWith('_yes_no') || fieldName === 'conducted_by_independent_agency' || fieldName === 'results_in_public_domain' || fieldName === 'has_policy')) val = null;


                updatedArray[index] = { ...updatedArray[index], [fieldName]: val };

                return {
                    ...prevData,
                    [parentKey]: {
                        ...prevData[parentKey],
                        [arrayName]: updatedArray
                    }
                };
            }
            return prevData;
        });
    }, []);

    const addArrayItem = useCallback((arrayName, itemStructure) => {
        setFormData(prevData => {
            let parentKey;
            let currentArray;

            if (initialSectionCPrinciple8Data.essential_indicators.hasOwnProperty(arrayName)) {
                parentKey = 'essential_indicators';
                currentArray = prevData.essential_indicators[arrayName] || [];
            } else if (initialSectionCPrinciple8Data.leadership_indicators.hasOwnProperty(arrayName)) {
                parentKey = 'leadership_indicators';
                currentArray = prevData.leadership_indicators[arrayName] || [];
            } else {
                console.error(`Array ${arrayName} not found for adding.`);
                return prevData;
            }
            
            const newItem = { ...itemStructure, s_no: currentArray.length + 1 };

            return {
                ...prevData,
                [parentKey]: {
                    ...prevData[parentKey],
                    [arrayName]: [...currentArray, newItem],
                },
            };
        });
    }, []);

    const removeArrayItem = useCallback((arrayName, indexToRemove) => {
        setFormData(prevData => {
            let parentKey;
            let oldArray;

            if (initialSectionCPrinciple8Data.essential_indicators.hasOwnProperty(arrayName)) {
                parentKey = 'essential_indicators';
                oldArray = prevData.essential_indicators[arrayName] || [];
            } else if (initialSectionCPrinciple8Data.leadership_indicators.hasOwnProperty(arrayName)) {
                parentKey = 'leadership_indicators';
                oldArray = prevData.leadership_indicators[arrayName] || [];
            } else {
                console.error(`Array ${arrayName} not found for removal.`);
                return prevData;
            }

            const newArray = oldArray.filter((_, i) => i !== indexToRemove)
                                   .map((item, idx) => ({ ...item, s_no: idx + 1 })); 

            return {
                ...prevData,
                [parentKey]: {
                    ...prevData[parentKey],
                    [arrayName]: newArray,
                },
            };
        });
    }, []);    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError('');

        // Validate form data
        const validation = validateFormData(formData);
        if (validation.errors.length > 0) {
            setLocalError(`Please fix the following errors before submitting:\n${validation.errors.join('\n')}`);
            return;
        }
        if (validation.warnings.length > 0) {
            const warningMessage = `The following warnings were found:\n${validation.warnings.join('\n')}\n\nDo you want to continue saving?`;
            if (!window.confirm(warningMessage)) {
                return;
            }
        }
        // Use the correct DB column name for payload
        const payload = { sc_p8_inclusive_growth: formData };
        try {
            const success = await handleSaveProgress(payload);
            if (success) {
                setLocalSuccess('Section C, Principle 8 saved successfully!');
                if (validation.warnings.length > 0) {
                    setLocalSuccess('Section C, Principle 8 saved successfully! (with warnings acknowledged)');
                }
            } else {
                setLocalError('Failed to save Section C, Principle 8.');
            }
        } catch (error) {
            console.error('Error saving P8 form:', error);
            setLocalError('An error occurred while saving. Please try again.');
        }
    }, [formData, handleSaveProgress, setWizardError, validateFormData]);

    if (!reportData) return null;
    const disabled = isSubmitted || isLoadingSave;

    return (
        <form onSubmit={handleSubmit} className="profile-form section-c-form">
            <h3>Section C: Principle-wise Performance</h3>
            <h4>Principle 8: Businesses should promote inclusive growth and equitable development.</h4>
            {localError && <p className="error-message" style={{ color: 'red' }}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{ color: 'green' }}>{localSuccess}</p>}

            <h5>Essential Indicators</h5>            {/* EI Q1: Details of Social Impact Assessments (SIA) */}
            <div className="form-group array-group">
                <label>1. Details of Social Impact Assessments (SIA) of projects undertaken by the entity based on applicable laws, in the current financial year:</label>
                <div className="array-container">
                    {(formData.essential_indicators.social_impact_assessments || []).length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Name and Brief Details of Project</th>
                                    <th>SIA Notification No.</th>
                                    <th>Date of Notification</th>
                                    <th>Conducted by Independent Agency</th>
                                    <th>Results in Public Domain</th>
                                    <th>Relevant Web Link</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.essential_indicators.social_impact_assessments.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.s_no || index + 1}</td>
                                        <td>
                                            <input 
                                                type="text" 
                                                placeholder="Name and brief details of project" 
                                                value={item.project_details || ''} 
                                                onChange={e => handleArrayObjectChange('social_impact_assessments', index, 'project_details', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`SIA ${index + 1} project details`}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                placeholder="SIA Notification No." 
                                                value={item.sia_notification_no || ''} 
                                                onChange={e => handleArrayObjectChange('social_impact_assessments', index, 'sia_notification_no', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`SIA ${index + 1} notification number`}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="date" 
                                                value={item.date_of_notification || ''} 
                                                onChange={e => handleArrayObjectChange('social_impact_assessments', index, 'date_of_notification', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`SIA ${index + 1} notification date`}
                                            />
                                        </td>
                                        <td>
                                            <select 
                                                value={item.conducted_by_independent_agency === null ? '' : String(item.conducted_by_independent_agency)} 
                                                onChange={e => handleArrayObjectChange('social_impact_assessments', index, 'conducted_by_independent_agency', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`SIA ${index + 1} conducted by independent agency`}
                                            >
                                                <option value="">Select Yes/No</option>
                                                <option value="true">Yes</option>
                                                <option value="false">No</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select 
                                                value={item.results_in_public_domain === null ? '' : String(item.results_in_public_domain)} 
                                                onChange={e => handleArrayObjectChange('social_impact_assessments', index, 'results_in_public_domain', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`SIA ${index + 1} results in public domain`}
                                            >
                                                <option value="">Select Yes/No</option>
                                                <option value="true">Yes</option>
                                                <option value="false">No</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input 
                                                type="url" 
                                                placeholder="Relevant Web link" 
                                                value={item.relevant_web_link || ''} 
                                                onChange={e => handleArrayObjectChange('social_impact_assessments', index, 'relevant_web_link', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`SIA ${index + 1} web link`}
                                            />
                                        </td>
                                        <td>
                                            {!disabled && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeArrayItem('social_impact_assessments', index)} 
                                                    className="remove-item-button"
                                                    aria-label={`Remove SIA ${index + 1}`}
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
                        <p>No social impact assessments added yet.</p>
                    )}
                    {!disabled && (
                        <button 
                            type="button" 
                            onClick={() => addArrayItem('social_impact_assessments', initialSIADetailItem)} 
                            className="add-item-button"
                        >
                            Add SIA Details
                        </button>
                    )}
                </div>
            </div>            {/* EI Q2: Rehabilitation and Resettlement (R&R) Projects */}
            <div className="form-group array-group">
                <label>2. Provide information on project(s) for which ongoing Rehabilitation and Resettlement (R&R) is being undertaken by your entity, in the following format:</label>
                <div className="array-container">
                    {(formData.essential_indicators.rehab_resettlement_projects || []).length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Name of Project for which R&R is ongoing</th>
                                    <th>State</th>
                                    <th>District</th>
                                    <th>No. of Project Affected Families (PAFs)</th>
                                    <th>% of PAFs covered by R&R</th>
                                    <th>Amounts paid to PAFs in the FY (In INR)</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.essential_indicators.rehab_resettlement_projects.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.s_no || index + 1}</td>
                                        <td>
                                            <input 
                                                type="text" 
                                                placeholder="Name of Project for which R&R is ongoing" 
                                                value={item.name_of_project_ongoing_rr || ''} 
                                                onChange={e => handleArrayObjectChange('rehab_resettlement_projects', index, 'name_of_project_ongoing_rr', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`R&R Project ${index + 1} name`}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                placeholder="State" 
                                                value={item.state || ''} 
                                                onChange={e => handleArrayObjectChange('rehab_resettlement_projects', index, 'state', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`R&R Project ${index + 1} state`}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                placeholder="District" 
                                                value={item.district || ''} 
                                                onChange={e => handleArrayObjectChange('rehab_resettlement_projects', index, 'district', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`R&R Project ${index + 1} district`}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="number" 
                                                placeholder="No. of Project Affected Families (PAFs)" 
                                                value={item.no_of_paf ?? ''} 
                                                onChange={e => handleArrayObjectChange('rehab_resettlement_projects', index, 'no_of_paf', e.target.value, 'number')} 
                                                disabled={disabled}
                                                min="0"
                                                aria-label={`R&R Project ${index + 1} number of PAFs`}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                placeholder="% of PAFs covered by R&R" 
                                                value={item.percent_pafs_covered_by_rr ?? ''} 
                                                onChange={e => handleArrayObjectChange('rehab_resettlement_projects', index, 'percent_pafs_covered_by_rr', e.target.value, 'number')} 
                                                disabled={disabled}
                                                min="0"
                                                max="100"
                                                aria-label={`R&R Project ${index + 1} percentage covered`}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                placeholder="Amounts paid to PAFs in the FY (In INR)" 
                                                value={item.amounts_paid_to_pafs_fy_inr ?? ''} 
                                                onChange={e => handleArrayObjectChange('rehab_resettlement_projects', index, 'amounts_paid_to_pafs_fy_inr', e.target.value, 'number')} 
                                                disabled={disabled}
                                                min="0"
                                                aria-label={`R&R Project ${index + 1} amount paid`}
                                            />
                                        </td>
                                        <td>
                                            {!disabled && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeArrayItem('rehab_resettlement_projects', index)} 
                                                    className="remove-item-button"
                                                    aria-label={`Remove R&R project ${index + 1}`}
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
                        <p>No R&R projects added yet.</p>
                    )}
                    {!disabled && (
                        <button 
                            type="button" 
                            onClick={() => addArrayItem('rehab_resettlement_projects', initialRRProjectItem)} 
                            className="add-item-button"
                        >
                            Add R&R Project
                        </button>
                    )}
                </div>
            </div>            {/* EI Q3: Community Grievance Mechanisms */}
            <div className="form-group">
                <label htmlFor="p8_community_grievance_mechanisms">3. Describe the mechanisms to receive and redress grievances of the community:</label>
                <textarea 
                    id="p8_community_grievance_mechanisms"
                    value={formData.essential_indicators.community_grievance_mechanisms || ''} 
                    onChange={e => handleChange('essential_indicators.community_grievance_mechanisms', e.target.value)} 
                    disabled={disabled} 
                    rows={3}
                    aria-label="Community grievance mechanisms description"
                />
            </div>

            {/* EI Q4: Input Material Sourcing (Current FY only) */}
            <div className="form-group">
                <label>4. Percentage of input material (inputs to total inputs by value) sourced from suppliers:</label>
                <fieldset>
                    <legend>Current Financial Year</legend>
                    <div>
                        <label htmlFor="p8_msme_sourcing_percent">Directly sourced from MSMEs/ small producers (%):</label>
                        <input 
                            type="number" 
                            id="p8_msme_sourcing_percent"
                            step="0.01" 
                            value={formData.essential_indicators.input_material_sourcing?.current_fy?.directly_from_msme_small_producers_percent ?? ''} 
                            onChange={e => handleChange('essential_indicators.input_material_sourcing.current_fy.directly_from_msme_small_producers_percent', e.target.value, 'number')} 
                            disabled={disabled}
                            min="0"
                            max="100"
                            aria-label="Percentage sourced from MSMEs and small producers"
                        />
                    </div>
                    <div>
                        <label htmlFor="p8_district_sourcing_percent">Sourced directly from within the district and neighbouring districts (%):</label>
                        <input 
                            type="number" 
                            id="p8_district_sourcing_percent"
                            step="0.01" 
                            value={formData.essential_indicators.input_material_sourcing?.current_fy?.directly_from_district_neighbouring_percent ?? ''} 
                            onChange={e => handleChange('essential_indicators.input_material_sourcing.current_fy.directly_from_district_neighbouring_percent', e.target.value, 'number')} 
                            disabled={disabled}
                            min="0"
                            max="100"
                            aria-label="Percentage sourced from district and neighbouring districts"
                        />
                    </div>
                </fieldset>
            </div>

            <h5>Leadership Indicators</h5>
            <p className="leadership-indicators-note">
                <em>Leadership indicators are optional and help demonstrate advanced ESG practices beyond basic compliance.</em>
            </p>            {/* LI Q1: Social Impact Mitigation Actions */}
            <div className="form-group array-group">
                <label>1. Provide details of actions taken to mitigate any negative social impacts identified in the Social Impact Assessments (Reference: Question 1 of Essential Indicators above):</label>
                <div className="array-container">
                    {(formData.leadership_indicators.social_impact_mitigation_actions || []).length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Details of Negative Social Impact Identified</th>
                                    <th>Corrective Action Taken</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.leadership_indicators.social_impact_mitigation_actions.map((item, index) => (
                                    <tr key={index}>                                        <td>
                                            <textarea 
                                                placeholder="Optional: Details of negative social impact identified" 
                                                value={item.negative_social_impact_identified || ''} 
                                                onChange={e => handleArrayObjectChange('social_impact_mitigation_actions', index, 'negative_social_impact_identified', e.target.value || null)} 
                                                disabled={disabled} 
                                                rows={2}
                                                aria-label={`Social impact ${index + 1} identified`}
                                            />
                                        </td>
                                        <td>
                                            <textarea 
                                                placeholder="Optional: Corrective action taken" 
                                                value={item.corrective_action_taken || ''} 
                                                onChange={e => handleArrayObjectChange('social_impact_mitigation_actions', index, 'corrective_action_taken', e.target.value || null)} 
                                                disabled={disabled} 
                                                rows={2}
                                                aria-label={`Corrective action ${index + 1}`}
                                            />
                                        </td>
                                        <td>
                                            {!disabled && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeArrayItem('social_impact_mitigation_actions', index)} 
                                                    className="remove-item-button"
                                                    aria-label={`Remove mitigation action ${index + 1}`}
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
                        <p>No social impact mitigation actions added yet.</p>
                    )}
                    {!disabled && (
                        <button 
                            type="button" 
                            onClick={() => addArrayItem('social_impact_mitigation_actions', initialLI1ActionItem)} 
                            className="add-item-button"
                        >
                            Add Mitigation Action
                        </button>
                    )}
                </div>
            </div>            {/* LI Q2: CSR Projects in Aspirational Districts */}
            <div className="form-group array-group">
                <label>2. Provide the following information on CSR projects undertaken by your entity in designated aspirational districts as identified by government bodies:</label>
                <div className="array-container">
                    {(formData.leadership_indicators.csr_aspirational_districts_projects || []).length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>State</th>
                                    <th>Aspirational District</th>
                                    <th>Amount spent (In INR)</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.leadership_indicators.csr_aspirational_districts_projects.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.s_no || index + 1}</td>                                        <td>
                                            <input 
                                                type="text" 
                                                placeholder="Optional: State" 
                                                value={item.state || ''} 
                                                onChange={e => handleArrayObjectChange('csr_aspirational_districts_projects', index, 'state', e.target.value || null)} 
                                                disabled={disabled}
                                                aria-label={`CSR project ${index + 1} state`}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                placeholder="Optional: Aspirational District" 
                                                value={item.aspirational_district || ''} 
                                                onChange={e => handleArrayObjectChange('csr_aspirational_districts_projects', index, 'aspirational_district', e.target.value || null)} 
                                                disabled={disabled}
                                                aria-label={`CSR project ${index + 1} aspirational district`}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                placeholder="Amount spent (In INR)" 
                                                value={item.amount_spent_inr ?? ''} 
                                                onChange={e => handleArrayObjectChange('csr_aspirational_districts_projects', index, 'amount_spent_inr', e.target.value, 'number')} 
                                                disabled={disabled}
                                                min="0"
                                                aria-label={`CSR project ${index + 1} amount spent`}
                                            />
                                        </td>
                                        <td>
                                            {!disabled && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeArrayItem('csr_aspirational_districts_projects', index)} 
                                                    className="remove-item-button"
                                                    aria-label={`Remove CSR project ${index + 1}`}
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
                        <p>No CSR aspirational district projects added yet.</p>
                    )}
                    {!disabled && (
                        <button 
                            type="button" 
                            onClick={() => addArrayItem('csr_aspirational_districts_projects', initialLI2CSRItem)} 
                            className="add-item-button"
                        >
                            Add CSR Project
                        </button>
                    )}
                </div>
            </div>
              {/* LI Q3: Preferential Procurement Policy */}
            <div className="form-group">
                <label htmlFor="p8_preferential_procurement_policy">3. (a) Do you have a preferential procurement policy where you give preference to purchase from suppliers comprising marginalized /vulnerable groups?</label>
                <select 
                    id="p8_preferential_procurement_policy"
                    value={formData.leadership_indicators.preferential_procurement?.has_policy === null ? '' : String(formData.leadership_indicators.preferential_procurement?.has_policy)} 
                    onChange={e => handleChange('leadership_indicators.preferential_procurement.has_policy', e.target.value)} 
                    disabled={disabled}
                    aria-label="Has preferential procurement policy"
                >
                    <option value="">Select Yes/No</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
                {formData.leadership_indicators.preferential_procurement?.has_policy && (
                    <>
                        <div className="form-group">
                            <label htmlFor="p8_marginalized_groups_procured">From which marginalized /vulnerable groups do you procure?</label>
                            <input 
                                type="text" 
                                id="p8_marginalized_groups_procured"
                                placeholder="e.g., MSEs, SC/ST, Women Entrepreneurs (comma separated)" 
                                value={formData.leadership_indicators.preferential_procurement?.marginalized_vulnerable_groups_procured_from?.join(', ') || ''} 
                                onChange={e => handleChange('leadership_indicators.preferential_procurement.marginalized_vulnerable_groups_procured_from', e.target.value.split(',').map(s => s.trim()).filter(s => s))} 
                                disabled={disabled}
                                aria-label="Marginalized and vulnerable groups procured from"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="p8_procurement_percentage">What percentage of total procurement (by value) does it constitute?</label>
                            <input 
                                type="number" 
                                id="p8_procurement_percentage"
                                step="0.01" 
                                placeholder="% of total procurement" 
                                value={formData.leadership_indicators.preferential_procurement?.percentage_total_procurement_by_value ?? ''} 
                                onChange={e => handleChange('leadership_indicators.preferential_procurement.percentage_total_procurement_by_value', e.target.value, 'number')} 
                                disabled={disabled}
                                min="0"
                                max="100"
                                aria-label="Percentage of total procurement by value"
                            />
                        </div>
                    </>
                )}
            </div>            {/* LI Q4: Intellectual Property Benefits (Traditional Knowledge) */}
            <div className="form-group array-group">
                <label>4. Details of the benefits derived and shared from the intellectual properties owned or acquired by your entity (in the current financial year), based on traditional knowledge:</label>
                <div className="array-container">
                    {(formData.leadership_indicators.ip_traditional_knowledge_benefits || []).length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Intellectual Property based on traditional knowledge</th>
                                    <th>Owned/Acquired</th>
                                    <th>Benefit shared (Yes/No)</th>
                                    <th>Basis of calculating benefit share</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.leadership_indicators.ip_traditional_knowledge_benefits.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.s_no || index + 1}</td>
                                        <td>
                                            <input 
                                                type="text" 
                                                placeholder="Optional: Intellectual Property based on traditional knowledge" 
                                                value={item.ip_based_on_traditional_knowledge || ''} 
                                                onChange={e => handleArrayObjectChange('ip_traditional_knowledge_benefits', index, 'ip_based_on_traditional_knowledge', e.target.value || null)} 
                                                disabled={disabled}
                                                aria-label={`IP Traditional Knowledge ${index + 1} description`}
                                            />
                                        </td>
                                        <td>
                                            <select 
                                                value={item.owned_acquired || ''} 
                                                onChange={e => handleArrayObjectChange('ip_traditional_knowledge_benefits', index, 'owned_acquired', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`IP Traditional Knowledge ${index + 1} owned or acquired`}
                                            >
                                                <option value="">Select</option>
                                                <option value="owned">Owned by entity</option>
                                                <option value="acquired">Acquired from other sources</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select 
                                                value={item.benefit_shared_yes_no === null ? '' : String(item.benefit_shared_yes_no)} 
                                                onChange={e => handleArrayObjectChange('ip_traditional_knowledge_benefits', index, 'benefit_shared_yes_no', e.target.value)} 
                                                disabled={disabled}
                                                aria-label={`IP Traditional Knowledge ${index + 1} benefit shared`}
                                            >
                                                <option value="">Select Yes/No</option>
                                                <option value="true">Yes</option>
                                                <option value="false">No</option>
                                            </select>
                                        </td>
                                        <td>
                                            <textarea 
                                                placeholder="Optional: Basis of calculating benefit share" 
                                                value={item.basis_of_calculating_benefit_share || ''} 
                                                onChange={e => handleArrayObjectChange('ip_traditional_knowledge_benefits', index, 'basis_of_calculating_benefit_share', e.target.value || null)} 
                                                disabled={disabled} 
                                                rows={2}
                                                aria-label={`IP Traditional Knowledge ${index + 1} basis of calculation`}
                                            />
                                        </td>
                                        <td>
                                            {!disabled && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeArrayItem('ip_traditional_knowledge_benefits', index)} 
                                                    className="remove-item-button"
                                                    aria-label={`Remove IP traditional knowledge ${index + 1}`}
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
                        <p>No IP traditional knowledge benefits added yet.</p>
                    )}
                    {!disabled && (
                        <button 
                            type="button" 
                            onClick={() => addArrayItem('ip_traditional_knowledge_benefits', initialLI4IPBenefitItem)} 
                            className="add-item-button"
                        >
                            Add IP Benefit
                        </button>
                    )}
                </div>
            </div>            {/* LI Q5: IP Disputes (Traditional Knowledge) Corrective Actions */}
            <div className="form-group array-group">
                <label>5. Details of corrective actions taken or underway, based on any adverse order in intellectual property related disputes wherein usage of traditional knowledge is involved:</label>
                <div className="array-container">
                    {(formData.leadership_indicators.ip_disputes_traditional_knowledge_actions || []).length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name of Authority</th>
                                    <th>Brief of the Case</th>
                                    <th>Corrective Action Taken</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.leadership_indicators.ip_disputes_traditional_knowledge_actions.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            <input 
                                                type="text" 
                                                placeholder="Optional: Name of authority" 
                                                value={item.name_of_authority || ''} 
                                                onChange={e => handleArrayObjectChange('ip_disputes_traditional_knowledge_actions', index, 'name_of_authority', e.target.value || null)} 
                                                disabled={disabled}
                                                aria-label={`IP Dispute ${index + 1} authority name`}
                                            />
                                        </td>
                                        <td>
                                            <textarea 
                                                placeholder="Optional: Brief of the Case" 
                                                value={item.brief_of_case || ''} 
                                                onChange={e => handleArrayObjectChange('ip_disputes_traditional_knowledge_actions', index, 'brief_of_case', e.target.value || null)} 
                                                disabled={disabled} 
                                                rows={2}
                                                aria-label={`IP Dispute ${index + 1} case brief`}
                                            />
                                        </td>
                                        <td>
                                            <textarea 
                                                placeholder="Optional: Corrective action taken" 
                                                value={item.corrective_action_taken || ''} 
                                                onChange={e => handleArrayObjectChange('ip_disputes_traditional_knowledge_actions', index, 'corrective_action_taken', e.target.value || null)} 
                                                disabled={disabled} 
                                                rows={2}
                                                aria-label={`IP Dispute ${index + 1} corrective action`}
                                            />
                                        </td>
                                        <td>
                                            {!disabled && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeArrayItem('ip_disputes_traditional_knowledge_actions', index)} 
                                                    className="remove-item-button"
                                                    aria-label={`Remove IP dispute ${index + 1}`}
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
                        <p>No IP disputes added yet.</p>
                    )}
                    {!disabled && (
                        <button 
                            type="button" 
                            onClick={() => addArrayItem('ip_disputes_traditional_knowledge_actions', initialLI5IPDisputeItem)} 
                            className="add-item-button"
                        >
                            Add Dispute Action
                        </button>
                    )}
                </div>
            </div>            {/* LI Q6: Details of beneficiaries of CSR Projects */}
            <div className="form-group array-group">
                <label>6. Details of beneficiaries of CSR Projects:</label>
                <div className="array-container">
                    {(formData.leadership_indicators.csr_project_beneficiaries_details || []).length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>CSR Project</th>
                                    <th>No. of persons benefitted from CSR Projects</th>
                                    <th>% of beneficiaries from vulnerable and marginalized groups</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.leadership_indicators.csr_project_beneficiaries_details.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.s_no || index + 1}</td>
                                        <td>
                                            <input 
                                                type="text" 
                                                placeholder="Optional: CSR Project" 
                                                value={item.csr_project || ''} 
                                                onChange={e => handleArrayObjectChange('csr_project_beneficiaries_details', index, 'csr_project', e.target.value || null)} 
                                                disabled={disabled}
                                                aria-label={`CSR Beneficiary ${index + 1} project name`}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="number" 
                                                placeholder="No. of persons benefitted from CSR Projects" 
                                                value={item.persons_benefitted_from_csr ?? ''} 
                                                onChange={e => handleArrayObjectChange('csr_project_beneficiaries_details', index, 'persons_benefitted_from_csr', e.target.value, 'number')} 
                                                disabled={disabled}
                                                min="0"
                                                aria-label={`CSR Beneficiary ${index + 1} number of persons`}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                placeholder="% of beneficiaries from vulnerable and marginalized groups" 
                                                value={item.percent_beneficiaries_vulnerable_marginalized ?? ''} 
                                                onChange={e => handleArrayObjectChange('csr_project_beneficiaries_details', index, 'percent_beneficiaries_vulnerable_marginalized', e.target.value, 'number')} 
                                                disabled={disabled}
                                                min="0"
                                                max="100"
                                                aria-label={`CSR Beneficiary ${index + 1} percentage vulnerable`}
                                            />
                                        </td>
                                        <td>
                                            {!disabled && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeArrayItem('csr_project_beneficiaries_details', index)} 
                                                    className="remove-item-button"
                                                    aria-label={`Remove CSR beneficiary ${index + 1}`}
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
                        <p>No CSR project beneficiaries added yet.</p>
                    )}
                    {!disabled && (
                        <button 
                            type="button" 
                            onClick={() => addArrayItem('csr_project_beneficiaries_details', initialLI6CSRBeneficiaryItem)} 
                            className="add-item-button"
                        >
                            Add Beneficiary Details
                        </button>
                    )}
                </div>
            </div>
            
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
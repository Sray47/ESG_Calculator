import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { deepMerge } from '../../utils/objectUtils'; // Assuming objectUtils.js has deepMerge

const complaintCategories = [
    { key: 'data_privacy', label: 'Data Privacy' },
    { key: 'advertising', label: 'Advertising' },
    { key: 'cyber_security', label: 'Cyber-security' },
    { key: 'delivery_essential_services', label: 'Delivery of essential services' },
    { key: 'restrictive_trade_practices', label: 'Restrictive Trade Practices' },
    { key: 'unfair_trade_practices', label: 'Unfair Trade Practices' },
    { key: 'other', label: 'Other' }, // Removed "(Please specify)" to match image more closely for table
];

// Define initial data structure for Principle 9 (Current FY focus)
const initialP9EssentialIndicators = {
    mechanisms_consumer_complaints_feedback: '', // EI Q1
    turnover_product_services_info: { // EI Q2
        environmental_social_parameters_turnover_percent: null,
        safe_responsible_usage_turnover_percent: null,
        recycling_disposal_turnover_percent: null,
    },
    consumer_complaints_summary: complaintCategories.map(cat => ({ // EI Q3 (Current FY only)
        category: cat.key,
        current_fy: { received_during_year: null, pending_resolution_at_year_end: null, remarks: '' },
        // previous_fy removed as per instruction
    })),
    product_recalls_safety: { // EI Q4
        voluntary_recalls: { number: null, reasons_for_recall: '' },
        forced_recalls: { number: null, reasons_for_recall: '' },
    },
    cyber_security_data_privacy_policy: { // EI Q5
        has_policy: null, // Yes/No
        policy_weblink: '',
        cybersecurity_investment_percent_revenue: null, // New  
    },
    corrective_actions_details: '', // EI Q6 (Single textarea for all sub-points as per image structure)
    ethical_supply_chain_governance: { // New  
        has_framework: null, // Yes/No
        code_of_conduct_followed: '',
    }
};

const initialP9LeadershipIndicators = {
    product_service_info_channels_platforms: null, // LI Q1 (Weblink if available)
    steps_inform_educate_safe_responsible_usage: null, // LI Q2
    mechanisms_inform_risk_disruption_essential_services: null, // LI Q3
    product_info_display_above_mandate: { // LI Q4 Part 1
        displays_yes_no_na: null, // Yes/No/Not Applicable
        details_if_yes: null,
    },
    consumer_satisfaction_survey_details: { // LI Q4 Part 2
        survey_carried_out_yes_no: null, // Yes/No
        // Details for survey are implicitly part of the overall question in image, not a separate field
    },
    data_breaches_info: { // LI Q5
        instances_along_with_impact: null, // Combined field for a. Number and impact
        percentage_involving_pii: null,
    },
};

const initialSectionCPrinciple9Data = {
    essential_indicators: initialP9EssentialIndicators,
    leadership_indicators: initialP9LeadershipIndicators,
};

function SectionCPrinciple9Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialSectionCPrinciple9Data);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    // Style constants
    const inputStyle = {
        width: '100%',
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px'
    };

    const textareaStyle = {
        width: '100%',
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px',
        minHeight: '60px',
        resize: 'vertical'
    };

    useEffect(() => {
        if (reportData?.section_c_data?.principle_9) {
            setFormData(prev => deepMerge(initialSectionCPrinciple9Data, reportData.section_c_data.principle_9));
        } else {
            setFormData(initialSectionCPrinciple9Data);
        }
    }, [reportData]);

    // Utility function for immutable nested object updates
    const setNestedValue = (obj, path, value) => {
        const keys = Array.isArray(path) ? path : path.split('.');
        const result = { ...obj };
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
                current[keys[i]] = {};
            } else {
                current[keys[i]] = { ...current[keys[i]] };
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return result;
    };

    // Enhanced validation function with field-specific validation
    const validateField = (name, value) => {
        const errors = {};
        
        // Percentage validation
        if (name.includes('percent') || name.includes('percentage')) {
            if (value !== null && value !== undefined && value !== '') {
                const numValue = parseFloat(value);
                if (isNaN(numValue) || numValue < 0 || numValue > 100) {
                    errors[name] = `${name} must be a number between 0 and 100`;
                }
            }
        }
        
        // Numeric validation for complaint counts
        if (name.includes('received_during_year') || name.includes('pending_resolution')) {
            if (value !== null && value !== undefined && value !== '') {
                const numValue = parseInt(value, 10);
                if (isNaN(numValue) || numValue < 0) {
                    errors[name] = `${name} must be a non-negative number`;
                }
            }
        }
        
        return errors;
    };

    // Client-side validation function
    const validateForm = () => {
        const errors = {};

        // Validate percentage fields (should be between 0 and 100)
        const percentageFields = [
            { path: 'essential_indicators.turnover_product_services_info.environmental_social_parameters_turnover_percent', label: 'Environmental and social parameters turnover percentage' },
            { path: 'essential_indicators.turnover_product_services_info.safe_responsible_usage_turnover_percent', label: 'Safe and responsible usage turnover percentage' },
            { path: 'essential_indicators.turnover_product_services_info.recycling_disposal_turnover_percent', label: 'Recycling and disposal turnover percentage' },
            { path: 'essential_indicators.cyber_security_data_privacy_policy.cybersecurity_investment_percent_revenue', label: 'Cybersecurity investment percentage' },
            { path: 'leadership_indicators.data_breaches_info.percentage_involving_pii', label: 'Percentage of data breaches involving PII' }
        ];

        percentageFields.forEach(field => {
            const value = getValueByPath(formData, field.path);
            if (value !== null && value !== undefined && value !== '') {
                if (value < 0 || value > 100) {
                    errors[field.path] = `${field.label} must be between 0 and 100`;
                }
            }
        });

        // Validate negative numbers for count fields
        const countFields = [
            { path: 'essential_indicators.product_recalls_safety.voluntary_recalls.number', label: 'Voluntary recalls number' },
            { path: 'essential_indicators.product_recalls_safety.forced_recalls.number', label: 'Forced recalls number' }
        ];

        countFields.forEach(field => {
            const value = getValueByPath(formData, field.path);
            if (value !== null && value !== undefined && value !== '' && value < 0) {
                errors[field.path] = `${field.label} cannot be negative`;
            }
        });

        // Validate complaint numbers (should not be negative)
        if (formData.essential_indicators.consumer_complaints_summary) {
            formData.essential_indicators.consumer_complaints_summary.forEach((complaint, index) => {
                const categoryLabel = complaintCategories.find(cat => cat.key === complaint.category)?.label || complaint.category;
                
                if (complaint.current_fy?.received_during_year !== null && complaint.current_fy?.received_during_year < 0) {
                    errors[`complaint_${complaint.category}_received`] = `${categoryLabel} - Received complaints cannot be negative`;
                }
                if (complaint.current_fy?.pending_resolution_at_year_end !== null && complaint.current_fy?.pending_resolution_at_year_end < 0) {
                    errors[`complaint_${complaint.category}_pending`] = `${categoryLabel} - Pending complaints cannot be negative`;
                }
                if (complaint.current_fy?.pending_resolution_at_year_end > complaint.current_fy?.received_during_year && 
                    complaint.current_fy?.received_during_year !== null && complaint.current_fy?.pending_resolution_at_year_end !== null) {
                    errors[`complaint_${complaint.category}_pending`] = `${categoryLabel} - Pending complaints cannot exceed received complaints`;
                }
            });
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Helper function to get value by path
    const getValueByPath = (obj, path) => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    };    const handleChange = (path, value, type, checked) => {
        setFormData(prevData => {
            const keys = path.split('.');
            let current = { ...prevData };
            let objRef = current;
            for (let i = 0; i < keys.length - 1; i++) {
                objRef[keys[i]] = (typeof objRef[keys[i]] === 'object' && objRef[keys[i]] !== null) ? { ...objRef[keys[i]] } : {};
                objRef = objRef[keys[i]];
            }
            
            let processedValue = value;
            if (type === 'number') {
                processedValue = value === '' ? null : parseFloat(value);
                if (isNaN(processedValue)) processedValue = null;
            } else if (type === 'checkbox') { // For actual checkbox inputs if any
                processedValue = checked;
            } else if (value === 'true') {
                processedValue = true;
            } else if (value === 'false') {
                processedValue = false;
            } else if (value === '' && (path.endsWith('_yes_no') || path.endsWith('.has_policy') || path.endsWith('.has_framework'))) {
                // handles Yes/No selects becoming null when empty option is chosen
                processedValue = null;
            }

            objRef[keys[keys.length - 1]] = processedValue;
            
            // Clear validation error for this field if it exists
            if (validationErrors[path]) {
                setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[path];
                    return newErrors;
                });
            }
            
            return current;
        });
    };    const handleComplaintChange = (categoryKey, fieldName, value, inputType = 'number') => {
        setFormData(prev => {
            const newComplaints = prev.essential_indicators.consumer_complaints_summary.map(complaint => {
                if (complaint.category === categoryKey) {
                    let processedValue;                    if (inputType === 'number') {
                        processedValue = value === '' ? null : (parseInt(value, 10) || 0);
                    } else { // For text fields like remarks
                        processedValue = value;
                    }
                    return {
                        ...complaint,
                        current_fy: {
                            ...complaint.current_fy,
                            [fieldName]: processedValue
                        }
                    };
                }
                return complaint;
            });

            // Clear validation errors for this complaint field
            const errorKey = fieldName === 'remarks' ? null : `complaint_${categoryKey}_${fieldName === 'received_during_year' ? 'received' : 'pending'}`;
            if (errorKey && validationErrors[errorKey]) {
                setValidationErrors(prevErrors => {
                    const newErrors = { ...prevErrors };
                    delete newErrors[errorKey];
                    return newErrors;
                });
            }

            return {
                ...prev,
                essential_indicators: {
                    ...prev.essential_indicators,
                    consumer_complaints_summary: newComplaints
                }
            };
        });
    };const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError('');

        // Validate form before submission
        if (!validateForm()) {
            setLocalError('Please fix the validation errors before submitting.');
            return;
        }

        // Use correct DB column name for payload
        const payload = {
            sc_p9_consumer_value: formData
        };

        const success = await handleSaveProgress(payload);
        if (success) {
            setLocalSuccess('Principle 9 data saved successfully!');
        } else {
            setLocalError('Failed to save Principle 9 data. Check wizard errors or console.');
        }
    };

    if (!reportData) return <p>Loading Section C, Principle 9 data...</p>;
    const disabled = isSubmitted || isLoadingSave;

    // Helper to render Yes/No select
    const renderYesNoSelect = (value, onChangeHandler, disabledFlag, name) => (
        <select name={name} value={value === null ? '' : String(value)} onChange={onChangeHandler} disabled={disabledFlag}>
            <option value="">Select Yes/No</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
        </select>
    );    return (
        <form onSubmit={handleSubmit} className="profile-form section-c-form">
            <h3 className="section-title">Section C: Principle-wise Performance</h3>
            <h4 className="sub-title">Principle 9: Businesses should engage with and provide value to their consumers in a responsible manner.</h4>
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}
            
            {/* Display validation errors */}
            {Object.keys(validationErrors).length > 0 && (
                <div className="validation-errors" style={{backgroundColor: '#ffebee', border: '1px solid #f44336', borderRadius: '4px', padding: '10px', marginBottom: '20px'}}>
                    <h5 style={{color: '#f44336', margin: '0 0 10px 0'}}>Please fix the following errors:</h5>
                    <ul style={{margin: 0, paddingLeft: '20px'}}>
                        {Object.values(validationErrors).map((error, index) => (
                            <li key={index} style={{color: '#f44336'}}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="form-section">
                <h5>Essential Indicators</h5>

                {/* EI Q1: Mechanisms to receive and respond to consumer complaints and feedback */}
                <div className="form-group">
                    <label>1. Describe the mechanisms in place to receive and respond to consumer complaints and feedback:</label>
                    <textarea 
                        value={formData.essential_indicators.mechanisms_consumer_complaints_feedback || ''} 
                        onChange={e => handleChange('essential_indicators.mechanisms_consumer_complaints_feedback', e.target.value)} 
                        disabled={disabled} 
                        rows={3} 
                    />
                </div>

                {/* EI Q2: Turnover of products and/ services as a percentage of turnover from all products/service that carry information about: */}
                <div className="form-group">
                    <label>2. Turnover of products and/ services as a percentage of turnover from all products/service that carry information about:</label>                <div style={{ marginLeft: '20px' }}>
                        <label>Environmental and social parameters relevant to the product (As a percentage to total turnover):</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            max="100"
                            style={{...inputStyle, borderColor: validationErrors['essential_indicators.turnover_product_services_info.environmental_social_parameters_turnover_percent'] ? '#f44336' : inputStyle.borderColor}}
                            value={formData.essential_indicators.turnover_product_services_info?.environmental_social_parameters_turnover_percent ?? ''} 
                            onChange={e => handleChange('essential_indicators.turnover_product_services_info.environmental_social_parameters_turnover_percent', e.target.value, 'number')} 
                            disabled={disabled} 
                            placeholder="%"
                        />
                        {validationErrors['essential_indicators.turnover_product_services_info.environmental_social_parameters_turnover_percent'] && (
                            <span style={{color: '#f44336', fontSize: '0.8em', display: 'block'}}>
                                {validationErrors['essential_indicators.turnover_product_services_info.environmental_social_parameters_turnover_percent']}
                            </span>
                        )}
                        <label>Safe and responsible usage (As a percentage to total turnover):</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            max="100"
                            style={{...inputStyle, borderColor: validationErrors['essential_indicators.turnover_product_services_info.safe_responsible_usage_turnover_percent'] ? '#f44336' : inputStyle.borderColor}}
                            value={formData.essential_indicators.turnover_product_services_info?.safe_responsible_usage_turnover_percent ?? ''} 
                            onChange={e => handleChange('essential_indicators.turnover_product_services_info.safe_responsible_usage_turnover_percent', e.target.value, 'number')} 
                            disabled={disabled} 
                            placeholder="%"
                        />
                        {validationErrors['essential_indicators.turnover_product_services_info.safe_responsible_usage_turnover_percent'] && (
                            <span style={{color: '#f44336', fontSize: '0.8em', display: 'block'}}>
                                {validationErrors['essential_indicators.turnover_product_services_info.safe_responsible_usage_turnover_percent']}
                            </span>
                        )}
                        <label>Recycling and/or safe disposal (As a percentage to total turnover):</label>                    <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            max="100"
                            style={{...inputStyle, borderColor: validationErrors['essential_indicators.turnover_product_services_info.recycling_disposal_turnover_percent'] ? '#f44336' : inputStyle.borderColor}}
                            value={formData.essential_indicators.turnover_product_services_info?.recycling_disposal_turnover_percent ?? ''} 
                            onChange={e => handleChange('essential_indicators.turnover_product_services_info.recycling_disposal_turnover_percent', e.target.value, 'number')} 
                            disabled={disabled} 
                            placeholder="%"
                        />
                        {validationErrors['essential_indicators.turnover_product_services_info.recycling_disposal_turnover_percent'] && (
                            <span style={{color: '#f44336', fontSize: '0.8em', display: 'block'}}>
                                {validationErrors['essential_indicators.turnover_product_services_info.recycling_disposal_turnover_percent']}
                            </span>
                        )}
                    </div>
                </div>

                {/* EI Q3: Number of consumer complaints (Current FY only) */}
                <div className="form-group">
                    <label>3. Number of consumer complaints in respect of the following (Current Financial Year):</label>
                    <table className="brsr-table card" style={{width: '100%', marginBottom: '20px'}}>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Received during the year (Current FY)</th>
                                <th>Pending resolution at end of year (Current FY)</th>
                                <th>Remarks (Current FY)</th>
                            </tr>
                        </thead>
                        <tbody>                        {formData.essential_indicators.consumer_complaints_summary?.map((item) => (
                            <tr key={item.category}>
                                <td>{complaintCategories.find(cat => cat.key === item.category)?.label}</td>
                                <td>
                                    <input 
                                        type="number" 
                                        style={{...inputStyle, borderColor: validationErrors[`complaint_${item.category}_received`] ? '#f44336' : inputStyle.borderColor}}
                                        value={item.current_fy?.received_during_year ?? ''} 
                                        onChange={e => handleComplaintChange(item.category, 'received_during_year', e.target.value, 'number')} 
                                        disabled={disabled} 
                                        min="0"
                                    />
                                    {validationErrors[`complaint_${item.category}_received`] && (
                                        <div style={{color: '#f44336', fontSize: '0.7em', marginTop: '2px'}}>
                                            {validationErrors[`complaint_${item.category}_received`]}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <input 
                                        type="number" 
                                        style={{...inputStyle, borderColor: validationErrors[`complaint_${item.category}_pending`] ? '#f44336' : inputStyle.borderColor}}
                                        value={item.current_fy?.pending_resolution_at_year_end ?? ''} 
                                        onChange={e => handleComplaintChange(item.category, 'pending_resolution_at_year_end', e.target.value, 'number')} 
                                        disabled={disabled} 
                                        min="0"
                                    />
                                    {validationErrors[`complaint_${item.category}_pending`] && (
                                        <div style={{color: '#f44336', fontSize: '0.7em', marginTop: '2px'}}>
                                            {validationErrors[`complaint_${item.category}_pending`]}
                                        </div>
                                    )}
                                </td>
                                <td><input type="text" value={item.current_fy?.remarks || ''} onChange={e => handleComplaintChange(item.category, 'remarks', e.target.value, 'text')} disabled={disabled} /></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* EI Q4: Details of instances of product recalls on account of safety issues */}
                <div className="form-group">
                    <label>4. Details of instances of product recalls on account of safety issues:</label>
                    <div style={{ marginLeft: '20px' }}>                    <label>Voluntary recalls - Number:</label>
                        <input 
                            type="number" 
                            min="0"
                            style={{...inputStyle, borderColor: validationErrors['essential_indicators.product_recalls_safety.voluntary_recalls.number'] ? '#f44336' : inputStyle.borderColor}}
                            value={formData.essential_indicators.product_recalls_safety?.voluntary_recalls?.number ?? ''} 
                            onChange={e => handleChange('essential_indicators.product_recalls_safety.voluntary_recalls.number', e.target.value, 'number')} 
                            disabled={disabled}
                        />
                        {validationErrors['essential_indicators.product_recalls_safety.voluntary_recalls.number'] && (
                            <span style={{color: '#f44336', fontSize: '0.8em', display: 'block'}}>
                                {validationErrors['essential_indicators.product_recalls_safety.voluntary_recalls.number']}
                            </span>
                        )}
                        <label>Voluntary recalls - Reasons for recall:</label>
                        <textarea 
                            style={textareaStyle}
                            value={formData.essential_indicators.product_recalls_safety?.voluntary_recalls?.reasons_for_recall || ''} 
                            onChange={e => handleChange('essential_indicators.product_recalls_safety.voluntary_recalls.reasons_for_recall', e.target.value)} 
                            disabled={disabled} 
                            rows={2}
                        />                    <label>Forced recalls - Number:</label>
                        <input 
                            type="number" 
                            min="0"
                            style={{...inputStyle, borderColor: validationErrors['essential_indicators.product_recalls_safety.forced_recalls.number'] ? '#f44336' : inputStyle.borderColor}}
                            value={formData.essential_indicators.product_recalls_safety?.forced_recalls?.number ?? ''} 
                            onChange={e => handleChange('essential_indicators.product_recalls_safety.forced_recalls.number', e.target.value, 'number')} 
                            disabled={disabled}
                        />
                        {validationErrors['essential_indicators.product_recalls_safety.forced_recalls.number'] && (
                            <span style={{color: '#f44336', fontSize: '0.8em', display: 'block'}}>
                                {validationErrors['essential_indicators.product_recalls_safety.forced_recalls.number']}
                            </span>
                        )}
                        <label>Forced recalls - Reasons for recall:</label>
                        <textarea 
                            style={textareaStyle}
                            value={formData.essential_indicators.product_recalls_safety?.forced_recalls?.reasons_for_recall || ''} 
                            onChange={e => handleChange('essential_indicators.product_recalls_safety.forced_recalls.reasons_for_recall', e.target.value)} 
                            disabled={disabled} 
                            rows={2}
                        />
                    </div>
                </div>

                {/* EI Q5: Does the entity have a framework/ policy on cyber security and risks related to data privacy? */}
                <div className="form-group">
                    <label>5. Does the entity have a framework/ policy on cyber security and risks related to data privacy? (Yes/No)</label>
                    {renderYesNoSelect(
                        formData.essential_indicators.cyber_security_data_privacy_policy?.has_policy,
                        e => handleChange('essential_indicators.cyber_security_data_privacy_policy.has_policy', e.target.value),
                        disabled,
                        'cyber_security_policy_has_policy'
                    )}
                    {formData.essential_indicators.cyber_security_data_privacy_policy?.has_policy && (
                        <>
                            <label>If available, provide a web-link of the policy:</label>
                            <input 
                                type="url" 
                                style={inputStyle}
                                value={formData.essential_indicators.cyber_security_data_privacy_policy?.policy_weblink || ''} 
                                onChange={e => handleChange('essential_indicators.cyber_security_data_privacy_policy.policy_weblink', e.target.value)} 
                                disabled={disabled} 
                                placeholder="https://example.com/policy"
                            />
                        </>
                    )}                <label>Cybersecurity Investment as % of Revenue:</label>
                     <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max="100"
                        style={{...inputStyle, borderColor: validationErrors['essential_indicators.cyber_security_data_privacy_policy.cybersecurity_investment_percent_revenue'] ? '#f44336' : inputStyle.borderColor}}
                        value={formData.essential_indicators.cyber_security_data_privacy_policy?.cybersecurity_investment_percent_revenue ?? ''} 
                        onChange={e => handleChange('essential_indicators.cyber_security_data_privacy_policy.cybersecurity_investment_percent_revenue', e.target.value, 'number')} 
                        disabled={disabled} 
                        placeholder="%"
                    />
                    {validationErrors['essential_indicators.cyber_security_data_privacy_policy.cybersecurity_investment_percent_revenue'] && (
                        <span style={{color: '#f44336', fontSize: '0.8em', display: 'block'}}>
                            {validationErrors['essential_indicators.cyber_security_data_privacy_policy.cybersecurity_investment_percent_revenue']}
                        </span>
                    )}
                    <p style={{fontSize: '0.8em', color: 'gray'}}>Description: Proportion of revenue allocated to cybersecurity.</p>
                </div>

                {/* EI Q6: Provide details of any corrective actions taken or underway on issues relating to advertising, and delivery of essential services; cyber security and data privacy of customers; re-occurrence of instances of product recalls; penalty / action taken by regulatory authorities on safety of products / services. */}
                <div className="form-group">
                    <label>6. Provide details of any corrective actions taken or underway on issues relating to advertising, and delivery of essential services; cyber security and data privacy of customers; re-occurrence of instances of product recalls; penalty / action taken by regulatory authorities on safety of products / services.</label>
                    <textarea 
                        style={textareaStyle}
                        value={formData.essential_indicators.corrective_actions_details || ''} 
                        onChange={e => handleChange('essential_indicators.corrective_actions_details', e.target.value)} 
                        disabled={disabled} 
                        rows={4} 
                    />
                </div>

                {/* New Custom EI: Ethical Supply Chain Governance */}
                <div className="form-group">
                    <label>7. Does the company implement an Integrated Ethical Supply Chain Governance framework?</label>
                    {renderYesNoSelect(
                        formData.essential_indicators.ethical_supply_chain_governance?.has_framework,
                        e => handleChange('essential_indicators.ethical_supply_chain_governance.has_framework', e.target.value),
                        disabled,
                        'ethical_supply_chain_has_framework'
                    )}
                    {formData.essential_indicators.ethical_supply_chain_governance?.has_framework && (
                        <>
                            <label>If yes, which code of conduct is followed:</label>
                            <input 
                                type="text" 
                                style={inputStyle}
                                value={formData.essential_indicators.ethical_supply_chain_governance?.code_of_conduct_followed || ''} 
                                onChange={e => handleChange('essential_indicators.ethical_supply_chain_governance.code_of_conduct_followed', e.target.value)} 
                                disabled={disabled} 
                                placeholder="e.g., RBA, Internal CoC"
                            />
                        </>
                    )}
                     <p style={{fontSize: '0.8em', color: 'gray'}}>Description: Yes & No, if yes which code of conduct is followed.</p>
                </div>
            </div>

            <div className="form-section">
                <hr />
                <h5>Leadership Indicators</h5>
                <p className="leadership-indicators-note">
                    <em>Leadership indicators are optional and help demonstrate advanced ESG practices beyond basic compliance.</em>
                </p>

                {/* LI Q1: Channels / platforms where information on products and services of the entity can be accessed (provide web link, if available). */}
                <div className="form-group">
                    <label>1. Channels / platforms where information on products and services of the entity can be accessed (provide web link, if available).</label>
                    <textarea 
                        style={textareaStyle}
                        value={formData.leadership_indicators.product_service_info_channels_platforms || ''} 
                        onChange={e => handleChange('leadership_indicators.product_service_info_channels_platforms', e.target.value)} 
                        disabled={disabled} 
                        rows={3} 
                        placeholder="Optional: e.g., Company Website: https://example.com/products, Mobile App: MyApp, Retail Stores"
                    />
                </div>

                {/* LI Q2: Steps taken to inform and educate consumers about safe and responsible usage of products and/or services. */}
                <div className="form-group">
                    <label>2. Steps taken to inform and educate consumers about safe and responsible usage of products and/or services.</label>
                    <textarea 
                        style={textareaStyle}
                        value={formData.leadership_indicators.steps_inform_educate_safe_responsible_usage || ''} 
                        onChange={e => handleChange('leadership_indicators.steps_inform_educate_safe_responsible_usage', e.target.value)} 
                        disabled={disabled} 
                        rows={3} 
                        placeholder="Optional: Describe steps taken"
                    />
                </div>

                {/* LI Q3: Mechanisms in place to inform consumers of any risk of disruption/discontinuation of essential services. */}
                <div className="form-group">
                    <label>3. Mechanisms in place to inform consumers of any risk of disruption/discontinuation of essential services.</label>
                    <textarea 
                        style={textareaStyle}
                        value={formData.leadership_indicators.mechanisms_inform_risk_disruption_essential_services || ''} 
                        onChange={e => handleChange('leadership_indicators.mechanisms_inform_risk_disruption_essential_services', e.target.value)} 
                        disabled={disabled} 
                        rows={3} 
                        placeholder="Optional: Describe mechanisms"
                    />
                </div>

                {/* LI Q4: Does the entity display product information on the product over and above what is mandated as per local laws? (Yes/No/Not Applicable) If yes, provide details in brief. Did your entity carry out any survey with regard to consumer satisfaction relating to the major products / services of the entity, significant locations of operation of the entity or the entity as a whole? (Yes/No) */}
                <div className="form-group">
                    <label>4. Does the entity display product information on the product over and above what is mandated as per local laws? (Yes/No/Not Applicable)</label>
                    <select 
                        name="product_info_above_mandate_select"
                        value={formData.leadership_indicators.product_info_display_above_mandate?.displays_yes_no_na || ''} 
                        onChange={e => handleChange('leadership_indicators.product_info_display_above_mandate.displays_yes_no_na', e.target.value)} 
                        disabled={disabled}
                    >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Not Applicable">Not Applicable</option>
                    </select>
                    {formData.leadership_indicators.product_info_display_above_mandate?.displays_yes_no_na === 'Yes' && (
                        <>
                            <label>If yes, provide details in brief:</label>
                            <textarea 
                                style={textareaStyle}
                                value={formData.leadership_indicators.product_info_display_above_mandate?.details_if_yes || ''} 
                                onChange={e => handleChange('leadership_indicators.product_info_display_above_mandate.details_if_yes', e.target.value)} 
                                disabled={disabled} 
                                rows={2}
                                placeholder="Optional: Provide details"
                            />
                        </>
                    )}
                    <label style={{marginTop: '15px'}}>Did your entity carry out any survey with regard to consumer satisfaction relating to the major products / services of the entity, significant locations of operation of the entity or the entity as a whole? (Yes/No)</label>
                    {renderYesNoSelect(
                        formData.leadership_indicators.consumer_satisfaction_survey_details?.survey_carried_out_yes_no,
                        e => handleChange('leadership_indicators.consumer_satisfaction_survey_details.survey_carried_out_yes_no', e.target.value),
                        disabled,
                        'consumer_satisfaction_survey_conducted'
                    )}
                     {/* The image implies details are part of the general question, not a separate field if 'Yes' */}
                </div>

                {/* LI Q5: Provide the following information relating to data breaches: */}
                <div className="form-group">
                    <label>5. Provide the following information relating to data breaches:</label>
                    <div style={{ marginLeft: '20px' }}>
                        <label>a. Number of instances of data breaches along-with impact:</label>
                        <textarea 
                            style={textareaStyle}
                            value={formData.leadership_indicators.data_breaches_info?.instances_along_with_impact || ''} 
                            onChange={e => handleChange('leadership_indicators.data_breaches_info.instances_along_with_impact', e.target.value)} 
                            disabled={disabled} 
                            rows={3} 
                            placeholder="Optional: e.g., 2 instances: Instance 1 - impacted 500 users, data accessed included names and emails. Instance 2 - impacted 1000 users, data accessed included addresses."
                        />                    <label>b. Percentage of data breaches involving personally identifiable information of customers:</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            max="100"
                            style={{...inputStyle, borderColor: validationErrors['leadership_indicators.data_breaches_info.percentage_involving_pii'] ? '#f44336' : inputStyle.borderColor}}
                            value={formData.leadership_indicators.data_breaches_info?.percentage_involving_pii ?? ''} 
                            onChange={e => handleChange('leadership_indicators.data_breaches_info.percentage_involving_pii', e.target.value, 'number')} 
                            disabled={disabled} 
                            placeholder="%"
                        />
                        {validationErrors['leadership_indicators.data_breaches_info.percentage_involving_pii'] && (
                            <span style={{color: '#f44336', fontSize: '0.8em', display: 'block'}}>
                                {validationErrors['leadership_indicators.data_breaches_info.percentage_involving_pii']}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="form-actions">
                <button type="submit" className="btn btn-primary submit-btn" disabled={disabled || isLoadingSave}>
                    {isLoadingSave ? 'Saving...' : 'Save Principle 9'}
                </button>
            </div>
        </form>
    );
}

export default SectionCPrinciple9Form;
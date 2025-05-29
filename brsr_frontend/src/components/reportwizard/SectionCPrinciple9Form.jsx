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
    { key: 'other', label: 'Other (Please specify)' },
];

// Define initial data structure for Principle 9
const initialP9EssentialIndicators = {
    customer_satisfaction_mechanisms: '', // EI 1
    product_services_info_turnover: { // EI 2
        info_carried: null, // Yes/No
        turnover_percentage: null, // Percentage
        details: '', // Qualitative details
    },
    consumer_complaints: complaintCategories.map(cat => ({
        category: cat.key,
        current_fy: { received: null, pending: null, remarks: '' },
        previous_fy: { received: null, pending: null, remarks: '' },
    })), // EI 3 (Dynamic table)
    product_recall_incidents: { // EI 4
        voluntary_recalls: null,
        forced_recalls: null,
        details: '',
    },
    cyber_security_policy: { // EI 5
        has_policy: null, // Yes/No
        weblink: '',
    },
    corrective_actions_p9_issues: '', // EI 6
};

const initialP9LeadershipIndicators = {
    product_info_channels: '', // LI 1
    consumer_education_safe_usage: '', // LI 2
    service_disruption_mechanisms: '', // LI 3
    product_info_above_mandated: { // LI 4
        is_displayed: null, // Yes/No
        details: '',
    },
    consumer_satisfaction_survey: { // LI 4 (part 2)
        conducted: null, // Yes/No
        survey_details: '',
    },
    data_breaches: { // LI 5
        num_instances: null,
        impact_details: '',
        percent_pii_breached: null,
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

    useEffect(() => {
        if (reportData?.section_c_data?.principle_9) {
            // Deep merge to ensure all initial fields are present and preserve fetched data
            setFormData(prev => deepMerge(prev, reportData.section_c_data.principle_9));
        } else {
            setFormData(initialSectionCPrinciple9Data);
        }
    }, [reportData]);

    const handleChange = (path, value, type, checked) => {
        setFormData(prevData => {
            const keys = path.split('.');
            let current = { ...prevData };
            let objRef = current;
            for (let i = 0; i < keys.length - 1; i++) {
                objRef[keys[i]] = isObject(objRef[keys[i]]) ? { ...objRef[keys[i]] } : {};
                objRef = objRef[keys[i]];
            }
            objRef[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
            return current;
        });
    };

    const handleComplaintChange = (categoryKey, fyType, fieldName, value) => {
        setFormData(prev => {
            const newComplaints = prev.essential_indicators.consumer_complaints.map(complaint => {
                if (complaint.category === categoryKey) {
                    return {
                        ...complaint,
                        [fyType]: {
                            ...complaint[fyType],
                            [fieldName]: value
                        }
                    };
                }
                return complaint;
            });
            return {
                ...prev,
                essential_indicators: {
                    ...prev.essential_indicators,
                    consumer_complaints: newComplaints
                }
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError('');

        const payload = {
            section_c_data: {
                ...reportData?.section_c_data, // Preserve other principles' data
                principle_9: formData,
            }
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

    return (
        <form onSubmit={handleSubmit} className="profile-form section-c-form">
            <h3>Section C: Principle-wise Performance</h3>
            <h4>Principle 9: Businesses should engage with and provide value to their customers and consumers in a responsible manner.</h4>
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}

            <h5>Essential Indicators</h5>

            {/* EI 1: Customer Satisfaction Mechanisms (Q1) */}
            <div className="form-group">
                <label>1. Describe the mechanisms in place to receive and respond to consumer complaints and feedback:</label>
                <textarea value={formData.essential_indicators.customer_satisfaction_mechanisms || ''} onChange={e => handleChange('essential_indicators.customer_satisfaction_mechanisms', e.target.value)} disabled={disabled} rows={3} />
            </div>

            {/* EI 2: Product/Services Turnover with Information (Q2) */}
            <div className="form-group">
                <h5>2. Turnover of products and/ services as a percentage of turnover from all products/services that carry information about:</h5>
                <label>a. Is information on Environmental and social parameters relevant to the product carried?</label>
                <select value={formData.essential_indicators.product_services_info_turnover.info_carried ?? ''} onChange={e => handleChange('essential_indicators.product_services_info_turnover.info_carried', e.target.value === 'true')} disabled={disabled}>
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
                {formData.essential_indicators.product_services_info_turnover.info_carried === true && (
                    <label>b. Percentage of total turnover contributed by such products/services:</label>
                )}
                <input type="number" step="0.01" value={formData.essential_indicators.product_services_info_turnover.turnover_percentage ?? ''} onChange={e => handleChange('essential_indicators.product_services_info_turnover.turnover_percentage', parseFloat(e.target.value) || null)} disabled={disabled} />
                <label>c. Details/Remarks regarding such information (e.g., if N.A.):</label>
                <textarea value={formData.essential_indicators.product_services_info_turnover.details || ''} onChange={e => handleChange('essential_indicators.product_services_info_turnover.details', e.target.value)} disabled={disabled} rows={2} />
            </div>

            {/* EI 3: Number of Consumer Complaints (Q3) */}
            <div className="form-group">
                <h5>3. Number of consumer complaints in respect of the following:</h5>
                <table className="brsr-table" style={{width: '100%', marginBottom: '20px'}}>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Current FY Received</th>
                            <th>Current FY Pending</th>
                            <th>Previous FY Received</th>
                            <th>Previous FY Pending</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.essential_indicators.consumer_complaints.map((item) => (
                            <tr key={item.category}>
                                <td>{complaintCategories.find(cat => cat.key === item.category)?.label}</td>
                                <td><input type="number" value={item.current_fy.received ?? ''} onChange={e => handleComplaintChange(item.category, 'current_fy', 'received', parseInt(e.target.value) || null)} disabled={disabled} /></td>
                                <td><input type="number" value={item.current_fy.pending ?? ''} onChange={e => handleComplaintChange(item.category, 'current_fy', 'pending', parseInt(e.target.value) || null)} disabled={disabled} /></td>
                                <td><input type="number" value={item.previous_fy.received ?? ''} onChange={e => handleComplaintChange(item.category, 'previous_fy', 'received', parseInt(e.target.value) || null)} disabled={disabled} /></td>
                                <td><input type="number" value={item.previous_fy.pending ?? ''} onChange={e => handleComplaintChange(item.category, 'previous_fy', 'pending', parseInt(e.target.value) || null)} disabled={disabled} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* EI 4: Details of instances of product recalls (Q4) */}
            <div className="form-group">
                <h5>4. Details of instances of product recalls on account of safety issues:</h5>
                <label>Voluntary Recalls (Count): <input type="number" value={formData.essential_indicators.product_recall_incidents.voluntary_recalls ?? ''} onChange={e => handleChange('essential_indicators.product_recall_incidents.voluntary_recalls', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                <label>Forced Recalls (Count): <input type="number" value={formData.essential_indicators.product_recall_incidents.forced_recalls ?? ''} onChange={e => handleChange('essential_indicators.product_recall_incidents.forced_recalls', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                <label>Reasons for recall / Details: <textarea value={formData.essential_indicators.product_recall_incidents.details || ''} onChange={e => handleChange('essential_indicators.product_recall_incidents.details', e.target.value)} disabled={disabled} rows={2} /></label>
            </div>

            {/* EI 5: Cyber security framework/policy (Q5) */}
            <div className="form-group">
                <h5>5. Does the entity have a framework/policy on cyber security and risks related to data privacy?</h5>
                <select value={formData.essential_indicators.cyber_security_policy.has_policy ?? ''} onChange={e => handleChange('essential_indicators.cyber_security_policy.has_policy', e.target.value === 'true')} disabled={disabled}>
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
                {formData.essential_indicators.cyber_security_policy.has_policy === true && (
                    <label>Web Link to policy: <input type="url" value={formData.essential_indicators.cyber_security_policy.weblink || ''} onChange={e => handleChange('essential_indicators.cyber_security_policy.weblink', e.target.value)} disabled={disabled} /></label>
                )}
            </div>

            {/* EI 6: Corrective actions (Q6) */}
            <div className="form-group">
                <h5>6. Provide details of any corrective actions taken or underway on issues relating to:</h5>
                <label>a. Advertising, and delivery of essential services:</label>
                <textarea value={formData.essential_indicators.corrective_actions_p9_issues.advertising_delivery || ''} onChange={e => handleChange('essential_indicators.corrective_actions_p9_issues.advertising_delivery', e.target.value)} disabled={disabled} rows={2} />
                <label>b. Cyber security and data privacy of customers:</label>
                <textarea value={formData.essential_indicators.corrective_actions_p9_issues.cyber_data_privacy || ''} onChange={e => handleChange('essential_indicators.corrective_actions_p9_issues.cyber_data_privacy', e.target.value)} disabled={disabled} rows={2} />
                <label>c. Re-occurrence of instances of product recalls:</label>
                <textarea value={formData.essential_indicators.corrective_actions_p9_issues.product_recalls_reoccurrence || ''} onChange={e => handleChange('essential_indicators.corrective_actions_p9_issues.product_recalls_reoccurrence', e.target.value)} disabled={disabled} rows={2} />
                <label>d. Penalty / action taken by regulatory authorities on safety of products / services:</label>
                <textarea value={formData.essential_indicators.corrective_actions_p9_issues.regulatory_action || ''} onChange={e => handleChange('essential_indicators.corrective_actions_p9_issues.regulatory_action', e.target.value)} disabled={disabled} rows={2} />
            </div>

            <hr />
            <h5>Leadership Indicators</h5>

            {/* LI 1: Channels / platforms where information on products and services can be accessed */}
            <div className="form-group">
                <h5>1. Channels / platforms where information on products and services of the entity can be accessed (provide web link, if available):</h5>
                <textarea value={formData.leadership_indicators.product_info_channels || ''} onChange={e => handleChange('leadership_indicators.product_info_channels', e.target.value)} disabled={disabled} rows={2} />
            </div>

            {/* LI 2: Steps taken to inform and educate consumers about safe and responsible usage */}
            <div className="form-group">
                <h5>2. Steps taken to inform and educate consumers about safe and responsible usage of products and/or services:</h5>
                <textarea value={formData.leadership_indicators.consumer_education_safe_usage || ''} onChange={e => handleChange('leadership_indicators.consumer_education_safe_usage', e.target.value)} disabled={disabled} rows={3} />
            </div>

            {/* LI 3: Mechanisms to inform consumers of any risk of disruption/discontinuation of essential services */}
            <div className="form-group">
                <h5>3. Mechanisms in place to inform consumers of any risk of disruption/discontinuation of essential services:</h5>
                <textarea value={formData.leadership_indicators.service_disruption_mechanisms || ''} onChange={e => handleChange('leadership_indicators.service_disruption_mechanisms', e.target.value)} disabled={disabled} rows={3} />
            </div>

            {/* LI 4: Product information above mandated laws and Consumer satisfaction survey */}
            <div className="form-group">
                <h5>4. Does the entity display product information on the product over and above what is mandated as per local laws?</h5>
                <select value={formData.leadership_indicators.product_info_above_mandated.is_displayed ?? ''} onChange={e => handleChange('leadership_indicators.product_info_above_mandated.is_displayed', e.target.value === 'true')} disabled={disabled}>
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
                {formData.leadership_indicators.product_info_above_mandated.is_displayed === true && (
                    <label>Provide details: <textarea value={formData.leadership_indicators.product_info_above_mandated.details || ''} onChange={e => handleChange('leadership_indicators.product_info_above_mandated.details', e.target.value)} disabled={disabled} rows={2} /></label>
                )}
                <h5>Did your entity carry out any survey with regard to consumer satisfaction?</h5>
                <select value={formData.leadership_indicators.consumer_satisfaction_survey.conducted ?? ''} onChange={e => handleChange('leadership_indicators.consumer_satisfaction_survey.conducted', e.target.value === 'true')} disabled={disabled}>
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
                {formData.leadership_indicators.consumer_satisfaction_survey.conducted === true && (
                    <label>Provide details: <textarea value={formData.leadership_indicators.consumer_satisfaction_survey.survey_details || ''} onChange={e => handleChange('leadership_indicators.consumer_satisfaction_survey.survey_details', e.target.value)} disabled={disabled} rows={2} /></label>
                )}
            </div>

            {/* LI 5: Data Breaches */}
            <div className="form-group">
                <h5>5. Provide the following information relating to data breaches:</h5>
                <label>a. Number of instances of data breaches: <input type="number" value={formData.leadership_indicators.data_breaches.num_instances ?? ''} onChange={e => handleChange('leadership_indicators.data_breaches.num_instances', parseInt(e.target.value) || null)} disabled={disabled} /></label>
                <label>Impact of data breaches (details): <textarea value={formData.leadership_indicators.data_breaches.impact_details || ''} onChange={e => handleChange('leadership_indicators.data_breaches.impact_details', e.target.value)} disabled={disabled} rows={2} /></label>
                <label>b. Percentage of data breaches involving personally identifiable information of customers: <input type="number" step="0.01" value={formData.leadership_indicators.data_breaches.percent_pii_breached ?? ''} onChange={e => handleChange('leadership_indicators.data_breaches.percent_pii_breached', parseFloat(e.target.value) || null)} disabled={disabled} /> %</label>
            </div>

            <hr />
            {!isSubmitted && (
                <button type="submit" className="form-button" disabled={isLoadingSave}>
                    {isLoadingSave ? 'Saving...' : 'Save Principle 9'}
                </button>
            )}
            {isSubmitted && <p>This section is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionCPrinciple9Form;
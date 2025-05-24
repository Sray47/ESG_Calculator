import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const initialP9EssentialIndicators = {
    customer_satisfaction_mechanisms: '',
    complaints_received: '',
    complaints_resolved: '',
    product_safety_measures: '',
    recall_incidents: '',
};
const initialP9LeadershipIndicators = {
    customer_engagement_initiatives: '',
    product_innovation_for_safety: '',
    customer_feedback_integration: '',
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
            setFormData(prev => ({
                ...prev,
                ...reportData.section_c_data.principle_9,
            }));
        } else {
            setFormData(initialSectionCPrinciple9Data);
        }
    }, [reportData]);

    const handleChange = (indicatorType, field, value) => {
        setFormData(prev => ({
            ...prev,
            [indicatorType]: {
                ...prev[indicatorType],
                [field]: value,
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError('');
        const payload = {
            section_c_data: {
                ...reportData?.section_c_data,
                principle_9: formData,
            },
        };
        const success = await handleSaveProgress(payload);
        if (success) {
            setLocalSuccess('Section C, Principle 9 saved successfully!');
        } else {
            setLocalError('Failed to save Section C, Principle 9.');
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
            <h5>Essential Indicators (Principle 9)</h5>
            <div className="form-group">
                <label>Mechanisms for customer satisfaction:</label>
                <textarea value={formData.essential_indicators.customer_satisfaction_mechanisms} onChange={e => handleChange('essential_indicators', 'customer_satisfaction_mechanisms', e.target.value)} disabled={disabled} rows={2} />
            </div>
            <div className="form-group">
                <label>Number of customer complaints received:</label>
                <input type="number" value={formData.essential_indicators.complaints_received} onChange={e => handleChange('essential_indicators', 'complaints_received', e.target.value)} disabled={disabled} />
            </div>
            <div className="form-group">
                <label>Number of customer complaints resolved:</label>
                <input type="number" value={formData.essential_indicators.complaints_resolved} onChange={e => handleChange('essential_indicators', 'complaints_resolved', e.target.value)} disabled={disabled} />
            </div>
            <div className="form-group">
                <label>Product safety measures:</label>
                <textarea value={formData.essential_indicators.product_safety_measures} onChange={e => handleChange('essential_indicators', 'product_safety_measures', e.target.value)} disabled={disabled} rows={2} />
            </div>
            <div className="form-group">
                <label>Product recall incidents (if any):</label>
                <input type="text" value={formData.essential_indicators.recall_incidents} onChange={e => handleChange('essential_indicators', 'recall_incidents', e.target.value)} disabled={disabled} />
            </div>
            <h5>Leadership Indicators (Principle 9)</h5>
            <div className="form-group">
                <label>Customer engagement initiatives:</label>
                <textarea value={formData.leadership_indicators.customer_engagement_initiatives} onChange={e => handleChange('leadership_indicators', 'customer_engagement_initiatives', e.target.value)} disabled={disabled} rows={2} />
            </div>
            <div className="form-group">
                <label>Product innovation for safety and value:</label>
                <textarea value={formData.leadership_indicators.product_innovation_for_safety} onChange={e => handleChange('leadership_indicators', 'product_innovation_for_safety', e.target.value)} disabled={disabled} rows={2} />
            </div>
            <div className="form-group">
                <label>Integration of customer feedback into product/service design:</label>
                <textarea value={formData.leadership_indicators.customer_feedback_integration} onChange={e => handleChange('leadership_indicators', 'customer_feedback_integration', e.target.value)} disabled={disabled} rows={2} />
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

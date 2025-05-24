import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const initialP6EssentialIndicators = {}; // Define based on BRSR PDF for Principle 6
const initialP6LeadershipIndicators = {}; // Define based on BRSR PDF for Principle 6

const initialSectionCPrinciple6Data = {
    essential_indicators: initialP6EssentialIndicators,
    leadership_indicators: initialP6LeadershipIndicators,
};

function SectionCPrinciple6Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialSectionCPrinciple6Data);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {
        if (reportData) {
            setFormData({
                essential_indicators: { ...initialP6EssentialIndicators, ...(reportData.sc_p6_essential_indicators || {}) },
                leadership_indicators: { ...initialP6LeadershipIndicators, ...(reportData.sc_p6_leadership_indicators || {}) },
            });
        } else {
            setFormData(initialSectionCPrinciple6Data);
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
            sc_p6_essential_indicators: formData.essential_indicators,
            sc_p6_leadership_indicators: formData.leadership_indicators,
        };
        const success = await handleSaveProgress(payload);
        if (success) {
            setLocalSuccess('Section C, Principle 6 saved successfully!');
        } else {
            setLocalError('Failed to save Section C, Principle 6.');
        }
    };

    if (!reportData) return <p>Loading Section C, Principle 6 data...</p>;
    const disabled = isSubmitted || isLoadingSave;

    return (
        <form onSubmit={handleSubmit} className="profile-form section-c-form">
            <h3>Section C: Principle-wise Performance</h3>
            <h4>Principle 6: Businesses should respect and make efforts to protect and restore the environment.</h4>
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}
            <h5>Essential Indicators (Principle 6)</h5>
            <p><i>Content for Principle 6 Essential Indicators to be added here.</i></p>
            <h5>Leadership Indicators (Principle 6)</h5>
            <p><i>Content for Principle 6 Leadership Indicators to be added here.</i></p>
            <hr />
            {!isSubmitted && (
                <button type="submit" className="form-button" disabled={isLoadingSave}>
                    {isLoadingSave ? 'Saving...' : 'Save Principle 6'}
                </button>
            )}
            {isSubmitted && <p>This section is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionCPrinciple6Form;

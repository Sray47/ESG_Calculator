import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const initialP5EssentialIndicators = {}; // Define based on BRSR PDF for Principle 5
const initialP5LeadershipIndicators = {}; // Define based on BRSR PDF for Principle 5

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
            setFormData({
                essential_indicators: { ...initialP5EssentialIndicators, ...(reportData.sc_p5_essential_indicators || {}) },
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
            <h5>Essential Indicators (Principle 5)</h5>
            <p><i>Content for Principle 5 Essential Indicators to be added here.</i></p>
            <h5>Leadership Indicators (Principle 5)</h5>
            <p><i>Content for Principle 5 Leadership Indicators to be added here.</i></p>
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

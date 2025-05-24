import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const initialP8EssentialIndicators = {
    policy_advocacy_initiatives: '',
    inclusive_development_programs: '',
    beneficiaries_count: '',
    impact_assessment: '',
};
const initialP8LeadershipIndicators = {
    beyond_compliance_initiatives: '',
    partnerships_with_ngo: '',
    innovative_inclusive_projects: '',
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
        if (reportData?.section_c_data?.principle_8) {
            setFormData(prev => ({
                ...prev,
                ...reportData.section_c_data.principle_8,
            }));
        } else {
            setFormData(initialSectionCPrinciple8Data);
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
                principle_8: formData,
            },
        };
        const success = await handleSaveProgress(payload);
        if (success) {
            setLocalSuccess('Section C, Principle 8 saved successfully!');
        } else {
            setLocalError('Failed to save Section C, Principle 8.');
        }
    };

    if (!reportData) return <p>Loading Section C, Principle 8 data...</p>;
    const disabled = isSubmitted || isLoadingSave;

    return (
        <form onSubmit={handleSubmit} className="profile-form section-c-form">
            <h3>Section C: Principle-wise Performance</h3>
            <h4>Principle 8: Businesses should promote inclusive growth and equitable development.</h4>
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}
            <h5>Essential Indicators (Principle 8)</h5>
            <div className="form-group">
                <label>Policy advocacy initiatives for inclusive development:</label>
                <textarea value={formData.essential_indicators.policy_advocacy_initiatives} onChange={e => handleChange('essential_indicators', 'policy_advocacy_initiatives', e.target.value)} disabled={disabled} rows={2} />
            </div>
            <div className="form-group">
                <label>Inclusive development programs undertaken:</label>
                <textarea value={formData.essential_indicators.inclusive_development_programs} onChange={e => handleChange('essential_indicators', 'inclusive_development_programs', e.target.value)} disabled={disabled} rows={2} />
            </div>
            <div className="form-group">
                <label>Number of beneficiaries:</label>
                <input type="number" value={formData.essential_indicators.beneficiaries_count} onChange={e => handleChange('essential_indicators', 'beneficiaries_count', e.target.value)} disabled={disabled} />
            </div>
            <div className="form-group">
                <label>Impact assessment of inclusive development initiatives:</label>
                <textarea value={formData.essential_indicators.impact_assessment} onChange={e => handleChange('essential_indicators', 'impact_assessment', e.target.value)} disabled={disabled} rows={2} />
            </div>
            <h5>Leadership Indicators (Principle 8)</h5>
            <div className="form-group">
                <label>Initiatives beyond compliance for inclusive growth:</label>
                <textarea value={formData.leadership_indicators.beyond_compliance_initiatives} onChange={e => handleChange('leadership_indicators', 'beyond_compliance_initiatives', e.target.value)} disabled={disabled} rows={2} />
            </div>
            <div className="form-group">
                <label>Partnerships with NGOs/communities for inclusive development:</label>
                <textarea value={formData.leadership_indicators.partnerships_with_ngo} onChange={e => handleChange('leadership_indicators', 'partnerships_with_ngo', e.target.value)} disabled={disabled} rows={2} />
            </div>
            <div className="form-group">
                <label>Innovative projects for inclusive development:</label>
                <textarea value={formData.leadership_indicators.innovative_inclusive_projects} onChange={e => handleChange('leadership_indicators', 'innovative_inclusive_projects', e.target.value)} disabled={disabled} rows={2} />
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

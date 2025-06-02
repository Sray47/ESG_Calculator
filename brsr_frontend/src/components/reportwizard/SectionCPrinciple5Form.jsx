import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { deepMerge } from '../../utils/objectUtils';

// Helper to create initial row structure for tables
const createRow = (isEmployeeOrWorker = false) => ({
    total_a: null,
    covered_b: null,
    ...(isEmployeeOrWorker ? {} : { percent_b_a: '' }) // Percentages typically calculated, not stored
});

const createMinWageRow = () => ({
    total_a: null,
    equal_min_wage_b: null,
    // percent_b_a: '', // Calculated
    more_than_min_wage_c: null,
    // percent_c_a: '', // Calculated
});

const createRemunerationRow = () => ({
    male_number: null,
    male_median_remuneration: '',
    female_number: null,
    female_median_remuneration: '',
});

const createComplaintRow = () => ({
    filed_current_fy: null,
    pending_current_fy: null,
    remarks_current_fy: '',
});

const initialP5EssentialIndicators = {
    // EI 1: Human Rights Training (Current FY)
    human_rights_training: {
        employees: {
            permanent: createRow(true),
            other_than_permanent: createRow(true),
            total: createRow(true),
        },
        workers: {
            permanent: createRow(true),
            other_than_permanent: createRow(true),
            total: createRow(true),
        },
    },
    // EI 2: Minimum Wages (Current FY)
    minimum_wages: {
        employees: {
            permanent_male: createMinWageRow(),
            permanent_female: createMinWageRow(),
            other_than_permanent_male: createMinWageRow(),
            other_than_permanent_female: createMinWageRow(),
        },
        workers: {
            permanent_male: createMinWageRow(),
            permanent_female: createMinWageRow(),
            other_than_permanent_male: createMinWageRow(),
            other_than_permanent_female: createMinWageRow(),
        },
    },
    // EI 3: Remuneration
    remuneration: {
        bod: createRemunerationRow(),
        kmp: createRemunerationRow(),
        employees_other_than_bod_kmp: createRemunerationRow(),
        workers: createRemunerationRow(),
    },
    // EI 4: Focal point for human rights
    focal_point_for_human_rights: null, // boolean
    // EI 5: Grievance redressal mechanisms
    grievance_redressal_mechanisms: '',
    // EI 6: Complaints (Current FY)
    complaints_current_fy: {
        sexual_harassment: createComplaintRow(),
        discrimination_workplace: createComplaintRow(),
        child_labour: createComplaintRow(),
        forced_labour: createComplaintRow(),
        wages: createComplaintRow(),
        other_hr_issues: createComplaintRow(),
    },
    // EI 7: Anti-retaliation mechanisms
    anti_retaliation_mechanisms: '',
    // EI 8: HR in business agreements
    hr_in_business_agreements: null, // boolean
    // EI 9: Assessments for the year (plants and offices)
    assessments_plants_offices: {
        child_labour_percent: null,
        forced_labour_percent: null,
        sexual_harassment_percent: null,
        discrimination_workplace_percent: null,
        wages_percent: null,
        others_text: '',
        others_percent: null,
    },
    // EI 10: Corrective actions from Q9
    corrective_actions_risks_q9: '',
};

// Leadership Indicators for Principle 5
const initialP5LeadershipIndicators = {
    // LI 1: Process modification due to HR grievances
    process_modification_grievances: null,
    // LI 2: HR due-diligence scope
    hr_due_diligence_scope: null,
    // LI 3: Accessibility for differently-abled
    accessibility_for_disabled: null, // boolean
    // LI 4: Assessment of value chain partners
    assessment_value_chain_partners: {
        sexual_harassment_percent: null,
        discrimination_workplace_percent: null,
        child_labour_percent: null,
        forced_labour_percent: null,
        wages_percent: null,
        others_text: null,
        others_percent: null,
    },
    // LI 5: Corrective actions from LI Q4
    corrective_actions_risks_q4_li: null,
};

const initialSectionCPrinciple5Data = {
    essential_indicators: initialP5EssentialIndicators,
    leadership_indicators: initialP5LeadershipIndicators,
};

function SectionCPrinciple5Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialSectionCPrinciple5Data);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');    useEffect(() => {
        if (reportData && (reportData.sc_p5_essential_indicators || reportData.sc_p5_leadership_indicators)) {
            try {
                const essFromReport = reportData.sc_p5_essential_indicators || {};
                const leadFromReport = reportData.sc_p5_leadership_indicators || {};

                setFormData({
                    essential_indicators: deepMerge(initialP5EssentialIndicators, essFromReport),
                    leadership_indicators: deepMerge(initialP5LeadershipIndicators, leadFromReport),
                });
            } catch (error) {
                console.error('Error merging report data:', error);
                setFormData(initialSectionCPrinciple5Data);
            }
        } else if (reportData) {
            // reportData exists but doesn't have P5 data, use initial state
            setFormData(initialSectionCPrinciple5Data);
        }
        // If reportData is null/undefined, wait for it to load
    }, [reportData]);

    const validateFormData = (data) => {
        const errors = [];
        const warnings = [];

        // Validate Essential Indicators
        const ei = data.essential_indicators;

        // EI 4: Focal point for human rights (required)
        if (ei.focal_point_for_human_rights === null) {
            errors.push('Please specify if the entity has a focal point for human rights issues');
        }

        // EI 8: HR in business agreements (required)
        if (ei.hr_in_business_agreements === null) {
            errors.push('Please specify if human rights requirements are included in business agreements');
        }

        // Validate percentage fields (0-100%)
        const validatePercentage = (value, fieldName) => {
            if (value !== null && value !== undefined && value !== '') {
                const num = parseFloat(value);
                if (isNaN(num) || num < 0 || num > 100) {
                    errors.push(`${fieldName} must be between 0 and 100%`);
                }
            }
        };

        // Validate assessment percentages
        Object.entries(ei.assessments_plants_offices || {}).forEach(([key, value]) => {
            if (key.endsWith('_percent')) {
                const fieldName = key.replace('_percent', '').replace(/_/g, ' ');
                validatePercentage(value, `Assessment percentage for ${fieldName}`);
            }
        });

        // Validate leadership indicator assessments
        Object.entries(data.leadership_indicators.assessment_value_chain_partners || {}).forEach(([key, value]) => {
            if (key.endsWith('_percent')) {
                const fieldName = key.replace('_percent', '').replace(/_/g, ' ');
                validatePercentage(value, `Value chain assessment percentage for ${fieldName}`);
            }
        });

        // Validate numeric fields are non-negative
        const validateNonNegative = (value, fieldName) => {
            if (value !== null && value !== undefined && value !== '') {
                const num = parseFloat(value);
                if (isNaN(num) || num < 0) {
                    errors.push(`${fieldName} must be a non-negative number`);
                }
            }
        };

        // Check for data integrity in human rights training totals
        const hrTraining = ei.human_rights_training || {};
        ['employees', 'workers'].forEach(category => {
            const categoryData = hrTraining[category] || {};
            const permanent = categoryData.permanent || {};
            const otherThanPermanent = categoryData.other_than_permanent || {};
            const total = categoryData.total || {};

            // Check if totals match sum of components (warning, not error)
            if (permanent.total_a && otherThanPermanent.total_a && total.total_a) {
                const calculatedTotal = (permanent.total_a || 0) + (otherThanPermanent.total_a || 0);
                if (Math.abs(calculatedTotal - total.total_a) > 0.01) {
                    warnings.push(`Total employees/workers (${total.total_a}) doesn't match sum of permanent and other than permanent (${calculatedTotal}) for ${category}`);
                }
            }
        });

        return { errors, warnings };
    };    const handleNestedChange = (indicatorType, path, value, type, checked) => {
        setFormData(prev => {
            try {
                const keys = path.split('.');
                let currentSection = { ...prev[indicatorType] };
                let objRef = currentSection;

                // Navigate to the nested object, creating intermediate objects as needed
                for (let i = 0; i < keys.length - 1; i++) {
                    const key = keys[i];
                    if (!objRef[key] || typeof objRef[key] !== 'object') {
                        objRef[key] = {};
                    }
                    objRef[key] = { ...objRef[key] };
                    objRef = objRef[key];
                }

                let processedValue = value;
                if (type === 'checkbox') {
                    processedValue = checked;
                } else if (type === 'radio') {
                    processedValue = value === 'true' ? true : (value === 'false' ? false : null);
                } else if (type === 'number') {
                    if (value === '' || value === null || value === undefined) {
                        processedValue = null;
                    } else {
                        processedValue = parseFloat(value);
                        if (isNaN(processedValue)) {
                            console.warn(`Invalid number value for ${path}: ${value}`);
                            processedValue = null;
                        }
                    }
                }
                
                objRef[keys[keys.length - 1]] = processedValue;

                return { ...prev, [indicatorType]: currentSection };
            } catch (error) {
                console.error('Error updating nested value:', error, { indicatorType, path, value, type });
                return prev; // Return unchanged state on error
            }
        });
    };
      const renderHrTrainingTable = (category, categoryLabel) => {
        const data = formData.essential_indicators.human_rights_training[category] || {};
        const pathPrefix = `human_rights_training.${category}`;
        
        // Calculate totals automatically
        const permanentData = data.permanent || {};
        const otherThanPermanentData = data.other_than_permanent || {};
        const calculatedTotalA = (permanentData.total_a || 0) + (otherThanPermanentData.total_a || 0);
        const calculatedCoveredB = (permanentData.covered_b || 0) + (otherThanPermanentData.covered_b || 0);
        
        return (
            <>
                <h5>{categoryLabel}</h5>
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Total (A)</th>
                            <th>No. of {categoryLabel.toLowerCase()} covered (B)</th>
                            <th>% (B/A)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Permanent</td>
                            <td><input 
                                type="number" 
                                value={permanentData.total_a ?? ''} 
                                onChange={e => handleNestedChange('essential_indicators', `${pathPrefix}.permanent.total_a`, e.target.value, 'number')} 
                                disabled={disabled}
                                min="0"
                                id={`${pathPrefix}_permanent_total_a`}
                            /></td>
                            <td><input 
                                type="number" 
                                value={permanentData.covered_b ?? ''} 
                                onChange={e => handleNestedChange('essential_indicators', `${pathPrefix}.permanent.covered_b`, e.target.value, 'number')} 
                                disabled={disabled}
                                min="0"
                                max={permanentData.total_a || undefined}
                                id={`${pathPrefix}_permanent_covered_b`}
                            /></td>
                            <td>{permanentData.total_a && permanentData.covered_b ? ((permanentData.covered_b / permanentData.total_a) * 100).toFixed(2) + '%' : 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Other than permanent</td>
                            <td><input 
                                type="number" 
                                value={otherThanPermanentData.total_a ?? ''} 
                                onChange={e => handleNestedChange('essential_indicators', `${pathPrefix}.other_than_permanent.total_a`, e.target.value, 'number')} 
                                disabled={disabled}
                                min="0"
                                id={`${pathPrefix}_other_than_permanent_total_a`}
                            /></td>
                            <td><input 
                                type="number" 
                                value={otherThanPermanentData.covered_b ?? ''} 
                                onChange={e => handleNestedChange('essential_indicators', `${pathPrefix}.other_than_permanent.covered_b`, e.target.value, 'number')} 
                                disabled={disabled}
                                min="0"
                                max={otherThanPermanentData.total_a || undefined}
                                id={`${pathPrefix}_other_than_permanent_covered_b`}
                            /></td>
                            <td>{otherThanPermanentData.total_a && otherThanPermanentData.covered_b ? ((otherThanPermanentData.covered_b / otherThanPermanentData.total_a) * 100).toFixed(2) + '%' : 'N/A'}</td>
                        </tr>
                        <tr style={{backgroundColor: '#f5f5f5', fontWeight: 'bold'}}>
                            <td>Total (Calculated)</td>
                            <td>{calculatedTotalA || 0}</td>
                            <td>{calculatedCoveredB || 0}</td>
                            <td>{calculatedTotalA && calculatedCoveredB ? ((calculatedCoveredB / calculatedTotalA) * 100).toFixed(2) + '%' : 'N/A'}</td>
                        </tr>
                    </tbody>
                </table>
            </>
        );
    };    const renderMinWageTable = (category, categoryLabel) => {
        const data = formData.essential_indicators.minimum_wages[category] || {};
        const pathPrefix = `minimum_wages.${category}`;
        const types = ['permanent_male', 'permanent_female', 'other_than_permanent_male', 'other_than_permanent_female'];
        
        return (
            <>
                <h5>{categoryLabel}</h5>
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Total (A)</th>
                            <th>Equal to Minimum Wage - No. (B)</th>
                            <th>Equal to Minimum Wage - % (B/A)</th>
                            <th>More than Minimum Wage - No. (C)</th>
                            <th>More than Minimum Wage - % (C/A)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {types.map(type => {
                            const typeData = data[type] || {};
                            const typeLabel = type.replace(/_/g, ' ').replace(/^./, str => str.toUpperCase());
                            const inputIdPrefix = `${pathPrefix}_${type}`;
                            
                            // Validation: B + C should not exceed A
                            const totalA = typeData.total_a || 0;
                            const equalMinWageB = typeData.equal_min_wage_b || 0;
                            const moreThanMinWageC = typeData.more_than_min_wage_c || 0;
                            const sumBC = equalMinWageB + moreThanMinWageC;
                            const isInvalid = totalA > 0 && sumBC > totalA;
                            
                            return (
                                <tr key={type} style={isInvalid ? {backgroundColor: '#ffebee'} : {}}>
                                    <td>
                                        <label htmlFor={`${inputIdPrefix}_total_a`}>{typeLabel}</label>
                                    </td>
                                    <td>
                                        <input 
                                            type="number" 
                                            id={`${inputIdPrefix}_total_a`}
                                            value={typeData.total_a ?? ''} 
                                            onChange={e => handleNestedChange('essential_indicators', `${pathPrefix}.${type}.total_a`, e.target.value, 'number')} 
                                            disabled={disabled}
                                            min="0"
                                            aria-label={`Total ${typeLabel}`}
                                        />
                                    </td>
                                    <td>
                                        <input 
                                            type="number" 
                                            id={`${inputIdPrefix}_equal_min_wage_b`}
                                            value={typeData.equal_min_wage_b ?? ''} 
                                            onChange={e => handleNestedChange('essential_indicators', `${pathPrefix}.${type}.equal_min_wage_b`, e.target.value, 'number')} 
                                            disabled={disabled}
                                            min="0"
                                            max={totalA || undefined}
                                            aria-label={`${typeLabel} equal to minimum wage`}
                                        />
                                    </td>
                                    <td>{typeData.total_a && typeData.equal_min_wage_b ? ((typeData.equal_min_wage_b / typeData.total_a) * 100).toFixed(2) + '%' : 'N/A'}</td>
                                    <td>
                                        <input 
                                            type="number" 
                                            id={`${inputIdPrefix}_more_than_min_wage_c`}
                                            value={typeData.more_than_min_wage_c ?? ''} 
                                            onChange={e => handleNestedChange('essential_indicators', `${pathPrefix}.${type}.more_than_min_wage_c`, e.target.value, 'number')} 
                                            disabled={disabled}
                                            min="0"
                                            max={totalA ? totalA - equalMinWageB : undefined}
                                            aria-label={`${typeLabel} more than minimum wage`}
                                        />
                                    </td>
                                    <td>{typeData.total_a && typeData.more_than_min_wage_c ? ((typeData.more_than_min_wage_c / typeData.total_a) * 100).toFixed(2) + '%' : 'N/A'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {data && Object.values(data).some(typeData => {
                    const totalA = typeData.total_a || 0;
                    const sumBC = (typeData.equal_min_wage_b || 0) + (typeData.more_than_min_wage_c || 0);
                    return totalA > 0 && sumBC > totalA;
                }) && (
                    <p style={{color: 'red', fontSize: '0.9em', marginTop: '5px'}}>
                        ⚠️ Warning: The sum of "Equal to Minimum Wage" and "More than Minimum Wage" should not exceed the Total.
                    </p>
                )}
            </>
        );
    };
      const renderRemunerationTable = () => {
        const data = formData.essential_indicators.remuneration || {};
        const pathPrefix = 'remuneration';
        const categories = ['bod', 'kmp', 'employees_other_than_bod_kmp', 'workers'];
        const categoryLabels = {'bod': 'Board of Directors (BoD)', 'kmp': 'Key Managerial Personnel (KMP)', 'employees_other_than_bod_kmp': 'Employees other than BoD and KMP', 'workers': 'Workers'};

        return (
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Male - Number</th>
                        <th>Male - Median Remuneration/Salary/Wages</th>
                        <th>Female - Number</th>
                        <th>Female - Median Remuneration/Salary/Wages</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => {
                        const catData = data[cat] || {};
                        const inputIdPrefix = `${pathPrefix}_${cat}`;
                        return (
                            <tr key={cat}>
                                <td>
                                    <label htmlFor={`${inputIdPrefix}_male_number`}>{categoryLabels[cat]}</label>
                                </td>
                                <td>
                                    <input 
                                        type="number" 
                                        id={`${inputIdPrefix}_male_number`}
                                        value={catData.male_number ?? ''} 
                                        onChange={e => handleNestedChange('essential_indicators', `${pathPrefix}.${cat}.male_number`, e.target.value, 'number')} 
                                        disabled={disabled}
                                        min="0"
                                        aria-label={`Male number for ${categoryLabels[cat]}`}
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        id={`${inputIdPrefix}_male_median_remuneration`}
                                        value={catData.male_median_remuneration || ''} 
                                        onChange={e => handleNestedChange('essential_indicators', `${pathPrefix}.${cat}.male_median_remuneration`, e.target.value, 'text')} 
                                        disabled={disabled}
                                        aria-label={`Male median remuneration for ${categoryLabels[cat]}`}
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="number" 
                                        id={`${inputIdPrefix}_female_number`}
                                        value={catData.female_number ?? ''} 
                                        onChange={e => handleNestedChange('essential_indicators', `${pathPrefix}.${cat}.female_number`, e.target.value, 'number')} 
                                        disabled={disabled}
                                        min="0"
                                        aria-label={`Female number for ${categoryLabels[cat]}`}
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        id={`${inputIdPrefix}_female_median_remuneration`}
                                        value={catData.female_median_remuneration || ''} 
                                        onChange={e => handleNestedChange('essential_indicators', `${pathPrefix}.${cat}.female_median_remuneration`, e.target.value, 'text')} 
                                        disabled={disabled}
                                        aria-label={`Female median remuneration for ${categoryLabels[cat]}`}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };const renderComplaintsTable = () => {
        const data = formData.essential_indicators.complaints_current_fy || {};
        const pathPrefix = 'complaints_current_fy';
        const complaintTypes = ['sexual_harassment', 'discrimination_workplace', 'child_labour', 'forced_labour', 'wages', 'other_hr_issues'];
        const complaintLabels = {
            'sexual_harassment': 'Sexual Harassment',
            'discrimination_workplace': 'Discrimination at workplace',
            'child_labour': 'Child Labour',
            'forced_labour': 'Forced Labour/Involuntary Labour',
            'wages': 'Wages',
            'other_hr_issues': 'Other human rights related issues'
        };

        return (
            <table>
                <thead>
                    <tr>
                        <th>Nature of Complaint</th>
                        <th>Filed during the year (Current FY)</th>
                        <th>Pending resolution at end of year (Current FY)</th>
                        <th>Remarks (Current FY)</th>
                    </tr>
                </thead>
                <tbody>
                    {complaintTypes.map(type => {
                        const typeData = data[type] || {};
                        const inputIdPrefix = `${pathPrefix}_${type}`;
                        return (
                            <tr key={type}>
                                <td>
                                    <label htmlFor={`${inputIdPrefix}_filed`}>{complaintLabels[type]}</label>
                                </td>
                                <td>
                                    <input 
                                        type="number" 
                                        id={`${inputIdPrefix}_filed`}
                                        value={typeData.filed_current_fy ?? ''} 
                                        onChange={e => handleNestedChange('essential_indicators', `${pathPrefix}.${type}.filed_current_fy`, e.target.value, 'number')} 
                                        disabled={disabled}
                                        min="0"
                                        aria-label={`Number of ${complaintLabels[type]} complaints filed`}
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="number" 
                                        id={`${inputIdPrefix}_pending`}
                                        value={typeData.pending_current_fy ?? ''} 
                                        onChange={e => handleNestedChange('essential_indicators', `${pathPrefix}.${type}.pending_current_fy`, e.target.value, 'number')} 
                                        disabled={disabled}
                                        min="0"
                                        max={typeData.filed_current_fy || undefined}
                                        aria-label={`Number of ${complaintLabels[type]} complaints pending`}
                                    />
                                </td>
                                <td>
                                    <textarea 
                                        id={`${inputIdPrefix}_remarks`}
                                        value={typeData.remarks_current_fy || ''} 
                                        onChange={e => handleNestedChange('essential_indicators', `${pathPrefix}.${type}.remarks_current_fy`, e.target.value, 'text')} 
                                        disabled={disabled} 
                                        rows={2}
                                        aria-label={`Remarks for ${complaintLabels[type]} complaints`}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };
      const renderAssessmentTable = (indicatorSec, dataPathSuffix, title, itemLabels) => {
        const data = formData[indicatorSec]?.[dataPathSuffix] || {};
        const pathPrefix = `${indicatorSec}.${dataPathSuffix}`;
        
        return (
            <>
                <h5>{title}</h5>
                <table>
                    <thead>
                        <tr>
                            <th>Assessment Area</th>
                            <th>% Assessed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(itemLabels).map(key => {
                            const inputId = `${pathPrefix}_${key}`;
                            return (
                                <tr key={key}>
                                    <td>
                                        <label htmlFor={inputId}>{itemLabels[key]}</label>
                                    </td>
                                    <td>
                                        <input 
                                            type="number" 
                                            id={inputId}
                                            value={data[key] ?? ''} 
                                            onChange={e => handleNestedChange(indicatorSec, `${dataPathSuffix}.${key}`, e.target.value, 'number')} 
                                            disabled={disabled} 
                                            placeholder="%"
                                            min="0"
                                            max="100"
                                            aria-label={`Percentage assessed for ${itemLabels[key]}`}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                        <tr>
                            <td>
                                <input 
                                    type="text" 
                                    id={`${pathPrefix}_others_text`}
                                    placeholder="Others - please specify" 
                                    value={data.others_text || ''} 
                                    onChange={e => handleNestedChange(indicatorSec, `${dataPathSuffix}.others_text`, e.target.value, 'text')} 
                                    disabled={disabled} 
                                    aria-label="Other assessment areas - please specify"
                                />
                            </td>
                            <td>
                                <input 
                                    type="number" 
                                    id={`${pathPrefix}_others_percent`}
                                    value={data.others_percent ?? ''} 
                                    onChange={e => handleNestedChange(indicatorSec, `${dataPathSuffix}.others_percent`, e.target.value, 'number')}
                                    disabled={disabled} 
                                    placeholder="%"
                                    min="0"
                                    max="100"
                                    aria-label="Percentage for other assessment areas"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </>
        );
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError('');

        // Validate form data
        const validation = validateFormData(formData);
        
        // If there are errors, prevent submission
        if (validation.errors.length > 0) {
            setLocalError(`Please fix the following errors before submitting:\n${validation.errors.join('\n')}`);
            return;
        }

        // If there are warnings, ask for confirmation
        if (validation.warnings.length > 0) {
            const warningMessage = `The following warnings were found:\n${validation.warnings.join('\n')}\n\nDo you want to continue saving?`;
            if (!window.confirm(warningMessage)) {
                return;
            }
        }

        const payload = {
            sc_p5_essential_indicators: formData.essential_indicators,
            sc_p5_leadership_indicators: formData.leadership_indicators,
        };
        
        try {
            const success = await handleSaveProgress(payload);
            if (success) {
                setLocalSuccess('Section C, Principle 5 saved successfully!');
                if (validation.warnings.length > 0) {
                    setLocalSuccess('Section C, Principle 5 saved successfully! (with warnings acknowledged)');
                }
            } else {
                setLocalError('Failed to save Section C, Principle 5.');
            }
        } catch (error) {
            console.error('Error saving form:', error);
            setLocalError('An error occurred while saving. Please try again.');
        }
    };

    if (!reportData) return <p>Loading Section C, Principle 5 data...</p>;
    const disabled = isSubmitted || isLoadingSave;
    
    const assessmentPlantOfficeLabels = {
        child_labour_percent: 'Child labour',
        forced_labour_percent: 'Forced/involuntary labour',
        sexual_harassment_percent: 'Sexual harassment',
        discrimination_workplace_percent: 'Discrimination at workplace',
        wages_percent: 'Wages',
    };

    const assessmentValueChainLabels = {
        sexual_harassment_percent: 'Sexual Harassment',
        discrimination_workplace_percent: 'Discrimination at workplace',
        child_labour_percent: 'Child Labour',
        forced_labour_percent: 'Forced Labour/Involuntary Labour',
        wages_percent: 'Wages',
    };

    return (
        <form onSubmit={handleSubmit} className="profile-form section-c-form">
            <h3>Section C: Principle-wise Performance</h3>
            <h4>Principle 5: Businesses should respect and promote human rights.</h4>
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}

            <h5>Essential Indicators</h5>
            
            <div className="form-group">
                <label>1. Employees and workers who have been provided training on human rights issues and policy(ies) of the entity (Current Financial Year):</label>
                {renderHrTrainingTable('employees', 'Employees')}
                {renderHrTrainingTable('workers', 'Workers')}
            </div>

            <div className="form-group">
                <label>2. Details of minimum wages paid to employees and workers (Current Financial Year):</label>
                {renderMinWageTable('employees', 'Employees')}
                {renderMinWageTable('workers', 'Workers')}
            </div>

            <div className="form-group">
                <label>3. Details of remuneration/salary/wages:</label>
                {renderRemunerationTable()}
            </div>            <div className="form-group">
                <label htmlFor="p5_focal_point_for_human_rights">4. Do you have a focal point (Individual/Committee) responsible for addressing human rights impacts or issues caused or contributed to by the business?</label>
                <div>
                    <label htmlFor="p5_focal_point_for_human_rights_yes">
                        <input 
                            type="radio" 
                            id="p5_focal_point_for_human_rights_yes"
                            name="p5_focal_point_for_human_rights" 
                            value="true" 
                            checked={formData.essential_indicators.focal_point_for_human_rights === true} 
                            onChange={e => handleNestedChange('essential_indicators', 'focal_point_for_human_rights', 'true', 'radio')} 
                            disabled={disabled} 
                        /> Yes
                    </label>
                    <label htmlFor="p5_focal_point_for_human_rights_no">
                        <input 
                            type="radio" 
                            id="p5_focal_point_for_human_rights_no"
                            name="p5_focal_point_for_human_rights" 
                            value="false" 
                            checked={formData.essential_indicators.focal_point_for_human_rights === false} 
                            onChange={e => handleNestedChange('essential_indicators', 'focal_point_for_human_rights', 'false', 'radio')} 
                            disabled={disabled} 
                        /> No
                    </label>
                </div>
            </div>            <div className="form-group">
                <label htmlFor="p5_grievance_redressal_mechanisms">5. Describe the internal mechanisms in place to redress grievances related to human rights issues:</label>
                <textarea 
                    id="p5_grievance_redressal_mechanisms"
                    value={formData.essential_indicators.grievance_redressal_mechanisms || ''} 
                    onChange={e => handleNestedChange('essential_indicators', 'grievance_redressal_mechanisms', e.target.value, 'text')} 
                    disabled={disabled} 
                    rows={3} 
                    aria-label="Describe grievance redressal mechanisms"
                />
            </div>

            <div className="form-group">
                <label>6. Number of Complaints on the following made by employees and workers (Current Financial Year):</label>
                {renderComplaintsTable()}
            </div>
              <div className="form-group">
                <label htmlFor="p5_anti_retaliation_mechanisms">7. Mechanisms to prevent adverse consequences to the complainant in discrimination and harassment cases:</label>
                <textarea 
                    id="p5_anti_retaliation_mechanisms"
                    value={formData.essential_indicators.anti_retaliation_mechanisms || ''} 
                    onChange={e => handleNestedChange('essential_indicators', 'anti_retaliation_mechanisms', e.target.value, 'text')} 
                    disabled={disabled} 
                    rows={3} 
                    aria-label="Describe anti-retaliation mechanisms"
                />
            </div>            <div className="form-group">
                <label htmlFor="p5_hr_in_business_agreements">8. Do human rights requirements form part of your business agreements and contracts?</label>
                <div>
                    <label htmlFor="p5_hr_in_business_agreements_yes">
                        <input 
                            type="radio" 
                            id="p5_hr_in_business_agreements_yes"
                            name="p5_hr_in_business_agreements" 
                            value="true" 
                            checked={formData.essential_indicators.hr_in_business_agreements === true} 
                            onChange={e => handleNestedChange('essential_indicators', 'hr_in_business_agreements', 'true', 'radio')} 
                            disabled={disabled} 
                        /> Yes
                    </label>
                    <label htmlFor="p5_hr_in_business_agreements_no">
                        <input 
                            type="radio" 
                            id="p5_hr_in_business_agreements_no"
                            name="p5_hr_in_business_agreements" 
                            value="false" 
                            checked={formData.essential_indicators.hr_in_business_agreements === false} 
                            onChange={e => handleNestedChange('essential_indicators', 'hr_in_business_agreements', 'false', 'radio')} 
                            disabled={disabled} 
                        /> No
                    </label>
                </div>
            </div>
            
            <div className="form-group">
                 {renderAssessmentTable('essential_indicators', 'assessments_plants_offices', '9. Assessments for the year: (% of your plants and offices that were assessed by entity or statutory authorities or third parties)', assessmentPlantOfficeLabels)}
            </div>            <div className="form-group">
                <label htmlFor="p5_corrective_actions_risks_q9">10. Provide details of any corrective actions taken or underway to address significant risks / concerns arising from the assessments at Question 9 above:</label>
                <textarea 
                    id="p5_corrective_actions_risks_q9"
                    value={formData.essential_indicators.corrective_actions_risks_q9 || ''} 
                    onChange={e => handleNestedChange('essential_indicators', 'corrective_actions_risks_q9', e.target.value, 'text')} 
                    disabled={disabled} 
                    rows={3} 
                    aria-label="Describe corrective actions for assessment risks"
                />
            </div>            <h5>Leadership Indicators</h5>
            <p className="leadership-indicators-note">
                <em>Leadership indicators are optional and help demonstrate advanced ESG practices beyond basic compliance.</em>
            </p>
            <div className="form-group">
                <label htmlFor="p5_process_modification_grievances">1. Details of a business process being modified / introduced as a result of addressing human rights grievances/complaints:</label>
                <textarea 
                    id="p5_process_modification_grievances"
                    value={formData.leadership_indicators.process_modification_grievances || ''} 
                    onChange={e => handleNestedChange('leadership_indicators', 'process_modification_grievances', e.target.value || null, 'text')} 
                    disabled={disabled} 
                    rows={3} 
                    placeholder="Optional: Describe business process modifications due to human rights grievances"
                    aria-label="Describe business process modifications"
                />
            </div>

            <div className="form-group">
                <label htmlFor="p5_hr_due_diligence_scope">2. Details of the scope and coverage of any Human rights due-diligence conducted:</label>
                <textarea 
                    id="p5_hr_due_diligence_scope"
                    value={formData.leadership_indicators.hr_due_diligence_scope || ''} 
                    onChange={e => handleNestedChange('leadership_indicators', 'hr_due_diligence_scope', e.target.value || null, 'text')} 
                    disabled={disabled} 
                    rows={3} 
                    placeholder="Optional: Describe human rights due-diligence scope and coverage"
                    aria-label="Describe human rights due-diligence scope"
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="p5_accessibility_for_disabled">3. Is the premise/office of the entity accessible to differently abled visitors, as per the requirements of the Rights of Persons with Disabilities Act, 2016?</label>
                <div>
                    <label htmlFor="p5_accessibility_for_disabled_yes">
                        <input 
                            type="radio" 
                            id="p5_accessibility_for_disabled_yes"
                            name="p5_accessibility_for_disabled" 
                            value="true" 
                            checked={formData.leadership_indicators.accessibility_for_disabled === true} 
                            onChange={e => handleNestedChange('leadership_indicators', 'accessibility_for_disabled', 'true', 'radio')} 
                            disabled={disabled} 
                        /> Yes
                    </label>
                    <label htmlFor="p5_accessibility_for_disabled_no">
                        <input 
                            type="radio" 
                            id="p5_accessibility_for_disabled_no"
                            name="p5_accessibility_for_disabled" 
                            value="false" 
                            checked={formData.leadership_indicators.accessibility_for_disabled === false} 
                            onChange={e => handleNestedChange('leadership_indicators', 'accessibility_for_disabled', 'false', 'radio')} 
                            disabled={disabled} 
                        /> No
                    </label>
                    <label htmlFor="p5_accessibility_for_disabled_null">
                        <input 
                            type="radio" 
                            id="p5_accessibility_for_disabled_null"
                            name="p5_accessibility_for_disabled" 
                            value="null" 
                            checked={formData.leadership_indicators.accessibility_for_disabled === null} 
                            onChange={e => handleNestedChange('leadership_indicators', 'accessibility_for_disabled', 'null', 'radio')} 
                            disabled={disabled} 
                        /> Not Answered
                    </label>
                </div>
            </div>

            <div className="form-group">
                <p><em>Optional: Provide assessment data for value chain partners if your organization conducts such assessments.</em></p>
                {renderAssessmentTable('leadership_indicators', 'assessment_value_chain_partners', '4. Details on assessment of value chain partners: (% of value chain partners (by value of business done with such partners) that were assessed)', assessmentValueChainLabels)}
            </div>            <div className="form-group">
                <label htmlFor="p5_corrective_actions_risks_q4_li">5. Provide details of any corrective actions taken or underway to address significant risks / concerns arising from the assessments at Question 4 above:</label>
                <textarea 
                    id="p5_corrective_actions_risks_q4_li"
                    value={formData.leadership_indicators.corrective_actions_risks_q4_li || ''} 
                    onChange={e => handleNestedChange('leadership_indicators', 'corrective_actions_risks_q4_li', e.target.value || null, 'text')} 
                    disabled={disabled} 
                    rows={3} 
                    placeholder="Optional: Describe corrective actions for value chain assessment risks"
                    aria-label="Describe corrective actions for value chain assessment risks"
                />
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

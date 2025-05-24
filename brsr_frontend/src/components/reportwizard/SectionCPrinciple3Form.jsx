import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { setNestedValue, deepMerge, isObject } from '../../utils/objectUtils'; // Assuming objectUtils.js is in src/utils

const initialDataP3 = {
    essential_indicators: {
        employee_well_being_measures: {
            employees: '',
            workers: '',
        },
        employee_association_collective_bargaining: {
            permanent_employees_union_percentage: '',
            permanent_workers_union_percentage: '',
            permanent_employees_collective_bargaining_percentage: '',
            permanent_workers_collective_bargaining_percentage: '',
        },
        retirement_benefits: {
            permanent_employees: {
                superannuation_fund_count: '',
                superannuation_fund_percentage: '',
                other_benefits: [{ name: '', count: '', percentage: '' }],
            },
            other_than_permanent_employees: {
                superannuation_fund_count: '',
                superannuation_fund_percentage: '',
                other_benefits: [{ name: '', count: '', percentage: '' }],
            },
        },
        workplace_accessibility_differently_abled: {
            is_accessible: null, // null for 'select', true for 'Yes', false for 'No'
            facilities_details: '',
        },
        paternity_leave_benefits: {
            is_extended: null,
            details: '',
        },
        training_details: {
            employees: {
                total: '',
                trained_count: '',
                training_topics: '',
                trained_percentage: '',
            },
            workers: {
                total: '',
                trained_count: '',
                training_topics: '',
                trained_percentage: '',
            },
        },
        performance_career_development_reviews: {
            employees: {
                total: '',
                covered_percentage: '',
            },
            workers: {
                total: '',
                covered_percentage: '',
            },
        },
        health_safety_management_system: {
            has_system: null,
            is_certified_externally: null,
            certification_agency: '',
            scope_of_coverage: '',
        },
        safety_related_incidents: {
            employees: {
                ltifr_current_fy: '',
                ltifr_previous_fy: '',
                work_related_injuries_current_fy: '',
                work_related_injuries_previous_fy: '',
                fatalities_current_fy: '',
                fatalities_previous_fy: '',
            },
            workers: {
                ltifr_current_fy: '',
                ltifr_previous_fy: '',
                work_related_injuries_current_fy: '',
                work_related_injuries_previous_fy: '',
                fatalities_current_fy: '',
                fatalities_previous_fy: '',
            },
        },
        life_health_insurance: {
            permanent_employees_life_insurance_extended: null,
            permanent_employees_life_insurance_percentage: '',
            permanent_employees_health_insurance_extended: null,
            permanent_employees_health_insurance_percentage: '',
            other_employees_life_insurance_extended: null,
            other_employees_life_insurance_percentage: '',
            other_employees_health_insurance_extended: null,
            other_employees_health_insurance_percentage: '',
        },
        worker_safety_measures: '',
        grievance_redressal_mechanism: {
            employees: {
                has_mechanism: null,
                details: '',
            },
            workers: {
                has_mechanism: null,
                details: '',
            },
        },
    },
    leadership_indicators: {
        benefits_over_statutory: {
            is_extended: null,
            details: '',
        },
        provident_fund_over_statutory: {
            is_contributed: null,
            details: '',
        },
        safe_healthy_workplace_measures: '',
        occupational_health_safety_training: {
            permanent_employees: {
                trained_count: '',
                trained_percentage: '',
            },
            other_than_permanent_employees: {
                trained_count: '',
                trained_percentage: '',
            },
        },
        transition_assistance_programs: {
            is_provided: null,
            details: '',
        },
        employee_retention_measures: '',
    },
};


function SectionCPrinciple3Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialDataP3);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {
        if (reportData?.section_c_data?.principle_3) {
            setFormData(prevData => deepMerge(prevData, reportData.section_c_data.principle_3));
        } else {
            setFormData(initialDataP3); // Reset or keep initial if no data
        }
    }, [reportData]);

    const handleChange = (path, value) => {
        setFormData(prevData => setNestedValue(prevData, path, value));
    };
    
    const handleCheckboxChange = (path, checked) => {
        handleChange(path, checked);
    };

    const handleRadioChange = (path, value) => {
        // For radio buttons that represent boolean (Yes/No mapped to true/false)
        handleChange(path, value === 'true');
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError(''); // Clear wizard-level errors

        // Construct the payload to be saved
        const payload = {
            section_c_data: {
                ...reportData?.section_c_data, // Preserve other principles' data
                principle_3: formData,
            }
        };

        const success = await handleSaveProgress(payload);
        if (success) {
            setLocalSuccess('Principle 3 data saved successfully!');
        } else {
            setLocalError('Failed to save Principle 3 data. Check wizard errors or console.');
        }
    };
    
    const disabled = isSubmitted || isLoadingSave;

    return (
        <form onSubmit={handleSubmit} className="profile-form">
            <h3>Principle 3: Employee Well-being</h3>
            <p>Businesses should promote the well-being of all employees.</p>

            {localError && <p className="error-message" style={{ color: 'red' }}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{ color: 'green' }}>{localSuccess}</p>}

            <h4>Essential Indicators</h4>

            {/* EI Q1: Measures for well-being */}
            <div className="form-group">
                <h5>1. Details of measures for the well-being of:</h5>
                <label htmlFor="p3_ei_employee_well_being_employees">a. Employees:</label>
                <textarea
                    id="p3_ei_employee_well_being_employees"
                    value={formData.essential_indicators.employee_well_being_measures.employees || ''}
                    onChange={(e) => handleChange('essential_indicators.employee_well_being_measures.employees', e.target.value)}
                    disabled={disabled}
                    rows={3}
                />
                <label htmlFor="p3_ei_employee_well_being_workers">b. Workers:</label>
                <textarea
                    id="p3_ei_employee_well_being_workers"
                    value={formData.essential_indicators.employee_well_being_measures.workers || ''}
                    onChange={(e) => handleChange('essential_indicators.employee_well_being_measures.workers', e.target.value)}
                    disabled={disabled}
                    rows={3}
                />
            </div>

            {/* EI Q2: Employee association and collective bargaining */}
            <div className="form-group">
                <h5>2. Employee association and collective bargaining:</h5>
                <p>Percentage of permanent employees and workers who are members of registered employee associations/unions recognized by management / covered by collective bargaining agreements:</p>
                <label htmlFor="p3_ei_perm_emp_union_perc">a. Permanent Employees - Union Membership (%):</label>
                <input
                    type="number"
                    id="p3_ei_perm_emp_union_perc"
                    value={formData.essential_indicators.employee_association_collective_bargaining.permanent_employees_union_percentage || ''}
                    onChange={(e) => handleChange('essential_indicators.employee_association_collective_bargaining.permanent_employees_union_percentage', parseFloat(e.target.value))}
                    disabled={disabled}
                />
                <label htmlFor="p3_ei_perm_work_union_perc">b. Permanent Workers - Union Membership (%):</label>
                <input
                    type="number"
                    id="p3_ei_perm_work_union_perc"
                    value={formData.essential_indicators.employee_association_collective_bargaining.permanent_workers_union_percentage || ''}
                    onChange={(e) => handleChange('essential_indicators.employee_association_collective_bargaining.permanent_workers_union_percentage', parseFloat(e.target.value))}
                    disabled={disabled}
                />
                 <label htmlFor="p3_ei_perm_emp_bargaining_perc">c. Permanent Employees - Collective Bargaining Coverage (%):</label>
                <input
                    type="number"
                    id="p3_ei_perm_emp_bargaining_perc"
                    value={formData.essential_indicators.employee_association_collective_bargaining.permanent_employees_collective_bargaining_percentage || ''}
                    onChange={(e) => handleChange('essential_indicators.employee_association_collective_bargaining.permanent_employees_collective_bargaining_percentage', parseFloat(e.target.value))}
                    disabled={disabled}
                />
                <label htmlFor="p3_ei_perm_work_bargaining_perc">d. Permanent Workers - Collective Bargaining Coverage (%):</label>
                <input
                    type="number"
                    id="p3_ei_perm_work_bargaining_perc"
                    value={formData.essential_indicators.employee_association_collective_bargaining.permanent_workers_collective_bargaining_percentage || ''}
                    onChange={(e) => handleChange('essential_indicators.employee_association_collective_bargaining.permanent_workers_collective_bargaining_percentage', parseFloat(e.target.value))}
                    disabled={disabled}
                />
            </div>
            
            {/* EI Q4: Accessibility of workplaces */}
            <div className="form-group">
                <h5>4. Accessibility of workplaces:</h5>
                <label>Are workplaces accessible to differently abled employees and workers?</label>
                <div>
                    <label>
                        <input 
                            type="radio" 
                            name="p3_ei_workplace_accessibility" 
                            value="true"
                            checked={formData.essential_indicators.workplace_accessibility_differently_abled.is_accessible === true}
                            onChange={(e) => handleRadioChange('essential_indicators.workplace_accessibility_differently_abled.is_accessible', e.target.value)}
                            disabled={disabled}
                        /> Yes
                    </label>
                    <label>
                        <input 
                            type="radio" 
                            name="p3_ei_workplace_accessibility" 
                            value="false"
                            checked={formData.essential_indicators.workplace_accessibility_differently_abled.is_accessible === false}
                            onChange={(e) => handleRadioChange('essential_indicators.workplace_accessibility_differently_abled.is_accessible', e.target.value)}
                            disabled={disabled}
                        /> No
                    </label>
                </div>
                {formData.essential_indicators.workplace_accessibility_differently_abled.is_accessible && (
                    <>
                        <label htmlFor="p3_ei_workplace_accessibility_details">If yes, provide details of facilities:</label>
                        <textarea
                            id="p3_ei_workplace_accessibility_details"
                            value={formData.essential_indicators.workplace_accessibility_differently_abled.facilities_details || ''}
                            onChange={(e) => handleChange('essential_indicators.workplace_accessibility_differently_abled.facilities_details', e.target.value)}
                            disabled={disabled}
                            rows={3}
                        />
                    </>
                )}
            </div>

            {/* ... (More questions for Principle 3 will be added here) ... */}

            <hr />
            {!isSubmitted && (
                <button type="submit" className="form-button" disabled={isLoadingSave}>
                    {isLoadingSave ? 'Saving...' : 'Save Principle 3'}
                </button>
            )}
            {isSubmitted && <p>This principle is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionCPrinciple3Form;

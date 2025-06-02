import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { setNestedValue, deepMerge, isObject } from '../../utils/objectUtils'; // Assuming objectUtils.js is in src/utils

const initialDataP3 = {
    essential_indicators: {
        // Q1: Details of measures for the well-being of employees and workers
        employee_well_being_measures: {
            employees_current_fy: '',
            workers_current_fy: '',
        },        // Q2: Percentage of permanent employees and workers in unions/collective bargaining
        employee_association_collective_bargaining: {
            permanent_employees_union_percentage_current_fy: null,
            permanent_workers_union_percentage_current_fy: null,
            permanent_employees_collective_bargaining_percentage_current_fy: null,
            permanent_workers_collective_bargaining_percentage_current_fy: null,
        },        // Q3: Details of retirement benefits (PF, Gratuity, Superannuation, Other)
        // For Permanent Employees
        retirement_benefits_permanent_employees: {
            pf_count_current_fy: null,
            pf_percentage_current_fy: null,
            gratuity_count_current_fy: null,
            gratuity_percentage_current_fy: null,
            superannuation_count_current_fy: null,
            superannuation_percentage_current_fy: null,
            other_benefits: [{ name: '', count_current_fy: null, percentage_current_fy: null }],
        },
        // For Other than Permanent Employees
        retirement_benefits_other_employees: {
            pf_count_current_fy: null,
            pf_percentage_current_fy: null,
            gratuity_count_current_fy: null,
            gratuity_percentage_current_fy: null,
            superannuation_count_current_fy: null,
            superannuation_percentage_current_fy: null,
            other_benefits: [{ name: '', count_current_fy: null, percentage_current_fy: null }],
        },
        // Q4: Accessibility of workplaces for differently-abled
        workplace_accessibility_differently_abled: {
            is_accessible_current_fy: null, // Yes/No
            facilities_details_current_fy: '',
        },
        // Q5: Paternity leave benefits
        paternity_leave_benefits: {
            is_extended_current_fy: null, // Yes/No
            details_current_fy: '',
        },        // Q6: Training details (Safety, Skill Upgradation, Other)
        // For Employees
        training_details_employees: {
            safety_persons_trained_current_fy: null,
            safety_avg_hours_current_fy: null,
            skill_upgradation_persons_trained_current_fy: null,
            skill_upgradation_avg_hours_current_fy: null,
            other_persons_trained_current_fy: null,
            other_avg_hours_current_fy: null,
        },
        // For Workers
        training_details_workers: {
            safety_persons_trained_current_fy: null,
            safety_avg_hours_current_fy: null,
            skill_upgradation_persons_trained_current_fy: null,
            skill_upgradation_avg_hours_current_fy: null,
            other_persons_trained_current_fy: null,
            other_avg_hours_current_fy: null,
        },
        // Q7: Performance and career development reviews
        // For Employees
        performance_career_development_reviews_employees: {
            total_current_fy: null,
            covered_percentage_current_fy: null,
        },
        // For Workers
        performance_career_development_reviews_workers: {
            total_current_fy: null,
            covered_percentage_current_fy: null,
        },
        // Q8: Health and safety management system
        health_safety_management_system: {
            has_system_current_fy: null, // Yes/No
            is_certified_externally_current_fy: null, // Yes/No
            certification_agency_current_fy: '',
            scope_of_coverage_current_fy: '',
        },        // Q9: Safety-related incidents (Employees)
        safety_related_incidents: {
            employees: {
                ltifr_current_fy: null,
                work_related_injuries_current_fy: null,
                fatalities_current_fy: null,
            },
            workers: {
                ltifr_current_fy: null,
                work_related_injuries_current_fy: null,
                fatalities_current_fy: null,
            },
        },
        // Q10: Life and health insurance coverage
        // For Permanent Employees
        life_health_insurance_permanent_employees: {
            life_insurance_extended_current_fy: null, // Yes/No
            life_insurance_percentage_current_fy: null,
            health_insurance_extended_current_fy: null, // Yes/No
            health_insurance_percentage_current_fy: null,
            statutory_health_coverage_extended_current_fy: null, // Yes/No for ESI etc.
            statutory_health_coverage_percentage_current_fy: null,
        },
        // For Other than Permanent Employees
        life_health_insurance_other_employees: {
            life_insurance_extended_current_fy: null, // Yes/No
            life_insurance_percentage_current_fy: null,
            health_insurance_extended_current_fy: null, // Yes/No
            health_insurance_percentage_current_fy: null,
            statutory_health_coverage_extended_current_fy: null, // Yes/No for ESI etc.
            statutory_health_coverage_percentage_current_fy: null,
        },
        // Q11: Measures taken for the safety of workers
        worker_safety_measures_current_fy: '',
        // Q12: Grievance redressal mechanism
        // For Employees
        grievance_redressal_employees: {
            has_mechanism_current_fy: null, // Yes/No
            details_current_fy: '',
        },
        // For Workers
        grievance_redressal_workers: {
            has_mechanism_current_fy: null, // Yes/No
            details_current_fy: '',
        },
    },    leadership_indicators: {
        // Q1: Benefits beyond statutory requirements
        benefits_over_statutory: {
            is_extended_current_fy: null, // Yes/No
            details_current_fy: null,
        },
        // Q2: Provident Fund contributions above statutory
        provident_fund_over_statutory: {
            is_contributed_current_fy: null, // Yes/No
            details_current_fy: null,
        },
        // Q3: Measures for safe and healthy workplace
        safe_healthy_workplace_measures_current_fy: null,        // Q4: Occupational health and safety training
        // For Permanent Employees
        occupational_health_safety_training_permanent_employees: {
            trained_count_current_fy: null,
            trained_percentage_current_fy: null,
        },
        // For Other than Permanent Employees
        occupational_health_safety_training_other_employees: {
            trained_count_current_fy: null,
            trained_percentage_current_fy: null,
        },
        // Q5: Transition assistance programs for retiring/career change employees
        transition_assistance_programs: {
            is_provided_current_fy: null, // Yes/No
            details_current_fy: null,
        },
        // Q6: Measures to improve employee retention
        employee_retention_measures_current_fy: null,
    },
};


function SectionCPrinciple3Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialDataP3);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');    useEffect(() => {
        if (reportData?.section_c_data?.principle_3) {
            setFormData(prevData => deepMerge(prevData, reportData.section_c_data.principle_3));
        } else {
            setFormData(initialDataP3); // Reset or keep initial if no data
        }
    }, [reportData]);

    const handleChange = (path, value) => {
        setFormData(prevData => {
            return setNestedValue(prevData, path, value);
        });
    };
      // handleRadioChange updated to handle null values properly
    const handleRadioChange = (path, value) => {
        if (value === 'true') {
            handleChange(path, true);
        } else if (value === 'false') {
            handleChange(path, false);
        } else {
            handleChange(path, null);
        }
    };

    // Helper function to add an "other benefit" entry
    const addOtherBenefit = (categoryPath) => {
        const currentBenefits = formData.essential_indicators[categoryPath]?.other_benefits || [];
        const newBenefit = { name: '', count_current_fy: '', percentage_current_fy: '' };
        handleChange(`essential_indicators.${categoryPath}.other_benefits`, [...currentBenefits, newBenefit]);
    };

    // Helper function to remove an "other benefit" entry
    const removeOtherBenefit = (categoryPath, index) => {
        const currentBenefits = formData.essential_indicators[categoryPath]?.other_benefits || [];
        const updatedBenefits = currentBenefits.filter((_, i) => i !== index);
        handleChange(`essential_indicators.${categoryPath}.other_benefits`, updatedBenefits);
    };

    // Helper function to handle changes in "other benefit" fields
    const handleOtherBenefitChange = (categoryPath, index, field, value) => {
        const currentBenefits = formData.essential_indicators[categoryPath]?.other_benefits || [];
        const updatedBenefits = currentBenefits.map((benefit, i) => 
            i === index ? { ...benefit, [field]: value } : benefit
        );
        handleChange(`essential_indicators.${categoryPath}.other_benefits`, updatedBenefits);
    };
    
    // Helper function to render a category row for retirement benefits
    const renderCategoryRow = (categoryKey, categoryLabel, employeeTypePath) => {
        const basePath = `essential_indicators.${employeeTypePath}.${categoryKey}`;
        const countPath = `${basePath}_count_current_fy`;
        const percentagePath = `${basePath}_percentage_current_fy`;
        
        return (
            <tr>
                <td>{categoryLabel}</td>
                <td>                    <input
                        type="number"
                        value={formData.essential_indicators[employeeTypePath]?.[`${categoryKey}_count_current_fy`] ?? ''}
                        onChange={(e) => handleChange(countPath, e.target.value === '' ? null : parseFloat(e.target.value))}
                        disabled={disabled}
                        placeholder="No. of Employees/Workers"
                    />
                </td>
                <td>
                    <input
                        type="number"
                        value={formData.essential_indicators[employeeTypePath]?.[`${categoryKey}_percentage_current_fy`] ?? ''}
                        onChange={(e) => handleChange(percentagePath, e.target.value === '' ? null : parseFloat(e.target.value))}
                        disabled={disabled}
                        placeholder="% of total"
                    />
                </td>
            </tr>
        );
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError('');

        const payload = {
            section_c_data: {
                ...reportData?.section_c_data,
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
            <h3>Principle 3: Businesses should promote the well-being of all employees</h3>
            <p>This principle is aligned with the ILO Declaration on Fundamental Principles and Rights at Work and UN Guiding Principles on Business and Human Rights.</p>

            {localError && <p className="error-message" style={{ color: 'red' }}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{ color: 'green' }}>{localSuccess}</p>}

            <h4>Essential Indicators</h4>

            {/* EI Q1: Measures for well-being */}
            <div className="form-group">
                <h5>1. Describe the measures taken for the well-being of employees and workers during the financial year.</h5>
                <label htmlFor="p3_ei_q1_employees_current_fy">a. Employees (Current FY):</label>
                <textarea
                    id="p3_ei_q1_employees_current_fy"
                    value={formData.essential_indicators.employee_well_being_measures.employees_current_fy || ''}
                    onChange={(e) => handleChange('essential_indicators.employee_well_being_measures.employees_current_fy', e.target.value)}
                    disabled={disabled}
                    rows={3}
                />
                <label htmlFor="p3_ei_q1_workers_current_fy">b. Workers (Current FY):</label>
                <textarea
                    id="p3_ei_q1_workers_current_fy"
                    value={formData.essential_indicators.employee_well_being_measures.workers_current_fy || ''}
                    onChange={(e) => handleChange('essential_indicators.employee_well_being_measures.workers_current_fy', e.target.value)}
                    disabled={disabled}
                    rows={3}
                />
            </div>

            {/* EI Q2: Employee association and collective bargaining */}
            <div className="form-group">
                <h5>2. Percentage of permanent employees and workers who are members of registered employee associations/unions recognized by management or covered by collective bargaining agreements (Current FY):</h5>
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Percentage (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Permanent Employees - Union Membership</td>
                            <td>
                                <input
                                    type="number"
                                    value={formData.essential_indicators.employee_association_collective_bargaining.permanent_employees_union_percentage_current_fy || ''}
                                    onChange={(e) => handleChange('essential_indicators.employee_association_collective_bargaining.permanent_employees_union_percentage_current_fy', parseFloat(e.target.value) || 0)}
                                    disabled={disabled}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>Permanent Workers - Union Membership</td>
                            <td>
                                <input
                                    type="number"
                                    value={formData.essential_indicators.employee_association_collective_bargaining.permanent_workers_union_percentage_current_fy || ''}
                                    onChange={(e) => handleChange('essential_indicators.employee_association_collective_bargaining.permanent_workers_union_percentage_current_fy', parseFloat(e.target.value) || 0)}
                                    disabled={disabled}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>Permanent Employees - Collective Bargaining Coverage</td>
                            <td>
                                <input
                                    type="number"
                                    value={formData.essential_indicators.employee_association_collective_bargaining.permanent_employees_collective_bargaining_percentage_current_fy || ''}
                                    onChange={(e) => handleChange('essential_indicators.employee_association_collective_bargaining.permanent_employees_collective_bargaining_percentage_current_fy', parseFloat(e.target.value) || 0)}
                                    disabled={disabled}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>Permanent Workers - Collective Bargaining Coverage</td>
                            <td>
                                <input
                                    type="number"
                                    value={formData.essential_indicators.employee_association_collective_bargaining.permanent_workers_collective_bargaining_percentage_current_fy || ''}
                                    onChange={(e) => handleChange('essential_indicators.employee_association_collective_bargaining.permanent_workers_collective_bargaining_percentage_current_fy', parseFloat(e.target.value) || 0)}
                                    disabled={disabled}
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* EI Q3: Retirement Benefits */}
            <div className="form-group">
                <h5>3. Details of retirement benefits extended to employees (Current FY):</h5>
                <h6>a. Permanent Employees:</h6>
                <table>
                    <thead>
                        <tr>
                            <th>Benefit</th>
                            <th>No. of Employees Covered</th>
                            <th>Percentage of Total Permanent Employees</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderCategoryRow('pf', 'Provident Fund', 'retirement_benefits_permanent_employees')}
                        {renderCategoryRow('gratuity', 'Gratuity', 'retirement_benefits_permanent_employees')}
                        {renderCategoryRow('superannuation', 'Superannuation Fund', 'retirement_benefits_permanent_employees')}
                        {/* Other Benefits for Permanent Employees */}
                        {formData.essential_indicators.retirement_benefits_permanent_employees.other_benefits.map((benefit, index) => (
                            <tr key={`perm_other_${index}`}>
                                <td>
                                    <input
                                        type="text"
                                        value={benefit.name}
                                        onChange={(e) => handleOtherBenefitChange('retirement_benefits_permanent_employees', index, 'name', e.target.value)}
                                        placeholder="Other Benefit Name"
                                        disabled={disabled}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={benefit.count_current_fy}
                                        onChange={(e) => handleOtherBenefitChange('retirement_benefits_permanent_employees', index, 'count_current_fy', parseFloat(e.target.value) || 0)}
                                        placeholder="No. of Employees"
                                        disabled={disabled}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={benefit.percentage_current_fy}
                                        onChange={(e) => handleOtherBenefitChange('retirement_benefits_permanent_employees', index, 'percentage_current_fy', parseFloat(e.target.value) || 0)}
                                        placeholder="% of total"
                                        disabled={disabled}
                                    />
                                    {index > 0 && (
                                        <button type="button" onClick={() => removeOtherBenefit('retirement_benefits_permanent_employees', index)} disabled={disabled}>Remove</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan="3">
                                <button type="button" onClick={() => addOtherBenefit('retirement_benefits_permanent_employees')} disabled={disabled}>Add Other Benefit (Permanent)</button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h6>b. Other than Permanent Employees:</h6>
                <table>
                    <thead>
                        <tr>
                            <th>Benefit</th>
                            <th>No. of Workers Covered</th>
                            <th>Percentage of Total Other than Permanent Employees</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderCategoryRow('pf', 'Provident Fund', 'retirement_benefits_other_employees')}
                        {renderCategoryRow('gratuity', 'Gratuity', 'retirement_benefits_other_employees')}
                        {renderCategoryRow('superannuation', 'Superannuation Fund', 'retirement_benefits_other_employees')}
                        {/* Other Benefits for Other Employees */}
                        {formData.essential_indicators.retirement_benefits_other_employees.other_benefits.map((benefit, index) => (
                            <tr key={`other_other_${index}`}>
                                <td>
                                    <input
                                        type="text"
                                        value={benefit.name}
                                        onChange={(e) => handleOtherBenefitChange('retirement_benefits_other_employees', index, 'name', e.target.value)}
                                        placeholder="Other Benefit Name"
                                        disabled={disabled}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={benefit.count_current_fy}
                                        onChange={(e) => handleOtherBenefitChange('retirement_benefits_other_employees', index, 'count_current_fy', parseFloat(e.target.value) || 0)}
                                        placeholder="No. of Workers"
                                        disabled={disabled}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={benefit.percentage_current_fy}
                                        onChange={(e) => handleOtherBenefitChange('retirement_benefits_other_employees', index, 'percentage_current_fy', parseFloat(e.target.value) || 0)}
                                        placeholder="% of total"
                                        disabled={disabled}
                                    />
                                    {index > 0 && (
                                        <button type="button" onClick={() => removeOtherBenefit('retirement_benefits_other_employees', index)} disabled={disabled}>Remove</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan="3">
                                <button type="button" onClick={() => addOtherBenefit('retirement_benefits_other_employees')} disabled={disabled}>Add Other Benefit (Other)</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            {/* EI Q4: Accessibility of workplaces */}
            <div className="form-group">
                <h5>4. Are workplaces accessible to differently abled employees and workers? (Current FY)</h5>                <div>
                    <label>
                        <input 
                            type="radio" 
                            name="p3_ei_q4_is_accessible_current_fy" 
                            value="true"
                            checked={formData.essential_indicators.workplace_accessibility_differently_abled.is_accessible_current_fy === true}
                            onChange={(e) => handleRadioChange('essential_indicators.workplace_accessibility_differently_abled.is_accessible_current_fy', e.target.value)}
                            disabled={disabled}
                        />
                        {' '}Yes
                    </label>
                    
                    <label>
                        <input 
                            type="radio" 
                            name="p3_ei_q4_is_accessible_current_fy" 
                            value="false"
                            checked={formData.essential_indicators.workplace_accessibility_differently_abled.is_accessible_current_fy === false}
                            onChange={(e) => handleRadioChange('essential_indicators.workplace_accessibility_differently_abled.is_accessible_current_fy', e.target.value)}
                            disabled={disabled}
                        />
                        {' '}No
                    </label>
                </div>
                {formData.essential_indicators.workplace_accessibility_differently_abled.is_accessible_current_fy && (
                    <>
                        <label htmlFor="p3_ei_q4_facilities_details_current_fy">If yes, provide details of facilities:</label>
                        <textarea
                            id="p3_ei_q4_facilities_details_current_fy"
                            value={formData.essential_indicators.workplace_accessibility_differently_abled.facilities_details_current_fy || ''}
                            onChange={(e) => handleChange('essential_indicators.workplace_accessibility_differently_abled.facilities_details_current_fy', e.target.value)}
                            disabled={disabled}
                            rows={3}
                        />
                    </>
                )}
            </div>

            {/* EI Q5: Paternity Leave Benefits */}
            <div className="form-group">
                <h5>5. Are paternity leave benefits extended to employees? (Current FY)</h5>                 <div>
                    <label>
                        <input 
                            type="radio" 
                            name="p3_ei_q5_paternity_leave_extended_current_fy" 
                            value="true"
                            checked={formData.essential_indicators.paternity_leave_benefits.is_extended_current_fy === true}
                            onChange={(e) => handleRadioChange('essential_indicators.paternity_leave_benefits.is_extended_current_fy', e.target.value)}
                            disabled={disabled}
                        />
                        {' '}Yes
                    </label>
                    
                    <label>
                        <input 
                            type="radio" 
                            name="p3_ei_q5_paternity_leave_extended_current_fy" 
                            value="false"
                            checked={formData.essential_indicators.paternity_leave_benefits.is_extended_current_fy === false}
                            onChange={(e) => handleRadioChange('essential_indicators.paternity_leave_benefits.is_extended_current_fy', e.target.value)}
                            disabled={disabled}
                        />
                        {' '}No
                    </label>
                </div>
                {formData.essential_indicators.paternity_leave_benefits.is_extended_current_fy && (
                    <>
                        <label htmlFor="p3_ei_q5_paternity_leave_details_current_fy">If yes, provide details:</label>
                        <textarea
                            id="p3_ei_q5_paternity_leave_details_current_fy"
                            value={formData.essential_indicators.paternity_leave_benefits.details_current_fy || ''}
                            onChange={(e) => handleChange('essential_indicators.paternity_leave_benefits.details_current_fy', e.target.value)}
                            disabled={disabled}
                            rows={3}
                        />
                    </>
                )}
            </div>

            {/* EI Q6: Training Details */}
            <div className="form-group">
                <h5>6. Details of training given to employees and workers (Current FY):</h5>
                {['employees', 'workers'].map(type => (
                    <div key={type}>
                        <h6>For {type.charAt(0).toUpperCase() + type.slice(1)}:</h6>
                        <table>
                            <thead>
                                <tr>
                                    <th>Training Type</th>
                                    <th>No. of Persons Trained</th>
                                    <th>Average Training Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                {['safety', 'skill_upgradation', 'other'].map(trainingCat => (
                                    <tr key={`${type}_${trainingCat}`}>
                                        <td>{trainingCat.charAt(0).toUpperCase() + trainingCat.slice(1).replace('_', ' ')}</td>
                                        <td>
                                            <input
                                                type="number"
                                                value={formData.essential_indicators[`training_details_${type}`]?.[`${trainingCat}_persons_trained_current_fy`] || ''}
                                                onChange={(e) => handleChange(`essential_indicators.training_details_${type}.${trainingCat}_persons_trained_current_fy`, parseFloat(e.target.value) || 0)}
                                                disabled={disabled}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={formData.essential_indicators[`training_details_${type}`]?.[`${trainingCat}_avg_hours_current_fy`] || ''}
                                                onChange={(e) => handleChange(`essential_indicators.training_details_${type}.${trainingCat}_avg_hours_current_fy`, parseFloat(e.target.value) || 0)}
                                                disabled={disabled}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
            
            {/* EI Q7: Performance and Career Development Reviews */}
            <div className="form-group">
                <h5>7. Details of performance and career development reviews (Current FY):</h5>
                {['employees', 'workers'].map(type => (
                    <div key={`perf_${type}`}>
                        <h6>For {type.charAt(0).toUpperCase() + type.slice(1)}:</h6>
                        <label htmlFor={`p3_ei_q7_${type}_total_current_fy`}>Total Number:</label>
                        <input
                            type="number"
                            id={`p3_ei_q7_${type}_total_current_fy`}
                            value={formData.essential_indicators[`performance_career_development_reviews_${type}`]?.total_current_fy || ''}
                            onChange={(e) => handleChange(`essential_indicators.performance_career_development_reviews_${type}.total_current_fy`, parseFloat(e.target.value) || 0)}
                            disabled={disabled}
                        />
                        <label htmlFor={`p3_ei_q7_${type}_covered_percentage_current_fy`}>Percentage Covered by Review:</label>
                        <input
                            type="number"
                            id={`p3_ei_q7_${type}_covered_percentage_current_fy`}
                            value={formData.essential_indicators[`performance_career_development_reviews_${type}`]?.covered_percentage_current_fy || ''}
                            onChange={(e) => handleChange(`essential_indicators.performance_career_development_reviews_${type}.covered_percentage_current_fy`, parseFloat(e.target.value) || 0)}
                            disabled={disabled}
                        />
                    </div>
                ))}
            </div>

            {/* EI Q8: Health and Safety Management System */}
            <div className="form-group">
                <h5>8. Health and Safety Management System (Current FY):</h5>
                <label>Does the entity have a Health and Safety Management System?</label>                <div>
                    <label>
                        <input 
                            type="radio" 
                            name="p3_ei_q8_has_system_current_fy" 
                            value="true" 
                            checked={formData.essential_indicators.health_safety_management_system.has_system_current_fy === true} 
                            onChange={(e) => handleRadioChange('essential_indicators.health_safety_management_system.has_system_current_fy', e.target.value)} 
                            disabled={disabled} 
                        />
                        {' '}Yes
                    </label>
                    
                    <label>
                        <input 
                            type="radio" 
                            name="p3_ei_q8_has_system_current_fy" 
                            value="false" 
                            checked={formData.essential_indicators.health_safety_management_system.has_system_current_fy === false} 
                            onChange={(e) => handleRadioChange('essential_indicators.health_safety_management_system.has_system_current_fy', e.target.value)} 
                            disabled={disabled} 
                        />
                        {' '}No
                    </label>
                </div>
                {formData.essential_indicators.health_safety_management_system.has_system_current_fy && (
                    <>
                        <label>Is it externally certified?</label>                        <div>
                            <label>
                                <input 
                                    type="radio" 
                                    name="p3_ei_q8_is_certified_current_fy" 
                                    value="true" 
                                    checked={formData.essential_indicators.health_safety_management_system.is_certified_externally_current_fy === true} 
                                    onChange={(e) => handleRadioChange('essential_indicators.health_safety_management_system.is_certified_externally_current_fy', e.target.value)} 
                                    disabled={disabled} 
                                />
                                {' '}Yes
                            </label>
                            
                            <label>
                                <input 
                                    type="radio" 
                                    name="p3_ei_q8_is_certified_current_fy" 
                                    value="false" 
                                    checked={formData.essential_indicators.health_safety_management_system.is_certified_externally_current_fy === false} 
                                    onChange={(e) => handleRadioChange('essential_indicators.health_safety_management_system.is_certified_externally_current_fy', e.target.value)} 
                                    disabled={disabled} 
                                />
                                {' '}No
                            </label>
                        </div>
                        {formData.essential_indicators.health_safety_management_system.is_certified_externally_current_fy && (
                            <>
                                <label htmlFor="p3_ei_q8_certification_agency_current_fy">Certification Agency:</label>
                                <input type="text" id="p3_ei_q8_certification_agency_current_fy" value={formData.essential_indicators.health_safety_management_system.certification_agency_current_fy || ''} onChange={(e) => handleChange('essential_indicators.health_safety_management_system.certification_agency_current_fy', e.target.value)} disabled={disabled} />
                            </>
                        )}
                        <label htmlFor="p3_ei_q8_scope_of_coverage_current_fy">Scope of Coverage:</label>
                        <textarea id="p3_ei_q8_scope_of_coverage_current_fy" value={formData.essential_indicators.health_safety_management_system.scope_of_coverage_current_fy || ''} onChange={(e) => handleChange('essential_indicators.health_safety_management_system.scope_of_coverage_current_fy', e.target.value)} disabled={disabled} rows={2} />
                    </>
                )}
            </div>

            {/* EI Q9: Details of safety related incidents */}
            <div className="form-group">
                <h5>9. Details of safety related incidents:</h5>
                {['employees', 'workers'].map(type => (
                    <div key={`safety_${type}`}>
                        <h6>For {type.charAt(0).toUpperCase() + type.slice(1)}:</h6>
                        <table>
                            <thead>
                                <tr>
                                    <th>Indicator</th>
                                    <th>Current FY</th>
                                    <th>Remarks/Corrective Actions (if any)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Lost Time Injury Frequency Rate (LTIFR)</td>
                                    <td>
                                        <input
                                            type="number"
                                            value={formData.essential_indicators.safety_related_incidents[type].ltifr_current_fy || ''}
                                            onChange={(e) => handleChange(`essential_indicators.safety_related_incidents.${type}.ltifr_current_fy`, parseFloat(e.target.value))}
                                            disabled={disabled}
                                        />
                                    </td>
                                    <td>
                                        {/* Remarks/Corrective Actions for LTIFR, if any */}
                                    </td>
                                </tr>
                                <tr>
                                    <td>No. of work-related injuries</td>
                                    <td>
                                        <input
                                            type="number"
                                            value={formData.essential_indicators.safety_related_incidents[type].work_related_injuries_current_fy || ''}
                                            onChange={(e) => handleChange(`essential_indicators.safety_related_incidents.${type}.work_related_injuries_current_fy`, parseFloat(e.target.value))}
                                            disabled={disabled}
                                        />
                                    </td>
                                    <td>
                                        {/* Remarks/Corrective Actions for work-related injuries, if any */}
                                    </td>
                                </tr>
                                <tr>
                                    <td>No. of fatalities</td>
                                    <td>
                                        <input
                                            type="number"
                                            value={formData.essential_indicators.safety_related_incidents[type].fatalities_current_fy || ''}
                                            onChange={(e) => handleChange(`essential_indicators.safety_related_incidents.${type}.fatalities_current_fy`, parseFloat(e.target.value))}
                                            disabled={disabled}
                                        />
                                    </td>
                                    <td>
                                        {/* Remarks/Corrective Actions for fatalities, if any */}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {/* EI Q10: Life and Health Insurance */}
            <div className="form-group">
                <h5>10. Describe the coverage of life and health insurance for employees (Current FY):</h5>
                {['permanent_employees', 'other_employees'].map(empType => (
                    <div key={empType}>
                        <h6>For {empType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</h6>
                        <table>
                            <thead>
                                <tr>
                                    <th>Insurance Type</th>
                                    <th>Extended? (Yes/No)</th>
                                    <th>Percentage Covered</th>
                                </tr>
                            </thead>
                            <tbody>
                                {['life_insurance', 'health_insurance', 'statutory_health_coverage'].map(insType => (
                                    <tr key={`${empType}_${insType}`}>
                                        <td>{insType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>                                        <td>
                                            <div>
                                                <label>
                                                    <input 
                                                        type="radio" 
                                                        name={`p3_ei_q10_${empType}_${insType}_ext_curr`} 
                                                        value="true" 
                                                        checked={formData.essential_indicators[`life_health_insurance_${empType}`]?.[`${insType}_extended_current_fy`] === true} 
                                                        onChange={(e) => handleRadioChange(`essential_indicators.life_health_insurance_${empType}.${insType}_extended_current_fy`, e.target.value)} 
                                                        disabled={disabled} 
                                                    />
                                                    {' '}Yes
                                                </label>
                                                
                                                <label>
                                                    <input 
                                                        type="radio" 
                                                        name={`p3_ei_q10_${empType}_${insType}_ext_curr`} 
                                                        value="false" 
                                                        checked={formData.essential_indicators[`life_health_insurance_${empType}`]?.[`${insType}_extended_current_fy`] === false} 
                                                        onChange={(e) => handleRadioChange(`essential_indicators.life_health_insurance_${empType}.${insType}_extended_current_fy`, e.target.value)} 
                                                        disabled={disabled} 
                                                    />
                                                    {' '}No
                                                </label>
                                            </div>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={formData.essential_indicators[`life_health_insurance_${empType}`]?.[`${insType}_percentage_current_fy`] || ''}
                                                onChange={(e) => handleChange(`essential_indicators.life_health_insurance_${empType}.${insType}_percentage_current_fy`, parseFloat(e.target.value) || 0)}
                                                disabled={disabled || formData.essential_indicators[`life_health_insurance_${empType}`]?.[`${insType}_extended_current_fy`] === false}
                                                placeholder="% of total"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {/* EI Q11: Measures for safety of workers */}
            <div className="form-group">
                <h5>11. Describe the measures taken for the safety of workers (Current FY):</h5>
                <textarea
                    id="p3_ei_q11_worker_safety_measures_current_fy"
                    value={formData.essential_indicators.worker_safety_measures_current_fy || ''}
                    onChange={(e) => handleChange('essential_indicators.worker_safety_measures_current_fy', e.target.value)}
                    disabled={disabled}
                    rows={3}
                />
            </div>

            {/* EI Q12: Grievance Redressal Mechanism */}
            <div className="form-group">
                <h5>12. Details of grievance redressal mechanism for employees and workers (Current FY):</h5>
                {['employees', 'workers'].map(type => (
                    <div key={`grievance_${type}`}>
                        <h6>For {type.charAt(0).toUpperCase() + type.slice(1)}:</h6>
                        <label>Is there a grievance redressal mechanism in place?</label>                        <div>
                            <label>
                                <input 
                                    type="radio" 
                                    name={`p3_ei_q12_${type}_has_mech_curr`} 
                                    value="true" 
                                    checked={formData.essential_indicators[`grievance_redressal_${type}`]?.has_mechanism_current_fy === true} 
                                    onChange={(e) => handleRadioChange(`essential_indicators.grievance_redressal_${type}.has_mechanism_current_fy`, e.target.value)} 
                                    disabled={disabled} 
                                /> Yes
                            </label>
                            <label>
                                <input 
                                    type="radio" 
                                    name={`p3_ei_q12_${type}_has_mech_curr`} 
                                    value="false" 
                                    checked={formData.essential_indicators[`grievance_redressal_${type}`]?.has_mechanism_current_fy === false} 
                                    onChange={(e) => handleRadioChange(`essential_indicators.grievance_redressal_${type}.has_mechanism_current_fy`, e.target.value)} 
                                    disabled={disabled} 
                                /> No
                            </label>
                        </div>
                        {formData.essential_indicators[`grievance_redressal_${type}`]?.has_mechanism_current_fy && (
                            <>
                                <label htmlFor={`p3_ei_q12_${type}_details_curr`}>Provide details:</label>
                                <textarea
                                    id={`p3_ei_q12_${type}_details_curr`}
                                    value={formData.essential_indicators[`grievance_redressal_${type}`]?.details_current_fy || ''}
                                    onChange={(e) => handleChange(`essential_indicators.grievance_redressal_${type}.details_current_fy`, e.target.value)}
                                    disabled={disabled}
                                    rows={3}
                                />
                            </>
                        )}
                    </div>
                ))}
            </div>


            <h4>Leadership Indicators</h4>
            <p className="leadership-indicators-note">
                <em>Leadership indicators are optional and help demonstrate advanced ESG practices beyond basic compliance.</em>
            </p>            {/* LI Q1: Benefits over statutory requirements */}
            <div className="form-group">
                <h5>1. Does the entity extend benefits over and above statutory requirements to employees/workers? (Current FY)</h5>                <div>
                    <label>
                        <input 
                            type="radio" 
                            name="p3_li_q1_benefits_over_statutory_current_fy" 
                            value="true" 
                            checked={formData.leadership_indicators.benefits_over_statutory.is_extended_current_fy === true} 
                            onChange={(e) => handleRadioChange('leadership_indicators.benefits_over_statutory.is_extended_current_fy', e.target.value)} 
                            disabled={disabled} 
                        />
                        {' '}Yes
                    </label>
                    
                    <label>
                        <input 
                            type="radio" 
                            name="p3_li_q1_benefits_over_statutory_current_fy" 
                            value="false" 
                            checked={formData.leadership_indicators.benefits_over_statutory.is_extended_current_fy === false} 
                            onChange={(e) => handleRadioChange('leadership_indicators.benefits_over_statutory.is_extended_current_fy', e.target.value)} 
                            disabled={disabled} 
                        />
                        {' '}No
                    </label>

                    <label>
                        <input 
                            type="radio" 
                            name="p3_li_q1_benefits_over_statutory_current_fy" 
                            value="null" 
                            checked={formData.leadership_indicators.benefits_over_statutory.is_extended_current_fy === null} 
                            onChange={(e) => handleRadioChange('leadership_indicators.benefits_over_statutory.is_extended_current_fy', e.target.value)} 
                            disabled={disabled} 
                        />
                        {' '}Not Answered
                    </label>
                </div>
                {formData.leadership_indicators.benefits_over_statutory.is_extended_current_fy === true && (
                    <>
                        <label htmlFor="p3_li_q1_benefits_details_current_fy">If yes, provide details:</label>
                        <textarea 
                            id="p3_li_q1_benefits_details_current_fy" 
                            value={formData.leadership_indicators.benefits_over_statutory.details_current_fy || ''} 
                            onChange={(e) => handleChange('leadership_indicators.benefits_over_statutory.details_current_fy', e.target.value || null)} 
                            disabled={disabled} 
                            rows={3} 
                            placeholder="Optional: Provide details about benefits extended beyond statutory requirements"
                        />
                    </>
                )}
            </div>            {/* LI Q2: Provident Fund contributions over statutory */}
            <div className="form-group">
                <h5>2. Does the entity contribute to Provident Fund over and above the statutory minimum? (Current FY)</h5>                <div>
                    <label>
                        <input 
                            type="radio" 
                            name="p3_li_q2_pf_over_statutory_current_fy" 
                            value="true" 
                            checked={formData.leadership_indicators.provident_fund_over_statutory.is_contributed_current_fy === true} 
                            onChange={(e) => handleRadioChange('leadership_indicators.provident_fund_over_statutory.is_contributed_current_fy', e.target.value)} 
                            disabled={disabled} 
                        />
                        {' '}Yes
                    </label>
                    
                    <label>
                        <input 
                            type="radio" 
                            name="p3_li_q2_pf_over_statutory_current_fy" 
                            value="false" 
                            checked={formData.leadership_indicators.provident_fund_over_statutory.is_contributed_current_fy === false} 
                            onChange={(e) => handleRadioChange('leadership_indicators.provident_fund_over_statutory.is_contributed_current_fy', e.target.value)} 
                            disabled={disabled} 
                        />
                        {' '}No
                    </label>

                    <label>
                        <input 
                            type="radio" 
                            name="p3_li_q2_pf_over_statutory_current_fy" 
                            value="null" 
                            checked={formData.leadership_indicators.provident_fund_over_statutory.is_contributed_current_fy === null} 
                            onChange={(e) => handleRadioChange('leadership_indicators.provident_fund_over_statutory.is_contributed_current_fy', e.target.value)} 
                            disabled={disabled} 
                        />
                        {' '}Not Answered
                    </label>
                </div>
                {formData.leadership_indicators.provident_fund_over_statutory.is_contributed_current_fy === true && (
                    <>
                        <label htmlFor="p3_li_q2_pf_details_current_fy">If yes, provide details:</label>
                        <textarea 
                            id="p3_li_q2_pf_details_current_fy" 
                            value={formData.leadership_indicators.provident_fund_over_statutory.details_current_fy || ''} 
                            onChange={(e) => handleChange('leadership_indicators.provident_fund_over_statutory.details_current_fy', e.target.value || null)} 
                            disabled={disabled} 
                            rows={3} 
                            placeholder="Optional: Provide details about PF contributions above statutory minimum"
                        />
                    </>
                )}
            </div>
              {/* LI Q3: Measures for safe and healthy workplace */}
            <div className="form-group">
                <h5>3. Describe measures taken to ensure a safe and healthy work place (Current FY):</h5>
                <textarea
                    id="p3_li_q3_safe_healthy_workplace_measures_current_fy"
                    value={formData.leadership_indicators.safe_healthy_workplace_measures_current_fy || ''}
                    onChange={(e) => handleChange('leadership_indicators.safe_healthy_workplace_measures_current_fy', e.target.value || null)}
                    disabled={disabled}
                    rows={3}
                    placeholder="Optional: Describe specific measures for workplace safety and health"
                />
            </div>            {/* LI Q4: Occupational health and safety training */}
            <div className="form-group">
                <h5>4. Details of occupational health and safety training provided (Current FY):</h5>
                <p><em>Optional: Provide training data if your organization conducts advanced OHS training programs.</em></p>
                {['permanent_employees', 'other_employees'].map(empType => (
                    <div key={`ohs_training_${empType}`}>
                        <h6>For {empType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</h6>
                        <label htmlFor={`p3_li_q4_${empType}_trained_count_current_fy`}>Number of Persons Trained:</label>                        <input
                            type="number"
                            id={`p3_li_q4_${empType}_trained_count_current_fy`}
                            value={formData.leadership_indicators[`occupational_health_safety_training_${empType}`]?.trained_count_current_fy ?? ''}
                            onChange={(e) => handleChange(`leadership_indicators.occupational_health_safety_training_${empType}.trained_count_current_fy`, e.target.value === '' ? null : parseFloat(e.target.value))}
                            disabled={disabled}
                            placeholder="Optional: Number trained"
                        />
                        <label htmlFor={`p3_li_q4_${empType}_trained_percentage_current_fy`}>Percentage of Total {empType.replace('_', ' ')} Trained:</label>
                        <input
                            type="number"
                            id={`p3_li_q4_${empType}_trained_percentage_current_fy`}
                            value={formData.leadership_indicators[`occupational_health_safety_training_${empType}`]?.trained_percentage_current_fy ?? ''}
                            onChange={(e) => handleChange(`leadership_indicators.occupational_health_safety_training_${empType}.trained_percentage_current_fy`, e.target.value === '' ? null : parseFloat(e.target.value))}
                            disabled={disabled}
                            placeholder="Optional: Percentage trained"
                        />
                    </div>
                ))}
            </div>            {/* LI Q5: Transition assistance programs */}
            <div className="form-group">
                <h5>5. Are transition assistance programs provided to employees retiring or separating due to workforce changes? (Current FY)</h5>                <div>
                    <label>
                        <input 
                            type="radio" 
                            name="p3_li_q5_transition_assistance_current_fy" 
                            value="true" 
                            checked={formData.leadership_indicators.transition_assistance_programs.is_provided_current_fy === true} 
                            onChange={(e) => handleRadioChange('leadership_indicators.transition_assistance_programs.is_provided_current_fy', e.target.value)} 
                            disabled={disabled} 
                        />
                        {' '}Yes
                    </label>
                    
                    <label>
                        <input 
                            type="radio" 
                            name="p3_li_q5_transition_assistance_current_fy" 
                            value="false" 
                            checked={formData.leadership_indicators.transition_assistance_programs.is_provided_current_fy === false} 
                            onChange={(e) => handleRadioChange('leadership_indicators.transition_assistance_programs.is_provided_current_fy', e.target.value)} 
                            disabled={disabled} 
                        />
                        {' '}No
                    </label>

                    <label>
                        <input 
                            type="radio" 
                            name="p3_li_q5_transition_assistance_current_fy" 
                            value="null" 
                            checked={formData.leadership_indicators.transition_assistance_programs.is_provided_current_fy === null} 
                            onChange={(e) => handleRadioChange('leadership_indicators.transition_assistance_programs.is_provided_current_fy', e.target.value)} 
                            disabled={disabled} 
                        />
                        {' '}Not Answered
                    </label>
                </div>
                {formData.leadership_indicators.transition_assistance_programs.is_provided_current_fy === true && (
                    <>
                        <label htmlFor="p3_li_q5_transition_details_current_fy">If yes, provide details:</label>
                        <textarea 
                            id="p3_li_q5_transition_details_current_fy" 
                            value={formData.leadership_indicators.transition_assistance_programs.details_current_fy || ''} 
                            onChange={(e) => handleChange('leadership_indicators.transition_assistance_programs.details_current_fy', e.target.value || null)} 
                            disabled={disabled} 
                            rows={3} 
                            placeholder="Optional: Describe transition assistance programs"
                        />
                    </>
                )}
            </div>            {/* LI Q6: Measures to improve employee retention */}
            <div className="form-group">
                <h5>6. Describe any specific measures taken to improve employee retention (Current FY):</h5>
                <textarea
                    id="p3_li_q6_employee_retention_measures_current_fy"
                    value={formData.leadership_indicators.employee_retention_measures_current_fy || ''}
                    onChange={(e) => handleChange('leadership_indicators.employee_retention_measures_current_fy', e.target.value || null)}
                    disabled={disabled}
                    rows={3}
                    placeholder="Optional: Describe specific employee retention measures"
                />
            </div>


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

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../../pages/ProfilePage.css'; // Re-use styles for now, consider specific wizard styles later

// Helper for Q18 employee/worker categories
const employeeWorkerCategoryInitial = {
    permanent_total: '', permanent_male_no: '', permanent_female_no: '',
    other_total: '', other_male_no: '', other_female_no: '',
};

// Helper for Q20 turnover rate for one year
const turnoverRateYearInitial = {
    year_label: '', 
    employees_male_turnover: '', employees_female_turnover: '', employees_total_turnover: '',
    workers_male_turnover: '', workers_female_turnover: '', workers_total_turnover: '',
};

// Define a comprehensive initial structure for Section A data
const initialSectionAData = {
    company_name: '',
    cin: '',
    year_of_incorporation: '',
    registered_office_address: '',
    corporate_address: '',
    email: '',
    telephone: '',
    website: '',
    financial_year: '', // This will be from the report object itself, but good to have in form structure
    stock_exchange_listed: '',
    paid_up_capital: '',
    brsr_contact_name: '',
    brsr_contact_mail: '',
    brsr_contact_number: '',
    reporting_boundary: 'Standalone',
    sa_business_activities_turnover: [{ description_main: '', description_business: '', turnover_percentage: '' }],
    sa_product_services_turnover: [{ product_service: '', nic_code: '', turnover_contributed: '' }],
    sa_locations_plants_offices: {
        national_plants: 0, national_offices: 0, international_plants: 0, international_offices: 0,
    },
    sa_markets_served: {
        locations: { national_states: 0, international_countries: 0 },
        exports_percentage: '0',
        customer_types: ''
    },
    // New fields for Q18, Q19, Q20
    sa_employee_details: { // Q18a
        permanent_male: 0, permanent_female: 0,
        other_than_permanent_male: 0, other_than_permanent_female: 0,
    },
    sa_workers_details: { // Q18b
        permanent_male: 0, permanent_female: 0,
        other_than_permanent_male: 0, other_than_permanent_female: 0,
    },
    sa_differently_abled_details: { // Q18c
        employees_male: 0, employees_female: 0,
        workers_male: 0, workers_female: 0,
    },
    sa_women_representation_details: { // Q19
        board_total_members: 0, board_number_of_women: 0,
        kmp_total_personnel: 0, kmp_number_of_women: 0,
    },
    sa_turnover_rate: { // Q20
        permanent_employees_turnover_rate: '',
        permanent_workers_turnover_rate: '',
    },
    // Existing fields (will be Q21, Q22, Q23)
    sa_holding_subsidiary_associate_companies: [{ name: '', cin_or_country: '', type: 'Holding', percentage_holding: '' }],
    sa_csr_applicable: false,
    sa_csr_turnover: '',
    sa_csr_net_worth: '',
    sa_transparency_complaints: {
        received: 0, pending: 0, remarks: ''
    }
};

function SectionAForm() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialSectionAData);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {
        if (reportData && reportData.section_a_data) {
            // Deep merge fetched data with initial structure to ensure all fields are present
            const mergedData = {
                ...initialSectionAData,
                ...reportData.section_a_data,
                sa_locations_plants_offices: {
                    ...initialSectionAData.sa_locations_plants_offices,
                    ...(reportData.section_a_data.sa_locations_plants_offices || {}),
                },
                sa_markets_served: {
                    ...initialSectionAData.sa_markets_served,
                    ...(reportData.section_a_data.sa_markets_served || {}),
                },
                // Merge new Q18, Q19, Q20 data structures
                sa_employee_details: {
                    ...initialSectionAData.sa_employee_details,
                    ...(reportData.section_a_data.sa_employee_details || {}),
                },
                sa_workers_details: {
                    ...initialSectionAData.sa_workers_details,
                    ...(reportData.section_a_data.sa_workers_details || {}),
                },
                sa_differently_abled_details: {
                    ...initialSectionAData.sa_differently_abled_details,
                    ...(reportData.section_a_data.sa_differently_abled_details || {}),
                },
                sa_women_representation_details: {
                    ...initialSectionAData.sa_women_representation_details,
                    ...(reportData.section_a_data.sa_women_representation_details || {}),
                },
                sa_turnover_rate: {
                    ...initialSectionAData.sa_turnover_rate,
                    ...(reportData.section_a_data.sa_turnover_rate || {}),
                },
                sa_transparency_complaints: {
                    ...initialSectionAData.sa_transparency_complaints,
                    ...(reportData.section_a_data.sa_transparency_complaints || {}),
                },
                // Ensure arrays are at least initialized if null/undefined from backend
                sa_business_activities_turnover: reportData.section_a_data.sa_business_activities_turnover && reportData.section_a_data.sa_business_activities_turnover.length > 0
                    ? reportData.section_a_data.sa_business_activities_turnover
                    : initialSectionAData.sa_business_activities_turnover,
                sa_product_services_turnover: reportData.section_a_data.sa_product_services_turnover && reportData.section_a_data.sa_product_services_turnover.length > 0
                    ? reportData.section_a_data.sa_product_services_turnover
                    : initialSectionAData.sa_product_services_turnover,
                sa_holding_subsidiary_associate_companies: reportData.section_a_data.sa_holding_subsidiary_associate_companies && reportData.section_a_data.sa_holding_subsidiary_associate_companies.length > 0
                    ? reportData.section_a_data.sa_holding_subsidiary_associate_companies
                    : initialSectionAData.sa_holding_subsidiary_associate_companies,
            };
            setFormData(mergedData);
        } else if (reportData) { // reportData exists but section_a_data might be null
             setFormData(initialSectionAData); // Initialize with defaults
        }
    }, [reportData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        // For turnover rates, allow direct string input including '%'
        if (name === 'sa_turnover_rate.permanent_employees_turnover_rate' || name === 'sa_turnover_rate.permanent_workers_turnover_rate') {
            handleNestedChange(name, value);
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleNestedChange = (path, value) => {
        setFormData(prev => {
            const keys = path.split('.');
            let current = prev;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return { ...prev };
        });
    };

    const handleArrayObjectChange = (arrayName, index, fieldName, value) => {
        setFormData(prev => {
            const newArray = [...prev[arrayName]];
            newArray[index] = { ...newArray[index], [fieldName]: value };
            return { ...prev, [arrayName]: newArray };
        });
    };

    const addArrayItem = (arrayName, itemStructure) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: [...(prev[arrayName] || []), { ...itemStructure }]
        }));
    };

    const removeArrayItem = (arrayName, index) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].filter((_, i) => i !== index)
        }));
    };

    // Add calculatePercentage helper function
    const calculatePercentage = (numerator, denominator) => {
        const num = parseFloat(numerator);
        const den = parseFloat(denominator);
        if (isNaN(num) || isNaN(den) || den === 0) { // num === 0 is fine, results in 0%
            return '0.00%';
        }
        return ((num / den) * 100).toFixed(2) + '%';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError(''); // Clear wizard-level error

        const success = await handleSaveProgress('section_a_data', formData);
        if (success) {
            setLocalSuccess('Section A saved successfully!');
        } else {
            // Error will be set by handleSaveProgress in ReportWizardPage and displayed there
            // Or, if handleSaveProgress doesn't set a global error, set one locally
            setLocalError('Failed to save Section A. Check console or wizard errors.');
        }
    };
    
    if (!reportData) {
        return <p>Loading Section A data...</p>;
    }

    const disabled = isSubmitted || isLoadingSave;

    // Helper for table cell inputs
    const renderNumericInput = (path, nestedKey) => (
        <input
            type="number"
            min="0"
            value={formData[path]?.[nestedKey] || 0}
            onChange={e => handleNestedChange(`${path}.${nestedKey}`, parseInt(e.target.value, 10) || 0)}
            disabled={disabled}
            style={{ width: '80px' }}
        />
    );
    
    // Calculate totals for display
    const employees_permanent_total = (formData.sa_employee_details?.permanent_male || 0) + (formData.sa_employee_details?.permanent_female || 0);
    const employees_other_total = (formData.sa_employee_details?.other_than_permanent_male || 0) + (formData.sa_employee_details?.other_than_permanent_female || 0);
    const employees_total_male = (formData.sa_employee_details?.permanent_male || 0) + (formData.sa_employee_details?.other_than_permanent_male || 0);
    const employees_total_female = (formData.sa_employee_details?.permanent_female || 0) + (formData.sa_employee_details?.other_than_permanent_female || 0);
    const employees_grand_total = employees_total_male + employees_total_female;

    const workers_permanent_total = (formData.sa_workers_details?.permanent_male || 0) + (formData.sa_workers_details?.permanent_female || 0);
    const workers_other_total = (formData.sa_workers_details?.other_than_permanent_male || 0) + (formData.sa_workers_details?.other_than_permanent_female || 0);
    const workers_total_male = (formData.sa_workers_details?.permanent_male || 0) + (formData.sa_workers_details?.other_than_permanent_male || 0);
    const workers_total_female = (formData.sa_workers_details?.permanent_female || 0) + (formData.sa_workers_details?.other_than_permanent_female || 0);
    const workers_grand_total = workers_total_male + workers_total_female;

    const diff_abled_employees_total = (formData.sa_differently_abled_details?.employees_male || 0) + (formData.sa_differently_abled_details?.employees_female || 0);
    const diff_abled_workers_total = (formData.sa_differently_abled_details?.workers_male || 0) + (formData.sa_differently_abled_details?.workers_female || 0);
    const diff_abled_total_male = (formData.sa_differently_abled_details?.employees_male || 0) + (formData.sa_differently_abled_details?.workers_male || 0);
    const diff_abled_total_female = (formData.sa_differently_abled_details?.employees_female || 0) + (formData.sa_differently_abled_details?.workers_female || 0);
    const diff_abled_grand_total = diff_abled_total_male + diff_abled_total_female;

    return (
        <form onSubmit={handleSubmit} className="profile-form section-a-form">
            <h3>Section A: General Disclosures</h3>
            <p>These disclosures provide basic information about the company and its BRSR reporting.</p>
            
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}            {/* Render form fields similar to EditDisclosuresPage, adapted for formData */}
            {/* Company Name and CIN fields removed since they're not editable */}
            
            {/* ... other general fields like year_of_incorporation, addresses, contact, financial_year (from report), stock_exchange_listed, paid_up_capital ... */}
            {/* These are mostly copied from company profile during report initialization */}

            <div className="form-group">
                <label htmlFor="reporting_boundary">Reporting Boundary (Q13)</label>
                <select id="reporting_boundary" name="reporting_boundary" value={formData.reporting_boundary || 'Standalone'} onChange={handleChange} disabled={disabled}>
                    <option value="Standalone">Standalone</option>
                    <option value="Consolidated">Consolidated</option>
                </select>
            </div>

            {/* Q14: Business Activities & Turnover */}
            <h4>Business Activities & Turnover (Q14)</h4>
            {formData.sa_business_activities_turnover && formData.sa_business_activities_turnover.map((activity, index) => (
                <div key={index} className="array-item">
                    <input type="text" placeholder="Main Activity" value={activity.description_main || ''} onChange={e => handleArrayObjectChange('sa_business_activities_turnover', index, 'description_main', e.target.value)} disabled={disabled} />
                    <input type="text" placeholder="Business Activity" value={activity.description_business || ''} onChange={e => handleArrayObjectChange('sa_business_activities_turnover', index, 'description_business', e.target.value)} disabled={disabled} />
                    <input type="number" placeholder="% of Turnover" value={activity.turnover_percentage || ''} onChange={e => handleArrayObjectChange('sa_business_activities_turnover', index, 'turnover_percentage', e.target.value)} disabled={disabled} />
                    {!disabled && <button type="button" onClick={() => removeArrayItem('sa_business_activities_turnover', index)}>Remove</button>}
                </div>
            ))}
            {!disabled && <button type="button" onClick={() => addArrayItem('sa_business_activities_turnover', { description_main: '', description_business: '', turnover_percentage: '' })}>Add Activity</button>}

            {/* Q15: Products/Services & Turnover */}
            <h4>Products/Services & Turnover (Q15)</h4>
            {formData.sa_product_services_turnover && formData.sa_product_services_turnover.map((product, index) => (
                <div key={index} className="array-item">
                    <input type="text" placeholder="Product/Service" value={product.product_service || ''} onChange={e => handleArrayObjectChange('sa_product_services_turnover', index, 'product_service', e.target.value)} disabled={disabled} />
                    <input type="text" placeholder="NIC Code" value={product.nic_code || ''} onChange={e => handleArrayObjectChange('sa_product_services_turnover', index, 'nic_code', e.target.value)} disabled={disabled} />
                    <input type="number" placeholder="% Turnover Contributed" value={product.turnover_contributed || ''} onChange={e => handleArrayObjectChange('sa_product_services_turnover', index, 'turnover_contributed', e.target.value)} disabled={disabled} />
                    {!disabled && <button type="button" onClick={() => removeArrayItem('sa_product_services_turnover', index)}>Remove</button>}
                </div>
            ))}
            {!disabled && <button type="button" onClick={() => addArrayItem('sa_product_services_turnover', { product_service: '', nic_code: '', turnover_contributed: '' })}>Add Product/Service</button>}
            
            {/* Q16: Locations */}
            <h4>Locations of Plants and Offices (Q16)</h4>
            <div className="form-group">
                <label>National Plants: <input type="number" value={formData.sa_locations_plants_offices?.national_plants || 0} onChange={e => handleNestedChange('sa_locations_plants_offices.national_plants', parseInt(e.target.value))} disabled={disabled} /></label>
                <label>National Offices: <input type="number" value={formData.sa_locations_plants_offices?.national_offices || 0} onChange={e => handleNestedChange('sa_locations_plants_offices.national_offices', parseInt(e.target.value))} disabled={disabled} /></label>
                <label>International Plants: <input type="number" value={formData.sa_locations_plants_offices?.international_plants || 0} onChange={e => handleNestedChange('sa_locations_plants_offices.international_plants', parseInt(e.target.value))} disabled={disabled} /></label>
                <label>International Offices: <input type="number" value={formData.sa_locations_plants_offices?.international_offices || 0} onChange={e => handleNestedChange('sa_locations_plants_offices.international_offices', parseInt(e.target.value))} disabled={disabled} /></label>
            </div>

            {/* Q17: Markets Served */}
            <h4>Markets Served (Q17)</h4>
            <div className="form-group">
                <label>National (No. of States): <input type="number" value={formData.sa_markets_served?.locations?.national_states || 0} onChange={e => handleNestedChange('sa_markets_served.locations.national_states', parseInt(e.target.value))} disabled={disabled} /></label>
                <label>International (No. of Countries): <input type="number" value={formData.sa_markets_served?.locations?.international_countries || 0} onChange={e => handleNestedChange('sa_markets_served.locations.international_countries', parseInt(e.target.value))} disabled={disabled} /></label>
            </div>
            <div className="form-group">
                <label htmlFor="sa_markets_served_exports_percentage">Contribution of exports to total turnover (%):</label>
                <input type="text" id="sa_markets_served_exports_percentage" name="sa_markets_served.exports_percentage" value={formData.sa_markets_served?.exports_percentage || '0'} onChange={e => handleNestedChange('sa_markets_served.exports_percentage', e.target.value)} disabled={disabled} />
            </div>
            <div className="form-group">
                <label htmlFor="sa_markets_served_customer_types">Description of Customer Base:</label>
                <textarea id="sa_markets_served_customer_types" name="sa_markets_served.customer_types" value={formData.sa_markets_served?.customer_types || ''} onChange={e => handleNestedChange('sa_markets_served.customer_types', e.target.value)} disabled={disabled}></textarea>
            </div>

            {/* Q18: Employee and Worker Details */}
            <h4>Employee and Worker Details (Q18)</h4>
            <p>(As on March 31 of the financial year)</p>
            <style>{'.brsr-table, .brsr-table th, .brsr-table td { border: 1px solid #ccc; border-collapse: collapse; padding: 8px; text-align: center; } .brsr-table th { background-color: #f2f2f2; } .brsr-table td:first-child { text-align: left; }'}</style>
            
            <h5>a. Employees</h5>
            <table className="brsr-table" style={{width: '100%', marginBottom: '20px'}}>
                <thead>
                    <tr><th>Category</th><th>Male</th><th>Female</th><th>Total</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Permanent</td>
                        <td>{renderNumericInput('sa_employee_details', 'permanent_male')}</td>
                        <td>{renderNumericInput('sa_employee_details', 'permanent_female')}</td>
                        <td>{employees_permanent_total}</td>
                    </tr>
                    <tr>
                        <td>Other than Permanent</td>
                        <td>{renderNumericInput('sa_employee_details', 'other_than_permanent_male')}</td>
                        <td>{renderNumericInput('sa_employee_details', 'other_than_permanent_female')}</td>
                        <td>{employees_other_total}</td>
                    </tr>
                    <tr>
                        <td><strong>Total Employees</strong></td>
                        <td><strong>{employees_total_male}</strong></td>
                        <td><strong>{employees_total_female}</strong></td>
                        <td><strong>{employees_grand_total}</strong></td>
                    </tr>
                </tbody>
            </table>

            <h5>b. Workers</h5>
            <table className="brsr-table" style={{width: '100%', marginBottom: '20px'}}>
                <thead>
                    <tr><th>Category</th><th>Male</th><th>Female</th><th>Total</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Permanent</td>
                        <td>{renderNumericInput('sa_workers_details', 'permanent_male')}</td>
                        <td>{renderNumericInput('sa_workers_details', 'permanent_female')}</td>
                        <td>{workers_permanent_total}</td>
                    </tr>
                    <tr>
                        <td>Other than Permanent</td>
                        <td>{renderNumericInput('sa_workers_details', 'other_than_permanent_male')}</td>
                        <td>{renderNumericInput('sa_workers_details', 'other_than_permanent_female')}</td>
                        <td>{workers_other_total}</td>
                    </tr>
                    <tr>
                        <td><strong>Total Workers</strong></td>
                        <td><strong>{workers_total_male}</strong></td>
                        <td><strong>{workers_total_female}</strong></td>
                        <td><strong>{workers_grand_total}</strong></td>
                    </tr>
                </tbody>
            </table>

            <h5>c. Differently Abled Employees and Workers</h5>
            <table className="brsr-table" style={{width: '100%', marginBottom: '20px'}}>
                <thead>
                    <tr><th>Category</th><th>Male</th><th>Female</th><th>Total</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Employees</td>
                        <td>{renderNumericInput('sa_differently_abled_details', 'employees_male')}</td>
                        <td>{renderNumericInput('sa_differently_abled_details', 'employees_female')}</td>
                        <td>{diff_abled_employees_total}</td>
                    </tr>
                    <tr>
                        <td>Workers</td>
                        <td>{renderNumericInput('sa_differently_abled_details', 'workers_male')}</td>
                        <td>{renderNumericInput('sa_differently_abled_details', 'workers_female')}</td>
                        <td>{diff_abled_workers_total}</td>
                    </tr>
                    <tr>
                        <td><strong>Total Differently Abled</strong></td>
                        <td><strong>{diff_abled_total_male}</strong></td>
                        <td><strong>{diff_abled_total_female}</strong></td>
                        <td><strong>{diff_abled_grand_total}</strong></td>
                    </tr>
                </tbody>
            </table>

            {/* Q19: Participation/inclusion/representation of women */}
            <h4>Participation/Inclusion/Representation of Women (Q19)</h4>
            <table className="brsr-table" style={{width: '100%', marginBottom: '20px'}}>
                <thead>
                    <tr><th>Category</th><th>Total Numbers</th><th>Number of Women</th><th>Percentage of Women (%)</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Board of Directors</td>
                        <td>{renderNumericInput('sa_women_representation_details', 'board_total_members')}</td>
                        <td>{renderNumericInput('sa_women_representation_details', 'board_number_of_women')}</td>
                        <td>{calculatePercentage(formData.sa_women_representation_details?.board_number_of_women, formData.sa_women_representation_details?.board_total_members)}</td>
                    </tr>
                    <tr>
                        <td>Key Managerial Personnel (KMPs)</td>
                        <td>{renderNumericInput('sa_women_representation_details', 'kmp_total_personnel')}</td>
                        <td>{renderNumericInput('sa_women_representation_details', 'kmp_number_of_women')}</td>
                        <td>{calculatePercentage(formData.sa_women_representation_details?.kmp_number_of_women, formData.sa_women_representation_details?.kmp_total_personnel)}</td>
                    </tr>
                </tbody>
            </table>
            <small>Note: Number of women employees and workers are covered in Q18.</small>


            {/* Q20: Turnover rate for permanent employees and workers */}
            <h4>Turnover Rate for Permanent Employees and Workers (Q20)</h4>
            <p>(During the financial year, provide as percentage %)</p>
            <div className="form-group">
                <label htmlFor="sa_turnover_employees">Permanent Employees Turnover Rate (%):</label>
                <input 
                    type="text" 
                    id="sa_turnover_employees" 
                    value={formData.sa_turnover_rate?.permanent_employees_turnover_rate || ''} 
                    onChange={e => handleNestedChange('sa_turnover_rate.permanent_employees_turnover_rate', e.target.value)} 
                    disabled={disabled} 
                    placeholder="e.g., 5.5%" />
            </div>
            <div className="form-group">
                <label htmlFor="sa_turnover_workers">Permanent Workers Turnover Rate (%):</label>
                <input 
                    type="text" 
                    id="sa_turnover_workers" 
                    value={formData.sa_turnover_rate?.permanent_workers_turnover_rate || ''} 
                    onChange={e => handleNestedChange('sa_turnover_rate.permanent_workers_turnover_rate', e.target.value)} 
                    disabled={disabled} 
                    placeholder="e.g., 7.2%" />
            </div>
            {/* Add inputs for Previous FY if required by BRSR format and user */}
            {/* <p>Previous Financial Year:</p> ... */}


            {/* Q21: Holding, Subsidiary, Associate Companies (Previously Q19) */}
            <h4>Holding, Subsidiary, and Associate Companies (Q21)</h4>
            {formData.sa_holding_subsidiary_associate_companies && formData.sa_holding_subsidiary_associate_companies.map((company, index) => (
                <div key={index} className="array-item">
                    <input type="text" placeholder="Company Name" value={company.name || ''} onChange={e => handleArrayObjectChange('sa_holding_subsidiary_associate_companies', index, 'name', e.target.value)} disabled={disabled} />
                    <input type="text" placeholder="CIN / Country" value={company.cin_or_country || ''} onChange={e => handleArrayObjectChange('sa_holding_subsidiary_associate_companies', index, 'cin_or_country', e.target.value)} disabled={disabled} />
                    <select value={company.type || 'Holding'} onChange={e => handleArrayObjectChange('sa_holding_subsidiary_associate_companies', index, 'type', e.target.value)} disabled={disabled}>
                        <option value="Holding">Holding</option>
                        <option value="Subsidiary">Subsidiary</option>
                        <option value="Associate">Associate</option>
                        <option value="Joint Venture">Joint Venture</option>
                    </select>
                    <input type="text" placeholder="% Holding" value={company.percentage_holding || ''} onChange={e => handleArrayObjectChange('sa_holding_subsidiary_associate_companies', index, 'percentage_holding', e.target.value)} disabled={disabled} />
                    {!disabled && <button type="button" onClick={() => removeArrayItem('sa_holding_subsidiary_associate_companies', index)}>Remove</button>}
                </div>
            ))}
            {!disabled && <button type="button" onClick={() => addArrayItem('sa_holding_subsidiary_associate_companies', { name: '', cin_or_country: '', type: 'Holding', percentage_holding: '' })}>Add Company</button>}

            {/* Q22: CSR (Previously Q20) */}
            <h4>CSR Details (Q22)</h4>
            <div className="form-group">
                <label>
                    <input type="checkbox" name="sa_csr_applicable" checked={formData.sa_csr_applicable || false} onChange={handleChange} disabled={disabled} />
                    Is CSR applicable as per Section 135 of Companies Act, 2013?
                </label>
            </div>
            {formData.sa_csr_applicable && (
                <>
                    <div className="form-group">
                        <label htmlFor="sa_csr_turnover">Turnover (in Rs.):</label>
                        <input type="text" id="sa_csr_turnover" name="sa_csr_turnover" value={formData.sa_csr_turnover || ''} onChange={handleChange} disabled={disabled} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="sa_csr_net_worth">Net Worth (in Rs.):</label>
                        <input type="text" id="sa_csr_net_worth" name="sa_csr_net_worth" value={formData.sa_csr_net_worth || ''} onChange={handleChange} disabled={disabled} />
                    </div>
                </>
            )}

            {/* Q23: Transparency & Disclosure Complaints (Previously Q21) */}
            <h4>Transparency and Disclosure Complaints (Q23)</h4>
            <div className="form-group">
                <label>Complaints Received: <input type="number" value={formData.sa_transparency_complaints?.received || 0} onChange={e => handleNestedChange('sa_transparency_complaints.received', parseInt(e.target.value))} disabled={disabled} /></label>
                <label>Pending Resolution: <input type="number" value={formData.sa_transparency_complaints?.pending || 0} onChange={e => handleNestedChange('sa_transparency_complaints.pending', parseInt(e.target.value))} disabled={disabled} /></label>
            </div>
            <div className="form-group">
                <label htmlFor="sa_transparency_complaints_remarks">Remarks (if any):</label>
                <textarea id="sa_transparency_complaints_remarks" value={formData.sa_transparency_complaints?.remarks || ''} onChange={e => handleNestedChange('sa_transparency_complaints.remarks', e.target.value)} disabled={disabled}></textarea>
            </div>
            
            <hr />
            {!isSubmitted && (
                <button type="submit" className="form-button" disabled={isLoadingSave}>
                    {isLoadingSave ? 'Saving...' : 'Save Section A'}
                </button>
            )}
             {isSubmitted && <p>This section is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionAForm;

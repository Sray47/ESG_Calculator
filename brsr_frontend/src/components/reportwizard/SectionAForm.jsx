import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getSession, fetchCompanyProfile, updateCompanyProfile, updateBrSrReport } from '../../services/authService';
import '../../pages/ProfilePage.css'; // Re-use styles for now, consider specific wizard styles later

// Utility function for setting nested values immutably
const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const result = { ...obj };
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...current[key] };
        current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return result;
};

// Validation functions
const validateField = (name, value) => {
    const errors = {};
    
    switch (name) {
        case 'cin':
            if (value && !/^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(value)) {
                errors.cin = 'CIN must be in format L12345AB1234ABC123456';
            }
            break;
        case 'email':
        case 'brsr_contact_mail':
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors[name] = 'Please enter a valid email address';
            }
            break;
        case 'website':
            if (value && !/^https?:\/\/.+/.test(value)) {
                errors.website = 'Website must start with http:// or https://';
            }
            break;
        case 'year_of_incorporation':
            const year = parseInt(value);
            const currentYear = new Date().getFullYear();
            if (value && (year < 1800 || year > currentYear)) {
                errors.year_of_incorporation = `Year must be between 1800 and ${currentYear}`;
            }
            break;
        case 'paid_up_capital':
            if (value && (isNaN(value) || parseFloat(value) < 0)) {
                errors.paid_up_capital = 'Paid up capital must be a valid positive number';
            }
            break;
    }
    
    return errors;
};

// Percentage validation helper
const validatePercentage = (value) => {
    if (!value) return true;
    const numericValue = parseFloat(value.toString().replace('%', ''));
    return !isNaN(numericValue) && numericValue >= 0 && numericValue <= 100;
};

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
    sa_employee_details: {
        permanent_male: 0, permanent_female: 0,
        other_than_permanent_male: 0, other_than_permanent_female: 0,
    },
    sa_workers_details: {
        permanent_male: 0, permanent_female: 0,
        other_than_permanent_male: 0, other_than_permanent_female: 0,
    },
    sa_differently_abled_details: {
        employees_male: 0, employees_female: 0,
        workers_male: 0, workers_female: 0,
    },
    sa_women_representation_details: {
        board_total_members: 0, board_number_of_women: 0,
        kmp_total_personnel: 0, kmp_number_of_women: 0,
    },
    sa_turnover_rate: {
        permanent_employees_turnover_rate: '',
        permanent_workers_turnover_rate: '',
    },
    sa_holding_subsidiary_associate_companies: [{ name: '', cin_or_country: '', type: 'Holding', percentage_holding: '' }],
    sa_csr_applicable: false,
    sa_csr_turnover: '',
    sa_csr_net_worth: '',
    sa_transparency_complaints: {
        received: 0, pending: 0, remarks: ''
    }
};

const formSectionStyle = {
  background: '#f8f9fa',
  borderRadius: 8,
  padding: 20,
  marginBottom: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
};
const labelStyle = {
  fontWeight: 500,
  marginBottom: 6,
  display: 'block',
  fontSize: '1em',
  color: '#333'
};
const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: '1em',
  marginBottom: 12,
  background: '#fff',
  fontFamily: 'inherit'
};
const textareaStyle = {
  ...inputStyle,
  minHeight: 60
};
const buttonStyle = {
  background: '#007bff',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '10px 20px',
  fontWeight: 600,
  fontSize: '1em',
  marginTop: 10,
  cursor: 'pointer',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
};

function SectionAForm() {
    const { reportData, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    
    // Split state: company info goes to companies table, Section A data goes to brsr_reports table
    const [companyInfo, setCompanyInfo] = useState({
        company_name: '', cin: '', year_of_incorporation: '', registered_office_address: '',
        corporate_address: '', email: '', telephone: '', website: '', paid_up_capital: '',
        stock_exchange_listed: [], brsr_contact_name: '', brsr_contact_mail: '', brsr_contact_number: ''
    });
    const [sectionAData, setSectionAData] = useState(initialSectionAData);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');
    const [validationErrors, setValidationErrors] = useState({});    // Fetch company info on component mount
    useEffect(() => {
        const fetchCompanyInfo = async () => {
            try {
                // Use the authService fetchCompanyProfile function
                const data = await fetchCompanyProfile();
                setCompanyInfo({
                    company_name: data.company_name || '',
                    cin: data.cin || '',
                    year_of_incorporation: data.year_of_incorporation || '',
                    registered_office_address: data.registered_office_address || '',
                    corporate_address: data.corporate_address || '',
                    email: data.email || '',
                    telephone: data.telephone || '',
                    website: data.website || '',
                    paid_up_capital: data.paid_up_capital || '',
                    stock_exchange_listed: data.stock_exchange_listed || [],
                    brsr_contact_name: data.brsr_contact_name || '',
                    brsr_contact_mail: data.brsr_contact_mail || '',
                    brsr_contact_number: data.brsr_contact_number || ''
                });
            } catch (error) {
                console.error('Error fetching company profile:', error);
                setLocalError(error.message || 'Failed to fetch company profile');
            }
        };

        fetchCompanyInfo();
    }, []);

    // Load Section A data from reportData
    useEffect(() => {
        if (reportData && reportData.section_a_data) {
            // Only merge allowed DB columns
            const mergedData = {
                ...initialSectionAData,
                ...Object.fromEntries(
                    Object.keys(initialSectionAData).map(key => [key, reportData.section_a_data[key] !== undefined ? reportData.section_a_data[key] : initialSectionAData[key]])
                )
            };
            setSectionAData(mergedData);
        } else if (reportData) {
            setSectionAData(initialSectionAData);
        }
    }, [reportData]);    // Handle changes for company info fields
    const handleCompanyChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        
        // Validate the field
        const fieldErrors = validateField(name, newValue);
        if (Object.keys(fieldErrors).length > 0) {
            setValidationErrors(prev => ({ ...prev, ...fieldErrors }));
        }
        
        setCompanyInfo(prev => ({ ...prev, [name]: newValue }));
    };

    // Handle changes for Section A BRSR fields
    const handleSectionAChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        
        // For turnover rates, allow direct string input including '%'
        if (name === 'sa_turnover_rate.permanent_employees_turnover_rate' || name === 'sa_turnover_rate.permanent_workers_turnover_rate') {
            setSectionAData(prev => setNestedValue(prev, name, newValue));
        } else {
            setSectionAData(prev => ({ ...prev, [name]: newValue }));
        }
    };    // Fixed immutable nested change handler for Section A data
    const handleNestedChange = (path, value) => {
        // Parse numeric values with proper fallback
        let processedValue = value;
        if (typeof value === 'string' && value !== '' && !isNaN(value)) {
            processedValue = parseFloat(value) || 0;
        } else if (value === '' || value === null || value === undefined) {
            processedValue = 0; // Default to 0 for empty numeric fields
        }
        
        // Clear validation error for nested fields
        const fieldKey = path.split('.').pop();
        if (validationErrors[fieldKey]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldKey];
                return newErrors;
            });
        }
        
        setSectionAData(prev => setNestedValue(prev, path, processedValue));
    };

    const handleArrayObjectChange = (arrayName, index, fieldName, value) => {
        setSectionAData(prev => {
            const newArray = [...prev[arrayName]];
            newArray[index] = { ...newArray[index], [fieldName]: value };
            return { ...prev, [arrayName]: newArray };
        });
    };

    const addArrayItem = (arrayName, itemStructure) => {
        setSectionAData(prev => ({
            ...prev,
            [arrayName]: [...(prev[arrayName] || []), { ...itemStructure }]
        }));
    };

    const removeArrayItem = (arrayName, index) => {
        setSectionAData(prev => ({
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
    };    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError('');

        // Validate all fields before submission
        const allErrors = {};

        // Validate company info required fields
        if (!companyInfo.company_name) {
            allErrors.company_name = 'Company name is required';
        }
        if (!companyInfo.cin) {
            allErrors.cin = 'CIN is required';
        }
        if (!companyInfo.brsr_contact_name) {
            allErrors.brsr_contact_name = 'BRSR contact name is required';
        }
        if (!companyInfo.brsr_contact_mail) {
            allErrors.brsr_contact_mail = 'BRSR contact email is required';
        }

        // Validate Section A required fields
        if (!sectionAData.sa_business_activities_turnover || sectionAData.sa_business_activities_turnover.length === 0 || !sectionAData.sa_business_activities_turnover[0].description_main) {
            allErrors.sa_business_activities_turnover = 'At least one business activity is required';
        }
        if (!sectionAData.sa_product_services_turnover || sectionAData.sa_product_services_turnover.length === 0 || !sectionAData.sa_product_services_turnover[0].product_service) {
            allErrors.sa_product_services_turnover = 'At least one product/service is required';
        }
        if (!sectionAData.sa_locations_plants_offices || (sectionAData.sa_locations_plants_offices.national_plants === 0 && sectionAData.sa_locations_plants_offices.national_offices === 0 && sectionAData.sa_locations_plants_offices.international_plants === 0 && sectionAData.sa_locations_plants_offices.international_offices === 0)) {
            allErrors.sa_locations_plants_offices = 'At least one plant or office location is required';
        }

        // Validate percentage fields
        if (sectionAData.sa_markets_served?.exports_percentage && !validatePercentage(sectionAData.sa_markets_served.exports_percentage)) {
            allErrors.exports_percentage = 'Export percentage must be between 0 and 100';
        }

        if (Object.keys(allErrors).length > 0) {
            setValidationErrors(allErrors);
            setLocalError('Please fix the validation errors before submitting.');
            return;
        }        try {
            // Use the authService to get session properly
            const session = getSession();
            if (!session || !session.access_token) {
                setLocalError('Authentication token not found. Please log in again.');
                return;
            }

            // Save company info to companies table using authService
            await updateCompanyProfile(companyInfo);

            // Save Section A data to brsr_reports table using authService
            if (!reportData?.id) {
                setLocalError('Report ID not found');
                return;
            }

            // Send each Section A field as a top-level property matching DB columns
            const sectionAUpdatePayload = {};
            Object.keys(initialSectionAData).forEach(key => {
                sectionAUpdatePayload[key] = sectionAData[key];
            });

            await updateBrSrReport(reportData.id, sectionAUpdatePayload);

            setLocalSuccess('Section A saved successfully!');
            setValidationErrors({});
        } catch (error) {
            console.error('Error saving Section A:', error);
            setLocalError(`Failed to save Section A: ${error.message}`);
        }
    };
    
    if (!reportData) {
        return <p>Loading Section A data...</p>;
    }

    const disabled = isSubmitted || isLoadingSave;    // Enhanced helper for table cell inputs with better validation
    const renderNumericInput = (path, nestedKey, min = 0, max = null) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input
                type="number"
                min={min}
                max={max}
                value={sectionAData[path]?.[nestedKey] ?? ''}
                onChange={e => {
                    const value = e.target.value;
                    const numericValue = value === '' ? 0 : (parseInt(value, 10) || 0);
                    
                    // Validate range if max is specified
                    if (max !== null && numericValue > max) {
                        setValidationErrors(prev => ({ 
                            ...prev, 
                            [`${path}.${nestedKey}`]: `Value must be less than or equal to ${max}` 
                        }));
                        return;
                    }
                    
                    // Clear validation error if value is valid
                    if (validationErrors[`${path}.${nestedKey}`]) {
                        setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[`${path}.${nestedKey}`];
                            return newErrors;
                        });
                    }
                    
                    handleNestedChange(`${path}.${nestedKey}`, numericValue);
                }}
                disabled={disabled}
                style={{ 
                    width: '80px',
                    borderColor: validationErrors[`${path}.${nestedKey}`] ? 'red' : '#ccc'
                }}
            />
            {validationErrors[`${path}.${nestedKey}`] && (
                <small style={{ color: 'red', fontSize: '0.75rem', textAlign: 'center' }}>
                    {validationErrors[`${path}.${nestedKey}`]}
                </small>
            )}
        </div>
    );

    // Enhanced percentage input with validation
    const renderPercentageInput = (path, nestedKey, placeholder = "0-100%") => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <input
                type="text"
                placeholder={placeholder}
                value={sectionAData[path]?.[nestedKey] || ''}
                onChange={e => {
                    const value = e.target.value;
                    
                    // Validate percentage
                    if (value && !validatePercentage(value)) {
                        setValidationErrors(prev => ({ 
                            ...prev, 
                            [`${path}.${nestedKey}`]: 'Must be between 0-100%' 
                        }));
                    } else if (validationErrors[`${path}.${nestedKey}`]) {
                        setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[`${path}.${nestedKey}`];
                            return newErrors;
                        });
                    }
                    
                    handleNestedChange(`${path}.${nestedKey}`, value);
                }}
                disabled={disabled}
                style={{ 
                    borderColor: validationErrors[`${path}.${nestedKey}`] ? 'red' : '#ccc'
                }}
            />
            {validationErrors[`${path}.${nestedKey}`] && (
                <small style={{ color: 'red', fontSize: '0.75rem' }}>
                    {validationErrors[`${path}.${nestedKey}`]}
                </small>
            )}
        </div>
    );
      // Calculate totals for display using sectionAData
    const employees_permanent_total = (sectionAData.sa_employee_details?.permanent_male || 0) + (sectionAData.sa_employee_details?.permanent_female || 0);
    const employees_other_total = (sectionAData.sa_employee_details?.other_than_permanent_male || 0) + (sectionAData.sa_employee_details?.other_than_permanent_female || 0);
    const employees_total_male = (sectionAData.sa_employee_details?.permanent_male || 0) + (sectionAData.sa_employee_details?.other_than_permanent_male || 0);
    const employees_total_female = (sectionAData.sa_employee_details?.permanent_female || 0) + (sectionAData.sa_employee_details?.other_than_permanent_female || 0);
    const employees_grand_total = employees_total_male + employees_total_female;

    const workers_permanent_total = (sectionAData.sa_workers_details?.permanent_male || 0) + (sectionAData.sa_workers_details?.permanent_female || 0);
    const workers_other_total = (sectionAData.sa_workers_details?.other_than_permanent_male || 0) + (sectionAData.sa_workers_details?.other_than_permanent_female || 0);
    const workers_total_male = (sectionAData.sa_workers_details?.permanent_male || 0) + (sectionAData.sa_workers_details?.other_than_permanent_male || 0);
    const workers_total_female = (sectionAData.sa_workers_details?.permanent_female || 0) + (sectionAData.sa_workers_details?.other_than_permanent_female || 0);
    const workers_grand_total = workers_total_male + workers_total_female;

    const diff_abled_employees_total = (sectionAData.sa_differently_abled_details?.employees_male || 0) + (sectionAData.sa_differently_abled_details?.employees_female || 0);
    const diff_abled_workers_total = (sectionAData.sa_differently_abled_details?.workers_male || 0) + (sectionAData.sa_differently_abled_details?.workers_female || 0);
    const diff_abled_total_male = (sectionAData.sa_differently_abled_details?.employees_male || 0) + (sectionAData.sa_differently_abled_details?.workers_male || 0);
    const diff_abled_total_female = (sectionAData.sa_differently_abled_details?.employees_female || 0) + (sectionAData.sa_differently_abled_details?.workers_female || 0);
    const diff_abled_grand_total = diff_abled_total_male + diff_abled_total_female;
    return (
        <form onSubmit={handleSubmit} className="profile-form section-a-form">
            <h3>Section A: General Disclosures</h3>
            <p>These disclosures provide basic information about the company and its BRSR reporting.</p>
            
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}
            
            {/* Company Basic Information */}
            <div className="form-section" style={{ maxWidth: 700, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: 32 }}>
            <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="company_name" style={labelStyle}>Company Name *</label>
                <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={companyInfo.company_name || ''}
                    onChange={handleCompanyChange}
                    disabled={disabled}
                    style={{ ...inputStyle, borderColor: validationErrors.company_name ? 'red' : '#ccc' }}
                    required
                />
                {validationErrors.company_name && (
                    <small style={{ color: 'red' }}>{validationErrors.company_name}</small>
                )}
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="cin" style={labelStyle}>CIN *</label>
                <input
                    type="text"
                    id="cin"
                    name="cin"
                    value={companyInfo.cin || ''}
                    onChange={handleCompanyChange}
                    disabled={disabled}
                    style={{ ...inputStyle, borderColor: validationErrors.cin ? 'red' : '#ccc' }}
                    placeholder="L12345AB1234ABC123456"
                    required
                />
                {validationErrors.cin && (
                    <small style={{ color: 'red' }}>{validationErrors.cin}</small>
                )}
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="year_of_incorporation" style={labelStyle}>Year of Incorporation *</label>
                <input
                    type="number"
                    id="year_of_incorporation"
                    name="year_of_incorporation"
                    value={companyInfo.year_of_incorporation || ''}
                    onChange={handleCompanyChange}
                    disabled={disabled}
                    style={{ ...inputStyle, borderColor: validationErrors.year_of_incorporation ? 'red' : '#ccc' }}
                    min="1800"
                    max={new Date().getFullYear()}
                    required
                />
                {validationErrors.year_of_incorporation && (
                    <small style={{ color: 'red' }}>{validationErrors.year_of_incorporation}</small>
                )}
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="registered_office_address" style={labelStyle}>Registered Office Address</label>
                <textarea
                    id="registered_office_address"
                    name="registered_office_address"
                    value={companyInfo.registered_office_address || ''}
                    onChange={handleCompanyChange}
                    disabled={disabled}
                    rows="3"
                    style={textareaStyle}
                />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="corporate_address" style={labelStyle}>Corporate Address</label>
                <textarea
                    id="corporate_address"
                    name="corporate_address"
                    value={companyInfo.corporate_address || ''}
                    onChange={handleCompanyChange}
                    disabled={disabled}
                    rows="3"
                    style={textareaStyle}
                />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="email" style={labelStyle}>Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={companyInfo.email || ''}
                    onChange={handleCompanyChange}
                    disabled={disabled}
                    style={{ ...inputStyle, borderColor: validationErrors.email ? 'red' : '#ccc' }}
                />
                {validationErrors.email && (
                    <small style={{ color: 'red' }}>{validationErrors.email}</small>
                )}
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="telephone" style={labelStyle}>Telephone</label>
                <input
                    type="tel"
                    id="telephone"
                    name="telephone"
                    value={companyInfo.telephone || ''}
                    onChange={handleCompanyChange}
                    disabled={disabled}
                    style={inputStyle}
                />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="website" style={labelStyle}>Website</label>
                <input
                    type="url"
                    id="website"
                    name="website"
                    value={companyInfo.website || ''}
                    onChange={handleCompanyChange}
                    disabled={disabled}
                    style={{ ...inputStyle, borderColor: validationErrors.website ? 'red' : '#ccc' }}
                    placeholder="https://example.com"
                />
                {validationErrors.website && (
                    <small style={{ color: 'red' }}>{validationErrors.website}</small>
                )}
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="paid_up_capital" style={labelStyle}>Paid Up Capital</label>
                <input
                    type="number"
                    id="paid_up_capital"
                    name="paid_up_capital"
                    value={companyInfo.paid_up_capital || ''}
                    onChange={handleCompanyChange}
                    disabled={disabled}
                    style={{ ...inputStyle, borderColor: validationErrors.paid_up_capital ? 'red' : '#ccc' }}
                    min="0"
                    step="0.01"
                />
                {validationErrors.paid_up_capital && (
                    <small style={{ color: 'red' }}>{validationErrors.paid_up_capital}</small>
                )}
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="brsr_contact_name" style={labelStyle}>BRSR Contact Name *</label>
                <input
                    type="text"
                    id="brsr_contact_name"
                    name="brsr_contact_name"
                    value={companyInfo.brsr_contact_name || ''}
                    onChange={handleCompanyChange}
                    disabled={disabled}
                    style={{ ...inputStyle, borderColor: validationErrors.brsr_contact_name ? 'red' : '#ccc' }}
                    required
                />
                {validationErrors.brsr_contact_name && (
                    <small style={{ color: 'red' }}>{validationErrors.brsr_contact_name}</small>
                )}
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="brsr_contact_mail" style={labelStyle}>BRSR Contact Email *</label>
                <input
                    type="email"
                    id="brsr_contact_mail"
                    name="brsr_contact_mail"
                    value={companyInfo.brsr_contact_mail || ''}
                    onChange={handleCompanyChange}
                    disabled={disabled}
                    style={{ ...inputStyle, borderColor: validationErrors.brsr_contact_mail ? 'red' : '#ccc' }}
                    required
                />
                {validationErrors.brsr_contact_mail && (
                    <small style={{ color: 'red' }}>{validationErrors.brsr_contact_mail}</small>
                )}
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="brsr_contact_number" style={labelStyle}>BRSR Contact Number</label>
                <input
                    type="tel"
                    id="brsr_contact_number"
                    name="brsr_contact_number"
                    value={companyInfo.brsr_contact_number || ''}
                    onChange={handleCompanyChange}
                    disabled={disabled}
                    style={inputStyle}
                />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="reporting_boundary" style={labelStyle}>Reporting Boundary (Q13)</label>
                <select id="reporting_boundary" name="reporting_boundary" value={sectionAData.reporting_boundary || 'Standalone'} onChange={handleSectionAChange} disabled={disabled} style={inputStyle}>
                    <option value="Standalone">Standalone</option>
                    <option value="Consolidated">Consolidated</option>
                </select>
            </div>
            </div>
            {/* Q14: Business Activities & Turnover */}
            <div style={formSectionStyle}>
            <h4>Business Activities & Turnover (Q14)</h4>
            {sectionAData.sa_business_activities_turnover && sectionAData.sa_business_activities_turnover.map((activity, index) => (
                <div key={index} className="array-item" style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <input type="text" placeholder="Main Activity" value={activity.description_main || ''} onChange={e => handleArrayObjectChange('sa_business_activities_turnover', index, 'description_main', e.target.value)} disabled={disabled} style={{ ...inputStyle, flex: 1, marginRight: 8 }} />
                    <input type="text" placeholder="Business Activity" value={activity.description_business || ''} onChange={e => handleArrayObjectChange('sa_business_activities_turnover', index, 'description_business', e.target.value)} disabled={disabled} style={{ ...inputStyle, flex: 1, marginRight: 8 }} />
                    <input type="number" placeholder="% of Turnover" value={activity.turnover_percentage || ''} onChange={e => handleArrayObjectChange('sa_business_activities_turnover', index, 'turnover_percentage', e.target.value)} disabled={disabled} style={{ ...inputStyle, width: 120, marginRight: 8 }} />
                    {!disabled && <button type="button" onClick={() => removeArrayItem('sa_business_activities_turnover', index)} style={{ ...buttonStyle, padding: '8px 12px', fontSize: '0.9em' }}>Remove</button>}
                </div>
            ))}
            {!disabled && <button type="button" onClick={() => addArrayItem('sa_business_activities_turnover', { description_main: '', description_business: '', turnover_percentage: '' })} style={{ ...buttonStyle, padding: '10px 20px', fontSize: '1em' }}>Add Activity</button>}
            </div>
            {/* Q15: Products/Services & Turnover */}
            <div style={formSectionStyle}>
            <h4>Products/Services & Turnover (Q15)</h4>
            {sectionAData.sa_product_services_turnover && sectionAData.sa_product_services_turnover.map((product, index) => (
                <div key={index} className="array-item" style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <input type="text" placeholder="Product/Service" value={product.product_service || ''} onChange={e => handleArrayObjectChange('sa_product_services_turnover', index, 'product_service', e.target.value)} disabled={disabled} style={{ ...inputStyle, flex: 1, marginRight: 8 }} />
                    <input type="text" placeholder="NIC Code" value={product.nic_code || ''} onChange={e => handleArrayObjectChange('sa_product_services_turnover', index, 'nic_code', e.target.value)} disabled={disabled} style={{ ...inputStyle, flex: 1, marginRight: 8 }} />
                    <input type="number" placeholder="% Turnover Contributed" value={product.turnover_contributed || ''} onChange={e => handleArrayObjectChange('sa_product_services_turnover', index, 'turnover_contributed', e.target.value)} disabled={disabled} style={{ ...inputStyle, width: 120, marginRight: 8 }} />
                    {!disabled && <button type="button" onClick={() => removeArrayItem('sa_product_services_turnover', index)} style={{ ...buttonStyle, padding: '8px 12px', fontSize: '0.9em' }}>Remove</button>}
                </div>
            ))}
            {!disabled && <button type="button" onClick={() => addArrayItem('sa_product_services_turnover', { product_service: '', nic_code: '', turnover_contributed: '' })} style={{ ...buttonStyle, padding: '10px 20px', fontSize: '1em' }}>Add Product/Service</button>}
            </div>
              {/* Q16: Locations */}
            <div style={formSectionStyle}>
            <h4>Locations of Plants and Offices (Q16)</h4>
            <div className="form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={labelStyle}>National Plants:</label>
                    <input type="number" value={sectionAData.sa_locations_plants_offices?.national_plants || 0} onChange={e => handleNestedChange('sa_locations_plants_offices.national_plants', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))} disabled={disabled} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={labelStyle}>National Offices:</label>
                    <input type="number" value={sectionAData.sa_locations_plants_offices?.national_offices || 0} onChange={e => handleNestedChange('sa_locations_plants_offices.national_offices', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))} disabled={disabled} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={labelStyle}>International Plants:</label>
                    <input type="number" value={sectionAData.sa_locations_plants_offices?.international_plants || 0} onChange={e => handleNestedChange('sa_locations_plants_offices.international_plants', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))} disabled={disabled} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={labelStyle}>International Offices:</label>
                    <input type="number" value={sectionAData.sa_locations_plants_offices?.international_offices || 0} onChange={e => handleNestedChange('sa_locations_plants_offices.international_offices', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))} disabled={disabled} style={{ ...inputStyle, width: '100%' }} />
                </div>
            </div>
            </div>            {/* Q17: Markets Served */}
            <div style={formSectionStyle}>
            <h4>Markets Served (Q17)</h4>
            <div className="form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={labelStyle}>National (No. of States):</label>
                    <input type="number" value={sectionAData.sa_markets_served?.locations?.national_states || 0} onChange={e => handleNestedChange('sa_markets_served.locations.national_states', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))} disabled={disabled} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={labelStyle}>International (No. of Countries):</label>
                    <input type="number" value={sectionAData.sa_markets_served?.locations?.international_countries || 0} onChange={e => handleNestedChange('sa_markets_served.locations.international_countries', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))} disabled={disabled} style={{ ...inputStyle, width: '100%' }} />
                </div>
            </div>
            <div className="form-group">
                <label htmlFor="sa_markets_served_exports_percentage" style={labelStyle}>Contribution of exports to total turnover (%):</label>
                <input type="text" id="sa_markets_served_exports_percentage" name="sa_markets_served.exports_percentage" value={sectionAData.sa_markets_served?.exports_percentage || '0'} onChange={e => handleNestedChange('sa_markets_served.exports_percentage', e.target.value)} disabled={disabled} style={{ ...inputStyle, width: '100%' }} />
            </div>
            <div className="form-group">
                <label htmlFor="sa_markets_served_customer_types" style={labelStyle}>Description of Customer Base:</label>
                <textarea id="sa_markets_served_customer_types" name="sa_markets_served.customer_types" value={sectionAData.sa_markets_served?.customer_types || ''} onChange={e => handleNestedChange('sa_markets_served.customer_types', e.target.value)} disabled={disabled} style={textareaStyle}></textarea>
            </div>
            </div>

            {/* Q18: Employee and Worker Details */}
            <div style={formSectionStyle}>
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
                </thead>                <tbody>
                    <tr>
                        <td>Board of Directors</td>
                        <td>{renderNumericInput('sa_women_representation_details', 'board_total_members')}</td>
                        <td>{renderNumericInput('sa_women_representation_details', 'board_number_of_women')}</td>
                        <td>{calculatePercentage(sectionAData.sa_women_representation_details?.board_number_of_women, sectionAData.sa_women_representation_details?.board_total_members)}</td>
                    </tr>
                    <tr>
                        <td>Key Managerial Personnel (KMPs)</td>
                        <td>{renderNumericInput('sa_women_representation_details', 'kmp_total_personnel')}</td>
                        <td>{renderNumericInput('sa_women_representation_details', 'kmp_number_of_women')}</td>
                        <td>{calculatePercentage(sectionAData.sa_women_representation_details?.kmp_number_of_women, sectionAData.sa_women_representation_details?.kmp_total_personnel)}</td>
                    </tr>
                </tbody>
            </table>
            <small>Note: Number of women employees and workers are covered in Q18.</small>


            {/* Q20: Turnover rate for permanent employees and workers */}
            <h4>Turnover Rate for Permanent Employees and Workers (Q20)</h4>
            <p>(During the financial year, provide as percentage %)</p>            <div className="form-group">
                <label htmlFor="sa_turnover_employees" style={labelStyle}>Permanent Employees Turnover Rate (%):</label>
                <input 
                    type="text" 
                    id="sa_turnover_employees" 
                    value={sectionAData.sa_turnover_rate?.permanent_employees_turnover_rate || ''} 
                    onChange={e => handleNestedChange('sa_turnover_rate.permanent_employees_turnover_rate', e.target.value)} 
                    disabled={disabled} 
                    placeholder="e.g., 5.5%" style={inputStyle} />
            </div>
            <div className="form-group">
                <label htmlFor="sa_turnover_workers" style={labelStyle}>Permanent Workers Turnover Rate (%):</label>
                <input 
                    type="text" 
                    id="sa_turnover_workers" 
                    value={sectionAData.sa_turnover_rate?.permanent_workers_turnover_rate || ''} 
                    onChange={e => handleNestedChange('sa_turnover_rate.permanent_workers_turnover_rate', e.target.value)} 
                    disabled={disabled} 
                    placeholder="e.g., 7.2%" style={inputStyle} />
            </div>
            {/* Add inputs for Previous FY if required by BRSR format and user */}
            {/* <p>Previous Financial Year:</p> ... */}
            </div>

            {/* Q21: Holding, Subsidiary, Associate Companies (Previously Q19) */}
            <div style={formSectionStyle}>
            <h4>Holding, Subsidiary, and Associate Companies (Q21)</h4>
            {sectionAData.sa_holding_subsidiary_associate_companies && sectionAData.sa_holding_subsidiary_associate_companies.map((company, index) => (
                <div key={index} className="array-item" style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <input type="text" placeholder="Company Name" value={company.name || ''} onChange={e => handleArrayObjectChange('sa_holding_subsidiary_associate_companies', index, 'name', e.target.value)} disabled={disabled} style={{ ...inputStyle, flex: 1, marginRight: 8 }} />
                    <input type="text" placeholder="CIN / Country" value={company.cin_or_country || ''} onChange={e => handleArrayObjectChange('sa_holding_subsidiary_associate_companies', index, 'cin_or_country', e.target.value)} disabled={disabled} style={{ ...inputStyle, flex: 1, marginRight: 8 }} />
                    <select value={company.type || 'Holding'} onChange={e => handleArrayObjectChange('sa_holding_subsidiary_associate_companies', index, 'type', e.target.value)} disabled={disabled} style={{ ...inputStyle, flex: '0 0 150px', marginRight: 8 }}>
                        <option value="Holding">Holding</option>
                        <option value="Subsidiary">Subsidiary</option>
                        <option value="Associate">Associate</option>
                        <option value="Joint Venture">Joint Venture</option>
                    </select>
                    <input type="text" placeholder="% Holding" value={company.percentage_holding || ''} onChange={e => handleArrayObjectChange('sa_holding_subsidiary_associate_companies', index, 'percentage_holding', e.target.value)} disabled={disabled} style={{ ...inputStyle, width: 120, marginRight: 8 }} />
                    {!disabled && <button type="button" onClick={() => removeArrayItem('sa_holding_subsidiary_associate_companies', index)} style={{ ...buttonStyle, padding: '8px 12px', fontSize: '0.9em' }}>Remove</button>}
                </div>
            ))}
            {!disabled && <button type="button" onClick={() => addArrayItem('sa_holding_subsidiary_associate_companies', { name: '', cin_or_country: '', type: 'Holding', percentage_holding: '' })} style={{ ...buttonStyle, padding: '10px 20px', fontSize: '1em' }}>Add Company</button>}
            </div>
            {/* Q22: CSR (Previously Q20) */}
            <div style={formSectionStyle}>
            <h4>CSR Details (Q22)</h4>
            <div className="form-group">
                <label>
                    <input type="checkbox" name="sa_csr_applicable" checked={sectionAData.sa_csr_applicable || false} onChange={handleSectionAChange} disabled={disabled} style={{ marginRight: 8 }} />
                    Is CSR applicable as per Section 135 of Companies Act, 2013?
                </label>
            </div>
            {sectionAData.sa_csr_applicable && (
                <>
                    <div className="form-group">
                        <label htmlFor="sa_csr_turnover" style={labelStyle}>Turnover (in Rs.):</label>
                        <input type="text" id="sa_csr_turnover" name="sa_csr_turnover" value={sectionAData.sa_csr_turnover || ''} onChange={handleSectionAChange} disabled={disabled} style={{ ...inputStyle, width: '100%' }} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="sa_csr_net_worth" style={labelStyle}>Net Worth (in Rs.):</label>
                        <input type="text" id="sa_csr_net_worth" name="sa_csr_net_worth" value={sectionAData.sa_csr_net_worth || ''} onChange={handleSectionAChange} disabled={disabled} style={{ ...inputStyle, width: '100%' }} />
                    </div>
                </>
            )}
            </div>            {/* Q23: Transparency & Disclosure Complaints (Previously Q21) */}
            <div style={formSectionStyle}>
            <h4>Transparency and Disclosure Complaints (Q23)</h4>
            <div className="form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={labelStyle}>Complaints Received:</label>
                    <input type="number" value={sectionAData.sa_transparency_complaints?.received || 0} onChange={e => handleNestedChange('sa_transparency_complaints.received', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))} disabled={disabled} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={labelStyle}>Pending Resolution:</label>
                    <input type="number" value={sectionAData.sa_transparency_complaints?.pending || 0} onChange={e => handleNestedChange('sa_transparency_complaints.pending', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))} disabled={disabled} style={{ ...inputStyle, width: '100%' }} />
                </div>
            </div>
            <div className="form-group">
                <label htmlFor="sa_transparency_complaints_remarks" style={labelStyle}>Remarks (if any):</label>
                <textarea id="sa_transparency_complaints_remarks" value={sectionAData.sa_transparency_complaints?.remarks || ''} onChange={e => handleNestedChange('sa_transparency_complaints.remarks', e.target.value)} disabled={disabled} style={textareaStyle}></textarea>
            </div>
            </div>
            
            <hr />
            {!isSubmitted && (
                <button type="submit" className="form-button" disabled={isLoadingSave} style={buttonStyle}>
                    {isLoadingSave ? 'Saving...' : 'Save Section A'}
                </button>
            )}
             {isSubmitted && <p>This section is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionAForm;

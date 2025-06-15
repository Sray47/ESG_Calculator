import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getSession, fetchCompanyProfile, updateCompanyProfile, updateBrSrReport } from '../../services/authService';
import '../../pages/ProfilePage.css'; // Re-use styles for now, consider specific wizard styles later

// Import decomposed components
import { 
    FormField, 
    FormSection, 
    DataTable, 
    ValidationSummary, 
    Button, 
    LoadingSpinner 
} from '../shared';
import { 
    CompanyInfoSection, 
    BRSRContactSection, 
    BusinessActivitiesTable, 
    ProductsServicesTable, 
    EmployeeDemographics 
} from '../form-sections';

// Import the new form management hook
import { useSectionAForm } from '../../hooks/useSectionAForm';

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
    };    // Enhanced submit handler using react-hook-form
    const handleSubmit = createSubmitHandler(async (formData) => {
        // Clear previous errors
        setWizardError('');

        try {
            // Use the authService to get session properly
            const session = getSession();
            if (!session || !session.access_token) {
                throw new Error('Authentication token not found. Please log in again.');
            }

            // Extract company info and section A data from form data
            const companyInfo = {
                company_name: formData.company_name,
                cin: formData.cin,
                year_of_incorporation: formData.year_of_incorporation,
                registered_office_address: formData.registered_office_address,
                corporate_address: formData.corporate_address,
                email: formData.email,
                telephone: formData.telephone,
                website: formData.website,
                paid_up_capital: formData.paid_up_capital,
                stock_exchange_listed: formData.stock_exchange_listed,
                brsr_contact_name: formData.brsr_contact_name,
                brsr_contact_mail: formData.brsr_contact_mail,
                brsr_contact_number: formData.brsr_contact_number
            };

            // Save company info to companies table using authService
            await updateCompanyProfile(companyInfo);

            // Save Section A data to brsr_reports table using authService
            if (!reportData?.id) {
                throw new Error('Report ID not found');
            }

            // Send each Section A field as a top-level property matching DB columns
            const sectionAUpdatePayload = {};
            Object.keys(initialSectionAData).forEach(key => {
                sectionAUpdatePayload[key] = formData[key];
            });

            await updateBrSrReport(reportData.id, sectionAUpdatePayload);

        } catch (error) {
            console.error('Error saving Section A:', error);
            throw error; // Let the form hook handle the error display
        }
    });
    
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
        <form onSubmit={handleSubmit} className="profile-form section-a-form">            <h3>Section A: General Disclosures</h3>
            <p>These disclosures provide basic information about the company and its BRSR reporting.</p>
            
            <ValidationSummary 
                errors={validationErrors} 
                variant="compact"
                title="Please fix the following errors before submitting:"
            />
            
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}
              {/* Company Basic Information */}
            <CompanyInfoSection 
                companyInfo={companyInfo} 
                onChange={(name, value) => {
                    setCompanyInfo(prev => ({ ...prev, [name]: value }));
                    // Clear validation error when user starts typing
                    if (validationErrors[name]) {
                        setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[name];
                            return newErrors;
                        });
                    }
                }}
                validationErrors={validationErrors} 
                disabled={disabled}
            />

            {/* BRSR Contact Information */}
            <BRSRContactSection 
                contactInfo={companyInfo} 
                onChange={(name, value) => {
                    setCompanyInfo(prev => ({ ...prev, [name]: value }));
                    // Clear validation error when user starts typing
                    if (validationErrors[name]) {
                        setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[name];
                            return newErrors;
                        });
                    }
                }}
                validationErrors={validationErrors} 
                disabled={disabled}
            />

            {/* Q14: Business Activities & Turnover */}
            <BusinessActivitiesTable 
                data={sectionAData.sa_business_activities_turnover || []}
                onUpdate={(rowIndex, columnKey, value) => {
                    const newActivities = [...(sectionAData.sa_business_activities_turnover || [])];
                    newActivities[rowIndex] = { ...newActivities[rowIndex], [columnKey]: value };
                    setSectionAData(prev => ({ ...prev, sa_business_activities_turnover: newActivities }));
                }}
                onAdd={() => {
                    const newActivity = { description_main: '', nic_code: '', business_activity_total_turnover: '', business_activity_percentage_turnover: '' };
                    setSectionAData(prev => ({
                        ...prev,
                        sa_business_activities_turnover: [...(prev.sa_business_activities_turnover || []), newActivity]
                    }));
                }}
                onRemove={(index) => {
                    setSectionAData(prev => ({
                        ...prev,
                        sa_business_activities_turnover: prev.sa_business_activities_turnover.filter((_, i) => i !== index)
                    }));
                }}
                disabled={disabled}
                validationErrors={validationErrors}
            />
            
            {/* Q15: Products/Services & Turnover */}
            <ProductsServicesTable 
                data={sectionAData.sa_product_services_turnover || []}
                onUpdate={(rowIndex, columnKey, value) => {
                    const newProducts = [...(sectionAData.sa_product_services_turnover || [])];
                    newProducts[rowIndex] = { ...newProducts[rowIndex], [columnKey]: value };
                    setSectionAData(prev => ({ ...prev, sa_product_services_turnover: newProducts }));
                }}
                onAdd={() => {
                    const newProduct = { product_service: '', nic_code: '', product_service_percentage_turnover: '' };
                    setSectionAData(prev => ({
                        ...prev,
                        sa_product_services_turnover: [...(prev.sa_product_services_turnover || []), newProduct]
                    }));
                }}
                onRemove={(index) => {
                    setSectionAData(prev => ({
                        ...prev,
                        sa_product_services_turnover: prev.sa_product_services_turnover.filter((_, i) => i !== index)                    }));
                }}
                disabled={disabled}
                validationErrors={validationErrors}
            />
              <FormSection title="Locations of Plants and Offices (Q16)">
                <div className="form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: '1 1 200px' }}>
                        <FormField
                            label="National Plants"
                            name="national_plants"
                            type="number"
                            value={sectionAData.sa_locations_plants_offices?.national_plants || 0}
                            onChange={(e) => handleNestedChange('sa_locations_plants_offices.national_plants', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))}
                            disabled={disabled}
                            min="0"
                        />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <FormField
                            label="National Offices"
                            name="national_offices"
                            type="number"
                            value={sectionAData.sa_locations_plants_offices?.national_offices || 0}
                            onChange={(e) => handleNestedChange('sa_locations_plants_offices.national_offices', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))}
                            disabled={disabled}
                            min="0"
                        />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <FormField
                            label="International Plants"
                            name="international_plants"
                            type="number"
                            value={sectionAData.sa_locations_plants_offices?.international_plants || 0}
                            onChange={(e) => handleNestedChange('sa_locations_plants_offices.international_plants', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))}
                            disabled={disabled}
                            min="0"
                        />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <FormField
                            label="International Offices"
                            name="international_offices"
                            type="number"
                            value={sectionAData.sa_locations_plants_offices?.international_offices || 0}
                            onChange={(e) => handleNestedChange('sa_locations_plants_offices.international_offices', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))}
                            disabled={disabled}
                            min="0"
                        />
                    </div>
                </div>
            </FormSection>
              {/* Q17: Markets Served */}
            <FormSection title="Markets Served (Q17)">
                <div className="form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: '1 1 200px' }}>
                        <FormField
                            label="National (No. of States)"
                            name="national_states"
                            type="number"
                            value={sectionAData.sa_markets_served?.locations?.national_states || 0}
                            onChange={(e) => handleNestedChange('sa_markets_served.locations.national_states', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))}
                            disabled={disabled}
                            min="0"
                        />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <FormField
                            label="International (No. of Countries)"
                            name="international_countries"
                            type="number"
                            value={sectionAData.sa_markets_served?.locations?.international_countries || 0}
                            onChange={(e) => handleNestedChange('sa_markets_served.locations.international_countries', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))}
                            disabled={disabled}
                            min="0"
                        />
                    </div>
                </div>
                
                <FormField
                    label="Contribution of exports to total turnover (%)"
                    name="exports_percentage"
                    value={sectionAData.sa_markets_served?.exports_percentage || '0'}
                    onChange={(e) => handleNestedChange('sa_markets_served.exports_percentage', e.target.value)}
                    disabled={disabled}
                    error={validationErrors.exports_percentage}
                />
                
                <FormField
                    label="Description of Customer Base"
                    name="customer_types"
                    type="textarea"
                    value={sectionAData.sa_markets_served?.customer_types || ''}
                    onChange={(e) => handleNestedChange('sa_markets_served.customer_types', e.target.value)}
                    disabled={disabled}
                />
            </FormSection>

            {/* Q18: Employee and Worker Details */}
            <FormSection title="Employee and Worker Details (Q18)" description="(As on March 31 of the financial year)">
            <style>{'.brsr-table, .brsr-table th, .brsr-table td { border: 1px solid #ccc; border-collapse: collapse; padding: 8px; text-align: center; } .brsr-table th { background-color: #f2f2f2; } .brsr-table td:first-child { text-align: left; }'}</style>
            
            <h5>a. Employees</h5>
            <DataTable
                data={[
                    {
                        category: 'Permanent',
                        male: sectionAData.sa_employee_details?.permanent_male || 0,
                        female: sectionAData.sa_employee_details?.permanent_female || 0,
                        total: employees_permanent_total
                    },
                    {
                        category: 'Other than Permanent',
                        male: sectionAData.sa_employee_details?.other_than_permanent_male || 0,
                        female: sectionAData.sa_employee_details?.other_than_permanent_female || 0,
                        total: employees_other_total
                    },
                    {
                        category: 'Total Employees',
                        male: employees_total_male,
                        female: employees_total_female,
                        total: employees_grand_total
                    }
                ]}
                columns={[
                    { title: 'Category', field: 'category' },
                    { title: 'Male', field: 'male' },
                    { title: 'Female', field: 'female' },
                    { title: 'Total', field: 'total' }
                ]}
                options={{
                    search: false,
                    paging: false,
                    sorting: false
                }}
                disabled={true}
            />

            <h5>b. Workers</h5>
            <DataTable
                data={[
                    {
                        category: 'Permanent',
                        male: sectionAData.sa_workers_details?.permanent_male || 0,
                        female: sectionAData.sa_workers_details?.permanent_female || 0,
                        total: workers_permanent_total
                    },
                    {
                        category: 'Other than Permanent',
                        male: sectionAData.sa_workers_details?.other_than_permanent_male || 0,
                        female: sectionAData.sa_workers_details?.other_than_permanent_female || 0,
                        total: workers_other_total
                    },
                    {
                        category: 'Total Workers',
                        male: workers_total_male,
                        female: workers_total_female,
                        total: workers_grand_total
                    }
                ]}
                columns={[
                    { title: 'Category', field: 'category' },
                    { title: 'Male', field: 'male' },
                    { title: 'Female', field: 'female' },
                    { title: 'Total', field: 'total' }
                ]}
                options={{
                    search: false,
                    paging: false,
                    sorting: false
                }}
                disabled={true}
            />

            <h5>c. Differently Abled Employees and Workers</h5>
            <DataTable
                data={[
                    {
                        category: 'Employees',
                        male: sectionAData.sa_differently_abled_details?.employees_male || 0,
                        female: sectionAData.sa_differently_abled_details?.employees_female || 0,
                        total: diff_abled_employees_total
                    },
                    {
                        category: 'Workers',
                        male: sectionAData.sa_differently_abled_details?.workers_male || 0,
                        female: sectionAData.sa_differently_abled_details?.workers_female || 0,
                        total: diff_abled_workers_total
                    },
                    {
                        category: 'Total Differently Abled',
                        male: diff_abled_total_male,
                        female: diff_abled_total_female,
                        total: diff_abled_grand_total
                    }
                ]}
                columns={[
                    { title: 'Category', field: 'category' },
                    { title: 'Male', field: 'male' },
                    { title: 'Female', field: 'female' },
                    { title: 'Total', field: 'total' }
                ]}
                options={{
                    search: false,
                    paging: false,                    sorting: false
                }}
                disabled={true}
            />
            </FormSection>

            {/* Q19: Participation/inclusion/representation of women */}
            <FormSection title="Participation/Inclusion/Representation of Women (Q19)">
            <DataTable
                data={[
                    {
                        category: 'Board of Directors',
                        total_numbers: sectionAData.sa_women_representation_details?.board_total_members || 0,
                        number_of_women: sectionAData.sa_women_representation_details?.board_number_of_women || 0,
                        percentage_of_women: calculatePercentage(sectionAData.sa_women_representation_details?.board_number_of_women, sectionAData.sa_women_representation_details?.board_total_members)
                    },
                    {
                        category: 'Key Managerial Personnel (KMPs)',
                        total_numbers: sectionAData.sa_women_representation_details?.kmp_total_personnel || 0,
                        number_of_women: sectionAData.sa_women_representation_details?.kmp_number_of_women || 0,
                        percentage_of_women: calculatePercentage(sectionAData.sa_women_representation_details?.kmp_number_of_women, sectionAData.sa_women_representation_details?.kmp_total_personnel)
                    }
                ]}
                columns={[
                    { title: 'Category', field: 'category' },
                    { title: 'Total Numbers', field: 'total_numbers' },
                    { title: 'Number of Women', field: 'number_of_women' },
                    { title: 'Percentage of Women (%)', field: 'percentage_of_women' }
                ]}
                options={{
                    search: false,
                    paging: false,
                    sorting: false                }}
                disabled={true}
            />
            <small>Note: Number of women employees and workers are covered in Q18.</small>
            </FormSection>

            {/* Q20: Turnover rate for permanent employees and workers */}
            <FormSection 
                title="Turnover Rate for Permanent Employees and Workers (Q20)" 
                description="(During the financial year, provide as percentage %)"
            >
                <FormField
                    label="Permanent Employees Turnover Rate (%)"
                    name="permanent_employees_turnover_rate"
                    value={sectionAData.sa_turnover_rate?.permanent_employees_turnover_rate || ''}
                    onChange={(e) => handleNestedChange('sa_turnover_rate.permanent_employees_turnover_rate', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g., 5.5%"
                />
                
                <FormField
                    label="Permanent Workers Turnover Rate (%)"
                    name="permanent_workers_turnover_rate"
                    value={sectionAData.sa_turnover_rate?.permanent_workers_turnover_rate || ''}
                    onChange={(e) => handleNestedChange('sa_turnover_rate.permanent_workers_turnover_rate', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g., 7.2%"
                />
            </FormSection>            {/* Q21: Holding, Subsidiary, Associate Companies (Previously Q19) */}
            <FormSection title="Holding, Subsidiary, and Associate Companies (Q21)">
                <DataTable
                    data={sectionAData.sa_holding_subsidiary_associate_companies || []}
                    columns={[
                        {
                            key: 'name',
                            label: 'Company Name',
                            type: 'text',
                            placeholder: 'Company Name',
                            required: true
                        },
                        {
                            key: 'cin_or_country',
                            label: 'CIN / Country',
                            type: 'text',
                            placeholder: 'CIN / Country'
                        },
                        {
                            key: 'type',
                            label: 'Type',
                            type: 'select',
                            options: [
                                { value: 'Holding', label: 'Holding' },
                                { value: 'Subsidiary', label: 'Subsidiary' },
                                { value: 'Associate', label: 'Associate' },
                                { value: 'Joint Venture', label: 'Joint Venture' }
                            ]
                        },
                        {
                            key: 'percentage_holding',
                            label: '% Holding',
                            type: 'text',
                            placeholder: '% Holding'
                        }
                    ]}
                    onUpdate={(rowIndex, columnKey, value) => {
                        const newCompanies = [...(sectionAData.sa_holding_subsidiary_associate_companies || [])];
                        newCompanies[rowIndex] = { ...newCompanies[rowIndex], [columnKey]: value };
                        setSectionAData(prev => ({ ...prev, sa_holding_subsidiary_associate_companies: newCompanies }));
                    }}
                    onAdd={() => {
                        const newCompany = { name: '', cin_or_country: '', type: 'Holding', percentage_holding: '' };
                        setSectionAData(prev => ({
                            ...prev,
                            sa_holding_subsidiary_associate_companies: [...(prev.sa_holding_subsidiary_associate_companies || []), newCompany]
                        }));
                    }}
                    onRemove={(index) => {
                        setSectionAData(prev => ({
                            ...prev,
                            sa_holding_subsidiary_associate_companies: prev.sa_holding_subsidiary_associate_companies.filter((_, i) => i !== index)
                        }));
                    }}
                    addButtonText="Add Company"
                    disabled={disabled}
                    minRows={0}
                />
            </FormSection>
            
            {/* Q22: CSR (Previously Q20) */}
            <FormSection title="CSR Details (Q22)">
                <FormField
                    label="Is CSR applicable as per Section 135 of Companies Act, 2013?"
                    name="sa_csr_applicable"
                    type="checkbox"
                    value={sectionAData.sa_csr_applicable || false}
                    onChange={handleSectionAChange}
                    disabled={disabled}
                />
                
                {sectionAData.sa_csr_applicable && (
                    <>
                        <FormField
                            label="Turnover (in Rs.)"
                            name="sa_csr_turnover"
                            value={sectionAData.sa_csr_turnover || ''}
                            onChange={handleSectionAChange}
                            disabled={disabled}
                        />
                        
                        <FormField                            label="Net Worth (in Rs.)"
                            name="sa_csr_net_worth"
                            value={sectionAData.sa_csr_net_worth || ''}
                            onChange={handleSectionAChange}
                            disabled={disabled}
                        />
                    </>
                )}
            </FormSection>
            
            {/* Q23: Transparency & Disclosure Complaints (Previously Q21) */}
            <FormSection title="Transparency and Disclosure Complaints (Q23)">
                <div className="form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: '1 1 200px' }}>
                        <FormField
                            label="Complaints Received"
                            name="received"
                            type="number"
                            value={sectionAData.sa_transparency_complaints?.received || 0}
                            onChange={(e) => handleNestedChange('sa_transparency_complaints.received', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))}
                            disabled={disabled}
                            min="0"
                        />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <FormField
                            label="Pending Resolution"
                            name="pending"
                            type="number"
                            value={sectionAData.sa_transparency_complaints?.pending || 0}
                            onChange={(e) => handleNestedChange('sa_transparency_complaints.pending', e.target.value === '' ? 0 : (parseInt(e.target.value, 10) || 0))}
                            disabled={disabled}
                            min="0"
                        />
                    </div>
                </div>
                
                <FormField
                    label="Remarks (if any)"
                    name="remarks"
                    type="textarea"
                    value={sectionAData.sa_transparency_complaints?.remarks || ''}
                    onChange={(e) => handleNestedChange('sa_transparency_complaints.remarks', e.target.value)}
                    disabled={disabled}
                />
            </FormSection>
            
            <hr />
            
            {!isSubmitted && (
                <Button 
                    type="submit" 
                    variant="primary" 
                    loading={isLoadingSave}
                    disabled={isLoadingSave}
                    style={{ marginTop: 20 }}
                >
                    {isLoadingSave ? 'Saving...' : 'Save Section A'}
                </Button>
            )}
            {isSubmitted && <p>This section is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionAForm;

import { useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { sectionAFormSchema, companyInfoSchema, sectionADataSchema } from '../schemas/sectionASchema';
import { fetchCompanyProfile, updateCompanyProfile, updateBrSrReport } from '../services/authService';

// Initial data structures
export const initialCompanyInfo = {
  company_name: '',
  cin: '',
  year_of_incorporation: '',
  registered_office_address: '',
  corporate_address: '',
  email: '',
  telephone: '',
  website: '',
  paid_up_capital: '',
  stock_exchange_listed: [],
  brsr_contact_name: '',
  brsr_contact_mail: '',
  brsr_contact_number: ''
};

export const initialSectionAData = {
  sa_business_activities_turnover: [{ description_main: '', description_business: '', turnover_percentage: '' }],
  sa_product_services_turnover: [{ product_service: '', nic_code: '', turnover_contributed: '' }],
  sa_locations_plants_offices: {
    national_plants: 0,
    national_offices: 0,
    international_plants: 0,
    international_offices: 0
  },
  sa_markets_served: {
    locations: { national_states: 0, international_countries: 0 },
    exports_percentage: '0',
    customer_types: ''
  },
  sa_employee_details: {
    permanent_male: 0,
    permanent_female: 0,
    other_than_permanent_male: 0,
    other_than_permanent_female: 0
  },
  sa_workers_details: {
    permanent_male: 0,
    permanent_female: 0,
    other_than_permanent_male: 0,
    other_than_permanent_female: 0
  },
  sa_differently_abled_details: {
    employees_male: 0,
    employees_female: 0,
    workers_male: 0,
    workers_female: 0
  },
  sa_women_representation_details: {
    board_total_members: 0,
    board_number_of_women: 0,
    kmp_total_personnel: 0,
    kmp_number_of_women: 0
  },
  sa_turnover_rate: {
    permanent_employees_turnover_rate: '',
    permanent_workers_turnover_rate: ''
  },
  sa_holding_subsidiary_associate_companies: [{ name: '', cin_or_country: '', type: 'Holding', percentage_holding: '' }],
  sa_csr_applicable: false,
  sa_csr_turnover: '',
  sa_csr_net_worth: '',
  sa_transparency_complaints: {
    received: 0,
    pending: 0,
    remarks: ''
  }
};

export const useSectionAForm = (reportData, setWizardError) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');

  // Initialize form with default values
  const form = useForm({
    resolver: zodResolver(sectionAFormSchema),
    defaultValues: {
      companyInfo: initialCompanyInfo,
      sectionAData: initialSectionAData
    },
    mode: 'onChange' // Validate on change for better UX
  });

  const { reset, formState: { errors, isSubmitting } } = form;

  // Load company profile data on mount
  useEffect(() => {
    const loadCompanyProfile = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCompanyProfile();
        
        const companyInfo = {
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
        };

        // Update form with fetched company data
        form.setValue('companyInfo', companyInfo);
      } catch (error) {
        console.error('Error fetching company profile:', error);
        setLocalError(error.message || 'Failed to fetch company profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanyProfile();
  }, [form]);

  // Load Section A data from reportData
  useEffect(() => {
    if (reportData && reportData.section_a_data) {
      // Merge with initial data to ensure all fields are present
      const mergedData = {
        ...initialSectionAData,
        ...Object.fromEntries(
          Object.keys(initialSectionAData).map(key => [
            key,
            reportData.section_a_data[key] !== undefined 
              ? reportData.section_a_data[key] 
              : initialSectionAData[key]
          ])
        )
      };
      form.setValue('sectionAData', mergedData);
    } else if (reportData) {
      form.setValue('sectionAData', initialSectionAData);
    }
  }, [reportData, form]);

  // Helper functions for array manipulation
  const addBusinessActivity = () => {
    const currentActivities = form.getValues('sectionAData.sa_business_activities_turnover');
    form.setValue('sectionAData.sa_business_activities_turnover', [
      ...currentActivities,
      { description_main: '', description_business: '', turnover_percentage: '' }
    ]);
  };

  const removeBusinessActivity = (index) => {
    const currentActivities = form.getValues('sectionAData.sa_business_activities_turnover');
    if (currentActivities.length > 1) {
      form.setValue('sectionAData.sa_business_activities_turnover', 
        currentActivities.filter((_, i) => i !== index)
      );
    }
  };

  const addProductService = () => {
    const currentProducts = form.getValues('sectionAData.sa_product_services_turnover');
    form.setValue('sectionAData.sa_product_services_turnover', [
      ...currentProducts,
      { product_service: '', nic_code: '', turnover_contributed: '' }
    ]);
  };

  const removeProductService = (index) => {
    const currentProducts = form.getValues('sectionAData.sa_product_services_turnover');
    if (currentProducts.length > 1) {
      form.setValue('sectionAData.sa_product_services_turnover',
        currentProducts.filter((_, i) => i !== index)
      );
    }
  };

  const addHoldingCompany = () => {
    const currentCompanies = form.getValues('sectionAData.sa_holding_subsidiary_associate_companies') || [];
    form.setValue('sectionAData.sa_holding_subsidiary_associate_companies', [
      ...currentCompanies,
      { name: '', cin_or_country: '', type: 'Holding', percentage_holding: '' }
    ]);
  };

  const removeHoldingCompany = (index) => {
    const currentCompanies = form.getValues('sectionAData.sa_holding_subsidiary_associate_companies') || [];
    form.setValue('sectionAData.sa_holding_subsidiary_associate_companies',
      currentCompanies.filter((_, i) => i !== index)
    );
  };

  // Helper for calculating percentages
  const calculatePercentage = (numerator, denominator) => {
    const num = parseFloat(numerator);
    const den = parseFloat(denominator);
    if (isNaN(num) || isNaN(den) || den === 0) {
      return '0.00%';
    }
    return ((num / den) * 100).toFixed(2) + '%';
  };

  // Submit handler
  const onSubmit = async (data) => {
    try {
      setLocalError('');
      setLocalSuccess('');
      setWizardError('');

      // Update company profile
      await updateCompanyProfile(data.companyInfo);

      // Update Section A data in BRSR report
      await updateBrSrReport({ section_a_data: data.sectionAData });

      setLocalSuccess('Section A data saved successfully!');
    } catch (error) {
      console.error('Error saving Section A data:', error);
      const errorMessage = error.message || 'Failed to save data';
      setLocalError(errorMessage);
      setWizardError(errorMessage);
    }
  };

  return {
    form,
    isLoading,
    isSubmitting,
    localError,
    localSuccess,
    errors,
    onSubmit,
    setLocalError,
    setLocalSuccess,
    // Array manipulation helpers
    addBusinessActivity,
    removeBusinessActivity,
    addProductService,
    removeProductService,
    addHoldingCompany,
    removeHoldingCompany,
    // Utility functions
    calculatePercentage
  };
};

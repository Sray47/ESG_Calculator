import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';
import { sectionBSchema, type SectionBFormData } from '../schemas/sectionBSchema';
// @ts-ignore - JS file
import { updateBrSrReport } from '../services/authService';

// Initial data structure for Section B
const initialPrinciplePolicy = (principleNumber: number) => ({
  principle: principleNumber,
  has_policy: false,
  is_board_approved: false,
  policy_text_or_url: '',
  translated_to_procedures: false,
  extends_to_value_chain: false,
  adopted_standards: '',
  specific_commitments_goals_targets: '',
  performance_against_targets: '',
  reason_q12_not_material: false,
  reason_q12_not_at_stage: false,
  reason_q12_no_resources: false,
  reason_q12_planned_next_year: false,
  reason_q12_other_text: '',
});

const getInitialSectionBData = () => ({
  sb_director_statement: '',
  sb_esg_responsible_individual: {
    name: '',
    designation: '',
    din_if_director: '',
    email: '',
    phone: '',
  },
  sb_principle_policies: Array.from({ length: 9 }, (_, i) => initialPrinciplePolicy(i + 1)),
  sb_sustainability_committee: {
    has_committee: false, 
    details: ''           
  },
  sb_ngrbc_company_review: {
    performance_review_yn: false,
    compliance_review_yn: false,
    review_undertaken_by: '',
    frequency: '',
  },
  sb_external_policy_assessment: {
    conducted: false, 
    agency_name: ''   
  }
});

export const useSectionBForm = (reportData: any, setWizardError?: (error: string) => void) => {
  const [isLoading, setIsLoading] = useState(true);
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');

  const form = useForm<SectionBFormData>({
    resolver: zodResolver(sectionBSchema),
    defaultValues: getInitialSectionBData(),
    mode: 'onChange'
  });

  const { reset, handleSubmit, formState: { isSubmitting, errors } } = form;

  // Load data from reportData when it changes
  useEffect(() => {
    if (reportData?.section_b_data) {
      const mergedData = {
        ...getInitialSectionBData(),
        ...reportData.section_b_data
      };
      
      // Ensure sb_principle_policies array is properly initialized
      if (!Array.isArray(mergedData.sb_principle_policies) || mergedData.sb_principle_policies.length !== 9) {
        mergedData.sb_principle_policies = Array.from({ length: 9 }, (_, i) => ({
          ...initialPrinciplePolicy(i + 1),
          ...(reportData.section_b_data.sb_principle_policies?.[i] || {})
        }));
      }
      
      reset(mergedData);
    } else {
      reset(getInitialSectionBData());
    }
    setIsLoading(false);
  }, [reportData, reset]);

  // Form submission handler
  const onSubmit = useCallback(async (formData: SectionBFormData) => {
    setLocalError('');
    setLocalSuccess('');
    setWizardError?.('');

    try {
      if (!reportData?.id) {
        throw new Error('Report ID not found');
      }

      // Save Section B data
      const payload = { section_b_data: formData };
      await updateBrSrReport(reportData.id, payload);
      
      setLocalSuccess('Section B saved successfully!');
      return true;
    } catch (error) {
      console.error('Error saving Section B:', error);
      const errorMessage = (error as Error).message || 'Failed to save Section B data';
      setLocalError(errorMessage);
      setWizardError?.(errorMessage);
      return false;
    }
  }, [reportData, setWizardError]);

  // Helper function to update a specific principle policy
  const updatePrinciplePolicy = useCallback((principleIndex: number, field: string, value: any) => {
    const currentPolicies = form.getValues('sb_principle_policies');
    const updatedPolicies = currentPolicies.map((policy, index) => 
      index === principleIndex ? { ...policy, [field]: value } : policy
    );
    form.setValue('sb_principle_policies', updatedPolicies);
  }, [form]);

  return {
    form,
    isLoading,
    isSubmitting,
    localError,
    localSuccess,
    errors,
    onSubmit: handleSubmit(onSubmit),
    setLocalError,
    setLocalSuccess,
    updatePrinciplePolicy,
  };
};

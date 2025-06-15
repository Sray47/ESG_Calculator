import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';
import { sectionCPrinciple1Schema, type SectionCPrinciple1FormData } from '../schemas/sectionCPrinciple1Schema';
// @ts-ignore - JS file
import { updateBrSrReport } from '../services/authService';

// Initial data structure for Section C Principle 1
const getInitialP1EssentialIndicators = () => ({
  anti_corruption_policy: {
    has_policy: false,
    details: '',
    weblink: '',
  },
  disciplinary_actions_by_le_agencies: {
    fy_2022_23: { directors: null, kmps: null, employees_executives: null, workers_non_executives: null },
  },
  complaints_conflict_of_interest: {
    directors_number: null, directors_remarks: '',
    kmps_number: null, kmps_remarks: '',
  },
  corrective_actions_on_corruption_coi: {
    details: '',
  },
  p1_training_coverage: {
    board_of_directors: { programs_held: null, topics_principles: '', percent_covered: null },
    kmp: { programs_held: null, topics_principles: '', percent_covered: null },
    employees_other_than_bod_kmp_executives: { programs_held: null, topics_principles: '', percent_covered: null },
    workers: { programs_held: null, topics_principles: '', percent_covered: null },
  },
  p1_fines_penalties_paid: {
    monetary_details: '', 
    non_monetary_details: '', 
  },
  p1_appeal_details_for_fines_penalties: {
    details: '', 
  },
  esg_training_employees: {
    has_program: null,
    employees_trained_count: null,
  }
});

const getInitialP1LeadershipIndicators = () => ({
  conflict_of_interest_policy_communication: {
    communicated: null,
    how_communicated: null,
    reasons_if_not: null,
  },
  conflict_of_interest_training: {
    covered_directors: null,
    covered_kmps: null,
    covered_employees: null,
    fy_training_details: null,
  },
  anti_corruption_policy_communication: {
    communicated_directors: null,
    communicated_kmps: null,
    communicated_employees: null,
    communicated_value_chain: null,
    fy_communication_details: null,
  },
  anti_corruption_training: {
    covered_directors: null,
    covered_kmps: null,
    covered_employees: null,
    covered_value_chain: null,
    fy_training_details: null,
  }
});

const getInitialSectionCPrinciple1Data = (): SectionCPrinciple1FormData => ({
  essential_indicators: getInitialP1EssentialIndicators(),
  leadership_indicators: getInitialP1LeadershipIndicators(),
});

export const useSectionCPrinciple1Form = (reportData: any, setWizardError?: (error: string) => void) => {
  const [isLoading, setIsLoading] = useState(true);
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');

  const form = useForm<SectionCPrinciple1FormData>({
    resolver: zodResolver(sectionCPrinciple1Schema),
    defaultValues: getInitialSectionCPrinciple1Data(),
    mode: 'onChange'
  });

  const { reset, handleSubmit, formState: { isSubmitting, errors } } = form;

  // Load data from reportData when it changes
  useEffect(() => {
    if (reportData?.sc_p1_ethical_conduct) {
      const mergedData = {
        essential_indicators: {
          ...getInitialP1EssentialIndicators(),
          ...(reportData.sc_p1_ethical_conduct.essential_indicators || {}),
        },
        leadership_indicators: {
          ...getInitialP1LeadershipIndicators(),
          ...(reportData.sc_p1_ethical_conduct.leadership_indicators || {}),
        },
      };
      reset(mergedData);
    } else {
      reset(getInitialSectionCPrinciple1Data());
    }
    setIsLoading(false);
  }, [reportData, reset]);

  // Form submission handler
  const onSubmit = useCallback(async (formData: SectionCPrinciple1FormData) => {
    setLocalError('');
    setLocalSuccess('');
    setWizardError?.('');

    try {
      if (!reportData?.id) {
        throw new Error('Report ID not found');
      }

      // Save Section C Principle 1 data
      const payload = { 
        sc_p1_ethical_conduct: {
          essential_indicators: formData.essential_indicators,
          leadership_indicators: formData.leadership_indicators,
        }
      };
      
      await updateBrSrReport(reportData.id, payload);
      
      setLocalSuccess('Section C, Principle 1 saved successfully!');
      return true;
    } catch (error) {
      console.error('Error saving Section C Principle 1:', error);
      const errorMessage = (error as Error).message || 'Failed to save Section C Principle 1 data';
      setLocalError(errorMessage);
      setWizardError?.(errorMessage);
      return false;
    }
  }, [reportData, setWizardError]);

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
  };
};

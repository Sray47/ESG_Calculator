import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';
import { sectionCPrinciple2Schema, type SectionCPrinciple2FormData } from '../schemas/sectionCPrinciple2Schema';
import { useFormStore } from '../store/formStore';
// @ts-ignore - JS file
import { updateBrSrReport } from '../services/authService';
// @ts-ignore - JS file
import { deepMerge } from '../utils/objectUtils';

const getInitialSectionCPrinciple2Data = (): SectionCPrinciple2FormData => ({
  // Essential Indicators
  p2_essential_rd_capex_percentages: {
    rd_percentage_current_fy: null,
    capex_percentage_current_fy: null,
    rd_improvements_details: '',
    capex_improvements_details: '',
  },
  p2_essential_sustainable_sourcing: {
    has_procedures: null,
    percentage_inputs_sourced_sustainably: null,
  },
  p2_essential_reclaim_processes_description: {
    plastics: '',
    e_waste: '',
    hazardous_waste: '',
    other_waste: '',
  },
  p2_essential_epr_status: {
    is_epr_applicable: null,
    is_collection_plan_in_line_with_epr: null,
    steps_to_address_epr_gap: '',
  },

  // Leadership Indicators
  p2_leadership_lca_details: {
    conducted: null,
    assessments: [],
  },
  p2_leadership_product_risks: [],
  p2_leadership_recycled_input_value_percentage: [],
  p2_leadership_reclaimed_waste_quantities: {
    plastics: { current_fy_reused_mt: null, current_fy_recycled_mt: null, current_fy_safely_disposed_mt: null },
    e_waste: { current_fy_reused_mt: null, current_fy_recycled_mt: null, current_fy_safely_disposed_mt: null },
    hazardous_waste: { current_fy_reused_mt: null, current_fy_recycled_mt: null, current_fy_safely_disposed_mt: null },
    other_waste: { current_fy_reused_mt: null, current_fy_recycled_mt: null, current_fy_safely_disposed_mt: null },
  },
  p2_leadership_reclaimed_products_as_percentage_sold: [],
});

export const useSectionCPrinciple2Form = (reportData: any, setWizardError: (error: string) => void) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');
  const { updateSectionStatus, setUnsavedChanges, reportId } = useFormStore();

  const form = useForm<SectionCPrinciple2FormData>({
    resolver: zodResolver(sectionCPrinciple2Schema),
    defaultValues: getInitialSectionCPrinciple2Data(),
    mode: 'onChange'
  });

  const { reset, formState: { errors, isDirty } } = form;
  // Update form state in Zustand store
  useEffect(() => {
    const sectionId = 'section-c-p2';
    updateSectionStatus(sectionId, {
      isDirty,
      isComplete: !isDirty && Object.keys(errors).length === 0,
    });
  }, [isDirty, Object.keys(errors).length]); // Remove updateSectionStatus from deps

  // Track unsaved changes
  useEffect(() => {
    setUnsavedChanges(isDirty);
  }, [isDirty]); // Remove setUnsavedChanges from deps

  // Initialize form data from reportData
  useEffect(() => {
    if (reportData) {
      setIsLoading(true);
      try {
        let formData = getInitialSectionCPrinciple2Data();
        
        if (reportData.sc_p2_sustainable_safe_goods) {
          formData = deepMerge(formData, reportData.sc_p2_sustainable_safe_goods) as SectionCPrinciple2FormData;
        }
        
        reset(formData);
        setLocalError('');
      } catch (error) {
        console.error('Error initializing Section C Principle 2 form:', error);
        setLocalError('Failed to load form data. Please refresh and try again.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [reportData, reset]);

  const onSubmit = useCallback(async (data: SectionCPrinciple2FormData) => {
    if (!reportId) {
      setLocalError('No report ID found. Please try refreshing the page.');
      return;
    }

    setIsSubmitting(true);
    setLocalError('');
    setLocalSuccess('');
    setWizardError('');

    try {
      const payload = {
        reportId,
        sc_p2_sustainable_safe_goods: data
      };

      const response = await updateBrSrReport(payload);
      if (response && response.message) {
        setLocalSuccess('Section C, Principle 2 saved successfully!');
        // Reset the form dirty state since we've saved
        reset(data, { keepValues: true });
      } else {
        setLocalError('Failed to save Section C, Principle 2.');
      }
    } catch (error) {
      console.error('Error saving Section C Principle 2 form:', error);
      setLocalError('An error occurred while saving. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [reportId, reset, setWizardError]);

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
  };
};

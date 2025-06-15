import React from 'react';
import { FormProvider } from 'react-hook-form';
import { useOutletContext } from 'react-router-dom';
import { useSectionCPrinciple2Form } from '../../hooks/useSectionCPrinciple2Form';
import '../../pages/ProfilePage.css';

// Import components
import { 
    FormSection, 
    ValidationSummary, 
    Button, 
    LoadingSpinner 
} from '../shared';

import { 
    RDCapexSection,
    SustainableSourcingSection,
    ReclaimProcessesSection,
    EPRStatusSection
} from '../form-sections';

const formSectionStyle = {
  background: '#f8f9fa',
  borderRadius: 8,
  padding: 20,
  marginBottom: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
};

function SectionCPrinciple2Form() {
    const { reportData, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    
    const {
        form,
        isLoading,
        isSubmitting,
        localError,
        localSuccess,
        errors,
        onSubmit,
    } = useSectionCPrinciple2Form(reportData, setWizardError);

    const { handleSubmit, control } = form;

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <LoadingSpinner />
                <span style={{ marginLeft: 12 }}>Loading Section C, Principle 2 data...</span>
            </div>
        );
    }

    const disabled = isSubmitted || isSubmitting || isLoadingSave;

    return (
        <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="profile-form section-c-form">
                <h3 className="section-title">Section C: Principle-wise Performance</h3>
                <h4 className="sub-title">Principle 2: Businesses should provide goods and services in a manner that is sustainable and safe</h4>
                
                <p style={{ color: '#6c757d', marginBottom: 32 }}>
                    This section covers your organization's approach to sustainable and safe goods and services, including R&D investments, sustainable sourcing, and waste management practices.
                </p>

                {/* Error and Success Messages */}
                {localError && (
                    <div style={{ color: '#dc3545', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', padding: 12, borderRadius: 4, marginBottom: 16 }}>
                        {localError}
                    </div>
                )}
                
                {localSuccess && (
                    <div style={{ color: '#155724', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', padding: 12, borderRadius: 4, marginBottom: 16 }}>
                        {localSuccess}
                    </div>
                )}

                {/* Validation Summary */}
                {Object.keys(errors).length > 0 && (
                    <ValidationSummary errors={errors} />
                )}

                {/* Essential Indicators */}
                <h4 style={{ marginTop: 32, marginBottom: 16, color: '#495057' }}>Essential Indicators</h4>
                
                <FormSection title="R&D and Capital Expenditure Investments" style={formSectionStyle}>
                    <RDCapexSection control={control} disabled={disabled} />
                </FormSection>

                <FormSection title="Sustainable Sourcing" style={formSectionStyle}>
                    <SustainableSourcingSection control={control} disabled={disabled} />
                </FormSection>

                <FormSection title="Reclaim Processes" style={formSectionStyle}>
                    <ReclaimProcessesSection control={control} disabled={disabled} />
                </FormSection>

                <FormSection title="Extended Producer Responsibility (EPR)" style={formSectionStyle}>
                    <EPRStatusSection control={control} disabled={disabled} />
                </FormSection>

                {/* Leadership Indicators */}
                <h4 style={{ marginTop: 48, marginBottom: 16, color: '#495057' }}>Leadership Indicators</h4>
                <div style={formSectionStyle}>
                    <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
                        Leadership indicators for this principle include Life Cycle Assessment details, product risk management, 
                        recycled input materials, and end-of-life product reclamation. These advanced sections can be implemented 
                        as the application grows.
                    </p>
                </div>

                <hr style={{ margin: '32px 0' }} />
                
                {!isSubmitted && (
                    <Button 
                        type="submit" 
                        variant="primary" 
                        loading={isSubmitting || isLoadingSave}
                        disabled={isSubmitting || isLoadingSave}
                        style={{ marginTop: 20 }}
                    >
                        {isSubmitting || isLoadingSave ? 'Saving...' : 'Save Section C, Principle 2'}
                    </Button>
                )}
                
                {isSubmitted && (
                    <p style={{ color: '#28a745', fontWeight: 500, textAlign: 'center' }}>
                        This section is part of a submitted report and cannot be edited.
                    </p>
                )}
            </form>
        </FormProvider>
    );
}

export default SectionCPrinciple2Form;

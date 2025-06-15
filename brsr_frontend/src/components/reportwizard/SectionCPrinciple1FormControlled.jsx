import React from 'react';
import { FormProvider } from 'react-hook-form';
import { useOutletContext } from 'react-router-dom';
import { useSectionCPrinciple1Form } from '../../hooks/useSectionCPrinciple1Form';
import '../../pages/ProfilePage.css';

// Import components
import { 
    FormSection, 
    ValidationSummary, 
    Button, 
    LoadingSpinner 
} from '../shared';

import { 
    EthicalConductEssentialSection,
    EthicalConductLeadershipSection
} from '../form-sections';

const formSectionStyle = {
  background: '#f8f9fa',
  borderRadius: 8,
  padding: 20,
  marginBottom: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
};

function SectionCPrinciple1Form() {
    const { reportData, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    
    const {
        form,
        isLoading,
        isSubmitting,
        localError,
        localSuccess,
        errors,
        onSubmit,
        setLocalError,
        setLocalSuccess,
    } = useSectionCPrinciple1Form(reportData, setWizardError);

    const { handleSubmit, control } = form;

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <LoadingSpinner />
                <span style={{ marginLeft: 12 }}>Loading Section C, Principle 1 data...</span>
            </div>
        );
    }

    const disabled = isSubmitted || isSubmitting || isLoadingSave;

    return (
        <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="profile-form section-c-form">
                <h3>Section C: Principle-wise Performance</h3>
                <h4 style={{ color: '#495057', marginBottom: 8 }}>
                    Principle 1: Businesses should conduct and govern themselves with integrity, 
                    and in a manner that is Ethical, Transparent and Accountable
                </h4>
                <p style={{ color: '#6c757d', marginBottom: 32, lineHeight: 1.5 }}>
                    This principle emphasizes the importance of ethical business conduct, transparency, 
                    and accountability in all business operations and decision-making processes.
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
                <FormSection title="Essential Indicators" style={formSectionStyle}>
                    <EthicalConductEssentialSection control={control} disabled={disabled} />
                </FormSection>

                {/* Leadership Indicators */}
                <FormSection title="Leadership Indicators" style={formSectionStyle}>
                    <EthicalConductLeadershipSection control={control} disabled={disabled} />
                </FormSection>

                <hr style={{ margin: '32px 0' }} />
                
                {!isSubmitted && (
                    <Button 
                        type="submit" 
                        variant="primary" 
                        loading={isSubmitting || isLoadingSave}
                        disabled={isSubmitting || isLoadingSave}
                        style={{ marginTop: 20 }}
                    >
                        {isSubmitting || isLoadingSave ? 'Saving...' : 'Save Principle 1'}
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

export default SectionCPrinciple1Form;

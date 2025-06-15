import React from 'react';
import { FormProvider } from 'react-hook-form';
import { useOutletContext } from 'react-router-dom';
import { useSectionBForm } from '../../hooks/useSectionBForm';
import '../../pages/ProfilePage.css';

// Import components
import { 
    FormSection, 
    ValidationSummary, 
    Button, 
    LoadingSpinner 
} from '../shared';

import { 
    DirectorStatementSection,
    ESGResponsibleSection,
    PrinciplePoliciesSection,
    GovernanceSection
} from '../form-sections';

const formSectionStyle = {
  background: '#f8f9fa',
  borderRadius: 8,
  padding: 20,
  marginBottom: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
};

function SectionBForm() {
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
    } = useSectionBForm(reportData, setWizardError);

    const { handleSubmit, control } = form;

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <LoadingSpinner />
                <span style={{ marginLeft: 12 }}>Loading Section B data...</span>
            </div>
        );
    }

    const disabled = isSubmitted || isSubmitting || isLoadingSave;

    return (
        <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="profile-form section-b-form">
                <h3>Section B: Management and Process Disclosures</h3>
                <p style={{ color: '#6c757d', marginBottom: 32 }}>
                    This section covers management and process-related disclosures for your organization's business responsibility practices.
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

                {/* Q1: Director Statement */}
                <FormSection title="Director's Statement (Q1)" style={formSectionStyle}>
                    <DirectorStatementSection control={control} disabled={disabled} />
                </FormSection>

                {/* Q2: ESG Responsible Individual */}
                <FormSection title="Highest Authority Responsible for Implementation (Q2)" style={formSectionStyle}>
                    <ESGResponsibleSection control={control} disabled={disabled} />
                </FormSection>

                {/* Q3: Principle Policies */}
                <FormSection title="Policies for NGRBC Principles (Q3)" style={formSectionStyle}>
                    <PrinciplePoliciesSection control={control} disabled={disabled} />
                </FormSection>

                {/* Q9-Q11: Governance */}
                <FormSection title="Governance and Oversight (Q9-Q11)" style={formSectionStyle}>
                    <GovernanceSection control={control} disabled={disabled} />
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
                        {isSubmitting || isLoadingSave ? 'Saving...' : 'Save Section B'}
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

export default SectionBForm;

import React from 'react';
import { useController } from 'react-hook-form';
import { FormFieldControlled } from '../shared';

const GovernanceSection = ({ control, disabled = false }) => {
  const { 
    field: { value: hasCommitteeValue } 
  } = useController({
    name: "sb_sustainability_committee.has_committee",
    control
  });

  const { 
    field: { value: conductedAssessmentValue } 
  } = useController({
    name: "sb_external_policy_assessment.conducted",
    control
  });

  return (
    <div style={{ marginBottom: 24 }}>
      <h4>Governance, Leadership and Oversight</h4>
      
      {/* Sustainability Committee */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: 8, 
        padding: 20, 
        marginBottom: 20 
      }}>
        <h5 style={{ marginBottom: 16 }}>Details of the Board/Committee responsible for assessment and improvement of BR performance</h5>
        
        <FormFieldControlled
          name="sb_sustainability_committee.has_committee"
          control={control}
          label="Whether Committee / Board / Individual"
          type="checkbox"
          disabled={disabled}
        />
        
        {hasCommitteeValue && (
          <FormFieldControlled
            name="sb_sustainability_committee.details"
            control={control}
            label="Details"
            as="textarea"
            rows={3}
            placeholder="Please provide details about the committee/board structure"
            disabled={disabled}
            style={{ marginTop: 16 }}
          />
        )}
      </div>

      {/* Company Review */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: 8, 
        padding: 20, 
        marginBottom: 20 
      }}>
        <h5 style={{ marginBottom: 16 }}>Details of Review of NGRBCs by the Company</h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <FormFieldControlled
            name="sb_ngrbc_company_review.performance_review_yn"
            control={control}
            label="Performance against above policies and follow up action (Yes/No)"
            type="checkbox"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="sb_ngrbc_company_review.compliance_review_yn"
            control={control}
            label="Compliance with statutory requirements (Yes/No)"
            type="checkbox"
            disabled={disabled}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <FormFieldControlled
            name="sb_ngrbc_company_review.review_undertaken_by"
            control={control}
            label="Review undertaken by"
            placeholder="Entity / Regulatory/ E&Y / Other third party"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="sb_ngrbc_company_review.frequency"
            control={control}
            label="Frequency"
            placeholder="Annually/Half yearly/Quarterly/Any other – please specify"
            disabled={disabled}
          />
        </div>
      </div>

      {/* External Policy Assessment */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: 8, 
        padding: 20 
      }}>
        <h5 style={{ marginBottom: 16 }}>Has the entity carried out independent assessment/ evaluation of the working of its policies by an external agency?</h5>
        
        <FormFieldControlled
          name="sb_external_policy_assessment.conducted"
          control={control}
          label="Assessment conducted"
          type="checkbox"
          disabled={disabled}
        />
        
        {conductedAssessmentValue && (
          <FormFieldControlled
            name="sb_external_policy_assessment.agency_name"
            control={control}
            label="If yes, provide name of the agency"
            placeholder="Enter agency name"
            disabled={disabled}
            style={{ marginTop: 16 }}
          />
        )}
      </div>
    </div>
  );
};

export default GovernanceSection;

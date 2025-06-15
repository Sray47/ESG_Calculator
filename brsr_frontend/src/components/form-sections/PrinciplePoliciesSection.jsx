import React from 'react';
import { useController } from 'react-hook-form';
import { FormFieldControlled } from '../shared';

const getPrincipleName = (number) => {
  const names = [
    "Social: Human Rights", // P1
    "Environmental: Natural Capital", // P2
    "Social: Employee Well-being", // P3
    "Social: Stakeholder Engagement", // P4
    "Governance: Ethical Conduct", // P5
    "Environmental: Circular Economy", // P6
    "Governance: Policy Advocacy", // P7
    "Social: Inclusive Development", // P8
    "Social: Customer Value" // P9
  ];
  return names[number-1] || `Principle ${number}`;
};

const PrinciplePolicyItem = ({ control, principleIndex, disabled = false }) => {
  const principleNumber = principleIndex + 1;
  const baseName = `sb_principle_policies.${principleIndex}`;
  
  const { 
    field: { value: hasPolicyValue } 
  } = useController({
    name: `${baseName}.has_policy`,
    control
  });

  return (
    <div style={{ 
      background: '#f8f9fa', 
      border: '1px solid #e9ecef', 
      borderRadius: 8, 
      padding: 20, 
      marginBottom: 16 
    }}>
      <h5 style={{ color: '#495057', marginBottom: 16, fontSize: '1.1rem' }}>
        Principle {principleNumber}: {getPrincipleName(principleNumber)}
      </h5>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div>
          <FormFieldControlled
            name={`${baseName}.has_policy`}
            control={control}
            label="Do you have a policy?"
            type="checkbox"
            disabled={disabled}
          />
        </div>
        
        {hasPolicyValue && (
          <>
            <div>
              <FormFieldControlled
                name={`${baseName}.is_board_approved`}
                control={control}
                label="Has it been approved by the Board?"
                type="checkbox"
                disabled={disabled}
              />
            </div>
            
            <div>
              <FormFieldControlled
                name={`${baseName}.translated_to_procedures`}
                control={control}
                label="Has it been translated into procedures?"
                type="checkbox"
                disabled={disabled}
              />
            </div>
            
            <div>
              <FormFieldControlled
                name={`${baseName}.extends_to_value_chain`}
                control={control}
                label="Does it extend to the Group/JVs/Suppliers/Contractors/NGOs/Others?"
                type="checkbox"
                disabled={disabled}
              />
            </div>
          </>
        )}
      </div>
      
      {hasPolicyValue && (
        <div style={{ marginTop: 16 }}>
          <FormFieldControlled
            name={`${baseName}.policy_text_or_url`}
            control={control}
            label="Web Link of the Policy to be given or policy to be summarized (max 1000 characters)"
            as="textarea"
            rows={3}
            disabled={disabled}
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <FormFieldControlled
              name={`${baseName}.adopted_standards`}
              control={control}
              label="Name 3 of your key stakeholder groups"
              as="textarea"
              rows={2}
              disabled={disabled}
            />
            
            <FormFieldControlled
              name={`${baseName}.specific_commitments_goals_targets`}
              control={control}
              label="Have you identified the Risks/ business opportunities?"
              as="textarea"
              rows={2}
              disabled={disabled}
            />
          </div>
          
          <FormFieldControlled
            name={`${baseName}.performance_against_targets`}
            control={control}
            label="Are there any risks/ opportunities related to the principle which have not been disclosed above? If yes, give ESG risk ID."
            as="textarea"
            rows={2}
            disabled={disabled}
            style={{ marginTop: 16 }}
          />
        </div>
      )}
      
      {!hasPolicyValue && (
        <div style={{ marginTop: 16 }}>
          <p style={{ marginBottom: 16, color: '#6c757d' }}>
            If answer to question (1) above is 'No' i.e. not applicable, explain why:
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <FormFieldControlled
              name={`${baseName}.reason_q12_not_material`}
              control={control}
              label="The entity does not consider the Principles material to its business"
              type="checkbox"
              disabled={disabled}
            />
            
            <FormFieldControlled
              name={`${baseName}.reason_q12_not_at_stage`}
              control={control}
              label="The entity is not at a stage where it is in a position to formulate and implement the policies on specified principles"
              type="checkbox"
              disabled={disabled}
            />
            
            <FormFieldControlled
              name={`${baseName}.reason_q12_no_resources`}
              control={control}
              label="The entity does not have the financial or/human and technical resources available for the task"
              type="checkbox"
              disabled={disabled}
            />
            
            <FormFieldControlled
              name={`${baseName}.reason_q12_planned_next_year`}
              control={control}
              label="It is planned to be done in the next financial year"
              type="checkbox"
              disabled={disabled}
            />
          </div>
          
          <FormFieldControlled
            name={`${baseName}.reason_q12_other_text`}
            control={control}
            label="Any other reason (please specify)"
            as="textarea"
            rows={2}
            disabled={disabled}
            style={{ marginTop: 16 }}
          />
        </div>
      )}
    </div>
  );
};

const PrinciplePoliciesSection = ({ control, disabled = false }) => {
  return (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ marginBottom: 20 }}>Policy and Management Processes for NGRBC Principles</h4>
      
      {Array.from({ length: 9 }, (_, index) => (
        <PrinciplePolicyItem
          key={index}
          control={control}
          principleIndex={index}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export default PrinciplePoliciesSection;

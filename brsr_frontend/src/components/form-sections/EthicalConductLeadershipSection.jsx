import React from 'react';
import { FormFieldControlled } from '../shared';

const EthicalConductLeadershipSection = ({ control, disabled = false }) => {
  return (
    <div style={{ marginBottom: 24 }}>
      <h4>Leadership Indicators</h4>
      
      {/* Conflict of Interest Policy Communication */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: 8, 
        padding: 20, 
        marginBottom: 20 
      }}>
        <h5 style={{ marginBottom: 16 }}>LI 1: Conflict of Interest Policy Communication</h5>
        
        <div style={{ marginBottom: 16 }}>
          <FormFieldControlled
            name="leadership_indicators.conflict_of_interest_policy_communication.communicated"
            control={control}
            label="Has the entity communicated the conflict of interest policy to employees?"
            type="checkbox"
            disabled={disabled}
          />
        </div>
        
        <FormFieldControlled
          name="leadership_indicators.conflict_of_interest_policy_communication.how_communicated"
          control={control}
          label="How was it communicated?"
          as="textarea"
          rows={2}
          disabled={disabled}
        />
        
        <FormFieldControlled
          name="leadership_indicators.conflict_of_interest_policy_communication.reasons_if_not"
          control={control}
          label="If not communicated, provide reasons"
          as="textarea"
          rows={2}
          disabled={disabled}
          style={{ marginTop: 16 }}
        />
      </div>

      {/* Conflict of Interest Training */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: 8, 
        padding: 20, 
        marginBottom: 20 
      }}>
        <h5 style={{ marginBottom: 16 }}>LI 2: Conflict of Interest Training Coverage</h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
          <FormFieldControlled
            name="leadership_indicators.conflict_of_interest_training.covered_directors"
            control={control}
            label="Directors Covered"
            type="checkbox"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="leadership_indicators.conflict_of_interest_training.covered_kmps"
            control={control}
            label="KMPs Covered"
            type="checkbox"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="leadership_indicators.conflict_of_interest_training.covered_employees"
            control={control}
            label="Employees Covered"
            type="checkbox"
            disabled={disabled}
          />
        </div>
        
        <FormFieldControlled
          name="leadership_indicators.conflict_of_interest_training.fy_training_details"
          control={control}
          label="Training Details for Current FY"
          as="textarea"
          rows={3}
          disabled={disabled}
        />
      </div>

      {/* Anti-Corruption Policy Communication */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: 8, 
        padding: 20, 
        marginBottom: 20 
      }}>
        <h5 style={{ marginBottom: 16 }}>LI 3: Anti-Corruption Policy Communication</h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
          <FormFieldControlled
            name="leadership_indicators.anti_corruption_policy_communication.communicated_directors"
            control={control}
            label="Communicated to Directors"
            type="checkbox"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="leadership_indicators.anti_corruption_policy_communication.communicated_kmps"
            control={control}
            label="Communicated to KMPs"
            type="checkbox"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="leadership_indicators.anti_corruption_policy_communication.communicated_employees"
            control={control}
            label="Communicated to Employees"
            type="checkbox"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="leadership_indicators.anti_corruption_policy_communication.communicated_value_chain"
            control={control}
            label="Communicated to Value Chain Partners"
            type="checkbox"
            disabled={disabled}
          />
        </div>
        
        <FormFieldControlled
          name="leadership_indicators.anti_corruption_policy_communication.fy_communication_details"
          control={control}
          label="Communication Details for Current FY"
          as="textarea"
          rows={3}
          disabled={disabled}
        />
      </div>

      {/* Anti-Corruption Training */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: 8, 
        padding: 20 
      }}>
        <h5 style={{ marginBottom: 16 }}>LI 4: Anti-Corruption Training Coverage</h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
          <FormFieldControlled
            name="leadership_indicators.anti_corruption_training.covered_directors"
            control={control}
            label="Directors Covered"
            type="checkbox"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="leadership_indicators.anti_corruption_training.covered_kmps"
            control={control}
            label="KMPs Covered"
            type="checkbox"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="leadership_indicators.anti_corruption_training.covered_employees"
            control={control}
            label="Employees Covered"
            type="checkbox"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="leadership_indicators.anti_corruption_training.covered_value_chain"
            control={control}
            label="Value Chain Partners Covered"
            type="checkbox"
            disabled={disabled}
          />
        </div>
        
        <FormFieldControlled
          name="leadership_indicators.anti_corruption_training.fy_training_details"
          control={control}
          label="Training Details for Current FY"
          as="textarea"
          rows={3}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default EthicalConductLeadershipSection;

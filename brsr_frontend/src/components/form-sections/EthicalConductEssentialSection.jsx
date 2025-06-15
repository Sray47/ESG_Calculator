import React from 'react';
import { useController } from 'react-hook-form';
import { FormFieldControlled } from '../shared';

const EthicalConductEssentialSection = ({ control, disabled = false }) => {
  const { 
    field: { value: hasPolicyValue } 
  } = useController({
    name: "essential_indicators.anti_corruption_policy.has_policy",
    control
  });

  const { 
    field: { value: hasTrainingProgramValue } 
  } = useController({
    name: "essential_indicators.esg_training_employees.has_program",
    control
  });

  return (
    <div style={{ marginBottom: 24 }}>
      <h4>Essential Indicators</h4>
      
      {/* Anti-Corruption Policy */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: 8, 
        padding: 20, 
        marginBottom: 20 
      }}>
        <h5 style={{ marginBottom: 16 }}>EI 1: Anti-Corruption and Bribery Policy</h5>
        
        <FormFieldControlled
          name="essential_indicators.anti_corruption_policy.has_policy"
          control={control}
          label="Does the entity have an anti-corruption or anti-bribery policy?"
          type="checkbox"
          disabled={disabled}
        />
        
        {hasPolicyValue && (
          <div style={{ marginTop: 16 }}>
            <FormFieldControlled
              name="essential_indicators.anti_corruption_policy.details"
              control={control}
              label="Policy Details"
              as="textarea"
              rows={3}
              placeholder="Provide details about the anti-corruption policy"
              disabled={disabled}
            />
            
            <FormFieldControlled
              name="essential_indicators.anti_corruption_policy.weblink"
              control={control}
              label="Web Link"
              placeholder="https://..."
              disabled={disabled}
              style={{ marginTop: 16 }}
            />
          </div>
        )}
      </div>

      {/* Disciplinary Actions */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: 8, 
        padding: 20, 
        marginBottom: 20 
      }}>
        <h5 style={{ marginBottom: 16 }}>EI 2: Disciplinary Actions (FY 2022-23)</h5>
        <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: 16 }}>
          Number of Directors/KMPs/employees/workers against whom disciplinary action was taken by any law enforcement agency for the charges of bribery/corruption:
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <FormFieldControlled
            name="essential_indicators.disciplinary_actions_by_le_agencies.fy_2022_23.directors"
            control={control}
            label="Directors"
            type="number"
            min="0"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="essential_indicators.disciplinary_actions_by_le_agencies.fy_2022_23.kmps"
            control={control}
            label="KMPs"
            type="number"
            min="0"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="essential_indicators.disciplinary_actions_by_le_agencies.fy_2022_23.employees_executives"
            control={control}
            label="Employees (Executives)"
            type="number"
            min="0"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="essential_indicators.disciplinary_actions_by_le_agencies.fy_2022_23.workers_non_executives"
            control={control}
            label="Workers (Non-Executives)"
            type="number"
            min="0"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Complaints on Conflict of Interest */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: 8, 
        padding: 20, 
        marginBottom: 20 
      }}>
        <h5 style={{ marginBottom: 16 }}>EI 3: Complaints regarding Conflict of Interest</h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <FormFieldControlled
            name="essential_indicators.complaints_conflict_of_interest.directors_number"
            control={control}
            label="Number of complaints received regarding Directors"
            type="number"
            min="0"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="essential_indicators.complaints_conflict_of_interest.kmps_number"
            control={control}
            label="Number of complaints received regarding KMPs"
            type="number"
            min="0"
            disabled={disabled}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormFieldControlled
            name="essential_indicators.complaints_conflict_of_interest.directors_remarks"
            control={control}
            label="Remarks for Directors"
            as="textarea"
            rows={2}
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="essential_indicators.complaints_conflict_of_interest.kmps_remarks"
            control={control}
            label="Remarks for KMPs"
            as="textarea"
            rows={2}
            disabled={disabled}
          />
        </div>
      </div>

      {/* ESG Training */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: 8, 
        padding: 20, 
        marginBottom: 20 
      }}>
        <h5 style={{ marginBottom: 16 }}>EI 4: ESG Training for Employees</h5>
        
        <FormFieldControlled
          name="essential_indicators.esg_training_employees.has_program"
          control={control}
          label="Does the entity have an ESG training program for employees?"
          type="checkbox"
          disabled={disabled}
        />
        
        {hasTrainingProgramValue && (
          <FormFieldControlled
            name="essential_indicators.esg_training_employees.employees_trained_count"
            control={control}
            label="Number of employees trained"
            type="number"
            min="0"
            disabled={disabled}
            style={{ marginTop: 16 }}
          />
        )}
      </div>

      {/* Corrective Actions */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: 8, 
        padding: 20, 
        marginBottom: 20 
      }}>
        <h5 style={{ marginBottom: 16 }}>EI 5: Corrective Actions</h5>
        
        <FormFieldControlled
          name="essential_indicators.corrective_actions_on_corruption_coi.details"
          control={control}
          label="Details of any corrective action taken or underway on issues related to fines/penalties/action taken by regulators/law enforcement agencies/judicial institutions, on cases of corruption and conflicts of interest"
          as="textarea"
          rows={4}
          disabled={disabled}
        />
      </div>

      {/* Fines and Penalties */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: 8, 
        padding: 20, 
        marginBottom: 20 
      }}>
        <h5 style={{ marginBottom: 16 }}>EI 6: Fines and Penalties</h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormFieldControlled
            name="essential_indicators.p1_fines_penalties_paid.monetary_details"
            control={control}
            label="Monetary Details"
            as="textarea"
            rows={3}
            placeholder="Details of fines/penalties/punishment/award/compounding fees/settlement amount paid"
            disabled={disabled}
          />
          
          <FormFieldControlled
            name="essential_indicators.p1_fines_penalties_paid.non_monetary_details"
            control={control}
            label="Non-Monetary Details"
            as="textarea"
            rows={3}
            placeholder="Details of non-monetary corrective measures"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Appeals */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: 8, 
        padding: 20 
      }}>
        <h5 style={{ marginBottom: 16 }}>EI 7: Appeals and Revisions</h5>
        
        <FormFieldControlled
          name="essential_indicators.p1_appeal_details_for_fines_penalties.details"
          control={control}
          label="Details of the Appeal/Revision preferred in cases where monetary or non-monetary action has been appealed"
          as="textarea"
          rows={3}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default EthicalConductEssentialSection;

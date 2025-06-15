import React from 'react';
import { useController } from 'react-hook-form';
import { FormField } from '../shared';

export default function RDCapexSection({ control, disabled = false }) {
  const {
    field: rdPercentageField,
    fieldState: { error: rdPercentageError }
  } = useController({
    name: 'p2_essential_rd_capex_percentages.rd_percentage_current_fy',
    control,
  });

  const {
    field: capexPercentageField,
    fieldState: { error: capexPercentageError }
  } = useController({
    name: 'p2_essential_rd_capex_percentages.capex_percentage_current_fy',
    control,
  });

  const {
    field: rdDetailsField
  } = useController({
    name: 'p2_essential_rd_capex_percentages.rd_improvements_details',
    control,
  });

  const {
    field: capexDetailsField
  } = useController({
    name: 'p2_essential_rd_capex_percentages.capex_improvements_details',
    control,
  });

  return (
    <div className="form-section">
      <h5>1. R&D and Capital Expenditure Investments</h5>
      <p style={{ fontSize: '0.9em', color: '#6c757d', marginBottom: 16 }}>
        Provide details on R&D and capital expenditure investments in sustainable technologies and processes.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div>
          <FormField
            label="R&D Investment (%)"
            name={rdPercentageField.name}
            type="number"
            value={rdPercentageField.value || ''}
            onChange={(e) => rdPercentageField.onChange(e.target.value ? parseFloat(e.target.value) : null)}
            onBlur={rdPercentageField.onBlur}
            disabled={disabled}
            error={rdPercentageError?.message}
            min="0"
            max="100"
            step="0.01"
            placeholder="e.g., 2.5"
          />
        </div>
        
        <div>
          <FormField
            label="Capital Expenditure (%)"
            name={capexPercentageField.name}
            type="number"
            value={capexPercentageField.value || ''}
            onChange={(e) => capexPercentageField.onChange(e.target.value ? parseFloat(e.target.value) : null)}
            onBlur={capexPercentageField.onBlur}
            disabled={disabled}
            error={capexPercentageError?.message}
            min="0"
            max="100"
            step="0.01"
            placeholder="e.g., 15.0"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <FormField
            label="R&D Improvements Details"
            name={rdDetailsField.name}
            type="textarea"
            value={rdDetailsField.value || ''}
            onChange={(e) => rdDetailsField.onChange(e.target.value)}
            onBlur={rdDetailsField.onBlur}
            disabled={disabled}
            placeholder="Describe specific R&D initiatives and improvements..."
            rows={4}
          />
        </div>
        
        <div>
          <FormField
            label="Capital Expenditure Improvements Details"
            name={capexDetailsField.name}
            type="textarea"
            value={capexDetailsField.value || ''}
            onChange={(e) => capexDetailsField.onChange(e.target.value)}
            onBlur={capexDetailsField.onBlur}
            disabled={disabled}
            placeholder="Describe specific capital expenditure initiatives and improvements..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}

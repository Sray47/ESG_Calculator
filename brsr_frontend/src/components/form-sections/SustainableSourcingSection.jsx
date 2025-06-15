import React from 'react';
import { useController } from 'react-hook-form';
import { FormField } from '../shared';

export default function SustainableSourcingSection({ control, disabled = false }) {
  const {
    field: hasProceduresField
  } = useController({
    name: 'p2_essential_sustainable_sourcing.has_procedures',
    control,
  });

  const {
    field: percentageField,
    fieldState: { error: percentageError }
  } = useController({
    name: 'p2_essential_sustainable_sourcing.percentage_inputs_sourced_sustainably',
    control,
  });

  const handleRadioChange = (value) => {
    hasProceduresField.onChange(value === 'yes' ? true : value === 'no' ? false : null);
  };

  return (
    <div className="form-section">
      <h5>2. Sustainable Sourcing</h5>
      <p style={{ fontSize: '0.9em', color: '#6c757d', marginBottom: 16 }}>
        Information about sustainable sourcing procedures and practices.
      </p>
      
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
          Does the entity have procedures in place for sustainable sourcing?
        </label>
        <div style={{ display: 'flex', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'normal' }}>
            <input
              type="radio"
              name="has_procedures"
              value="yes"
              checked={hasProceduresField.value === true}
              onChange={() => handleRadioChange('yes')}
              onBlur={hasProceduresField.onBlur}
              disabled={disabled}
            />
            Yes
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'normal' }}>
            <input
              type="radio"
              name="has_procedures"
              value="no"
              checked={hasProceduresField.value === false}
              onChange={() => handleRadioChange('no')}
              onBlur={hasProceduresField.onBlur}
              disabled={disabled}
            />
            No
          </label>
        </div>
      </div>

      {hasProceduresField.value === true && (
        <div>
          <FormField
            label="Percentage of inputs sourced sustainably (%)"
            name={percentageField.name}
            type="number"
            value={percentageField.value || ''}
            onChange={(e) => percentageField.onChange(e.target.value ? parseFloat(e.target.value) : null)}
            onBlur={percentageField.onBlur}
            disabled={disabled}
            error={percentageError?.message}
            min="0"
            max="100"
            step="0.01"
            placeholder="e.g., 75.5"
          />
        </div>
      )}
    </div>
  );
}

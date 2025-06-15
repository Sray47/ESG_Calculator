import React from 'react';
import { useController } from 'react-hook-form';
import { FormField } from '../shared';

export default function EPRStatusSection({ control, disabled = false }) {
  const {
    field: isEprApplicableField
  } = useController({
    name: 'p2_essential_epr_status.is_epr_applicable',
    control,
  });

  const {
    field: isCollectionPlanInLineField
  } = useController({
    name: 'p2_essential_epr_status.is_collection_plan_in_line_with_epr',
    control,
  });

  const {
    field: stepsToAddressGapField
  } = useController({
    name: 'p2_essential_epr_status.steps_to_address_epr_gap',
    control,
  });

  const handleEprApplicableChange = (value) => {
    isEprApplicableField.onChange(value === 'yes' ? true : value === 'no' ? false : null);
  };

  const handleCollectionPlanChange = (value) => {
    isCollectionPlanInLineField.onChange(value === 'yes' ? true : value === 'no' ? false : null);
  };

  return (
    <div className="form-section">
      <h5>4. Extended Producer Responsibility (EPR)</h5>
      <p style={{ fontSize: '0.9em', color: '#6c757d', marginBottom: 16 }}>
        Information about Extended Producer Responsibility applicability and compliance.
      </p>
      
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
          Is Extended Producer Responsibility (EPR) applicable to the entity's activities?
        </label>
        <div style={{ display: 'flex', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'normal' }}>
            <input
              type="radio"
              name="is_epr_applicable"
              value="yes"
              checked={isEprApplicableField.value === true}
              onChange={() => handleEprApplicableChange('yes')}
              onBlur={isEprApplicableField.onBlur}
              disabled={disabled}
            />
            Yes
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'normal' }}>
            <input
              type="radio"
              name="is_epr_applicable"
              value="no"
              checked={isEprApplicableField.value === false}
              onChange={() => handleEprApplicableChange('no')}
              onBlur={isEprApplicableField.onBlur}
              disabled={disabled}
            />
            No
          </label>
        </div>
      </div>

      {isEprApplicableField.value === true && (
        <>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
              Is the collection plan in line with EPR requirements?
            </label>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'normal' }}>
                <input
                  type="radio"
                  name="is_collection_plan_in_line_with_epr"
                  value="yes"
                  checked={isCollectionPlanInLineField.value === true}
                  onChange={() => handleCollectionPlanChange('yes')}
                  onBlur={isCollectionPlanInLineField.onBlur}
                  disabled={disabled}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'normal' }}>
                <input
                  type="radio"
                  name="is_collection_plan_in_line_with_epr"
                  value="no"
                  checked={isCollectionPlanInLineField.value === false}
                  onChange={() => handleCollectionPlanChange('no')}
                  onBlur={isCollectionPlanInLineField.onBlur}
                  disabled={disabled}
                />
                No
              </label>
            </div>
          </div>

          {isCollectionPlanInLineField.value === false && (
            <div>
              <FormField
                label="Steps to Address EPR Gap"
                name={stepsToAddressGapField.name}
                type="textarea"
                value={stepsToAddressGapField.value || ''}
                onChange={(e) => stepsToAddressGapField.onChange(e.target.value)}
                onBlur={stepsToAddressGapField.onBlur}
                disabled={disabled}
                placeholder="Describe the steps being taken to address the EPR gap..."
                rows={4}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

import React from 'react';
import { useController } from 'react-hook-form';
import { FormField } from '../shared';

export default function ReclaimProcessesSection({ control, disabled = false }) {
  const {
    field: plasticsField
  } = useController({
    name: 'p2_essential_reclaim_processes_description.plastics',
    control,
  });

  const {
    field: eWasteField
  } = useController({
    name: 'p2_essential_reclaim_processes_description.e_waste',
    control,
  });

  const {
    field: hazardousWasteField
  } = useController({
    name: 'p2_essential_reclaim_processes_description.hazardous_waste',
    control,
  });

  const {
    field: otherWasteField
  } = useController({
    name: 'p2_essential_reclaim_processes_description.other_waste',
    control,
  });

  return (
    <div className="form-section">
      <h5>3. Reclaim Processes Description</h5>
      <p style={{ fontSize: '0.9em', color: '#6c757d', marginBottom: 16 }}>
        Describe the processes in place for reclaiming different types of waste materials.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <FormField
            label="Plastics"
            name={plasticsField.name}
            type="textarea"
            value={plasticsField.value || ''}
            onChange={(e) => plasticsField.onChange(e.target.value)}
            onBlur={plasticsField.onBlur}
            disabled={disabled}
            placeholder="Describe plastic reclaim processes..."
            rows={4}
          />
        </div>
        
        <div>
          <FormField
            label="E-Waste"
            name={eWasteField.name}
            type="textarea"
            value={eWasteField.value || ''}
            onChange={(e) => eWasteField.onChange(e.target.value)}
            onBlur={eWasteField.onBlur}
            disabled={disabled}
            placeholder="Describe e-waste reclaim processes..."
            rows={4}
          />
        </div>
        
        <div>
          <FormField
            label="Hazardous Waste"
            name={hazardousWasteField.name}
            type="textarea"
            value={hazardousWasteField.value || ''}
            onChange={(e) => hazardousWasteField.onChange(e.target.value)}
            onBlur={hazardousWasteField.onBlur}
            disabled={disabled}
            placeholder="Describe hazardous waste reclaim processes..."
            rows={4}
          />
        </div>
        
        <div>
          <FormField
            label="Other Waste"
            name={otherWasteField.name}
            type="textarea"
            value={otherWasteField.value || ''}
            onChange={(e) => otherWasteField.onChange(e.target.value)}
            onBlur={otherWasteField.onBlur}
            disabled={disabled}
            placeholder="Describe other waste reclaim processes..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { DataTable, FormSection } from '../shared';

/**
 * Business activities table component
 * Used in Section A for displaying business activities and turnover
 */
const BusinessActivitiesTable = ({
  data = [],
  onUpdate,
  onAdd,
  onRemove,
  disabled = false,
  validationErrors = {}
}) => {
  const columns = [
    {
      key: 'description_main',
      label: 'Description of Main Activity',
      type: 'textarea',
      required: true,
      placeholder: 'Enter main business activity description'
    },
    {
      key: 'nic_code',
      label: 'NIC Code',
      type: 'text',
      placeholder: 'Enter NIC code'
    },
    {
      key: 'business_activity_total_turnover',
      label: 'Turnover (INR Crores)',
      type: 'number',
      min: 0,
      step: 0.01,
      placeholder: '0.00'
    },
    {
      key: 'business_activity_percentage_turnover',
      label: '% of Total Turnover',
      type: 'number',
      min: 0,
      max: 100,
      step: 0.01,
      placeholder: '0.00'
    }
  ];

  const handleUpdateRow = (rowIndex, columnKey, value) => {
    if (onUpdate) {
      onUpdate(rowIndex, columnKey, value);
    }
  };

  const handleAddRow = () => {
    if (onAdd) {
      onAdd();
    }
  };

  const handleRemoveRow = (index) => {
    if (onRemove) {
      onRemove(index);
    }
  };

  return (
    <FormSection title="Business Activities">
      {validationErrors.sa_business_activities_turnover && (
        <div style={{ color: '#dc3545', marginBottom: 16, fontSize: '0.875rem' }}>
          {validationErrors.sa_business_activities_turnover}
        </div>
      )}
      
      <DataTable
        data={data}
        columns={columns}
        onUpdate={handleUpdateRow}
        onAdd={handleAddRow}
        onRemove={handleRemoveRow}
        addButtonText="Add Business Activity"
        disabled={disabled}
        minRows={1}
        maxRows={10}
      />
    </FormSection>
  );
};

export default BusinessActivitiesTable;

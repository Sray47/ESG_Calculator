import React from 'react';
import { DataTable, FormSection } from '../shared';

/**
 * Products and services table component
 * Used in Section A for displaying products/services and turnover
 */
const ProductsServicesTable = ({
  data = [],
  onUpdate,
  onAdd,
  onRemove,
  disabled = false,
  validationErrors = {}
}) => {
  const columns = [
    {
      key: 'product_service',
      label: 'Product/Service',
      type: 'textarea',
      required: true,
      placeholder: 'Enter product or service description'
    },
    {
      key: 'nic_code',
      label: 'NIC Code',
      type: 'text',
      placeholder: 'Enter NIC code'
    },
    {
      key: 'product_service_percentage_turnover',
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
    <FormSection title="Products and Services">
      {validationErrors.sa_product_services_turnover && (
        <div style={{ color: '#dc3545', marginBottom: 16, fontSize: '0.875rem' }}>
          {validationErrors.sa_product_services_turnover}
        </div>
      )}
      
      <DataTable
        data={data}
        columns={columns}
        onUpdate={handleUpdateRow}
        onAdd={handleAddRow}
        onRemove={handleRemoveRow}
        addButtonText="Add Product/Service"
        disabled={disabled}
        minRows={1}
        maxRows={10}
      />
    </FormSection>
  );
};

export default ProductsServicesTable;

import React from 'react';
import { FormField, FormSection } from '../shared';

/**
 * Employee demographics component
 * Reusable component for employee/worker count tables
 */
const EmployeeDemographics = ({
  title,
  data,
  onChange,
  disabled = false,
  showCategories = ['permanent', 'other'],
  showGenderBreakdown = true
}) => {
  const handleFieldChange = (category, field, value) => {
    if (onChange) {
      onChange(category, field, value);
    }
  };

  const calculateTotal = (maleCount, femaleCount) => {
    const male = parseInt(maleCount) || 0;
    const female = parseInt(femaleCount) || 0;
    return male + female;
  };

  const renderCategoryRow = (category, categoryData) => (
    <tr key={category}>
      <td style={{ padding: 12, fontWeight: 500, textTransform: 'capitalize' }}>
        {category}
      </td>
      {showGenderBreakdown && (
        <>
          <td style={{ padding: 12 }}>
            <input
              type="number"
              min="0"
              value={categoryData[`${category}_male_no`] || ''}
              onChange={(e) => handleFieldChange(category, `${category}_male_no`, e.target.value)}
              disabled={disabled}
              style={{ width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 3 }}
            />
          </td>
          <td style={{ padding: 12 }}>
            <input
              type="number"
              min="0"
              value={categoryData[`${category}_female_no`] || ''}
              onChange={(e) => handleFieldChange(category, `${category}_female_no`, e.target.value)}
              disabled={disabled}
              style={{ width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 3 }}
            />
          </td>
        </>
      )}
      <td style={{ padding: 12 }}>
        <input
          type="number"
          min="0"
          value={categoryData[`${category}_total`] || 
                 calculateTotal(categoryData[`${category}_male_no`], categoryData[`${category}_female_no`])}
          onChange={(e) => handleFieldChange(category, `${category}_total`, e.target.value)}
          disabled={disabled}
          style={{ width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 3 }}
        />
      </td>
    </tr>
  );

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 4,
    overflow: 'hidden'
  };

  const headerStyle = {
    background: '#f8f9fa',
    fontWeight: 600,
    padding: 12,
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6'
  };

  return (
    <FormSection title={title}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={headerStyle}>Category</th>
            {showGenderBreakdown && (
              <>
                <th style={headerStyle}>Male</th>
                <th style={headerStyle}>Female</th>
              </>
            )}
            <th style={headerStyle}>Total</th>
          </tr>
        </thead>
        <tbody>
          {showCategories.map(category => renderCategoryRow(category, data))}
        </tbody>
      </table>
    </FormSection>
  );
};

export default EmployeeDemographics;

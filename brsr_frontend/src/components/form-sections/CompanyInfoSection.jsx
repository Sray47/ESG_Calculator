import React from 'react';
import { FormField, FormSection } from '../shared';

/**
 * Company information form component
 * Used in Section A and potentially other forms
 */
const CompanyInfoSection = ({
  companyInfo,
  onChange,
  validationErrors = {},
  disabled = false,
  showAllFields = true
}) => {
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  return (
    <FormSection 
      title="Company Basic Information" 
      variant="card"
    >
      <FormField
        label="Company Name"
        name="company_name"
        value={companyInfo.company_name}
        onChange={handleFieldChange}
        required
        disabled={disabled}
        error={validationErrors.company_name}
      />

      <FormField
        label="CIN"
        name="cin"
        value={companyInfo.cin}
        onChange={handleFieldChange}
        placeholder="L12345AB1234ABC123456"
        required
        disabled={disabled}
        error={validationErrors.cin}
        helperText="Corporate Identity Number (21 characters)"
      />

      <FormField
        label="Year of Incorporation"
        name="year_of_incorporation"
        type="number"
        value={companyInfo.year_of_incorporation}
        onChange={handleFieldChange}
        min="1800"
        max={new Date().getFullYear()}
        required
        disabled={disabled}
        error={validationErrors.year_of_incorporation}
      />

      {showAllFields && (
        <>
          <FormField
            label="Registered Office Address"
            name="registered_office_address"
            type="textarea"
            value={companyInfo.registered_office_address}
            onChange={handleFieldChange}
            rows={3}
            disabled={disabled}
            error={validationErrors.registered_office_address}
          />

          <FormField
            label="Corporate Address"
            name="corporate_address"
            type="textarea"
            value={companyInfo.corporate_address}
            onChange={handleFieldChange}
            rows={3}
            disabled={disabled}
            error={validationErrors.corporate_address}
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            value={companyInfo.email}
            onChange={handleFieldChange}
            disabled={disabled}
            error={validationErrors.email}
          />

          <FormField
            label="Telephone"
            name="telephone"
            value={companyInfo.telephone}
            onChange={handleFieldChange}
            disabled={disabled}
            error={validationErrors.telephone}
          />

          <FormField
            label="Website"
            name="website"
            value={companyInfo.website}
            onChange={handleFieldChange}
            placeholder="https://www.example.com"
            disabled={disabled}
            error={validationErrors.website}
            helperText="Must start with http:// or https://"
          />

          <FormField
            label="Paid Up Capital"
            name="paid_up_capital"
            type="number"
            value={companyInfo.paid_up_capital}
            onChange={handleFieldChange}
            min="0"
            step="0.01"
            disabled={disabled}
            error={validationErrors.paid_up_capital}
            helperText="Enter amount in INR"
          />
        </>
      )}
    </FormSection>
  );
};

export default CompanyInfoSection;

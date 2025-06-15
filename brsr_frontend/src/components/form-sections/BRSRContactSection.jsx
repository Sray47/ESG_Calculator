import React from 'react';
import { FormField, FormSection } from '../shared';

/**
 * BRSR contact information form component
 * Used in Section A for BRSR-specific contact details
 */
const BRSRContactSection = ({
  contactInfo,
  onChange,
  validationErrors = {},
  disabled = false
}) => {
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  return (
    <FormSection 
      title="BRSR Contact Information" 
      description="Details of the person responsible for BRSR reporting"
    >
      <FormField
        label="BRSR Contact Name"
        name="brsr_contact_name"
        value={contactInfo.brsr_contact_name}
        onChange={handleFieldChange}
        required
        disabled={disabled}
        error={validationErrors.brsr_contact_name}
      />

      <FormField
        label="BRSR Contact Email"
        name="brsr_contact_mail"
        type="email"
        value={contactInfo.brsr_contact_mail}
        onChange={handleFieldChange}
        required
        disabled={disabled}
        error={validationErrors.brsr_contact_mail}
      />

      <FormField
        label="BRSR Contact Number"
        name="brsr_contact_number"
        value={contactInfo.brsr_contact_number}
        onChange={handleFieldChange}
        disabled={disabled}
        error={validationErrors.brsr_contact_number}
        helperText="Phone number with country code"
      />
    </FormSection>
  );
};

export default BRSRContactSection;

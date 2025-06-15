import React from 'react';
import { FormFieldControlled } from '../shared';

const ESGResponsibleSection = ({ control, disabled = false }) => {
  return (
    <div style={{ marginBottom: 24 }}>
      <h4>Details of the Highest Authority Responsible for Implementation and Oversight of the Business Responsibility Policy(ies)</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
        <FormFieldControlled
          name="sb_esg_responsible_individual.name"
          control={control}
          label="Name"
          placeholder="Enter full name"
          disabled={disabled}
          required
        />
        
        <FormFieldControlled
          name="sb_esg_responsible_individual.designation"
          control={control}
          label="Designation"
          placeholder="Enter designation"
          disabled={disabled}
          required
        />
        
        <FormFieldControlled
          name="sb_esg_responsible_individual.din_if_director"
          control={control}
          label="DIN (if Director)"
          placeholder="Enter DIN if applicable"
          disabled={disabled}
        />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginTop: 16 }}>
        <FormFieldControlled
          name="sb_esg_responsible_individual.email"
          control={control}
          label="Email ID"
          type="email"
          placeholder="Enter email address"
          disabled={disabled}
          required
        />
        
        <FormFieldControlled
          name="sb_esg_responsible_individual.phone"
          control={control}
          label="Contact Number"
          type="tel"
          placeholder="Enter phone number"
          disabled={disabled}
          required
        />
      </div>
    </div>
  );
};

export default ESGResponsibleSection;

import React from 'react';
import { FormFieldControlled } from '../shared';

const DirectorStatementSection = ({ control, disabled = false }) => {
  return (
    <div style={{ marginBottom: 24 }}>
      <h4>Statement by Director Responsible for Business Responsibility Report</h4>
      <FormFieldControlled
        name="sb_director_statement"
        control={control}
        label="Statement"
        as="textarea"
        rows={4}
        placeholder="Enter the director's statement on business responsibility"
        disabled={disabled}
        required
      />
    </div>
  );
};

export default DirectorStatementSection;

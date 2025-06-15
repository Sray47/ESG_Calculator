import React from 'react';
import { FormFieldControlled } from '../shared';

const BRSRContactSectionControlled = ({ control }) => {
    return (
        <div>
            <div className="form-group">
                <FormFieldControlled
                    name="companyInfo.brsr_contact_name"
                    control={control}
                    label="Name"
                    required
                    placeholder="Enter contact person name"
                />
            </div>
            
            <div className="form-row">
                <div className="form-group">
                    <FormFieldControlled
                        name="companyInfo.brsr_contact_mail"
                        control={control}
                        label="Email"
                        type="email"
                        required
                        placeholder="contact@example.com"
                    />
                </div>
                <div className="form-group">
                    <FormFieldControlled
                        name="companyInfo.brsr_contact_number"
                        control={control}
                        label="Phone Number"
                        type="tel"
                        required
                        placeholder="+91-9876543210"
                    />
                </div>
            </div>
        </div>
    );
};

export default BRSRContactSectionControlled;

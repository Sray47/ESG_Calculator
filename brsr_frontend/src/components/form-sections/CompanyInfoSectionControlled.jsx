import React from 'react';
import { FormFieldControlled } from '../shared';

const CompanyInfoSectionControlled = ({ control }) => {
    return (
        <div>
            <div className="form-row">
                <div className="form-group">
                    <FormFieldControlled
                        name="companyInfo.company_name"
                        control={control}
                        label="Company Name"
                        required
                        placeholder="Enter company name"
                    />
                </div>
                <div className="form-group">
                    <FormFieldControlled
                        name="companyInfo.cin"
                        control={control}
                        label="Corporate Identity Number (CIN)"
                        required
                        placeholder="L12345AB1234ABC123456"
                    />
                </div>
            </div>
            
            <div className="form-row">
                <div className="form-group">
                    <FormFieldControlled
                        name="companyInfo.year_of_incorporation"
                        control={control}
                        label="Year of Incorporation"
                        type="number"
                        min="1800"
                        max={new Date().getFullYear()}
                        placeholder="e.g., 1995"
                    />
                </div>
                <div className="form-group">
                    <FormFieldControlled
                        name="companyInfo.paid_up_capital"
                        control={control}
                        label="Paid-up Capital (in ₹)"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g., 10000000"
                    />
                </div>
            </div>
            
            <div className="form-group">
                <FormFieldControlled
                    name="companyInfo.registered_office_address"
                    control={control}
                    label="Registered Office Address"
                    required
                    as="textarea"
                    rows={3}
                    placeholder="Enter complete registered office address"
                />
            </div>
            
            <div className="form-group">
                <FormFieldControlled
                    name="companyInfo.corporate_address"
                    control={control}
                    label="Corporate Address (if different from registered office)"
                    as="textarea"
                    rows={3}
                    placeholder="Enter corporate address if different from registered office"
                />
            </div>
            
            <div className="form-row">
                <div className="form-group">
                    <FormFieldControlled
                        name="companyInfo.email"
                        control={control}
                        label="Email"
                        type="email"
                        placeholder="company@example.com"
                    />
                </div>
                <div className="form-group">
                    <FormFieldControlled
                        name="companyInfo.telephone"
                        control={control}
                        label="Telephone"
                        type="tel"
                        placeholder="+91-11-12345678"
                    />
                </div>
            </div>
            
            <div className="form-row">
                <div className="form-group">
                    <FormFieldControlled
                        name="companyInfo.website"
                        control={control}
                        label="Website"
                        type="url"
                        placeholder="https://www.company.com"
                    />
                </div>
                <div className="form-group">
                    <FormFieldControlled
                        name="companyInfo.stock_exchange_listed"
                        control={control}
                        label="Stock Exchange(s) Listed"
                        as="select"
                        multiple
                        options={[
                            { value: 'BSE', label: 'BSE' },
                            { value: 'NSE', label: 'NSE' },
                            { value: 'MSE', label: 'MSE' },
                            { value: 'CSE', label: 'CSE' },
                            { value: 'Other', label: 'Other' }
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default CompanyInfoSectionControlled;

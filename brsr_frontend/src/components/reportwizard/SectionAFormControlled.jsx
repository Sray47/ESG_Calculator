import React from 'react';
import { FormProvider, useFormContext } from 'react-hook-form';
import { useOutletContext } from 'react-router-dom';
import { useSectionAForm } from '../../hooks/useSectionAForm';
import '../../pages/ProfilePage.css';

// Import components
import { 
    FormFieldControlled,
    FormSection, 
    DataTable, 
    ValidationSummary, 
    Button, 
    LoadingSpinner 
} from '../shared';

import { 
    CompanyInfoSectionControlled,
    BRSRContactSectionControlled,
    BusinessActivitiesTableControlled,
    ProductsServicesTableControlled,
    EmployeeDemographicsControlled 
} from '../form-sections';

const formSectionStyle = {
  background: '#f8f9fa',
  borderRadius: 8,
  padding: 20,
  marginBottom: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
};

function SectionAForm() {
    const { reportData, setError: setWizardError } = useOutletContext();
    
    const {
        form,
        isLoading,
        isSubmitting,
        localError,
        localSuccess,
        errors,
        onSubmit,
        setLocalError,
        setLocalSuccess,
        addBusinessActivity,
        removeBusinessActivity,
        addProductService,
        removeProductService,
        addHoldingCompany,
        removeHoldingCompany,
        calculatePercentage
    } = useSectionAForm(reportData, setWizardError);

    const { handleSubmit, control, watch } = form;

    if (isLoading) {
        return <LoadingSpinner message="Loading company profile..." />;
    }

    return (
        <FormProvider {...form}>
            <div className="section-form">
                <div className="section-header">
                    <h2>Section A: General Disclosures</h2>
                    <p>Please provide company details and basic information required for BRSR reporting.</p>
                </div>

                {(localError || localSuccess) && (
                    <ValidationSummary 
                        errors={localError ? [localError] : []}
                        success={localSuccess}
                    />
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* Company Information Section */}
                    <FormSection 
                        title="Company Information" 
                        style={formSectionStyle}
                    >
                        <CompanyInfoSectionControlled control={control} />
                    </FormSection>

                    {/* BRSR Contact Information */}
                    <FormSection 
                        title="BRSR Contact Information" 
                        style={formSectionStyle}
                    >
                        <BRSRContactSectionControlled control={control} />
                    </FormSection>

                    {/* Business Activities */}
                    <FormSection 
                        title="Business Activities Contributing to Turnover" 
                        style={formSectionStyle}
                    >
                        <BusinessActivitiesTableControlled
                            control={control}
                            onAdd={addBusinessActivity}
                            onRemove={removeBusinessActivity}
                        />
                    </FormSection>

                    {/* Products and Services */}
                    <FormSection 
                        title="Products/Services Contributing to Turnover" 
                        style={formSectionStyle}
                    >
                        <ProductsServicesTableControlled
                            control={control}
                            onAdd={addProductService}
                            onRemove={removeProductService}
                        />
                    </FormSection>

                    {/* Locations of Plants and Offices */}
                    <FormSection 
                        title="Locations of Plants and Offices" 
                        style={formSectionStyle}
                    >
                        <div className="form-row">
                            <div className="form-group">
                                <FormFieldControlled
                                    name="sectionAData.sa_locations_plants_offices.national_plants"
                                    control={control}
                                    label="National - Plants"
                                    type="number"
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <FormFieldControlled
                                    name="sectionAData.sa_locations_plants_offices.national_offices"
                                    control={control}
                                    label="National - Offices"
                                    type="number"
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <FormFieldControlled
                                    name="sectionAData.sa_locations_plants_offices.international_plants"
                                    control={control}
                                    label="International - Plants"
                                    type="number"
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <FormFieldControlled
                                    name="sectionAData.sa_locations_plants_offices.international_offices"
                                    control={control}
                                    label="International - Offices"
                                    type="number"
                                    min="0"
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Markets Served */}
                    <FormSection 
                        title="Markets Served by the Entity" 
                        style={formSectionStyle}
                    >
                        <div className="form-row">
                            <div className="form-group">
                                <FormFieldControlled
                                    name="sectionAData.sa_markets_served.locations.national_states"
                                    control={control}
                                    label="Number of States"
                                    type="number"
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <FormFieldControlled
                                    name="sectionAData.sa_markets_served.locations.international_countries"
                                    control={control}
                                    label="Number of Countries"
                                    type="number"
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <FormFieldControlled
                                    name="sectionAData.sa_markets_served.exports_percentage"
                                    control={control}
                                    label="What is the contribution of exports as a percentage of the total turnover?"
                                    placeholder="e.g., 25%"
                                />
                            </div>
                            <div className="form-group">
                                <FormFieldControlled
                                    name="sectionAData.sa_markets_served.customer_types"
                                    control={control}
                                    label="Types of customers"
                                    as="textarea"
                                    rows={3}
                                    placeholder="Describe the types of customers (e.g., B2B, B2C, Government, etc.)"
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Employee and Worker Demographics */}
                    <FormSection 
                        title="Employee and Worker Demographics" 
                        style={formSectionStyle}
                    >
                        <EmployeeDemographicsControlled 
                            control={control}
                            calculatePercentage={calculatePercentage}
                            watch={watch}
                        />
                    </FormSection>

                    {/* Turnover Rate */}
                    <FormSection 
                        title="Turnover Rate for the Current Year and Previous Year" 
                        style={formSectionStyle}
                    >
                        <div className="form-row">
                            <div className="form-group">
                                <FormFieldControlled
                                    name="sectionAData.sa_turnover_rate.permanent_employees_turnover_rate"
                                    control={control}
                                    label="Permanent Employees Turnover Rate"
                                    placeholder="e.g., 5.2%"
                                />
                            </div>
                            <div className="form-group">
                                <FormFieldControlled
                                    name="sectionAData.sa_turnover_rate.permanent_workers_turnover_rate"
                                    control={control}
                                    label="Permanent Workers Turnover Rate"
                                    placeholder="e.g., 3.8%"
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Holding/Subsidiary/Associate Companies */}
                    <FormSection 
                        title="Holding, Subsidiary and Associate Companies" 
                        style={formSectionStyle}
                    >
                        <HoldingCompaniesTableControlled
                            control={control}
                            onAdd={addHoldingCompany}
                            onRemove={removeHoldingCompany}
                        />
                    </FormSection>

                    {/* CSR Details */}
                    <FormSection 
                        title="CSR Details" 
                        style={formSectionStyle}
                    >
                        <div className="form-group">
                            <FormFieldControlled
                                name="sectionAData.sa_csr_applicable"
                                control={control}
                                label="Whether CSR is applicable as per section 135 of Companies Act, 2013"
                                type="checkbox"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <FormFieldControlled
                                    name="sectionAData.sa_csr_turnover"
                                    control={control}
                                    label="Turnover (in ₹)"
                                    placeholder="e.g., 500000000"
                                />
                            </div>
                            <div className="form-group">
                                <FormFieldControlled
                                    name="sectionAData.sa_csr_net_worth"
                                    control={control}
                                    label="Net worth (in ₹)"
                                    placeholder="e.g., 250000000"
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Transparency and Disclosures Complaints */}
                    <FormSection 
                        title="Transparency and Disclosures Complaints" 
                        style={formSectionStyle}
                    >
                        <div className="form-row">
                            <div className="form-group">
                                <FormFieldControlled
                                    name="sectionAData.sa_transparency_complaints.received"
                                    control={control}
                                    label="Complaints received"
                                    type="number"
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <FormFieldControlled
                                    name="sectionAData.sa_transparency_complaints.pending"
                                    control={control}
                                    label="Complaints pending"
                                    type="number"
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <FormFieldControlled
                                name="sectionAData.sa_transparency_complaints.remarks"
                                control={control}
                                label="Remarks"
                                as="textarea"
                                rows={3}
                                placeholder="Any additional remarks about transparency and disclosure complaints"
                            />
                        </div>
                    </FormSection>

                    {/* Submit Button */}
                    <div style={{ marginTop: 32, textAlign: 'center' }}>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            style={{
                                background: '#007bff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                padding: '12px 24px',
                                fontWeight: 600,
                                fontSize: '1em',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.7 : 1,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Section A'}
                        </Button>
                    </div>
                </form>
            </div>
        </FormProvider>
    );
}

// Simple table component for holding companies
const HoldingCompaniesTableControlled = ({ control, onAdd, onRemove }) => {
    const { watch } = useFormContext();
    const companies = watch('sectionAData.sa_holding_subsidiary_associate_companies') || [];

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button 
                    type="button"
                    onClick={onAdd}
                    style={{
                        background: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '8px 16px',
                        cursor: 'pointer'
                    }}
                >
                    Add Company
                </Button>
            </div>
            
            {companies.map((_, index) => (
                <div key={index} style={{ border: '1px solid #ddd', borderRadius: 4, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ margin: 0 }}>Company {index + 1}</h4>
                        <Button
                            type="button"
                            onClick={() => onRemove(index)}
                            style={{
                                background: '#dc3545',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '0.875em'
                            }}
                        >
                            Remove
                        </Button>
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <FormFieldControlled
                                name={`sectionAData.sa_holding_subsidiary_associate_companies.${index}.name`}
                                control={control}
                                label="Name of the company"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <FormFieldControlled
                                name={`sectionAData.sa_holding_subsidiary_associate_companies.${index}.cin_or_country`}
                                control={control}
                                label="CIN/GLN or Country of Incorporation"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <FormFieldControlled
                                name={`sectionAData.sa_holding_subsidiary_associate_companies.${index}.type`}
                                control={control}
                                label="Holding/Subsidiary/Associate"
                                as="select"
                                options={[
                                    { value: 'Holding', label: 'Holding' },
                                    { value: 'Subsidiary', label: 'Subsidiary' },
                                    { value: 'Associate', label: 'Associate' }
                                ]}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <FormFieldControlled
                                name={`sectionAData.sa_holding_subsidiary_associate_companies.${index}.percentage_holding`}
                                control={control}
                                label="% of shareholding"
                                placeholder="e.g., 75%"
                                required
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SectionAForm;

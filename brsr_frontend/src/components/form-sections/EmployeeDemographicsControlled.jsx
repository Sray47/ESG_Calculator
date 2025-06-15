import React from 'react';
import { FormFieldControlled, FormSection } from '../shared';

const EmployeeDemographicsControlled = ({ control, calculatePercentage, watch }) => {
    // Watch employee and worker data for percentage calculations
    const employeeData = watch('sectionAData.sa_employee_details') || {};
    const workerData = watch('sectionAData.sa_workers_details') || {};
    const disabledData = watch('sectionAData.sa_differently_abled_details') || {};
    const womenRepData = watch('sectionAData.sa_women_representation_details') || {};

    // Calculate totals for percentages
    const totalEmployees = (employeeData.permanent_male || 0) + (employeeData.permanent_female || 0) + 
                          (employeeData.other_than_permanent_male || 0) + (employeeData.other_than_permanent_female || 0);
    const totalWorkers = (workerData.permanent_male || 0) + (workerData.permanent_female || 0) + 
                        (workerData.other_than_permanent_male || 0) + (workerData.other_than_permanent_female || 0);

    const employeeFemalePercentage = calculatePercentage(
        (employeeData.permanent_female || 0) + (employeeData.other_than_permanent_female || 0),
        totalEmployees
    );

    const workerFemalePercentage = calculatePercentage(
        (workerData.permanent_female || 0) + (workerData.other_than_permanent_female || 0),
        totalWorkers
    );

    const boardWomenPercentage = calculatePercentage(
        womenRepData.board_number_of_women || 0,
        womenRepData.board_total_members || 0
    );

    const kmpWomenPercentage = calculatePercentage(
        womenRepData.kmp_number_of_women || 0,
        womenRepData.kmp_total_personnel || 0
    );

    return (
        <div>
            {/* Employee Details */}
            <div style={{ marginBottom: 24 }}>
                <h4>Employee Details</h4>
                <div className="form-row">
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_employee_details.permanent_male"
                            control={control}
                            label="Permanent - Male"
                            type="number"
                            min="0"
                        />
                    </div>
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_employee_details.permanent_female"
                            control={control}
                            label="Permanent - Female"
                            type="number"
                            min="0"
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_employee_details.other_than_permanent_male"
                            control={control}
                            label="Other than Permanent - Male"
                            type="number"
                            min="0"
                        />
                    </div>
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_employee_details.other_than_permanent_female"
                            control={control}
                            label="Other than Permanent - Female"
                            type="number"
                            min="0"
                        />
                    </div>
                </div>
                <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 4, marginTop: 8 }}>
                    <strong>Total Employees: {totalEmployees}</strong> | 
                    <strong> Female Percentage: {employeeFemalePercentage}</strong>
                </div>
            </div>

            {/* Worker Details */}
            <div style={{ marginBottom: 24 }}>
                <h4>Worker Details</h4>
                <div className="form-row">
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_workers_details.permanent_male"
                            control={control}
                            label="Permanent - Male"
                            type="number"
                            min="0"
                        />
                    </div>
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_workers_details.permanent_female"
                            control={control}
                            label="Permanent - Female"
                            type="number"
                            min="0"
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_workers_details.other_than_permanent_male"
                            control={control}
                            label="Other than Permanent - Male"
                            type="number"
                            min="0"
                        />
                    </div>
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_workers_details.other_than_permanent_female"
                            control={control}
                            label="Other than Permanent - Female"
                            type="number"
                            min="0"
                        />
                    </div>
                </div>
                <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 4, marginTop: 8 }}>
                    <strong>Total Workers: {totalWorkers}</strong> | 
                    <strong> Female Percentage: {workerFemalePercentage}</strong>
                </div>
            </div>

            {/* Differently Abled Details */}
            <div style={{ marginBottom: 24 }}>
                <h4>Differently Abled Employees and Workers</h4>
                <div className="form-row">
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_differently_abled_details.employees_male"
                            control={control}
                            label="Employees - Male"
                            type="number"
                            min="0"
                        />
                    </div>
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_differently_abled_details.employees_female"
                            control={control}
                            label="Employees - Female"
                            type="number"
                            min="0"
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_differently_abled_details.workers_male"
                            control={control}
                            label="Workers - Male"
                            type="number"
                            min="0"
                        />
                    </div>
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_differently_abled_details.workers_female"
                            control={control}
                            label="Workers - Female"
                            type="number"
                            min="0"
                        />
                    </div>
                </div>
            </div>

            {/* Women Representation */}
            <div style={{ marginBottom: 24 }}>
                <h4>Participation/Inclusion/Representation of Women</h4>
                <div className="form-row">
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_women_representation_details.board_total_members"
                            control={control}
                            label="Total Board Members"
                            type="number"
                            min="0"
                        />
                    </div>
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_women_representation_details.board_number_of_women"
                            control={control}
                            label="No. of Women on Board"
                            type="number"
                            min="0"
                        />
                    </div>
                </div>
                <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 4, marginBottom: 12 }}>
                    <strong>Women on Board: {boardWomenPercentage}</strong>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_women_representation_details.kmp_total_personnel"
                            control={control}
                            label="Total KMP Personnel"
                            type="number"
                            min="0"
                        />
                    </div>
                    <div className="form-group">
                        <FormFieldControlled
                            name="sectionAData.sa_women_representation_details.kmp_number_of_women"
                            control={control}
                            label="No. of Women in KMP"
                            type="number"
                            min="0"
                        />
                    </div>
                </div>
                <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 4, marginTop: 8 }}>
                    <strong>Women in KMP: {kmpWomenPercentage}</strong>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDemographicsControlled;

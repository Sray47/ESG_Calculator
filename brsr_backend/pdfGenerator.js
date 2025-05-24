// pdfGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Calculate all derived values from raw report data
 * This function implements all the mathematical formulas for automatic calculations
 * @param {Object} reportData - Raw report data from database
 * @returns {Object} - Object containing all calculated values
 */
function calculateDerivedValues(reportData) {
    const calculatedData = {};
    
    // Helper function to safely convert to number
    const toNumber = (val) => {
        if (val === null || val === undefined) return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : num;
    };

    // Helper function to format percentage
    const formatPercentage = (numerator, denominator) => {
        if (!denominator) return '0%';
        return ((numerator / denominator) * 100).toFixed(2) + '%';
    };

    // --------------------------------------------------
    // SECTION A CALCULATIONS
    // --------------------------------------------------
    calculatedData.sectionA = {};

    // Employee and Worker Totals (Q18)
    if (reportData.sa_employee_details) {
        const employees = reportData.sa_employee_details;
        const permanentMale = toNumber(employees.permanent_male);
        const permanentFemale = toNumber(employees.permanent_female);
        const otherMale = toNumber(employees.other_than_permanent_male);
        const otherFemale = toNumber(employees.other_than_permanent_female);
        
        calculatedData.sectionA.employees = {
            permanent_total: permanentMale + permanentFemale,
            other_than_permanent_total: otherMale + otherFemale,
            total_male: permanentMale + otherMale,
            total_female: permanentFemale + otherFemale,
            grand_total: permanentMale + permanentFemale + otherMale + otherFemale
        };
    }

    if (reportData.sa_workers_details) {
        const workers = reportData.sa_workers_details;
        const permanentMale = toNumber(workers.permanent_male);
        const permanentFemale = toNumber(workers.permanent_female);
        const otherMale = toNumber(workers.other_than_permanent_male);
        const otherFemale = toNumber(workers.other_than_permanent_female);
        
        calculatedData.sectionA.workers = {
            permanent_total: permanentMale + permanentFemale,
            other_than_permanent_total: otherMale + otherFemale,
            total_male: permanentMale + otherMale,
            total_female: permanentFemale + otherFemale,
            grand_total: permanentMale + permanentFemale + otherMale + otherFemale
        };
    }

    if (reportData.sa_differently_abled_details) {
        const diffAbled = reportData.sa_differently_abled_details;
        calculatedData.sectionA.differently_abled = {
            employees_total: (diffAbled.employees_male || 0) + (diffAbled.employees_female || 0),
            workers_total: (diffAbled.workers_male || 0) + (diffAbled.workers_female || 0),
            total_male: (diffAbled.employees_male || 0) + (diffAbled.workers_male || 0),
            total_female: (diffAbled.employees_female || 0) + (diffAbled.workers_female || 0),
            grand_total: (diffAbled.employees_male || 0) + (diffAbled.employees_female || 0) + 
                         (diffAbled.workers_male || 0) + (diffAbled.workers_female || 0)
        };
    }

    // Women Representation Percentages (Q19)
    if (reportData.sa_women_representation_details) {
        const women = reportData.sa_women_representation_details;
        calculatedData.sectionA.women_representation = {
            board_percentage: women.board_total_members > 0 
                ? ((women.board_number_of_women || 0) / women.board_total_members * 100).toFixed(2) + '%'
                : '0%',
            kmp_percentage: women.kmp_total_personnel > 0
                ? ((women.kmp_number_of_women || 0) / women.kmp_total_personnel * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    // Total Locations (Q16)
    if (reportData.sa_locations_plants_offices) {
        const locations = reportData.sa_locations_plants_offices;
        calculatedData.sectionA.locations = {
            total_plants: (locations.national_plants || 0) + (locations.international_plants || 0),
            total_offices: (locations.national_offices || 0) + (locations.international_offices || 0),
            national_total: (locations.national_plants || 0) + (locations.national_offices || 0),
            international_total: (locations.international_plants || 0) + (locations.international_offices || 0),
            grand_total: (locations.national_plants || 0) + (locations.national_offices || 0) +
                        (locations.international_plants || 0) + (locations.international_offices || 0)
        };
    }

    // --------------------------------------------------
    // SECTION B CALCULATIONS
    // --------------------------------------------------
    calculatedData.sectionB = {};
    // Note: Section B is mostly text-based disclosures, calculations may be limited    // --------------------------------------------------
    // SECTION C PRINCIPLE 1-9 CALCULATIONS
    // --------------------------------------------------
    calculatedData.sectionC = {};
    
    // Principle 3: Employee Wellbeing
    if (reportData.sc_p3_essential_indicators && reportData.sc_p3_essential_indicators.employee_grievances) {
        const grievances = reportData.sc_p3_essential_indicators.employee_grievances;
        calculatedData.sectionC.p3 = {
            ...calculatedData.sectionC.p3 || {},
            grievances_resolution_percentage: grievances.filed > 0 
                ? formatPercentage(toNumber(grievances.resolved), toNumber(grievances.filed))
                : '0%'
        };
    }
      // Principle 6: Environmental
    if (reportData.sc_p6_essential_indicators) {
        calculatedData.sectionC.p6 = calculatedData.sectionC.p6 || {};
        
        // Water Withdrawal Calculations
        if (reportData.sc_p6_essential_indicators.water_withdrawal) {
            const water = reportData.sc_p6_essential_indicators.water_withdrawal;
            const surfaceWater = toNumber(water.surface_water);
            const groundwater = toNumber(water.groundwater);
            const thirdPartyWater = toNumber(water.third_party_water);
            const seawaterDesalinated = toNumber(water.seawater_desalinated);
            const others = toNumber(water.others);
            
            calculatedData.sectionC.p6.water_withdrawal = {
                surface_water: surfaceWater,
                groundwater: groundwater,
                third_party_water: thirdPartyWater,
                seawater_desalinated: seawaterDesalinated,
                others: others,
                total_volume: surfaceWater + groundwater + thirdPartyWater + seawaterDesalinated + others
            };
            
            // If there are previous year values, calculate percentage change
            if (water.previous_year) {
                const prevSurfaceWater = toNumber(water.previous_year.surface_water);
                const prevGroundwater = toNumber(water.previous_year.groundwater);
                const prevThirdPartyWater = toNumber(water.previous_year.third_party_water);
                const prevSeawaterDesalinated = toNumber(water.previous_year.seawater_desalinated);
                const prevOthers = toNumber(water.previous_year.others);
                const prevTotal = prevSurfaceWater + prevGroundwater + prevThirdPartyWater + prevSeawaterDesalinated + prevOthers;
                
                const currentTotal = calculatedData.sectionC.p6.water_withdrawal.total_volume;
                
                calculatedData.sectionC.p6.water_withdrawal.previous_year = {
                    total_volume: prevTotal,
                    percentage_change: prevTotal > 0 
                        ? (((currentTotal - prevTotal) / prevTotal) * 100).toFixed(2) + '%'
                        : 'N/A'
                };
            }
        }
        
        // Energy Consumption Calculations
        if (reportData.sc_p6_essential_indicators.energy_consumption) {
            const energy = reportData.sc_p6_essential_indicators.energy_consumption;
            const electricity = toNumber(energy.electricity);
            const fuel = toNumber(energy.fuel);
            const otherSources = toNumber(energy.other_sources);
            
            calculatedData.sectionC.p6.energy_consumption = {
                electricity: electricity,
                fuel: fuel,
                other_sources: otherSources,
                total_energy_consumption: electricity + fuel + otherSources
            };
            
            // If there are previous year values, calculate percentage change
            if (energy.previous_year) {
                const prevElectricity = toNumber(energy.previous_year.electricity);
                const prevFuel = toNumber(energy.previous_year.fuel);
                const prevOtherSources = toNumber(energy.previous_year.other_sources);
                const prevTotal = prevElectricity + prevFuel + prevOtherSources;
                
                const currentTotal = calculatedData.sectionC.p6.energy_consumption.total_energy_consumption;
                
                calculatedData.sectionC.p6.energy_consumption.previous_year = {
                    total_energy_consumption: prevTotal,
                    percentage_change: prevTotal > 0 
                        ? (((currentTotal - prevTotal) / prevTotal) * 100).toFixed(2) + '%'
                        : 'N/A'
                };
            }
        }
        
        // Waste Management Calculations
        if (reportData.sc_p6_essential_indicators.waste_management) {
            const waste = reportData.sc_p6_essential_indicators.waste_management;
            
            // Process hazardous waste
            if (waste.hazardous_waste) {
                const recycled = toNumber(waste.hazardous_waste.recycled);
                const landfilled = toNumber(waste.hazardous_waste.landfilled);
                const incinerated = toNumber(waste.hazardous_waste.incinerated);
                const other_disposal = toNumber(waste.hazardous_waste.other_disposal);
                
                calculatedData.sectionC.p6.waste_management = {
                    ...calculatedData.sectionC.p6.waste_management || {},
                    hazardous_waste: {
                        recycled: recycled,
                        landfilled: landfilled,
                        incinerated: incinerated,
                        other_disposal: other_disposal,
                        total: recycled + landfilled + incinerated + other_disposal
                    }
                };
            }
            
            // Process non-hazardous waste
            if (waste.non_hazardous_waste) {
                const recycled = toNumber(waste.non_hazardous_waste.recycled);
                const landfilled = toNumber(waste.non_hazardous_waste.landfilled);
                const incinerated = toNumber(waste.non_hazardous_waste.incinerated);
                const other_disposal = toNumber(waste.non_hazardous_waste.other_disposal);
                
                calculatedData.sectionC.p6.waste_management = {
                    ...calculatedData.sectionC.p6.waste_management || {},
                    non_hazardous_waste: {
                        recycled: recycled,
                        landfilled: landfilled,
                        incinerated: incinerated,
                        other_disposal: other_disposal,
                        total: recycled + landfilled + incinerated + other_disposal
                    }
                };
            }        }
    }

    // Principle 6: Environment
    if (reportData.sc_p6_essential_indicators) {
        const env = reportData.sc_p6_essential_indicators;
        
        // Water consumption calculations
        if (env.water_withdrawal) {
            const water = env.water_withdrawal;
            calculatedData.sectionC.p6 = {
                ...calculatedData.sectionC.p6,
                water_consumption: {
                    surface_water: water.surface_water || 0,
                    groundwater: water.groundwater || 0,
                    third_party_water: water.third_party_water || 0,
                    seawater_desalinated: water.seawater_desalinated || 0,
                    others: water.others || 0,
                    total_volume: (water.surface_water || 0) + 
                                 (water.groundwater || 0) + 
                                 (water.third_party_water || 0) + 
                                 (water.seawater_desalinated || 0) + 
                                 (water.others || 0)
                }
            };
        }
        
        // Energy consumption calculations
        if (env.energy_consumption) {
            const energy = env.energy_consumption;
            calculatedData.sectionC.p6 = {
                ...calculatedData.sectionC.p6,
                energy_consumption: {
                    electricity: energy.electricity || 0,
                    fuel: energy.fuel || 0,
                    other_sources: energy.other_sources || 0,
                    total_energy: (energy.electricity || 0) + 
                                 (energy.fuel || 0) + 
                                 (energy.other_sources || 0)
                }
            };
        }
        
        // Waste management calculations
        if (env.waste_generated) {
            const waste = env.waste_generated;
            calculatedData.sectionC.p6 = {
                ...calculatedData.sectionC.p6,
                waste_management: {
                    plastic_waste: waste.plastic_waste || 0,
                    e_waste: waste.e_waste || 0,
                    bio_medical_waste: waste.bio_medical_waste || 0,
                    construction_waste: waste.construction_waste || 0,
                    battery_waste: waste.battery_waste || 0,
                    radioactive_waste: waste.radioactive_waste || 0,
                    other_hazardous_waste: waste.other_hazardous_waste || 0,
                    other_non_hazardous_waste: waste.other_non_hazardous_waste || 0,
                    total_waste: (waste.plastic_waste || 0) + 
                                (waste.e_waste || 0) + 
                                (waste.bio_medical_waste || 0) +
                                (waste.construction_waste || 0) +
                                (waste.battery_waste || 0) +
                                (waste.radioactive_waste || 0) +
                                (waste.other_hazardous_waste || 0) +
                                (waste.other_non_hazardous_waste || 0)
                }
            };
        }
    }

    // Principle 8: Inclusive Growth - CSR Spending
    if (reportData.sc_p8_essential_indicators && reportData.sc_p8_essential_indicators.csr_spending) {
        const csr = reportData.sc_p8_essential_indicators.csr_spending;
        calculatedData.sectionC.p8 = {
            csr_spending_percentage: csr.net_profit > 0 
                ? ((csr.total_spent || 0) / csr.net_profit * 100).toFixed(2) + '%'
                : '0%',
            csr_spending_gap: csr.obligation > (csr.total_spent || 0) 
                ? csr.obligation - (csr.total_spent || 0)
                : 0
        };
    }

    // Principle 9: Customer Value - Complaints
    if (reportData.sc_p9_essential_indicators && reportData.sc_p9_essential_indicators.consumer_complaints) {
        const complaints = reportData.sc_p9_essential_indicators.consumer_complaints;
        calculatedData.sectionC.p9 = {
            complaints_resolved_percentage: complaints.received > 0 
                ? ((complaints.resolved || 0) / complaints.received * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    return calculatedData;
}

/**
 * Generate a properly formatted PDF report with all data
 * @param {string} outputPath - Path where the PDF will be saved
 * @param {Object} reportData - Raw report data from database
 * @param {Object} companyData - Company details
 * @param {Object} calculatedData - Pre-calculated derived values
 */
async function generateBRSRPdf(outputPath, reportData, companyData, calculatedData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                autoFirstPage: true,
                size: 'A4',
                margin: 50,
                info: {
                    Title: `BRSR Report - ${companyData.company_name}`,
                    Author: 'ESG Calculator',
                    Subject: 'Business Responsibility and Sustainability Report',
                    Keywords: 'BRSR, ESG, Sustainability'
                }
            });

            // Create write stream
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // Cover page
            doc.fontSize(24).font('Helvetica-Bold').text('Business Responsibility and', {align: 'center'});
            doc.text('Sustainability Report', {align: 'center'});
            doc.moveDown(2);
            
            doc.fontSize(18).text(companyData.company_name, {align: 'center'});
            doc.moveDown(0.5);
            doc.fontSize(16).text(`Financial Year: ${reportData.financial_year}`, {align: 'center'});
            doc.moveDown(1);
            doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`, {align: 'center'});
            doc.moveDown(8);
            
            // Disclaimer
            doc.fontSize(10).font('Helvetica-Oblique').text(
                'This report has been generated by the ESG Calculator application based on the data provided by the company.', 
                {align: 'center'}
            );
            
            // Add a new page for the report content
            doc.addPage();
            
            // SECTION A: COMPANY DETAILS
            doc.fontSize(16).font('Helvetica-Bold').text('SECTION A: COMPANY DETAILS', {underline: true});
            doc.moveDown(1);
            
            // Company Information Table
            doc.fontSize(12).font('Helvetica-Bold').text('1. Corporate Identity Number (CIN):');
            doc.fontSize(12).font('Helvetica').text(companyData.cin || 'Not provided');
            doc.moveDown(0.5);
            
            doc.fontSize(12).font('Helvetica-Bold').text('2. Name of the Company:');
            doc.fontSize(12).font('Helvetica').text(companyData.company_name || 'Not provided');
            doc.moveDown(0.5);
            
            doc.fontSize(12).font('Helvetica-Bold').text('3. Year of Incorporation:');
            doc.fontSize(12).font('Helvetica').text(companyData.year_of_incorporation?.toString() || 'Not provided');
            doc.moveDown(0.5);
            
            doc.fontSize(12).font('Helvetica-Bold').text('4. Registered Office Address:');
            doc.fontSize(12).font('Helvetica').text(companyData.registered_office_address || 'Not provided');
            doc.moveDown(0.5);
            
            doc.fontSize(12).font('Helvetica-Bold').text('5. Corporate Address:');
            doc.fontSize(12).font('Helvetica').text(companyData.corporate_address || 'Not provided');
            doc.moveDown(0.5);
            
            doc.fontSize(12).font('Helvetica-Bold').text('6. Email:');
            doc.fontSize(12).font('Helvetica').text(companyData.email || 'Not provided');
            doc.moveDown(0.5);
            
            doc.fontSize(12).font('Helvetica-Bold').text('7. Telephone:');
            doc.fontSize(12).font('Helvetica').text(companyData.telephone || 'Not provided');
            doc.moveDown(0.5);
            
            doc.fontSize(12).font('Helvetica-Bold').text('8. Website:');
            doc.fontSize(12).font('Helvetica').text(companyData.website || 'Not provided');
            doc.moveDown(0.5);
            
            doc.fontSize(12).font('Helvetica-Bold').text('9. Financial year for which reporting is being done:');
            doc.fontSize(12).font('Helvetica').text(reportData.financial_year || 'Not provided');
            doc.moveDown(0.5);
            
            doc.fontSize(12).font('Helvetica-Bold').text('10. Paid-up Capital:');
            doc.fontSize(12).font('Helvetica').text(companyData.paid_up_capital || 'Not provided');
            doc.moveDown(0.5);
            
            doc.fontSize(12).font('Helvetica-Bold').text('11. Name of the Stock Exchange(s) where shares are listed:');
            doc.fontSize(12).font('Helvetica').text(
                Array.isArray(companyData.stock_exchange_listed) 
                ? companyData.stock_exchange_listed.join(', ') 
                : companyData.stock_exchange_listed || 'Not provided'
            );
            doc.moveDown(0.5);
            
            doc.fontSize(12).font('Helvetica-Bold').text('12. BRSR Contact Person:');
            doc.fontSize(12).font('Helvetica').text(`Name: ${companyData.brsr_contact_name || 'Not provided'}`);
            doc.text(`Email: ${companyData.brsr_contact_mail || 'Not provided'}`);
            doc.text(`Telephone: ${companyData.brsr_contact_number || 'Not provided'}`);
            doc.moveDown(1);
            
            doc.fontSize(12).font('Helvetica-Bold').text('13. Reporting Boundary:');
            doc.fontSize(12).font('Helvetica').text(reportData.reporting_boundary || 'Not provided');
            doc.moveDown(2);
            
            // Section A - Business Activities
            doc.fontSize(14).font('Helvetica-Bold').text('14. Business Activities');
            doc.moveDown(0.5);
            
            // Create a table for business activities
            if (reportData.sa_business_activities_turnover && reportData.sa_business_activities_turnover.length > 0) {
                const activities = reportData.sa_business_activities_turnover;
                
                // Table headers
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Main Activity', 50, doc.y, {width: 140});
                doc.text('Business Description', 190, doc.y, {width: 240});
                doc.text('% of Turnover', 430, doc.y, {width: 100, align: 'right'});
                doc.moveDown(0.5);
                
                // Table rows
                doc.fontSize(10).font('Helvetica');
                activities.forEach(activity => {
                    const yPos = doc.y;
                    doc.text(activity.description_main || '', 50, yPos, {width: 140});
                    doc.text(activity.description_business || '', 190, yPos, {width: 240});
                    doc.text(activity.turnover_percentage || '0', 430, yPos, {width: 100, align: 'right'});
                    doc.moveDown(1);
                });
            } else {
                doc.fontSize(10).font('Helvetica-Oblique').text('No business activities data provided.');
            }
            doc.moveDown(1);
            
            // Section A - Products/Services
            doc.fontSize(14).font('Helvetica-Bold').text('15. Products/Services');
            doc.moveDown(0.5);
            
            // Create a table for products/services
            if (reportData.sa_product_services_turnover && reportData.sa_product_services_turnover.length > 0) {
                const products = reportData.sa_product_services_turnover;
                
                // Table headers
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Product/Service', 50, doc.y, {width: 200});
                doc.text('NIC Code', 250, doc.y, {width: 100});
                doc.text('% of Turnover', 350, doc.y, {width: 100, align: 'right'});
                doc.moveDown(0.5);
                
                // Table rows
                doc.fontSize(10).font('Helvetica');
                products.forEach(product => {
                    const yPos = doc.y;
                    doc.text(product.product_service || '', 50, yPos, {width: 200});
                    doc.text(product.nic_code || '', 250, yPos, {width: 100});
                    doc.text(product.turnover_contributed || '0', 350, yPos, {width: 100, align: 'right'});
                    doc.moveDown(1);
                });
            } else {
                doc.fontSize(10).font('Helvetica-Oblique').text('No products/services data provided.');
            }
            doc.moveDown(1);
            
            // Section A - Locations (Q16)
            doc.fontSize(14).font('Helvetica-Bold').text('16. Operations Locations');
            doc.moveDown(0.5);
            
            if (reportData.sa_locations_plants_offices) {
                const locations = reportData.sa_locations_plants_offices;
                const calculated = calculatedData.sectionA.locations;
                
                // Table headers
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Location Type', 50, doc.y, {width: 120});
                doc.text('National', 170, doc.y, {width: 80, align: 'center'});
                doc.text('International', 250, doc.y, {width: 80, align: 'center'});
                doc.text('Total', 330, doc.y, {width: 80, align: 'center'});
                doc.moveDown(0.5);
                
                // Table rows
                doc.fontSize(10).font('Helvetica');
                
                // Plants row
                let yPos = doc.y;
                doc.text('Plants', 50, yPos, {width: 120});
                doc.text((locations.national_plants || 0).toString(), 170, yPos, {width: 80, align: 'center'});
                doc.text((locations.international_plants || 0).toString(), 250, yPos, {width: 80, align: 'center'});
                doc.text(calculated.total_plants.toString(), 330, yPos, {width: 80, align: 'center'});
                doc.moveDown(0.5);
                
                // Offices row
                yPos = doc.y;
                doc.text('Offices', 50, yPos, {width: 120});
                doc.text((locations.national_offices || 0).toString(), 170, yPos, {width: 80, align: 'center'});
                doc.text((locations.international_offices || 0).toString(), 250, yPos, {width: 80, align: 'center'});
                doc.text(calculated.total_offices.toString(), 330, yPos, {width: 80, align: 'center'});
                doc.moveDown(0.5);
                
                // Total row
                yPos = doc.y;
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Total', 50, yPos, {width: 120});
                doc.text(calculated.national_total.toString(), 170, yPos, {width: 80, align: 'center'});
                doc.text(calculated.international_total.toString(), 250, yPos, {width: 80, align: 'center'});
                doc.text(calculated.grand_total.toString(), 330, yPos, {width: 80, align: 'center'});
            } else {
                doc.fontSize(10).font('Helvetica-Oblique').text('No locations data provided.');
            }
            doc.moveDown(1);
            
            // Check if we need a new page
            if (doc.y > 700) {
                doc.addPage();
            }
            
            // Section A - Markets Served (Q17)
            doc.fontSize(14).font('Helvetica-Bold').text('17. Markets Served');
            doc.moveDown(0.5);
            
            if (reportData.sa_markets_served) {
                const markets = reportData.sa_markets_served;
                
                doc.fontSize(10).font('Helvetica-Bold').text('Number of states in India where business operations are conducted:');
                doc.fontSize(10).font('Helvetica').text(markets.locations?.national_states?.toString() || '0');
                doc.moveDown(0.5);
                
                doc.fontSize(10).font('Helvetica-Bold').text('Number of countries where business operations are conducted:');
                doc.fontSize(10).font('Helvetica').text(markets.locations?.international_countries?.toString() || '0');
                doc.moveDown(0.5);
                
                doc.fontSize(10).font('Helvetica-Bold').text('Exports as a percentage of total turnover:');
                doc.fontSize(10).font('Helvetica').text(`${markets.exports_percentage || '0'}%`);
                doc.moveDown(0.5);
                
                doc.fontSize(10).font('Helvetica-Bold').text('Types of customers:');
                doc.fontSize(10).font('Helvetica').text(markets.customer_types || 'Not provided');
            } else {
                doc.fontSize(10).font('Helvetica-Oblique').text('No markets served data provided.');
            }
            doc.moveDown(1);
            
            // Section A - Employee/Worker Details (Q18)
            if (doc.y > 650) {
                doc.addPage();
            }
            
            doc.fontSize(14).font('Helvetica-Bold').text('18. Employee & Worker Details');
            doc.moveDown(0.5);
            
            // Employee details table
            if (reportData.sa_employee_details) {
                const employees = reportData.sa_employee_details;
                const calculated = calculatedData.sectionA.employees;
                
                doc.fontSize(12).font('Helvetica-Bold').text('a. Employees');
                doc.moveDown(0.5);
                
                // Table headers
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Category', 50, doc.y, {width: 120});
                doc.text('Male', 170, doc.y, {width: 80, align: 'center'});
                doc.text('Female', 250, doc.y, {width: 80, align: 'center'});
                doc.text('Total', 330, doc.y, {width: 80, align: 'center'});
                doc.moveDown(0.5);
                
                // Permanent row
                let yPos = doc.y;
                doc.fontSize(10).font('Helvetica');
                doc.text('Permanent', 50, yPos, {width: 120});
                doc.text((employees.permanent_male || 0).toString(), 170, yPos, {width: 80, align: 'center'});
                doc.text((employees.permanent_female || 0).toString(), 250, yPos, {width: 80, align: 'center'});
                doc.text(calculated.permanent_total.toString(), 330, yPos, {width: 80, align: 'center'});
                doc.moveDown(0.5);
                
                // Other than permanent row
                yPos = doc.y;
                doc.text('Other than Permanent', 50, yPos, {width: 120});
                doc.text((employees.other_than_permanent_male || 0).toString(), 170, yPos, {width: 80, align: 'center'});
                doc.text((employees.other_than_permanent_female || 0).toString(), 250, yPos, {width: 80, align: 'center'});
                doc.text(calculated.other_than_permanent_total.toString(), 330, yPos, {width: 80, align: 'center'});
                doc.moveDown(0.5);
                
                // Total row
                yPos = doc.y;
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Total', 50, yPos, {width: 120});
                doc.text(calculated.total_male.toString(), 170, yPos, {width: 80, align: 'center'});
                doc.text(calculated.total_female.toString(), 250, yPos, {width: 80, align: 'center'});
                doc.text(calculated.grand_total.toString(), 330, yPos, {width: 80, align: 'center'});
                doc.moveDown(1);
            } else {
                doc.fontSize(10).font('Helvetica-Oblique').text('No employee details provided.');
                doc.moveDown(1);
            }
            
            // Worker details table
            if (reportData.sa_workers_details) {
                const workers = reportData.sa_workers_details;
                const calculated = calculatedData.sectionA.workers;
                
                doc.fontSize(12).font('Helvetica-Bold').text('b. Workers');
                doc.moveDown(0.5);
                
                // Table headers
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Category', 50, doc.y, {width: 120});
                doc.text('Male', 170, doc.y, {width: 80, align: 'center'});
                doc.text('Female', 250, doc.y, {width: 80, align: 'center'});
                doc.text('Total', 330, doc.y, {width: 80, align: 'center'});
                doc.moveDown(0.5);
                
                // Permanent row
                let yPos = doc.y;
                doc.fontSize(10).font('Helvetica');
                doc.text('Permanent', 50, yPos, {width: 120});
                doc.text((workers.permanent_male || 0).toString(), 170, yPos, {width: 80, align: 'center'});
                doc.text((workers.permanent_female || 0).toString(), 250, yPos, {width: 80, align: 'center'});
                doc.text(calculated.permanent_total.toString(), 330, yPos, {width: 80, align: 'center'});
                doc.moveDown(0.5);
                
                // Other than permanent row
                yPos = doc.y;
                doc.text('Other than Permanent', 50, yPos, {width: 120});
                doc.text((workers.other_than_permanent_male || 0).toString(), 170, yPos, {width: 80, align: 'center'});
                doc.text((workers.other_than_permanent_female || 0).toString(), 250, yPos, {width: 80, align: 'center'});
                doc.text(calculated.other_than_permanent_total.toString(), 330, yPos, {width: 80, align: 'center'});
                doc.moveDown(0.5);
                
                // Total row
                yPos = doc.y;
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Total', 50, yPos, {width: 120});
                doc.text(calculated.total_male.toString(), 170, yPos, {width: 80, align: 'center'});
                doc.text(calculated.total_female.toString(), 250, yPos, {width: 80, align: 'center'});
                doc.text(calculated.grand_total.toString(), 330, yPos, {width: 80, align: 'center'});
                doc.moveDown(1);
            } else {
                doc.fontSize(10).font('Helvetica-Oblique').text('No worker details provided.');
                doc.moveDown(1);
            }
            
            // Add more sections for Section B and Section C
            
            // Section C - Principle 6 - Environment
            if (calculatedData.sectionC && calculatedData.sectionC.p6) {
                // Check if we need a new page
                if (doc.y > 650) {
                    doc.addPage();
                }
                
                doc.fontSize(16).font('Helvetica-Bold').text('SECTION C: PRINCIPLE 6 - ENVIRONMENT', {underline: true});
                doc.moveDown(1);
                
                // Water consumption
                if (calculatedData.sectionC.p6.water_consumption) {
                    const water = calculatedData.sectionC.p6.water_consumption;
                    
                    doc.fontSize(12).font('Helvetica-Bold').text('Water Withdrawal & Consumption');
                    doc.moveDown(0.5);
                    
                    // Table headers
                    doc.fontSize(10).font('Helvetica-Bold');
                    doc.text('Water Source', 50, doc.y, {width: 200});
                    doc.text('Volume (kilolitres)', 250, doc.y, {width: 100, align: 'right'});
                    doc.moveDown(0.5);
                    
                    // Table rows
                    doc.fontSize(10).font('Helvetica');
                    
                    doc.text('(i) Surface water', 50, doc.y, {width: 200});
                    doc.text(water.surface_water.toString(), 250, doc.y, {width: 100, align: 'right'});
                    doc.moveDown(0.5);
                    
                    doc.text('(ii) Groundwater', 50, doc.y, {width: 200});
                    doc.text(water.groundwater.toString(), 250, doc.y, {width: 100, align: 'right'});
                    doc.moveDown(0.5);
                    
                    doc.text('(iii) Third party water', 50, doc.y, {width: 200});
                    doc.text(water.third_party_water.toString(), 250, doc.y, {width: 100, align: 'right'});
                    doc.moveDown(0.5);
                    
                    doc.text('(iv) Seawater / desalinated water', 50, doc.y, {width: 200});
                    doc.text(water.seawater_desalinated.toString(), 250, doc.y, {width: 100, align: 'right'});
                    doc.moveDown(0.5);
                    
                    doc.text('(v) Others', 50, doc.y, {width: 200});
                    doc.text(water.others.toString(), 250, doc.y, {width: 100, align: 'right'});
                    doc.moveDown(0.5);
                    
                    // Total row
                    doc.fontSize(10).font('Helvetica-Bold');
                    doc.text('Total volume of water withdrawal', 50, doc.y, {width: 200});
                    doc.text(water.total_volume.toString(), 250, doc.y, {width: 100, align: 'right'});
                    doc.moveDown(1);
                }
                
                // Energy consumption
                if (calculatedData.sectionC.p6.energy_consumption) {
                    const energy = calculatedData.sectionC.p6.energy_consumption;
                    
                    doc.fontSize(12).font('Helvetica-Bold').text('Energy Consumption');
                    doc.moveDown(0.5);
                    
                    // Table headers
                    doc.fontSize(10).font('Helvetica-Bold');
                    doc.text('Energy Source', 50, doc.y, {width: 200});
                    doc.text('Current Financial Year', 250, doc.y, {width: 100, align: 'right'});
                    doc.moveDown(0.5);
                    
                    // Table rows
                    doc.fontSize(10).font('Helvetica');
                    
                    doc.text('Total electricity consumption (A)', 50, doc.y, {width: 200});
                    doc.text(energy.electricity.toString(), 250, doc.y, {width: 100, align: 'right'});
                    doc.moveDown(0.5);
                    
                    doc.text('Total fuel consumption (B)', 50, doc.y, {width: 200});
                    doc.text(energy.fuel.toString(), 250, doc.y, {width: 100, align: 'right'});
                    doc.moveDown(0.5);
                    
                    doc.text('Energy consumption through other sources (C)', 50, doc.y, {width: 200});
                    doc.text(energy.other_sources.toString(), 250, doc.y, {width: 100, align: 'right'});
                    doc.moveDown(0.5);
                    
                    // Total row
                    doc.fontSize(10).font('Helvetica-Bold');
                    doc.text('Total energy consumption (A+B+C)', 50, doc.y, {width: 200});
                    doc.text(energy.total_energy.toString(), 250, doc.y, {width: 100, align: 'right'});
                    doc.moveDown(1);
                }
            }
            
            // Add more sections for the other principles...
            
            // Final page - Verification
            doc.addPage();
            doc.fontSize(16).font('Helvetica-Bold').text('VERIFICATION', {align: 'center', underline: true});
            doc.moveDown(2);
            
            doc.fontSize(12).font('Helvetica').text(
                `This report was generated from the data submitted by ${companyData.company_name} ` +
                `for the financial year ${reportData.financial_year}. The report was submitted on ` +
                `${new Date(reportData.submitted_at).toLocaleDateString()} by the company representative.`,
                {align: 'justify'}
            );
            doc.moveDown(2);
            
            doc.fontSize(12).font('Helvetica-Bold').text('Declaration:', {align: 'left'});
            doc.fontSize(12).font('Helvetica').text(
                'The information provided in this report has been reviewed and approved by the company. ' +
                'The company is responsible for the accuracy and completeness of the information disclosed in this report.',
                {align: 'justify'}
            );
            
            // Finalize PDF
            doc.end();
            
            // When the stream is fully written, resolve the promise
            stream.on('finish', () => {
                console.log(`PDF successfully generated at ${outputPath}`);
                resolve(outputPath);
            });
            
            // If there's an error, reject the promise
            stream.on('error', (err) => {
                console.error('Error generating PDF:', err);
                reject(err);
            });
            
        } catch (error) {
            console.error('Error in PDF generation:', error);
            reject(error);
        }
    });
}

module.exports = {
    calculateDerivedValues,
    generateBRSRPdf
};

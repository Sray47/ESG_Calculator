// testPdfCalculations.js
const { calculateDerivedValues } = require('./pdfGenerator');

// Sample report data for testing
const sampleReportData = {
    // Employee Section A data
    sa_employee_details: {
        permanent_male: 5000,
        permanent_female: 2000,
        other_than_permanent_male: 1000,
        other_than_permanent_female: 500
    },
    
    sa_workers_details: {
        permanent_male: 8000,
        permanent_female: 3000,
        other_than_permanent_male: 2000,
        other_than_permanent_female: 1000
    },
    
    sa_differently_abled_details: {
        employees_male: 50,
        employees_female: 20,
        workers_male: 30,
        workers_female: 15
    },
    
    sa_women_representation_details: {
        board_total_members: 10,
        board_number_of_women: 3,
        kmp_total_personnel: 20,
        kmp_number_of_women: 5
    },
    
    sa_locations_plants_offices: {
        national_plants: 5,
        national_offices: 10,
        international_plants: 2,
        international_offices: 3
    },
    
    // Section C - Principle 6 data
    sc_p6_essential_indicators: {
        water_withdrawal: {
            surface_water: 1000,
            groundwater: 2000,
            third_party_water: 500,
            seawater_desalinated: 0,
            others: 200
        },
        energy_consumption: {
            electricity: 5000,
            fuel: 3000,
            other_sources: 1000
        }
    }
};

// Run the test
console.log("Testing PDF calculations with sample data:");
const calculatedData = calculateDerivedValues(sampleReportData);
console.log(JSON.stringify(calculatedData, null, 2));

// Verify some specific calculations
console.log("\nVerifying specific calculations:");

// Employee totals
const empTotal = sampleReportData.sa_employee_details.permanent_male + 
               sampleReportData.sa_employee_details.permanent_female +
               sampleReportData.sa_employee_details.other_than_permanent_male +
               sampleReportData.sa_employee_details.other_than_permanent_female;
               
console.log(`Employee grand total: ${calculatedData.sectionA.employees.grand_total} (Expected: ${empTotal})`);

// Water withdrawal total
const waterTotal = sampleReportData.sc_p6_essential_indicators.water_withdrawal.surface_water +
                 sampleReportData.sc_p6_essential_indicators.water_withdrawal.groundwater +
                 sampleReportData.sc_p6_essential_indicators.water_withdrawal.third_party_water +
                 sampleReportData.sc_p6_essential_indicators.water_withdrawal.seawater_desalinated +
                 sampleReportData.sc_p6_essential_indicators.water_withdrawal.others;
                 
console.log(`Water withdrawal total: ${calculatedData.sectionC.p6.water_consumption.total_volume} (Expected: ${waterTotal})`);

// Energy consumption total
const energyTotal = sampleReportData.sc_p6_essential_indicators.energy_consumption.electricity +
                  sampleReportData.sc_p6_essential_indicators.energy_consumption.fuel +
                  sampleReportData.sc_p6_essential_indicators.energy_consumption.other_sources;
                  
console.log(`Energy consumption total: ${calculatedData.sectionC.p6.energy_consumption.total_energy} (Expected: ${energyTotal})`);

// Women representation percentages
const boardWomenPct = (sampleReportData.sa_women_representation_details.board_number_of_women / 
                      sampleReportData.sa_women_representation_details.board_total_members * 100).toFixed(2) + '%';
                      
console.log(`Board women percentage: ${calculatedData.sectionA.women_representation.board_percentage} (Expected: ${boardWomenPct})`);

console.log("\nTest completed!");

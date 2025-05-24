// enhancedPdfCalculationsTest.js
const { calculateDerivedValues } = require('./pdfGenerator');

// Sample report data for testing
const sampleReportData = {
    // Section A data
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
    
    // Section C - Principle 3 data
    sc_p3_essential_indicators: {
        employee_grievances: {
            filed: 100,
            resolved: 85
        }
    },
    
    // Section C - Principle 6 data
    sc_p6_essential_indicators: {
        water_withdrawal: {
            surface_water: 1000,
            groundwater: 2000,
            third_party_water: 500,
            seawater_desalinated: 0,
            others: 200,
            previous_year: {
                surface_water: 900,
                groundwater: 1800,
                third_party_water: 450,
                seawater_desalinated: 0,
                others: 180
            }
        },
        energy_consumption: {
            electricity: 5000,
            fuel: 3000,
            other_sources: 1000,
            previous_year: {
                electricity: 4600,
                fuel: 2700,
                other_sources: 900
            }
        },
        waste_management: {
            hazardous_waste: {
                recycled: 100,
                landfilled: 50,
                incinerated: 30,
                other_disposal: 20
            },
            non_hazardous_waste: {
                recycled: 500,
                landfilled: 300,
                incinerated: 100,
                other_disposal: 50
            }
        }
    }
};

/**
 * Run tests to verify calculations
 */
function runTests() {
    console.log("STARTING ENHANCED PDF CALCULATION TESTS");
    console.log("======================================");
    
    // Run calculations
    const calculatedData = calculateDerivedValues(sampleReportData);
    const errors = [];
    
    // Helper function to verify a single calculation
    function verify(description, actual, expected, formatFn = x => x) {
        const actualFormatted = formatFn(actual);
        const expectedFormatted = formatFn(expected);
        const result = actualFormatted === expectedFormatted ? "✓ PASS" : "✗ FAIL";
        
        console.log(`${result} | ${description}: ${actualFormatted} (Expected: ${expectedFormatted})`);
        
        if (result === "✗ FAIL") {
            errors.push({ description, actual: actualFormatted, expected: expectedFormatted });
        }
    }
    
    console.log("\n1. SECTION A - EMPLOYEE CALCULATIONS");
    console.log("-----------------------------------");
    
    // Employee totals
    if (calculatedData.sectionA && calculatedData.sectionA.employees) {
        const emp = calculatedData.sectionA.employees;
        verify("Permanent employees total", emp.permanent_total, 7000);
        verify("Other than permanent employees total", emp.other_than_permanent_total, 1500);
        verify("Total male employees", emp.total_male, 6000);
        verify("Total female employees", emp.total_female, 2500);
        verify("Grand total employees", emp.grand_total, 8500);
    } else {
        console.log("✗ FAIL | Section A employee calculations missing");
        errors.push({ description: "Section A employee calculations", actual: "Missing", expected: "Present" });
    }
    
    // Workers totals
    if (calculatedData.sectionA && calculatedData.sectionA.workers) {
        const workers = calculatedData.sectionA.workers;
        verify("Permanent workers total", workers.permanent_total, 11000);
        verify("Other than permanent workers total", workers.other_than_permanent_total, 3000);
        verify("Total male workers", workers.total_male, 10000);
        verify("Total female workers", workers.total_female, 4000);
        verify("Grand total workers", workers.grand_total, 14000);
    } else {
        console.log("✗ FAIL | Section A workers calculations missing");
        errors.push({ description: "Section A workers calculations", actual: "Missing", expected: "Present" });
    }
    
    // Differently abled
    if (calculatedData.sectionA && calculatedData.sectionA.differently_abled) {
        const diffAbled = calculatedData.sectionA.differently_abled;
        verify("Differently abled employees total", diffAbled.employees_total, 70);
        verify("Differently abled workers total", diffAbled.workers_total, 45);
        verify("Total male differently abled", diffAbled.total_male, 80);
        verify("Total female differently abled", diffAbled.total_female, 35);
        verify("Grand total differently abled", diffAbled.grand_total, 115);
    } else {
        console.log("✗ FAIL | Section A differently abled calculations missing");
        errors.push({ description: "Section A differently abled calculations", actual: "Missing", expected: "Present" });
    }
    
    // Women representation
    if (calculatedData.sectionA && calculatedData.sectionA.women_representation) {
        const women = calculatedData.sectionA.women_representation;
        verify("Board women percentage", women.board_percentage, "30.00%");
        verify("KMP women percentage", women.kmp_percentage, "25.00%");
    } else {
        console.log("✗ FAIL | Section A women representation calculations missing");
        errors.push({ description: "Section A women representation calculations", actual: "Missing", expected: "Present" });
    }
    
    // Locations
    if (calculatedData.sectionA && calculatedData.sectionA.locations) {
        const loc = calculatedData.sectionA.locations;
        verify("Total plants", loc.total_plants, 7);
        verify("Total offices", loc.total_offices, 13);
        verify("National total locations", loc.national_total, 15);
        verify("International total locations", loc.international_total, 5);
        verify("Grand total locations", loc.grand_total, 20);
    } else {
        console.log("✗ FAIL | Section A locations calculations missing");
        errors.push({ description: "Section A locations calculations", actual: "Missing", expected: "Present" });
    }
    
    console.log("\n2. SECTION C - PRINCIPLE 3 CALCULATIONS");
    console.log("-------------------------------------");
    
    // Employee grievances
    if (calculatedData.sectionC && calculatedData.sectionC.p3) {
        verify("Grievances resolution percentage", 
            calculatedData.sectionC.p3.grievances_resolution_percentage, 
            "85.00%");
    } else {
        console.log("✗ FAIL | Section C Principle 3 grievance calculations missing");
        errors.push({ description: "Section C P3 grievance calculations", actual: "Missing", expected: "Present" });
    }
    
    console.log("\n3. SECTION C - PRINCIPLE 6 CALCULATIONS");
    console.log("-------------------------------------");
    
    // Water withdrawal
    if (calculatedData.sectionC && calculatedData.sectionC.p6 && calculatedData.sectionC.p6.water_withdrawal) {
        const water = calculatedData.sectionC.p6.water_withdrawal;
        verify("Surface water", water.surface_water, 1000);
        verify("Groundwater", water.groundwater, 2000);
        verify("Third party water", water.third_party_water, 500);
        verify("Seawater desalinated", water.seawater_desalinated, 0);
        verify("Others water sources", water.others, 200);
        verify("Total water withdrawal", water.total_volume, 3700);
        
        // Previous year comparison
        if (water.previous_year) {
            verify("Previous year total water withdrawal", water.previous_year.total_volume, 3330);
            verify("Water withdrawal percentage change", water.previous_year.percentage_change, "11.11%");
        } else {
            console.log("✗ FAIL | Water withdrawal previous year calculations missing");
            errors.push({ description: "Water withdrawal previous year calculations", actual: "Missing", expected: "Present" });
        }
    } else {
        console.log("✗ FAIL | Water withdrawal calculations missing");
        errors.push({ description: "Water withdrawal calculations", actual: "Missing", expected: "Present" });
    }
    
    // Energy consumption
    if (calculatedData.sectionC && calculatedData.sectionC.p6 && calculatedData.sectionC.p6.energy_consumption) {
        const energy = calculatedData.sectionC.p6.energy_consumption;
        verify("Electricity consumption", energy.electricity, 5000);
        verify("Fuel consumption", energy.fuel, 3000);
        verify("Other energy sources", energy.other_sources, 1000);
        verify("Total energy consumption", energy.total_energy_consumption, 9000);
        
        // Previous year comparison
        if (energy.previous_year) {
            verify("Previous year total energy consumption", energy.previous_year.total_energy_consumption, 8200);
            verify("Energy consumption percentage change", energy.previous_year.percentage_change, "9.76%");
        } else {
            console.log("✗ FAIL | Energy consumption previous year calculations missing");
            errors.push({ description: "Energy previous year calculations", actual: "Missing", expected: "Present" });
        }
    } else {
        console.log("✗ FAIL | Energy consumption calculations missing");
        errors.push({ description: "Energy consumption calculations", actual: "Missing", expected: "Present" });
    }
    
    // Waste management
    if (calculatedData.sectionC && calculatedData.sectionC.p6 && calculatedData.sectionC.p6.waste_management) {
        const waste = calculatedData.sectionC.p6.waste_management;
        
        // Hazardous waste
        if (waste.hazardous_waste) {
            verify("Hazardous waste recycled", waste.hazardous_waste.recycled, 100);
            verify("Hazardous waste landfilled", waste.hazardous_waste.landfilled, 50);
            verify("Hazardous waste incinerated", waste.hazardous_waste.incinerated, 30);
            verify("Hazardous waste other disposal", waste.hazardous_waste.other_disposal, 20);
            verify("Total hazardous waste", waste.hazardous_waste.total, 200);
        } else {
            console.log("✗ FAIL | Hazardous waste calculations missing");
            errors.push({ description: "Hazardous waste calculations", actual: "Missing", expected: "Present" });
        }
        
        // Non-hazardous waste
        if (waste.non_hazardous_waste) {
            verify("Non-hazardous waste recycled", waste.non_hazardous_waste.recycled, 500);
            verify("Non-hazardous waste landfilled", waste.non_hazardous_waste.landfilled, 300);
            verify("Non-hazardous waste incinerated", waste.non_hazardous_waste.incinerated, 100);
            verify("Non-hazardous waste other disposal", waste.non_hazardous_waste.other_disposal, 50);
            verify("Total non-hazardous waste", waste.non_hazardous_waste.total, 950);
        } else {
            console.log("✗ FAIL | Non-hazardous waste calculations missing");
            errors.push({ description: "Non-hazardous waste calculations", actual: "Missing", expected: "Present" });
        }
    } else {
        console.log("✗ FAIL | Waste management calculations missing");
        errors.push({ description: "Waste management calculations", actual: "Missing", expected: "Present" });
    }
    
    // Summary of test results
    console.log("\nTEST SUMMARY");
    console.log("===========");
    if (errors.length === 0) {
        console.log("✓ All tests passed successfully!");
    } else {
        console.log(`✗ ${errors.length} test(s) failed:`);
        errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.description}: expected ${error.expected}, got ${error.actual}`);
        });
    }
    
    return errors.length === 0;
}

runTests();

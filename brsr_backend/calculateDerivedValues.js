// brsr_backend/calculateDerivedValues.js

const calculateDerivedValues = (reportData) => {
    // Helper to safely convert values to numbers, returning 0 if invalid
    const toNumber = (val) => {
        if (val === null || val === undefined || val === '') return 0;
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };

    // Helper to format percentages, handling division by zero
    const formatPercentage = (numerator, denominator, toFixed = 2) => {
        const num = toNumber(numerator);
        const den = toNumber(denominator);
        if (den === 0) return '0.00%';
        return ((num / den) * 100).toFixed(toFixed) + '%';
    };
    
    // Helper for year-over-year change
    const calculateYoYChange = (current, previous) => {
        const currentNum = toNumber(current);
        const previousNum = toNumber(previous);
        if (previousNum === 0) {
            return currentNum > 0 ? 'New' : 'N/A';
        }
        const change = ((currentNum - previousNum) / previousNum) * 100;
        return change.toFixed(2) + '%';
    };

    const calculatedData = {
        sectionA: {},
        sectionC: {
            p1: {}, p2: {}, p3: {}, p4: {}, p5: {},
            p6: {}, p7: {}, p8: {}, p9: {}
        }
    };

    // --- SECTION A CALCULATIONS ---
    const sa = reportData; // In the new structure, section A fields are top-level in the report object
    
    // Employee totals (Q18a)
    const empPermMale = toNumber(sa.sa_employee_details?.permanent_male);
    const empPermFemale = toNumber(sa.sa_employee_details?.permanent_female);
    const empOtherMale = toNumber(sa.sa_employee_details?.other_than_permanent_male);
    const empOtherFemale = toNumber(sa.sa_employee_details?.other_than_permanent_female);
    calculatedData.sectionA.employees = {
        permanent_total: empPermMale + empPermFemale,
        other_total: empOtherMale + empOtherFemale,
        total_male: empPermMale + empOtherMale,
        total_female: empPermFemale + empOtherFemale,
        grand_total: empPermMale + empPermFemale + empOtherMale + empOtherFemale,
    };
    
    // Worker totals (Q18a)
    const wrkPermMale = toNumber(sa.sa_workers_details?.permanent_male);
    const wrkPermFemale = toNumber(sa.sa_workers_details?.permanent_female);
    const wrkOtherMale = toNumber(sa.sa_workers_details?.other_than_permanent_male);
    const wrkOtherFemale = toNumber(sa.sa_workers_details?.other_than_permanent_female);
    calculatedData.sectionA.workers = {
        permanent_total: wrkPermMale + wrkPermFemale,
        other_total: wrkOtherMale + wrkOtherFemale,
        total_male: wrkPermMale + wrkOtherMale,
        total_female: wrkPermFemale + wrkOtherFemale,
        grand_total: wrkPermMale + wrkPermFemale + wrkOtherMale + wrkOtherFemale,
    };
    
    // Differently abled totals (Q18b)
    const diffAbledEmpMale = toNumber(sa.sa_differently_abled_details?.employees_male);
    const diffAbledEmpFemale = toNumber(sa.sa_differently_abled_details?.employees_female);
    const diffAbledWrkMale = toNumber(sa.sa_differently_abled_details?.workers_male);
    const diffAbledWrkFemale = toNumber(sa.sa_differently_abled_details?.workers_female);
    calculatedData.sectionA.differently_abled = {
        employees_total: diffAbledEmpMale + diffAbledEmpFemale,
        workers_total: diffAbledWrkMale + diffAbledWrkFemale,
        total_male: diffAbledEmpMale + diffAbledWrkMale,
        total_female: diffAbledEmpFemale + diffAbledWrkFemale,
        grand_total: diffAbledEmpMale + diffAbledEmpFemale + diffAbledWrkMale + diffAbledWrkFemale,
    };
    
    // Women representation percentages (Q19)
    calculatedData.sectionA.women_representation = {
        board_percentage: formatPercentage(sa.sa_women_representation_details?.board_number_of_women, sa.sa_women_representation_details?.board_total_members),
        kmp_percentage: formatPercentage(sa.sa_women_representation_details?.kmp_number_of_women, sa.sa_women_representation_details?.kmp_total_personnel),
    };
    
    // Locations total (Q16)
    const loc = sa.sa_locations_plants_offices || {};
    calculatedData.sectionA.locations = {
        total_plants: toNumber(loc.national_plants) + toNumber(loc.international_plants),
        total_offices: toNumber(loc.national_offices) + toNumber(loc.international_offices),
        national_total: toNumber(loc.national_plants) + toNumber(loc.national_offices),
        international_total: toNumber(loc.international_plants) + toNumber(loc.international_offices),
        grand_total: toNumber(loc.national_plants) + toNumber(loc.international_plants) + toNumber(loc.national_offices) + toNumber(loc.international_offices),
    };

    // --- SECTION C CALCULATIONS ---

    // Principle 3: Employee Wellbeing
    const p3_ei = reportData.sc_p3_employee_wellbeing?.essential_indicators || {};
    if (p3_ei.employee_grievances) {
        calculatedData.sectionC.p3 = {
            grievances_resolution_percentage: formatPercentage(p3_ei.employee_grievances.resolved, p3_ei.employee_grievances.filed),
        };
    }

    // Principle 6: Environment
    const p6_ei = reportData.sc_p6_environment_protection?.essential_indicators || {};
    if (p6_ei) {
        // Energy Calculations
        const p6_energy_curr = p6_ei.energy_consumption_intensity?.current_fy || {};
        const p6_energy_prev = p6_ei.energy_consumption_intensity?.previous_fy || {};
        const total_energy_curr = toNumber(p6_energy_curr.electricity_consumption_a) + toNumber(p6_energy_curr.fuel_consumption_b) + toNumber(p6_energy_curr.other_sources_consumption_c);
        const total_energy_prev = toNumber(p6_energy_prev.electricity_consumption_a) + toNumber(p6_energy_prev.fuel_consumption_b) + toNumber(p6_energy_prev.other_sources_consumption_c);

        // Water Calculations
        const p6_water_curr = p6_ei.water_disclosures?.current_fy || {};
        const p6_water_prev = p6_ei.water_disclosures?.previous_fy || {};
        const total_withdrawal_curr = toNumber(p6_water_curr.withdrawal_surface) + toNumber(p6_water_curr.withdrawal_groundwater) + toNumber(p6_water_curr.withdrawal_third_party) + toNumber(p6_water_curr.withdrawal_seawater_desalinated) + toNumber(p6_water_curr.withdrawal_others);
        const total_withdrawal_prev = toNumber(p6_water_prev.withdrawal_surface) + toNumber(p6_water_prev.withdrawal_groundwater) + toNumber(p6_water_prev.withdrawal_third_party) + toNumber(p6_water_prev.withdrawal_seawater_desalinated) + toNumber(p6_water_prev.withdrawal_others);
        
        // Waste Calculations
        const p6_waste_gen_curr = p6_ei.waste_management?.current_fy?.generated || {};
        const total_waste_gen_curr = Object.values(p6_waste_gen_curr).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
        const p6_waste_rec_curr = p6_ei.waste_management?.current_fy?.recovered || {};
        const total_waste_rec_curr = Object.values(p6_waste_rec_curr).reduce((sum, val) => sum + toNumber(val), 0);
        const p6_waste_disp_curr = p6_ei.waste_management?.current_fy?.disposed || {};
        const total_waste_disp_curr = Object.values(p6_waste_disp_curr).reduce((sum, val) => sum + toNumber(val), 0);

        calculatedData.sectionC.p6 = {
            energy: {
                total_current_fy: total_energy_curr,
                total_previous_fy: total_energy_prev,
                yoy_change: calculateYoYChange(total_energy_curr, total_energy_prev),
            },
            water: {
                total_withdrawal_current_fy: total_withdrawal_curr,
                total_withdrawal_previous_fy: total_withdrawal_prev,
                yoy_change: calculateYoYChange(total_withdrawal_curr, total_withdrawal_prev),
            },
            waste: {
                total_generated_current_fy: total_waste_gen_curr,
                total_recovered_current_fy: total_waste_rec_curr,
                total_disposed_current_fy: total_waste_disp_curr,
            }
        };
    }
    
    console.log("[calculateDerivedValues] Completed successfully.");
    return calculatedData;
};

module.exports = calculateDerivedValues;
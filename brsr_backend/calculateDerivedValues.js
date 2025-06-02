// calculateDerivedValues.js

const calculateDerivedValues = (reportData) => {
    const calculatedData = {
        sectionA: {
            employees: {},
            workers: {},
            differently_abled: {},
            women_representation: {},
        },
        sectionC: {
            principle6: {},
        }
    };

    const toNumber = (val) => {
        const num = Number(val);
        return isNaN(num) ? 0 : num;
    };

    // Helper function to format percentage
    const formatPercentage = (numerator, denominator, toFixed = 2) => {
        if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
            return 'N/A';
        }
        return ((toNumber(numerator) / toNumber(denominator)) * 100).toFixed(toFixed) + '%';
    };

    // SECTION A Calculations
    const saEmp = reportData.sa_employee_details?.employees || {};
    const saWrk = reportData.sa_workers_details?.workers || {};
    const saDiffAbledEmp = reportData.sa_differently_abled_details?.employees || {};
    const saDiffAbledWrk = reportData.sa_differently_abled_details?.workers || {};
    const saWomenRepBoard = reportData.sa_women_representation_details?.board_directors || {};
    const saWomenRepKMP = reportData.sa_women_representation_details?.kmps || {};
    const saGeneral = reportData.sa_general_details || {};

    // Employees Totals
    calculatedData.sectionA.employees.permanent_total = toNumber(saEmp.permanent_male_no) + toNumber(saEmp.permanent_female_no);
    calculatedData.sectionA.employees.other_total = toNumber(saEmp.other_male_no) + toNumber(saEmp.other_female_no);
    calculatedData.sectionA.employees.total_male = toNumber(saEmp.permanent_male_no) + toNumber(saEmp.other_male_no);
    calculatedData.sectionA.employees.total_female = toNumber(saEmp.permanent_female_no) + toNumber(saEmp.other_female_no);
    calculatedData.sectionA.employees.grand_total = calculatedData.sectionA.employees.total_male + calculatedData.sectionA.employees.total_female;

    // Workers Totals
    calculatedData.sectionA.workers.permanent_total = toNumber(saWrk.permanent_male_no) + toNumber(saWrk.permanent_female_no);
    calculatedData.sectionA.workers.other_total = toNumber(saWrk.other_male_no) + toNumber(saWrk.other_female_no);
    calculatedData.sectionA.workers.total_male = toNumber(saWrk.permanent_male_no) + toNumber(saWrk.other_male_no);
    calculatedData.sectionA.workers.total_female = toNumber(saWrk.permanent_female_no) + toNumber(saWrk.other_female_no);
    calculatedData.sectionA.workers.grand_total = calculatedData.sectionA.workers.total_male + calculatedData.sectionA.workers.total_female;

    // Differently Abled Employees Totals
    calculatedData.sectionA.differently_abled.employees_permanent_total = toNumber(saDiffAbledEmp.permanent_male_no) + toNumber(saDiffAbledEmp.permanent_female_no);
    calculatedData.sectionA.differently_abled.employees_other_total = toNumber(saDiffAbledEmp.other_male_no) + toNumber(saDiffAbledEmp.other_female_no);
    calculatedData.sectionA.differently_abled.employees_total_male = toNumber(saDiffAbledEmp.permanent_male_no) + toNumber(saDiffAbledEmp.other_male_no);
    calculatedData.sectionA.differently_abled.employees_total_female = toNumber(saDiffAbledEmp.permanent_female_no) + toNumber(saDiffAbledEmp.other_female_no);
    calculatedData.sectionA.differently_abled.employees_grand_total = calculatedData.sectionA.differently_abled.employees_total_male + calculatedData.sectionA.differently_abled.employees_total_female;

    // Differently Abled Workers Totals
    calculatedData.sectionA.differently_abled.workers_permanent_total = toNumber(saDiffAbledWrk.permanent_male_no) + toNumber(saDiffAbledWrk.permanent_female_no);
    calculatedData.sectionA.differently_abled.workers_other_total = toNumber(saDiffAbledWrk.other_male_no) + toNumber(saDiffAbledWrk.other_female_no);
    calculatedData.sectionA.differently_abled.workers_total_male = toNumber(saDiffAbledWrk.permanent_male_no) + toNumber(saDiffAbledWrk.other_male_no);
    calculatedData.sectionA.differently_abled.workers_total_female = toNumber(saDiffAbledWrk.permanent_female_no) + toNumber(saDiffAbledWrk.other_female_no);
    calculatedData.sectionA.differently_abled.workers_grand_total = calculatedData.sectionA.differently_abled.workers_total_male + calculatedData.sectionA.differently_abled.workers_total_female;

    // Women Representation Percentages
    calculatedData.sectionA.women_representation.board_women_percentage = formatPercentage(saWomenRepBoard.women_no, saWomenRepBoard.total_members);
    calculatedData.sectionA.women_representation.kmp_women_percentage = formatPercentage(saWomenRepKMP.women_kmps_no, saWomenRepKMP.total_kmps);
    calculatedData.sectionA.women_representation.employees_permanent_women_percentage = formatPercentage(saEmp.permanent_female_no, calculatedData.sectionA.employees.permanent_total);
    calculatedData.sectionA.women_representation.employees_other_women_percentage = formatPercentage(saEmp.other_female_no, calculatedData.sectionA.employees.other_total);
    calculatedData.sectionA.women_representation.employees_total_women_percentage = formatPercentage(calculatedData.sectionA.employees.total_female, calculatedData.sectionA.employees.grand_total);
    
    calculatedData.sectionA.women_representation.workers_permanent_women_percentage = formatPercentage(saWrk.permanent_female_no, calculatedData.sectionA.workers.permanent_total);
    calculatedData.sectionA.women_representation.workers_other_women_percentage = formatPercentage(saWrk.other_female_no, calculatedData.sectionA.workers.other_total);
    calculatedData.sectionA.women_representation.workers_total_women_percentage = formatPercentage(calculatedData.sectionA.workers.total_female, calculatedData.sectionA.workers.grand_total);

    // SECTION C - Principle 6 Calculations
    const p6Essential = reportData.sc_principle6_data?.essential_indicators || {};
    const turnover = toNumber(reportData.sa_csr_details?.turnover_inr); // Assuming turnover is in sa_csr_details

    // Renewable Energy Percentage
    calculatedData.sectionC.principle6.renewable_energy_percentage = formatPercentage(p6Essential.total_renewable_energy_consumed_gj, p6Essential.total_energy_consumed_gj);

    // Energy Intensity (per rupee of turnover)
    if (turnover > 0 && p6Essential.total_energy_consumed_gj) {
        calculatedData.sectionC.principle6.energy_intensity = (toNumber(p6Essential.total_energy_consumed_gj) / turnover).toFixed(4) + ' GJ/INR';
    } else {
        calculatedData.sectionC.principle6.energy_intensity = 'N/A';
    }

    // Water Intensity (per rupee of turnover)
    if (turnover > 0 && p6Essential.total_water_consumption_kl) {
        calculatedData.sectionC.principle6.water_intensity = (toNumber(p6Essential.total_water_consumption_kl) / turnover).toFixed(4) + ' KL/INR';
    } else {
        calculatedData.sectionC.principle6.water_intensity = 'N/A';
    }

    // GHG Intensity (Scope 1+2 per rupee of turnover)
    const totalScope12GHG = toNumber(p6Essential.ghg_emissions_scope1_tonnes) + toNumber(p6Essential.ghg_emissions_scope2_tonnes);
    if (turnover > 0 && totalScope12GHG > 0) {
        calculatedData.sectionC.principle6.ghg_intensity = (totalScope12GHG / turnover).toFixed(4) + ' tonnes CO2e/INR';
    } else {
        calculatedData.sectionC.principle6.ghg_intensity = 'N/A';
    }

    return calculatedData;
}

module.exports = calculateDerivedValues;
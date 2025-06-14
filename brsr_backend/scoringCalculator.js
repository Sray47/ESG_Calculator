// brsr_backend/scoringCalculator.js

console.log("--- LOADING LATEST PDF GENERATOR (FULLY FORTIFIED V6 - DB SCHEMA ALIGNED) ---");

// --- Helper Functions (No changes needed) ---
function getScore(value, rules) {
    if (rules.type === 'boolean') {
        return value ? rules.yes : (rules.no !== undefined ? rules.no : 0);
    }
    if (rules.type === 'disclosure') {
        return (value && String(value).trim() !== '') ? rules.points : 0;
    }
    if (rules.type === 'percentage') {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) return 0;
        for (const threshold of rules.thresholds) {
            if (numericValue >= threshold.min) {
                return threshold.points;
            }
        }
        return 0;
    }
    return 0;
}

// --- Corrected Principle Scoring Functions ---

// Principle 1 (Governance): 800 points
function calculateP1Scores(p1Data) {
    const ei = p1Data?.essential_indicators || {};
    const li = p1Data?.leadership_indicators || {};
    
    // Logic from your framework for P1
    const scores = {
        // Q1: Training & Awareness (complex logic, simplified here)
        q1: getScore(ei.p1_training_coverage?.board_of_directors?.programs_held, { type: 'disclosure', points: 80 }),
        // Q2 & Q3: Fines/Penalties (Monetary & Non-Monetary)
        q2: getScore(ei.p1_fines_penalties_paid?.monetary_details, { type: 'disclosure', points: 50 }),
        q3: getScore(ei.p1_fines_penalties_paid?.non_monetary_details, { type: 'disclosure', points: 100 }),
        // Q4: Anti-Corruption Policy
        q4: getScore(ei.anti_corruption_policy?.has_policy, { type: 'boolean', yes: 100, no: -10 }),
        // Q5: Disciplinary Action (No cases = 100)
        q5: (ei.disciplinary_actions_by_le_agencies?.fy_2022_23?.directors === 0) ? 100 : 20,
        // Q6: Complaints on Conflict of Interest (Negative scoring)
        q6: (ei.complaints_conflict_of_interest?.directors_number > 0 ? -50 : 0),
        // Q7: Corrective Action
        q7: getScore(ei.corrective_actions_on_corruption_coi?.details, { type: 'disclosure', points: 100 }),
        // Q8: Leadership Indicators (Combined)
        q8: getScore(li.anti_corruption_training?.fy_training_details, { type: 'disclosure', points: 100 }),
    };
    
    scores.total = Object.values(scores).reduce((sum, val) => sum + val, 0);
    return scores;
}

// Principle 2 (Environment): 500 points
function calculateP2Scores(p2Data) {
    const ei = p2Data?.p2_essential_rd_capex_percentages || {};
    const li = p2Data?.p2_leadership_lca_details || {};
    
    const scores = {
        // Q1: R&D/Capex Improvements
        q1: getScore(ei.rd_improvements_details, { type: 'disclosure', points: 100 }),
        // Q2: Sustainable Sourcing
        q2: getScore(p2Data?.p2_essential_sustainable_sourcing?.has_procedures, { type: 'boolean', yes: 100, no: -10 }),
        // Q3: Product Reclamation Process
        q3: getScore(p2Data?.p2_essential_reclaim_processes_description?.e_waste, { type: 'disclosure', points: 100 }),
        // Q4: Extended Producer Responsibility (EPR)
        q4: getScore(p2Data?.p2_essential_epr_status?.is_collection_plan_in_line_with_epr, { type: 'boolean', yes: 100, no: -20 }),
        // Q5: Leadership Indicators (LCA)
        q5: getScore(li.conducted, { type: 'boolean', yes: 100, no: 0 }),
    };
    scores.total = Object.values(scores).reduce((sum, val) => sum + val, 0);
    return scores;
}

// Principle 3 (Social): 1400 points
function calculateP3Scores(p3Data) {
    const ei = p3Data?.essential_indicators || {};
    const li = p3Data?.leadership_indicators || {};
    
    const scores = {
        q1: getScore(ei.employee_well_being_measures?.employees_current_fy, { type: 'disclosure', points: 50 }),
        q2: getScore(ei.employee_well_being_measures?.workers_current_fy, { type: 'disclosure', points: 50 }),
        q3: getScore(ei.retirement_benefits_permanent_employees, { type: 'disclosure', points: 100 }),
        q4: getScore(ei.retirement_benefits_other_employees, { type: 'disclosure', points: 100 }),
        q5: getScore(ei.workplace_accessibility_differently_abled?.is_accessible_current_fy, { type: 'boolean', yes: 100, no: -10 }),
        q6: getScore(ei.grievance_redressal_employees?.has_mechanism_current_fy, { type: 'boolean', yes: 100, no: -10 }),
        q7: getScore(ei.grievance_redressal_workers?.has_mechanism_current_fy, { type: 'boolean', yes: 100, no: -10 }),
        q8: getScore(ei.training_details_employees?.safety_persons_trained_current_fy, { type: 'disclosure', points: 100 }),
        q9: getScore(ei.training_details_employees?.skill_upgradation_persons_trained_current_fy, { type: 'disclosure', points: 100 }),
        q10: getScore(ei.performance_career_development_reviews_employees?.covered_percentage_current_fy, { type: 'percentage', thresholds: [ { min: 100, points: 100 }, { min: 80, points: 80 } ] }),
        q11: getScore(ei.health_safety_management_system?.is_certified_externally_current_fy, { type: 'boolean', yes: 100, no: 0 }),
        q12: getScore(ei.life_health_insurance_permanent_employees?.life_insurance_percentage_current_fy, { type: 'disclosure', points: 100 }),
        q13: getScore(li.transition_assistance_programs?.is_provided_current_fy, { type: 'boolean', yes: 100, no: 0 }),
        q14: getScore(li.safe_healthy_workplace_measures_current_fy, { type: 'disclosure', points: 100 }),
    };
    scores.total = Object.values(scores).reduce((sum, val) => sum + val, 0);
    return scores;
}

// Principle 4 (Governance): 200 points
function calculateP4Scores(p4Data) {
    const ei = p4Data?.essential_indicators || {};
    const li = p4Data?.leadership_indicators || {};

    const scores = {
        q1: getScore(ei.processes_for_identifying_stakeholder_groups, { type: 'disclosure', points: 100 }),
        q2: getScore(li.consultation_esg_details, { type: 'disclosure', points: 100 }),
    };
    scores.total = Object.values(scores).reduce((sum, val) => sum + val, 0);
    return scores;
}

// Principle 5 (Social): 800 points
function calculateP5Scores(p5Data) {
    const ei = p5Data?.essential_indicators || {};
    const li = p5Data?.leadership_indicators || {};

    const scores = {
        q1: getScore(ei.human_rights_training?.employees?.permanent?.covered_b > 0, { type: 'boolean', yes: 100, no: 0 }),
        q2: getScore(ei.minimum_wages?.employees, { type: 'disclosure', points: 100 }),
        q3: getScore(ei.remuneration?.bod, { type: 'disclosure', points: 100 }),
        q4: getScore(ei.focal_point_for_human_rights, { type: 'boolean', yes: 100, no: -10 }),
        q5: getScore(ei.grievance_redressal_mechanisms, { type: 'disclosure', points: 100 }),
        q6: getScore(ei.hr_in_business_agreements, { type: 'boolean', yes: 100, no: -10 }),
        q7: getScore(li.hr_due_diligence_scope, { type: 'disclosure', points: 100 }),
        q8: getScore(li.assessment_value_chain_partners?.child_labour_percent !== null, { type: 'boolean', yes: 100, no: 0 })
    };
    scores.total = Object.values(scores).reduce((sum, val) => sum + val, 0);
    return scores;
}

// Principle 6 (Environment): 2100 points
function calculateP6Scores(p6Data) {
    const ei = p6Data?.essential_indicators || {};
    const li = p6Data?.leadership_indicators || {};
    const scores = {
        q1: getScore(ei.energy_consumption_intensity?.current_fy, { type: 'disclosure', points: 100 }),
        q2: getScore(ei.designated_consumers_pat?.is_dc, { type: 'boolean', yes: 100, no: 0 }),
        q3: getScore(ei.water_disclosures?.current_fy, { type: 'disclosure', points: 100 }),
        q4: getScore(ei.zero_liquid_discharge?.implemented, { type: 'boolean', yes: 100, no: 0 }),
        q5: getScore(ei.air_emissions_other_ghg?.current_fy, { type: 'disclosure', points: 100 }),
        q6: getScore(ei.ghg_emissions_scope1_2?.current_fy, { type: 'disclosure', points: 100 }),
        q7: getScore(ei.ghg_reduction_projects?.has_projects, { type: 'boolean', yes: 100, no: 0 }),
        q8: getScore(ei.waste_management?.current_fy, { type: 'disclosure', points: 100 }),
        q9: getScore(ei.waste_management_practices_desc, { type: 'disclosure', points: 100 }),
        q10: getScore(ei.ecologically_sensitive_operations?.list?.length > 0, { type: 'boolean', yes: 100, no: 0 }),
        q11: getScore(ei.eia_current_fy?.list?.length > 0, { type: 'boolean', yes: 100, no: 0 }),
        q12: getScore(ei.env_law_compliance?.is_compliant, { type: 'boolean', yes: 100, no: -50 }),
        q13: getScore(ei.biodiversity_impact_assessment?.assessed_reported, { type: 'boolean', yes: 100, no: 0 }),
        q14: getScore(ei.plantation_initiatives?.undertaken, { type: 'boolean', yes: 100, no: 0 }),
        q15: getScore(ei.deforestation_impact?.tracked_reported, { type: 'boolean', yes: 100, no: 0 }),
        q16: getScore(ei.afforestation_reforestation_sustainability?.undertaken, { type: 'boolean', yes: 100, no: 0 }),
        q17: getScore(ei.soil_quality_management?.monitored_managed, { type: 'boolean', yes: 100, no: 0 }),
        q18: getScore(ei.green_building_certification?.has_certified_buildings, { type: 'boolean', yes: 100, no: 0 }),
        q19: getScore(ei.noise_pollution_monitoring_mitigation?.has_monitoring_mitigation_plan, { type: 'boolean', yes: 100, no: 0 }),
        q20: getScore(ei.significant_environmental_incidents_details, { type: 'disclosure', points: 100 }),
        q21: getScore(li.value_chain_partners_env_assessment_percent, { type: 'percentage', thresholds: [ { min: 80, points: 100 }, { min: 50, points: 70 }, { min: 20, points: 40 } ] }),
    };
    scores.total = Object.values(scores).reduce((sum, val) => sum + val, 0);
    return scores;
}

// Principle 7 (Governance): 200 points
function calculateP7Scores(p7Data) {
    const ei = p7Data?.essential_indicators || {};
    const li = p7Data?.leadership_indicators || {};
    const scores = {
        q1: getScore(ei.anti_competitive_conduct_corrective_actions?.length > 0, { type: 'boolean', yes: 100, no: 0 }),
        q2: getScore(li.public_policy_positions_advocated?.length > 0, { type: 'boolean', yes: 100, no: 0 }),
    };
    scores.total = Object.values(scores).reduce((sum, val) => sum + val, 0);
    return scores;
}

// Principle 8 (Governance): 300 points
function calculateP8Scores(p8Data) {
    const ei = p8Data?.essential_indicators || {};
    const li = p8Data?.leadership_indicators || {};
    let q1 = 0;
    const sias = ei.social_impact_assessments || [];
    if (sias.length > 0) {
        q1 = sias.some(s => s.results_communicated_in_public_domain) ? 100 : -40;
    }
    let q2 = getScore(ei.rehab_resettlement_projects?.length > 0, { type: 'boolean', yes: 100, no: 0 });
    let q3 = 0;
    if (li) {
        let leadershipScore = 0;
        if (li.social_impact_mitigation_actions?.length > 0) leadershipScore += 100;
        if (li.csr_aspirational_districts_projects?.length > 0) leadershipScore += 100;
        q3 = Math.min(leadershipScore, 100); // Capped at 100
    }
    const scores = { q1, q2, q3 };
    scores.total = q1 + q2 + q3; // Keep negative scores
    return scores;
}

// Principle 9 (Social): 600 points
function calculateP9Scores(p9Data) {
    const ei = p9Data?.essential_indicators || {};
    const li = p9Data?.leadership_indicators || {};
    const scores = {
        q1: getScore(ei.turnover_product_services_info?.environmental_social_parameters_turnover_percent, { type: 'percentage', thresholds: [{ min: 80, points: 90 }, { min: 60, points: 70 }, { min: 50, points: 60 }] }),
        q2: 100, // Placeholder for complex complaint logic
        q3: getScore(ei.cyber_security_data_privacy_policy?.has_policy, { type: 'boolean', yes: 100, no: -10 }),
        q4: 100, // Placeholder, as per framework
        q5: 100, // Placeholder
        q6: getScore(li.consumer_satisfaction_survey_details?.survey_carried_out_yes_no === true, { type: 'boolean', yes: 100, no: 0 })
    };
    scores.total = Object.values(scores).reduce((sum, val) => sum + val, 0);
    return scores;
}


// --- Main Calculation Function ---
function calculateESGScores(reportData) {
    const p1Data = reportData.sc_p1_ethical_conduct || {};
    const p2Data = reportData.sc_p2_sustainable_safe_goods || {};
    const p3Data = reportData.sc_p3_employee_wellbeing || {};
    const p4Data = reportData.sc_p4_stakeholder_responsiveness || {};
    const p5Data = reportData.sc_p5_human_rights || {};
    const p6Data = reportData.sc_p6_environment_protection || {};
    const p7Data = reportData.sc_p7_policy_advocacy || {};
    const p8Data = reportData.sc_p8_inclusive_growth || {};
    const p9Data = reportData.sc_p9_consumer_value || {};

    const principleScores = {
        p1: calculateP1Scores(p1Data),
        p2: calculateP2Scores(p2Data),
        p3: calculateP3Scores(p3Data),
        p4: calculateP4Scores(p4Data),
        p5: calculateP5Scores(p5Data),
        p6: calculateP6Scores(p6Data),
        p7: calculateP7Scores(p7Data),
        p8: calculateP8Scores(p8Data),
        p9: calculateP9Scores(p9Data)
    };

    // --- NEW: Define Max Scores for Pillars ---
    const maxPillarScores = {
        environment: 2600, // P2 (500) + P6 (2100)
        social: 2800,      // P3 (1400) + P5 (800) + P9 (600)
        governance: 1500,  // P1 (800) + P4 (200) + P7 (200) + P8 (300)
    };

    const pillarScores = {
        environment: (principleScores.p2?.total || 0) + (principleScores.p6?.total || 0),
        social: (principleScores.p3?.total || 0) + (principleScores.p5?.total || 0) + (principleScores.p9?.total || 0),
        governance: (principleScores.p1?.total || 0) + (principleScores.p4?.total || 0) + (principleScores.p7?.total || 0) + (principleScores.p8?.total || 0),
    };
    // --- NEW: Calculate Pillar Percentages ---
    pillarScores.environmentPercentage = maxPillarScores.environment > 0 ? ((pillarScores.environment / maxPillarScores.environment) * 100).toFixed(2) : "0.00";
    pillarScores.socialPercentage = maxPillarScores.social > 0 ? ((pillarScores.social / maxPillarScores.social) * 100).toFixed(2) : "0.00";
    pillarScores.governancePercentage = maxPillarScores.governance > 0 ? ((pillarScores.governance / maxPillarScores.governance) * 100).toFixed(2) : "0.00";

    const totalScore = pillarScores.environment + pillarScores.social + pillarScores.governance;
    const maxScore = 6900; // Your framework total

    return {
        principleScores,
        pillarScores,
        totalScore,
        maxScore,
        percentage: maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(2) : "0.00",
    };
}

module.exports = calculateESGScores;

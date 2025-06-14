// brsr_backend/data/robust-data.js
// Robust, fully-filled placeholder data for all BRSR sections.

const reportData = {
  financial_year: '2023-24',
  reporting_boundary: 'Consolidated',
  sa_product_services_turnover: [
    { product_service: 'Test Product Alpha', nic_code: '99999', turnover_contributed: '60' },
    { product_service: 'Test Service Beta', nic_code: '88888', turnover_contributed: '40' }
  ],
  sa_locations_plants_offices: { national_plants: 10, national_offices: 25, international_plants: 2, international_offices: 5 },
  sa_markets_served: { locations: { national_states: 28, international_countries: 15 }, exports_percentage: '45', customer_types: 'Global enterprise customers and domestic SMEs.' },
  sa_employee_details: { permanent_male: 1200, permanent_female: 800, other_than_permanent_male: 300, other_than_permanent_female: 250 },
  sa_workers_details: { permanent_male: 2500, permanent_female: 500, other_than_permanent_male: 1000, other_than_permanent_female: 400 },
  sa_differently_abled_details: { employees_male: 15, employees_female: 10, workers_male: 25, workers_female: 5 },
  sa_women_representation_details: { board_total_members: 12, board_number_of_women: 4, kmp_total_personnel: 5, kmp_number_of_women: 2 },
  sb_policy_management: {
    sb_director_statement: 'The Board of Test Company confirms its commitment to responsible business conduct as outlined in this comprehensive BRSR report.',
    sb_esg_responsible_individual: { name: 'John Smith', designation: 'Chief Sustainability Officer', din_if_director: '01234567', email: 'john.smith@testco.com', phone: '123-456-7890' },
    sb_principle_policies: Array.from({ length: 9 }, (_, i) => ({
      principle: i + 1, has_policy: true, is_board_approved: true, policy_text_or_url: `https://testco.com/policies/p${i + 1}`, extends_to_value_chain: true, performance_against_targets: `Achieved 95% of targets for P${i+1}.`
    })),
    sb_sustainability_committee: { has_committee: true, details: 'A dedicated Board-level Sustainability Committee, chaired by an independent director, meets quarterly.' },
    sb_ngrbc_company_review: { performance_review_yn: true, compliance_review_yn: true, review_undertaken_by: 'Board Committee', frequency: 'Quarterly' },
    sb_external_policy_assessment: { conducted: true, agency_name: 'Global ESG Auditors Inc.' }
  },
  sc_p1_ethical_conduct: { essential_indicators: { anti_corruption_policy: { has_policy: true, details: "Zero-tolerance policy on bribery and corruption.", weblink: 'https://testco.com/ethics' }, fines_penalties_corruption: { current_fy: { amount: 5000, frequency: 1 }, previous_fy: { amount: 0, frequency: 0 } } } },
  sc_p2_sustainable_safe_goods: { leadership_indicators: { p2_leadership_lca_details: { conducted: true, assessments: [{ product_service_name: 'Test Product Alpha', nic_code: '99999', turnover_percentage: '60', lca_boundary: 'Cradle-to-Grave', results_communicated_publicly: true, lca_summary_weblink: 'http://testco.com/lca' }] } } },
  sc_p3_employee_wellbeing: { essential_indicators: { employee_association_collective_bargaining: { permanent_employees_total: 2000, permanent_employees_collective_bargaining_percentage: 85 } } },
  sc_p4_stakeholder_responsiveness: { leadership_indicators: { stakeholder_consultation_esg: { conducted: true, details: 'Conducted formal ESG consultation with investors, employees, and community leaders.' } } },
  sc_p5_human_rights: { essential_indicators: { complaints_current_fy: { sexual_harassment: { filed_current_fy: 2, pending_current_fy: 0, resolved_current_fy: 2 }, wages: { filed_current_fy: 5, pending_current_fy: 1, resolved_current_fy: 4 } } } },
  sc_p6_environment_protection: { essential_indicators: { water_consumption_discharge: { current_fy: { total_water_withdrawal: 1000000, water_recycled_reused: 400000, percentage_recycled_reused: 40 } } } },
  sc_p7_policy_advocacy: { leadership_indicators: { public_policy_positions_advocated: [{ policy_advocated: 'Renewable Energy Adoption', method_of_advocacy: 'White papers and industry forums', board_review_frequency: 'Annually' }] } },
  sc_p8_inclusive_growth: { leadership_indicators: { csr_aspirational_districts_projects: [{ s_no: 1, state: 'Test State', aspirational_district: 'Test District', amount_spent_inr: 5000000 }] } },
  sc_p9_consumer_value: { essential_indicators: { consumer_complaints: { data_privacy: { received_current_fy: 1, pending_resolution_current_fy: 0 } }, consumer_survey_satisfaction_score: { score: '92', methodology: 'Annual survey conducted by third-party agency.' } } }
};

module.exports = { reportData };

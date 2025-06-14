// brsr_backend/data/generic-data.js
// Generic, simple placeholder data for all BRSR sections.

const reportData = {
  financial_year: '2023-24',
  reporting_boundary: 'Standalone',
  sa_product_services_turnover: [{ product_service: 'Generic Product A', nic_code: '10001', turnover_contributed: '100' }],
  sa_locations_plants_offices: { national_plants: 2, national_offices: 5 },
  sa_markets_served: { locations: { national_states: 5 }, exports_percentage: '10', customer_types: 'B2B domestic clients' },
  sa_employee_details: { permanent_male: 100, permanent_female: 50 },
  sa_workers_details: { permanent_male: 200, permanent_female: 20 },
  sa_differently_abled_details: { employees_male: 2, employees_female: 1 },
  sa_women_representation_details: { board_total_members: 10, board_number_of_women: 2 },
  sb_policy_management: {
    sb_director_statement: 'This is a generic statement from the director responsible for the BRSR report.',
    sb_esg_responsible_individual: { name: 'Jane Doe', designation: 'ESG Head' },
    sb_principle_policies: Array.from({ length: 9 }, (_, i) => ({ principle: i + 1, has_policy: true, is_board_approved: true, policy_text_or_url: `http://example.com/p${i+1}` })),
    sb_sustainability_committee: { has_committee: true, details: 'Sustainability committee oversees ESG implementation.' },
    sb_ngrbc_company_review: { performance_review_yn: true, frequency: 'Annually' },
    sb_external_policy_assessment: { conducted: false }
  },
  sc_p1_ethical_conduct: { essential_indicators: { anti_corruption_policy: { has_policy: true, weblink: 'http://example.com/ethics' } } },
  sc_p2_sustainable_safe_goods: { essential_indicators: { p2_essential_sustainable_sourcing: { has_procedures: true, percentage_inputs_sourced_sustainably: 50 } } },
  sc_p3_employee_wellbeing: { essential_indicators: { equal_remuneration_policy: { has_policy: true, details: 'Equal pay for equal work policy is followed.' } } },
  sc_p4_stakeholder_responsiveness: { essential_indicators: { stakeholder_identification_engagement: [{ stakeholder_group: 'Customers', frequency_of_engagement: 'Quarterly' }] } },
  sc_p5_human_rights: { essential_indicators: { hr_training: { employees: { permanent: { count_current_fy: 150, percentage_current_fy: 100 } } } } },
  sc_p6_environment_protection: { essential_indicators: { energy_consumption_intensity: { current_fy: { total_energy_consumption: 50000 } } } },
  sc_p7_policy_advocacy: { essential_indicators: { trade_and_industry_chambers_associations: [{ name: 'National Chamber of Commerce', reach: 'National' }] } },
  sc_p8_inclusive_growth: { essential_indicators: { input_material_sourcing: { current_fy: { directly_from_msme_small_producers_percent: 25 } } } },
  sc_p9_consumer_value: { essential_indicators: { data_security_privacy_policy: { has_policy: true, policy_weblink: 'http://example.com/privacy' } } },
};

module.exports = { reportData };

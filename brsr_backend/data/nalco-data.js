// brsr_backend/data/nalco-data.js
// Data extracted from the NALCO 2022-23 BRSR Report with negligible numeric changes.

const reportData = {
  // === SECTION A ===
  financial_year: '2022-23',
  reporting_boundary: 'Standalone',
  sa_product_services_turnover: [
    { product_service: 'Aluminium', nic_code: '24202', turnover_contributed: '72.1' },
    { product_service: 'Alumina', nic_code: '20119', turnover_contributed: '27.6' }
  ],
  sa_locations_plants_offices: {
    national_plants: 4, national_offices: 7, international_plants: 0, international_offices: 0
  },
  sa_markets_served: {
    locations: { national_states: 24, international_countries: 8 },
    exports_percentage: '29.8',
    customer_types: 'Alumina and Aluminium products are sold to domestic customers through Memorandum of Understanding (MoU) agreements and by participating in tenders. Sales to international customers are conducted through online global tenders.'
  },
  sa_employee_details: {
    permanent_male: 1502, permanent_female: 86, other_than_permanent_male: 0, other_than_permanent_female: 0
  },
  sa_workers_details: {
    permanent_male: 3361, permanent_female: 241, other_than_permanent_male: 12077, other_than_permanent_female: 805
  },
  sa_differently_abled_details: {
    employees_male: 24, employees_female: 4, workers_male: 53, workers_female: 9
  },
  sa_women_representation_details: {
    board_total_members: 16, board_number_of_women: 2, kmp_total_personnel: 7, kmp_number_of_women: 0
  },

  // === SECTION B ===
  sb_policy_management: {
    sb_director_statement: "NALCO is a Schedule 'A' Navratna CPSE (Central Public Sector Enterprise) under the Ministry of Mines, Government of India. It is committed to achieving sustainability in terms of Environment, Social, and Governance (ESG) aspects. NALCO acknowledges its role in mitigating the impact of climate change and prioritizes environmental stewardship. As a responsible corporate organization, NALCO is fully conscious of its societal responsibilities. The company places significant emphasis on corporate governance.",
    sb_esg_responsible_individual: {
      name: 'Shri Pankaj Kumar Sharma',
      designation: 'Director (Production)',
      din_if_director: '10041341',
      email: 'dirprod@nalcoindia.co.in',
      phone: '0674-2300660'
    },
    sb_principle_policies: Array.from({ length: 9 }, (_, i) => ({
      principle: i + 1,
      has_policy: true,
      is_board_approved: true,
      policy_text_or_url: `https://nalcoindia.com/company/policies-docs/`,
      extends_to_value_chain: [6, 8].includes(i + 1), // P6 and P8 are Yes, others are No
    })),
    sb_sustainability_committee: {
      has_committee: true,
      details: 'YES, the Company has Board level Sub-Committee i.e. CSR and Sustainability Development Committee responsible for decision making on sustainability related issues.'
    },
    sb_ngrbc_company_review: {
      performance_review_yn: true,
      compliance_review_yn: false,
      review_undertaken_by: 'Director Committee of the Board/Any other Committee',
      frequency: 'Annually'
    },
    sb_external_policy_assessment: {
      conducted: false,
      agency_name: ''
    }
  },

  // === SECTION C ===
  sc_p1_ethical_conduct: {
    essential_indicators: {
      anti_corruption_policy: { has_policy: false, details: "The company is continuously making efforts to improve its systems and procedures to ensure transparency...", weblink: "https://nalcoindia.com/company/policies-docs/" },
      concerns_reporting_process: { has_process: true, process_details: "Grievance procedure is available on HR manual. Policy to prevent sexual harassment is in place." },
      fines_penalties_corruption: { current_fy: { amount: 0, frequency: 0 }, previous_fy: { amount: 0, frequency: 0 } },
    }
  },
  sc_p2_sustainable_safe_goods: {
    p2_essential_rd_capex_percentages: {
      rd_percentage_current_fy: 5.3, capex_percentage_current_fy: 10.4,
      rd_improvements_details: "Advancement in technology to transform Smelter plant hazardous waste SPL into valuable products.",
      capex_improvements_details: "Capital expenditure (CAPEX) projects at the refinery and CPP focus on pollution control, recycling, reuse, and energy conservation."
    },
    p2_essential_sustainable_sourcing: { has_procedures: true, percentage_inputs_sourced_sustainably: 100 },
    p2_essential_reclaim_processes_description: { plastics: "Evaluating feasibility of developing a procedure for reclamation and recycling of plastics i.e. VSI HDPE fabric...", e_waste: "N.A.", hazardous_waste: "N.A." }
  },
  sc_p3_employee_wellbeing: {
    essential_indicators: {
      retirement_benefits_permanent_employees: { pf_count_current_fy: 1592, gratuity_count_current_fy: 1592 },
      equal_remuneration_policy: { has_policy: false, details: "The entity ensures compliance with the Rights of Persons with Disabilities Act, 2016 within its premises." },
      complaints_working_conditions: { working_conditions: { filed_current_fy: 0, pending_current_fy: 0 }, sexual_harassment: { filed_current_fy: 0, pending_current_fy: 0 } }
    }
  },
  sc_p4_stakeholder_responsiveness: {
    essential_indicators: {
      stakeholder_identification_engagement: [
        { stakeholder_group: 'Shareholders', identified_as_vulnerable: false, channels_of_communication: 'Emails, Letters, Website, Newspaper, AGMs', frequency_of_engagement: 'Regular & Need based' },
        { stakeholder_group: 'Community', identified_as_vulnerable: true, channels_of_communication: 'Request letters- Emails, Community Meetings', frequency_of_engagement: 'Need based' },
        { stakeholder_group: 'Customers', identified_as_vulnerable: false, channels_of_communication: 'Website, emails, Letters, Meetings', frequency_of_engagement: 'Regular and Need-based' },
        { stakeholder_group: 'Value Chain Partners', identified_as_vulnerable: true, channels_of_communication: 'Website, Mobile Apps, Email, Letters', frequency_of_engagement: 'Regular and need based' }
      ]
    }
  },
  sc_p5_human_rights: {
    essential_indicators: {
      hr_training: { employees: { permanent: { count_current_fy: 61, percentage_current_fy: 4 } }, workers: { permanent: { count_current_fy: 0, percentage_current_fy: 0 } } },
      remuneration: { employees_other_than_bod_kmp: { male_median: 3546713, female_median: 2950207 }, workers: { male_median: 2639015, female_median: 1861066 } },
      complaints_current_fy: { sexual_harassment: { filed_current_fy: 0, pending_current_fy: 0, resolved_current_fy: 0 }, discrimination_workplace: { filed_current_fy: 0, pending_current_fy: 0, resolved_current_fy: 0 } },
      assessments_plants_offices: { child_labour_percent: 100, forced_labour_percent: 100, sexual_harassment_percent: 100, discrimination_workplace_percent: 100, wages_percent: 100 }
    }
  },
  sc_p6_environment_protection: {
    essential_indicators: {
      energy_consumption_intensity: { current_fy: { electricity_consumption_a: 4359616, fuel_consumption_b: 98580904, energy_intensity_turnover: 0.00073 } },
      water_consumption_discharge: { current_fy: { total_water_withdrawal: 44520694, net_water_consumption: 44520694, percentage_recycled_reused: 0 } },
      ghg_emissions: { current_fy: { total_ghg_emissions: 11186395, ghg_reduction_initiatives: 0, percentage_reduction: 0 } },
      operations_in_or_near_biodiversity_hotspots: 'Yes',
      ecologically_sensitive_operations: { list: [{ location: 'Panchpatmali Bauxite Mine, Damanjodi', type_of_operations: 'Mining of bauxite', compliance_status: 'Yes' }] }
    }
  },
  sc_p7_policy_advocacy: {
    essential_indicators: {
      trade_and_industry_chambers_associations: [
        { name: 'Aluminium Association of India', reach: 'National' },
        { name: 'Confederation of Indian Industry', reach: 'National' },
        { name: 'Standing Conference of Public Enterprise (SCOPE)', reach: 'National' }
      ],
      anti_competitive_conduct_corrective_actions: []
    }
  },
  sc_p8_inclusive_growth: {
    essential_indicators: {
      social_impact_assessments: [],
      rehab_resettlement_projects: [
        { name_of_project_ongoing_rr: 'Utkal D Coal Mines', state: 'Odisha', district: 'Angul', no_of_paf: 235, amounts_paid_to_pafs_fy_inr: 1800000000 },
        { name_of_project_ongoing_rr: 'Utkal E Coal Mines', state: 'Odisha', district: 'Angul', no_of_paf: 979, amounts_paid_to_pafs_fy_inr: 0 }
      ],
      input_material_sourcing: { current_fy: { directly_from_msme_small_producers_percent: 29.9, directly_from_district_neighbouring_percent: 47.1 } }
    }
  },
  sc_p9_consumer_value: {
    essential_indicators: {
      consumer_complaints: {
        data_privacy: { received_current_fy: 0, pending_resolution_current_fy: 0 },
        other_consumer_issues: { received_current_fy: 6, pending_resolution_current_fy: 0 }
      },
      product_recalls: { voluntary_recall: { instances_current_fy: 0, reasons_for_recall: 'N.A.' } },
      data_security_privacy_policy: { has_policy: true, policy_weblink: 'https://NALCOindia.com/home/privacy-policy/' }
    }
  }
};

module.exports = { reportData };

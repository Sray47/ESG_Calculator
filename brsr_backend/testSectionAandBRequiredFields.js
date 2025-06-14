// testSectionAandBRequiredFields.js
// Script to fill required Section A and B columns in brsr_reports for a given report, so it can be submitted
// Run with: node brsr_backend/testSectionAandBRequiredFields.js

const { pool } = require('./db');

// Minimal required Section A fields (see table definition and SectionAForm logic)
const sectionARequired = {
  sa_business_activities_turnover: [
    { description_main: 'Aluminium', description_business: 'Refining', turnover_percentage: '50' }
  ],
  sa_product_services_turnover: [
    { product_service: 'Alumina', nic_code: '23454', turnover_contributed: '50' }
  ],
  sa_locations_plants_offices: {
    national_plants: 1, national_offices: 1, international_plants: 0, international_offices: 0
  },
  sa_markets_served: {
    locations: { national_states: 1, international_countries: 0 },
    exports_percentage: '0',
    customer_types: 'Test customer base'
  },
  sa_employee_details: {
    permanent_male: 1, permanent_female: 1, other_than_permanent_male: 0, other_than_permanent_female: 0
  },
  sa_workers_details: {
    permanent_male: 1, permanent_female: 1, other_than_permanent_male: 0, other_than_permanent_female: 0
  },
  sa_differently_abled_details: {
    employees_male: 0, employees_female: 0, workers_male: 0, workers_female: 0
  },
  sa_women_representation_details: {
    board_total_members: 2, board_number_of_women: 1, kmp_total_personnel: 2, kmp_number_of_women: 1
  },
  sa_turnover_rate: {
    permanent_employees_turnover_rate: '1', permanent_workers_turnover_rate: '1'
  },
  sa_holding_subsidiary_associate_companies: [
    { name: 'Test Holding', cin_or_country: 'IN', type: 'Holding', percentage_holding: '100' }
  ],
  sa_csr_applicable: false,
  sa_csr_turnover: '',
  sa_csr_net_worth: '',
  sa_transparency_complaints: { received: 0, pending: 0, remarks: '' }
};

// Fully filled Section B fields for robust testing
const sectionBRequired = {
  sb_policy_management: {
    sb_director_statement: 'This is a test director statement for Section B.',
    sb_esg_responsible_individual: {
      name: 'Test Responsible Person',
      designation: 'Chief Sustainability Officer',
      din_if_director: '12345678',
      email: 'test.responsible@example.com',
      phone: '+91-9999999999'
    },
    sb_principle_policies: Array.from({ length: 9 }, (_, i) => ({
      principle: i + 1,
      has_policy: true,
      is_board_approved: true,
      policy_text_or_url: `https://example.com/policy${i + 1}`,
      translated_to_procedures: true,
      extends_to_value_chain: true,
      adopted_standards: 'ISO 9001, SA 8000',
      specific_commitments_goals_targets: `Commitment for P${i + 1}`,
      performance_against_targets: `Performance for P${i + 1}`,
      reason_q12_not_material: false,
      reason_q12_not_at_stage: false,
      reason_q12_no_resources: false,
      reason_q12_planned_next_year: false,
      reason_q12_other_text: ''
    })),
    sb_sustainability_committee: {
      has_committee: true,
      details: 'CSR and Sustainability Development Committee, 5 members including 2 women.'
    },
    sb_ngrbc_company_review: {
      performance_review_yn: true,
      compliance_review_yn: true,
      review_undertaken_by: 'Board Committee',
      frequency: 'Annually'
    },
    sb_external_policy_assessment: {
      conducted: true,
      agency_name: 'External ESG Auditors Ltd.'
    }
  }
};

async function fillRequiredFields(reportId) {
  // Compose update query for all required fields
  const fields = { ...sectionARequired, ...sectionBRequired };
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const [col, val] of Object.entries(fields)) {
    setClauses.push(`${col} = $${idx++}`);
    values.push(typeof val === 'object' ? JSON.stringify(val) : val);
  }
  values.push(reportId);
  const query = `UPDATE brsr_reports SET ${setClauses.join(', ')} WHERE id = $${idx}`;
  await pool.query(query, values);
}

// Usage: node testSectionAandBRequiredFields.js <reportId>
if (require.main === module) {
  const reportId = process.argv[2];
  if (!reportId) {
    console.error('Usage: node testSectionAandBRequiredFields.js <reportId>');
    process.exit(1);
  }
  fillRequiredFields(reportId)
    .then(() => {
      console.log('Required Section A and B fields filled for report', reportId);
      process.exit(0);
    })
    .catch(err => {
      console.error('Error updating report:', err);
      process.exit(1);
    });
}

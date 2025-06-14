// testSectionCPrinciplesFillAll.js
// Script to fill all columns of the database for P4, P7, and P8 in brsr_reports for a given report, only for columns that are not already filled.
// Run with: node brsr_backend/testSectionCPrinciplesFillAll.js <reportId>

const { pool } = require('./db');

// Helper: returns a fully filled object for each principle
function getFullP4() {
  return {
    essential_indicators: {
      processes_for_identifying_stakeholder_groups: 'Stakeholder groups identified via annual survey',
    },
    leadership_indicators: {
      consultation_esg_details: 'Consultations held with all major stakeholder groups in 2024.'
    }
  };
}

function getFullP7() {
  return {
    essential_indicators: {
      anti_competitive_conduct_corrective_actions: [
        { name_of_authority: 'Competition Commission', year: 2024, corrective_action: 'Policy revised' }
      ]
    },
    leadership_indicators: {
      public_policy_positions_advocated: [
        { policy_advocated: 'Sustainable procurement', method_of_advocacy: 'Industry forum', info_in_public_domain: 'Yes', board_review_frequency: 'Annually', web_link: 'https://example.com/policy-advocacy' }
      ]
    }
  };
}

function getFullP8() {
  return {
    essential_indicators: {
      social_impact_assessments: [
        { project: 'Community Health', results_communicated_in_public_domain: true }
      ],
      rehab_resettlement_projects: [
        { project: 'Resettlement 2024', beneficiaries: 100 }
      ]
    },
    leadership_indicators: {
      social_impact_mitigation_actions: [
        { action: 'Health camps', year: 2024 } ],
      csr_aspirational_districts_projects: [
        { project: 'Aspirational Districts Education', year: 2024, amount_spent: 1000000 }
      ]
    }
  };
}

async function fillPrincipleIfMissing(reportId, dbKey, fullObj) {
  // Get current value
  const { rows } = await pool.query(`SELECT ${dbKey} FROM brsr_reports WHERE id = $1`, [reportId]);
  if (!rows.length) throw new Error('Report not found');
  const current = rows[0][dbKey];
  if (current) {
    // Try to parse JSON if string
    let parsed = current;
    if (typeof current === 'string') {
      try { parsed = JSON.parse(current); } catch { parsed = {}; }
    }
    // Fill only missing fields
    let changed = false;
    for (const key in fullObj) {
      if (!parsed[key] || (typeof parsed[key] === 'object' && Object.keys(parsed[key]).length === 0)) {
        parsed[key] = fullObj[key];
        changed = true;
      }
    }
    if (changed) {
      await pool.query(`UPDATE brsr_reports SET ${dbKey} = $1 WHERE id = $2`, [JSON.stringify(parsed), reportId]);
      console.log(`Updated ${dbKey} for report ${reportId}`);
    } else {
      console.log(`${dbKey} already filled for report ${reportId}`);
    }
  } else {
    await pool.query(`UPDATE brsr_reports SET ${dbKey} = $1 WHERE id = $2`, [JSON.stringify(fullObj), reportId]);
    console.log(`Filled ${dbKey} for report ${reportId}`);
  }
}

async function main() {
  const reportId = process.argv[2];
  if (!reportId) {
    console.error('Usage: node testSectionCPrinciplesFillAll.js <reportId>');
    process.exit(1);
  }
  await fillPrincipleIfMissing(reportId, 'sc_p4_stakeholder_responsiveness', getFullP4());
  await fillPrincipleIfMissing(reportId, 'sc_p7_policy_advocacy', getFullP7());
  await fillPrincipleIfMissing(reportId, 'sc_p8_inclusive_growth', getFullP8());
  console.log('Done.');
  process.exit(0);
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}

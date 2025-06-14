// brsr_backend/scripts/populate-from-nalco-report.js
// Populates a BRSR report with data closely matching the NALCO 2022-23 annual report.
// Usage: node brsr_backend/scripts/populate-from-nalco-report.js <reportId>

const { pool } = require('../db');
const { reportData } = require('../data/nalco-data');

async function populateReport(reportId) {
  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const [col, val] of Object.entries(reportData)) {
    setClauses.push(`${col} = $${idx++}`);
    values.push(typeof val === 'object' ? JSON.stringify(val) : val);
  }

  // Also set the company_id
  setClauses.push(`company_id = $${idx++}`);
  values.push(7);

  // Add the reportId for the WHERE clause
  values.push(reportId);

  const query = `UPDATE brsr_reports SET ${setClauses.join(', ')} WHERE id = $${idx}`;

  await pool.query(query, values);
}

if (require.main === module) {
  const reportId = process.argv[2];
  if (!reportId) {
    console.error('Usage: node brsr_backend/scripts/populate-from-nalco-report.js <reportId>');
    process.exit(1);
  }
  populateReport(reportId)
    .then(() => {
      console.log(`Successfully populated report ${reportId} with NALCO-like data.`);
      process.exit(0);
    })
    .catch(err => {
      console.error(`Error updating report ${reportId}:`, err);
      process.exit(1);
    });
}

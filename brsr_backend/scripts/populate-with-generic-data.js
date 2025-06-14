// brsr_backend/scripts/populate-with-generic-data.js
// Populates a BRSR report with simple, generic data for all sections.
// Usage: node brsr_backend/scripts/populate-with-generic-data.js <reportId>

const { pool } = require('../db');
const { reportData } = require('../data/generic-data');

async function populateReport(reportId) {
  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const [col, val] of Object.entries(reportData)) {
    setClauses.push(`${col} = $${idx++}`);
    values.push(typeof val === 'object' ? JSON.stringify(val) : val);
  }
  
  setClauses.push(`company_id = $${idx++}`);
  values.push(7);
  
  values.push(reportId);

  const query = `UPDATE brsr_reports SET ${setClauses.join(', ')} WHERE id = $${idx}`;

  await pool.query(query, values);
}

if (require.main === module) {
  const reportId = process.argv[2];
  if (!reportId) {
    console.error('Usage: node brsr_backend/scripts/populate-with-generic-data.js <reportId>');
    process.exit(1);
  }
  populateReport(reportId)
    .then(() => {
      console.log(`Successfully populated report ${reportId} with generic data.`);
      process.exit(0);
    })
    .catch(err => {
      console.error(`Error updating report ${reportId}:`, err);
      process.exit(1);
    });
}

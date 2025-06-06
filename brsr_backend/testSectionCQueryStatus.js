// Test script to verify Section C query status check is working
const { pool } = require('./db');

async function testQuery() {
  try {    // Update these with values from your system
    const reportId = 25; // Use a valid report ID with InProgress status
    const company_id = 7; // Use the corresponding company ID
    
    // First check the current status of the report
    const statusQuery = `SELECT id, company_id, status FROM brsr_reports WHERE id = $1`;
    const statusResult = await pool.query(statusQuery, [reportId]);
    
    if (statusResult.rows.length === 0) {
      console.log(`No report found with ID ${reportId}`);
      await pool.end();
      return;
    }
    
    console.log('Current report status:');
    console.log(statusResult.rows[0]);
      // Now test the query that would be used for Section C updates
    const queryWithInProgress = `
      SELECT id, status, sc_p1_ethical_conduct FROM brsr_reports 
      WHERE id = $1 AND company_id = $2 AND (status = 'draft' OR status = 'InProgress' OR status IS NULL)
    `;
    
    const result = await pool.query(queryWithInProgress, [reportId, company_id]);
    console.log('\nSection C update query result (should return rows if report can be updated):');
    
    if (result.rows.length > 0) {      console.log('Report ID:', result.rows[0].id);
      console.log('Status:', result.rows[0].status);
      console.log('Has sc_p1_ethical_conduct:', result.rows[0].sc_p1_ethical_conduct ? 'Yes' : 'No');
      console.log('\nSUCCESS: The report can be updated with the current query!');
      
      // Check if the DB structure matches what we expect based on the frontend component
      console.log('\nVerifying database structure for Section C Principle 1:');
        // Check the column names in the brsr_reports table
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'brsr_reports' 
        AND column_name LIKE 'sc_p%'
      `;
      const columnsResult = await pool.query(columnsQuery);
      
      console.log('\nColumns related to Section C Principle 1 in the database:');
      columnsResult.rows.forEach(row => {
        console.log(`- ${row.column_name}`);
      });
      
    } else {
      console.log('\nFAIL: The report cannot be updated with the current query!');
    }
    
    // Close the connection pool
    await pool.end();
  } catch (error) {
    console.error('Error running test:', error);
    try {
      await pool.end();
    } catch (e) {
      console.error('Error closing pool:', e);
    }
    process.exit(1);
  }
}

testQuery();

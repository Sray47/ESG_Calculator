// A test script that directly updates the Section C Principle 6 data in the database
const { pool } = require('./db');

async function testSectionCPrinciple6Update() {
  try {
    // Update these with values from your system
    const reportId = 25; // Use a valid report ID with InProgress status
    const companyId = 7; // Use the corresponding company ID
    
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
    
    // Ensure test uses 'sc_p6_environment_protection' for DB update and validation
    const updatePayload = {
      sc_p6_environment_protection: 'Test value for Principle 6',
    };
    
    console.log('\nUpdating sc_p6_environment_protection with test data:');
    console.log(JSON.stringify(updatePayload, null, 2));
    
    // Update the database directly
    const updateQuery = `
      UPDATE brsr_reports 
      SET sc_p6_environment_protection = $1 
      WHERE id = $2 AND company_id = $3 AND (status = 'draft' OR status = 'InProgress' OR status IS NULL)
      RETURNING id, status
    `;
    
    const updateResult = await pool.query(updateQuery, [
      JSON.stringify(updatePayload),
      reportId,
      companyId
    ]);
    
    if (updateResult.rows.length > 0) {
      console.log('\nSUCCESS: Updated Section C Principle 6 data!');
      console.log('Report ID:', updateResult.rows[0].id);
      console.log('Status:', updateResult.rows[0].status);
      
      // Validate DB stores value in 'sc_p6_environment_protection'
      const verifyQuery = `
        SELECT sc_p6_environment_protection FROM brsr_reports 
        WHERE id = $1
      `;
      
      const verifyResult = await pool.query(verifyQuery, [reportId]);
      
      console.log('\nVerified data in database:');
      console.log(JSON.stringify(verifyResult.rows[0].sc_p6_environment_protection, null, 2));
    } else {
      console.log('\nFAIL: Could not update the report!');
      console.log('Possible reasons:');
      console.log('- Report ID or company ID is incorrect');
      console.log('- Report status is not "draft", "InProgress", or NULL');
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

testSectionCPrinciple6Update();

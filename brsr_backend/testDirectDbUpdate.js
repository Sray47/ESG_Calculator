// A test script that directly updates the database without using the API
const { pool } = require('./db');

async function testDirectUpdate() {
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
    
    // Create test data for Section C Principle 1
    const testData = {
      anti_corruption_policy: {
        has_policy: true,
        details: `Updated anti-corruption policy details at ${new Date().toISOString()}`,
        weblink: 'https://example.com/policy-updated',
      },
      esg_training_employees: {
        has_program: true,
        employees_trained_count: 150,
      }
    };
    
    console.log('\nUpdating sc_p1_ethical_conduct with test data:');
    console.log(JSON.stringify(testData, null, 2));
    
    // Update the database directly
    const updateQuery = `
      UPDATE brsr_reports 
      SET sc_p1_ethical_conduct = $1 
      WHERE id = $2 AND company_id = $3 AND (status = 'draft' OR status = 'InProgress' OR status IS NULL)
      RETURNING id, status
    `;
    
    const updateResult = await pool.query(updateQuery, [
      JSON.stringify(testData),
      reportId,
      companyId
    ]);
    
    if (updateResult.rows.length > 0) {
      console.log('\nSUCCESS: Updated Section C Principle 1 data!');
      console.log('Report ID:', updateResult.rows[0].id);
      console.log('Status:', updateResult.rows[0].status);
      
      // Verify the update by retrieving the data
      const verifyQuery = `
        SELECT sc_p1_ethical_conduct FROM brsr_reports 
        WHERE id = $1
      `;
      
      const verifyResult = await pool.query(verifyQuery, [reportId]);
      
      console.log('\nVerified data in database:');
      console.log(JSON.stringify(verifyResult.rows[0].sc_p1_ethical_conduct, null, 2));
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

testDirectUpdate();

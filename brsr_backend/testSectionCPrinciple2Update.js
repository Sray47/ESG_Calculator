// A test script that directly updates the Section C Principle 2 data in the database
const { pool } = require('./db');

async function testSectionCPrinciple2Update() {
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
    
    // Create test data for Section C Principle 2
    const testData = {
      p2_essential_rd_capex_percentages: {
        rd_percentage_current_fy: 15.5,
        capex_percentage_current_fy: 10.3,
        rd_improvements_details: `Updated R&D improvements details at ${new Date().toISOString()}`,
        capex_improvements_details: `Updated Capex improvements details at ${new Date().toISOString()}`,
      },
      p2_essential_sustainable_sourcing: {
        has_procedures: true,
        percentage_inputs_sourced_sustainably: 65,
      }
    };    console.log('\nUpdating sc_p2_sustainable_safe_goods with test data:');
    console.log(JSON.stringify(testData, null, 2));
    
    // Update the database directly
    const updateQuery = `
      UPDATE brsr_reports 
      SET sc_p2_sustainable_safe_goods = $1 
      WHERE id = $2 AND company_id = $3 AND (status = 'draft' OR status = 'InProgress' OR status IS NULL)
      RETURNING id, status
    `;
    
    const updateResult = await pool.query(updateQuery, [
      JSON.stringify(testData),
      reportId,
      companyId
    ]);
    
    if (updateResult.rows.length > 0) {
      console.log('\nSUCCESS: Updated Section C Principle 2 data!');
      console.log('Report ID:', updateResult.rows[0].id);
      console.log('Status:', updateResult.rows[0].status);      // Verify the update by retrieving the data
      const verifyQuery = `
        SELECT sc_p2_sustainable_safe_goods FROM brsr_reports 
        WHERE id = $1
      `;
      
      const verifyResult = await pool.query(verifyQuery, [reportId]);
      
      console.log('\nVerified data in database:');
      console.log(JSON.stringify(verifyResult.rows[0].sc_p2_sustainable_safe_goods, null, 2));
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

testSectionCPrinciple2Update();

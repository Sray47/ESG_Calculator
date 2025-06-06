// A test script that directly updates the Section C Principle 5 data in the database
const { pool } = require('./db');

async function testSectionCPrinciple5Update() {
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
    
    // Create test data for Section C Principle 5
    const testData = {
      essential_indicators: {
        human_rights_training: {
          employees: {
            permanent: { total_a: 100, covered_b: 90 },
            other_than_permanent: { total_a: 50, covered_b: 40 },
            total: { total_a: 150, covered_b: 130 }
          },
          workers: {
            permanent: { total_a: 80, covered_b: 70 },
            other_than_permanent: { total_a: 20, covered_b: 10 },
            total: { total_a: 100, covered_b: 80 }
          }
        },
        minimum_wages: {},
        remuneration: {},
        focal_point_for_human_rights: true,
        grievance_redressal_mechanisms: 'Available',
        complaints_current_fy: {},
        anti_retaliation_mechanisms: 'Yes',
        hr_in_business_agreements: true,
        assessments_plants_offices: {},
        corrective_actions_risks_q9: 'Some corrective actions',
      },
      leadership_indicators: {
        process_modification_grievances: true,
        hr_due_diligence_scope: 'Full value chain',
        accessibility_for_disabled: true,
        assessment_value_chain_partners: {},
        corrective_actions_risks_q4_li: 'Actions taken',
      }
    };
    
    console.log('\nUpdating sc_p5_human_rights with test data:');
    console.log(JSON.stringify(testData, null, 2));
    
    // Update the database directly
    const updateQuery = `
      UPDATE brsr_reports 
      SET sc_p5_human_rights = $1 
      WHERE id = $2 AND company_id = $3 AND (status = 'draft' OR status = 'InProgress' OR status IS NULL)
      RETURNING id, status
    `;
    
    const updateResult = await pool.query(updateQuery, [
      JSON.stringify(testData),
      reportId,
      companyId
    ]);
    
    if (updateResult.rows.length > 0) {
      console.log('\nSUCCESS: Updated Section C Principle 5 data!');
      console.log('Report ID:', updateResult.rows[0].id);
      console.log('Status:', updateResult.rows[0].status);
      
      // Verify the update by retrieving the data
      const verifyQuery = `
        SELECT sc_p5_human_rights FROM brsr_reports 
        WHERE id = $1
      `;
      
      const verifyResult = await pool.query(verifyQuery, [reportId]);
      
      console.log('\nVerified data in database:');
      console.log(JSON.stringify(verifyResult.rows[0].sc_p5_human_rights, null, 2));
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

testSectionCPrinciple5Update();

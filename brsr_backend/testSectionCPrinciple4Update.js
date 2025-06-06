// A test script that directly updates the Section C Principle 4 data in the database
const { pool } = require('./db');

async function testSectionCPrinciple4Update() {
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
    
    // Create test data for Section C Principle 4
    const testData = {
      essential_indicators: {
        processes_for_identifying_stakeholder_groups: 'Test process description',
        stakeholder_engagement_data: [
          {
            stakeholder_group_name: 'Local Community',
            is_vulnerable_marginalized: true,
            channels_of_communication: 'Email, Community Meetings',
            frequency_of_engagement: 'Quarterly',
            purpose_scope_of_engagement: 'Feedback and consultation',
          }
        ]
      },
      leadership_indicators: {
        consultation_process_with_board_path: 'Board consults via annual meetings',
        consultation_used_for_esg_topics: true,
        consultation_esg_details: 'ESG topics discussed in board meetings',
        vulnerable_group_engagement_details: 'Special sessions for vulnerable groups',
      }
    };
    
    console.log('\nUpdating sc_p4_stakeholder_engagement with test data:');
    console.log(JSON.stringify(testData, null, 2));
    
    // Update the database directly
    const updateQuery = `
      UPDATE brsr_reports 
      SET sc_p4_stakeholder_responsiveness = $1 
      WHERE id = $2 AND company_id = $3 AND (status = 'draft' OR status = 'InProgress' OR status IS NULL)
      RETURNING id, status
    `;
    
    const updateResult = await pool.query(updateQuery, [
      JSON.stringify(testData),
      reportId,
      companyId
    ]);
    
    if (updateResult.rows.length > 0) {
      console.log('\nSUCCESS: Updated Section C Principle 4 data!');
      console.log('Report ID:', updateResult.rows[0].id);
      console.log('Status:', updateResult.rows[0].status);
      
      // Verify the update by retrieving the data
      const verifyQuery = `
        SELECT sc_p4_stakeholder_responsiveness FROM brsr_reports 
        WHERE id = $1
      `;
      
      const verifyResult = await pool.query(verifyQuery, [reportId]);
      
      console.log('\nVerified data in database:');
      console.log(JSON.stringify(verifyResult.rows[0].sc_p4_stakeholder_responsiveness, null, 2));
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

testSectionCPrinciple4Update();

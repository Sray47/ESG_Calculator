// Test script to check column names for Section C in the database
const { pool } = require('./db');

async function testColumns() {
  try {
    // Update these with values from your system
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
    
    // Check all column names in the brsr_reports table
    console.log('\nChecking all columns in the brsr_reports table:');
    const allColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'brsr_reports'
      ORDER BY column_name
    `;
    const allColumnsResult = await pool.query(allColumnsQuery);
    
    console.log('Section C columns in the brsr_reports table:');
    const sectionCColumns = [];
    allColumnsResult.rows.forEach(row => {
      if (row.column_name.startsWith('sc_p')) {
        console.log(`- ${row.column_name}`);
        sectionCColumns.push(row.column_name);
      }
    });
    
    // Now test the query that would be used for Section C updates
    const queryWithInProgress = `
      SELECT id, status FROM brsr_reports 
      WHERE id = $1 AND company_id = $2 AND (status = 'draft' OR status = 'InProgress' OR status IS NULL)
    `;
    
    const result = await pool.query(queryWithInProgress, [reportId, company_id]);
    console.log('\nSection C update query result (should return rows if report can be updated):');
    
    if (result.rows.length > 0) {
      console.log('Report ID:', result.rows[0].id);
      console.log('Status:', result.rows[0].status);
      console.log('\nSUCCESS: The report can be updated with the current query!');
      
      // If we found Section C columns, try to get their values
      if (sectionCColumns.length > 0) {
        console.log('\nChecking data for Section C columns:');
        const sc_p1_column = sectionCColumns.find(col => col.startsWith('sc_p1'));
        
        if (sc_p1_column) {
          const dataQuery = `
            SELECT ${sc_p1_column} FROM brsr_reports 
            WHERE id = $1 AND company_id = $2
          `;
          try {
            const dataResult = await pool.query(dataQuery, [reportId, company_id]);
            console.log(`Data for ${sc_p1_column}:`, dataResult.rows[0][sc_p1_column]);
          } catch (err) {
            console.error(`Error querying ${sc_p1_column}:`, err.message);
          }
        } else {
          console.log('No column found for Section C Principle 1');
        }
      }
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

testColumns();

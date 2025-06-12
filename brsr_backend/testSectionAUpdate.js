// Test script to update Section A data in the database for a given report
const { pool } = require('./db');

async function testSectionAUpdate() {
  // Set these to valid values for your environment
  const reportId = 26; // Change to a valid report ID in your DB
  const companyId = 7; // Changed to the correct company ID as per user

  // Sample valid Section A data (matches frontend structure and DB columns)
  const sectionAData = {
    sa_business_activities_turnover: [
      { description_main: "Mining", description_business: "Bauxite Mining", turnover_percentage: 60 },
      { description_main: "Refining", description_business: "Alumina Refining", turnover_percentage: 40 }
    ],
    sa_product_services_turnover: [
      { product_service: "Aluminium Ingots", nic_code: "24201", turnover_contributed: 70 },
      { product_service: "Alumina Hydrate", nic_code: "24202", turnover_contributed: 30 }
    ],
    sa_locations_plants_offices: {
      national_plants: 3,
      national_offices: 2,
      international_plants: 1,
      international_offices: 1
    },
    sa_markets_served: {
      locations: { national_states: 12, international_countries: 8 },
      exports_percentage: "25",
      customer_types: "Industrial, Government, Export"
    },
    sa_employee_details: {
      permanent_male: 120,
      permanent_female: 30,
      other_than_permanent_male: 10,
      other_than_permanent_female: 5
    },
    sa_workers_details: {
      permanent_male: 80,
      permanent_female: 10,
      other_than_permanent_male: 15,
      other_than_permanent_female: 2
    },
    sa_differently_abled_details: {
      employees_male: 2,
      employees_female: 1,
      workers_male: 1,
      workers_female: 0
    },
    sa_women_representation_details: {
      board_total_members: 8,
      board_number_of_women: 2,
      kmp_total_personnel: 5,
      kmp_number_of_women: 1
    },
    sa_turnover_rate: {
      permanent_employees_turnover_rate: "5.2",
      permanent_workers_turnover_rate: "7.1"
    },
    sa_holding_subsidiary_associate_companies: [
      { name: "NALCO Power Ltd", cin_or_country: "U40101OR2001GOI006478", type: "Subsidiary", percentage_holding: "100" }
    ],
    sa_csr_applicable: true,
    sa_csr_turnover: "1500000000",
    sa_csr_net_worth: "5000000000",
    sa_transparency_complaints: {
      received: 1,
      pending: 0,
      remarks: "No major complaints"
    }
  };

  // List of allowed DB columns for Section A
  const allowedColumns = [
    'sa_business_activities_turnover',
    'sa_product_services_turnover',
    'sa_locations_plants_offices',
    'sa_markets_served',
    'sa_employee_details',
    'sa_turnover_rate',
    'sa_workers_details',
    'sa_differently_abled_details',
    'sa_holding_subsidiary_associate_companies',
    'sa_csr_applicable',
    'sa_csr_turnover',
    'sa_csr_net_worth',
    'sa_transparency_complaints',
    'sa_women_representation_details'
  ];

  try {
    // Build the update query dynamically for only the allowed columns
    const setClauses = allowedColumns.map((col, idx) => `${col} = $${idx + 1}`);
    const values = allowedColumns.map(col => JSON.stringify(sectionAData[col]));
    // For booleans/numbers, don't stringify
    const booleanCols = ['sa_csr_applicable'];
    const numberCols = [];
    allowedColumns.forEach((col, idx) => {
      if (booleanCols.includes(col)) values[idx] = sectionAData[col];
      if (numberCols.includes(col)) values[idx] = sectionAData[col];
    });
    values.push(reportId, companyId);

    const updateQuery = `
      UPDATE brsr_reports
      SET ${setClauses.join(', ')}
      WHERE id = $${allowedColumns.length + 1} AND company_id = $${allowedColumns.length + 2} AND (status = 'draft' OR status = 'InProgress' OR status IS NULL)
      RETURNING id, status
    `;
    const updateResult = await pool.query(updateQuery, values);
    if (updateResult.rows.length > 0) {
      console.log('\nSUCCESS: Updated Section A columns!');
      console.log('Report ID:', updateResult.rows[0].id);
      console.log('Status:', updateResult.rows[0].status);
      // Verify the update by retrieving the columns
      const verifyQuery = `
        SELECT ${allowedColumns.join(', ')} FROM brsr_reports 
        WHERE id = $1
      `;
      const verifyResult = await pool.query(verifyQuery, [reportId]);
      console.log('\nVerified data in database:');
      console.log(JSON.stringify(verifyResult.rows[0], null, 2));
    } else {
      console.log('\nFAIL: Could not update the report!');
      console.log('Possible reasons:');
      console.log('- Report ID or company ID is incorrect');
      console.log('- Report status is not "draft", "InProgress", or NULL');
    }
    await pool.end();
  } catch (error) {
    console.error('Error running test:', error);
    try { await pool.end(); } catch (e) {}
    process.exit(1);
  }
}

testSectionAUpdate();

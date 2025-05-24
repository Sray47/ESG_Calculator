// directPdfTest.js
// This script directly tests the PDF generation without UI automation
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const API_URL = 'http://localhost:3050/api';
const REPORTS_URL = `${API_URL}/reports`;
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');

// Create directories if they don't exist
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Supabase config
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://czrxdrytvvbbtqfacnwr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cnhkcnl0dnZiYnRxZmFjbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MjI3NzcsImV4cCI6MjA2MzI5ODc3N30.zPjoqzQ1JYRhSkctZyo1_KQhCMGb1YQppNRq-U3hUwQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Login credentials
const credentials = {
  email: 'autotest1747976939143@gmail.com',
  password: 'Test123!'
};

/**
 * Run a direct test of the PDF generation API
 */
async function directPdfTest() {
  try {
    console.log('\n===== STARTING DIRECT PDF TEST =====');
    
    // 1. Login to get authentication token via Supabase
    console.log('1. Authenticating with Supabase...');
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (error || !data || !data.session || !data.session.access_token) {
      throw new Error('Authentication failed - no token received from Supabase');
    }
    const token = data.session.access_token;
    console.log('Authentication successful, received Supabase token');
    
    // 2. Get list of reports
    console.log('\n2. Getting reports list...');
    const reportsResponse = await axios.get(REPORTS_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!reportsResponse.data || !reportsResponse.data.length) {
      throw new Error('No reports found. Please create and submit a report first.');
    }
    
    console.log(`Found ${reportsResponse.data.length} reports`);
    
    // 3. Get the first submitted report
    const submittedReports = reportsResponse.data.filter(report => 
      report.status === 'submitted' || report.status === 'Submitted'
    );
    
    if (!submittedReports.length) {
      throw new Error('No submitted reports found. Please submit a report first.');
    }
    
    const reportId = submittedReports[0].id;
    console.log(`Using report ID: ${reportId}`);
    
    // 4. Download the PDF directly
    console.log('\n3. Downloading PDF...');
    const pdfResponse = await axios.get(`${REPORTS_URL}/${reportId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });
    
    // 5. Save the PDF file
    const pdfFileName = `direct_test_report_${reportId}_${Date.now()}.pdf`;
    const pdfFilePath = path.join(DOWNLOADS_DIR, pdfFileName);

    fs.writeFileSync(pdfFilePath, pdfResponse.data);
    console.log(`PDF saved to: ${pdfFilePath}`);
    const fileSize = fs.statSync(pdfFilePath).size;
    console.log(`PDF file size: ${fileSize} bytes`);

    // --- PDF Signature Check ---
    const fd = fs.openSync(pdfFilePath, 'r');
    const buffer = Buffer.alloc(5);
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    const signature = buffer.toString();
    if (signature !== '%PDF-') {
      throw new Error('Downloaded file is not a valid PDF (missing %PDF- signature)');
    } else {
      console.log('PDF signature check passed.');
    }
    // --- End PDF Signature Check ---

    return {
      success: true,
      message: 'PDF downloaded directly via API',
      pdfPath: pdfFilePath
    };
    
  } catch (error) {
    console.error('❌ TEST FAILED:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    
    return {
      success: false,
      message: `Test failed: ${error.message}`
    };
  }
}

// Run the test
directPdfTest()
  .then(result => {
    console.log('\n===== TEST SUMMARY =====');
    console.log(`Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Message: ${result.message}`);
    if (result.pdfPath) {
      console.log(`PDF generated: ${result.pdfPath}`);
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n===== UNHANDLED ERROR =====');
    console.error(error);
    process.exit(1);
  });

// createAndReportTest.js
// Automated test: create user, fill Section A, submit, and download PDF
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import testData from './testData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://czrxdrytvvbbtqfacnwr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cnhkcnl0dnZiYnRxZmFjbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MjI3NzcsImV4cCI6MjA2MzI5ODc3N30.zPjoqzQ1JYRhSkctZyo1_KQhCMGb1YQppNRq-U3hUwQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_URL = 'http://localhost:3050/api';
const REPORTS_URL = `${API_URL}/reports`;
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

const credentials = {
  email: 'autotest1747976939143@gmail.com',
  password: 'Test123!'
};

async function main() {
  try {
    console.log('1. Registering user with Supabase...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password
    });
    if (signupError) throw new Error('Supabase signup failed: ' + signupError.message);
    console.log('Signup complete:', signupData.user.email);

    // Wait for email confirmation if required (skip for auto-confirmed projects)
    // Try to sign in
    let token;
    for (let i = 0; i < 5; i++) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(credentials);
      if (signInData && signInData.session && signInData.session.access_token) {
        token = signInData.session.access_token;
        break;
      }
      if (signInError) console.log('Sign-in error, retrying...', signInError.message);
      await new Promise(r => setTimeout(r, 2000));
    }
    if (!token) throw new Error('Could not sign in newly registered user.');
    console.log('Authenticated, got token.');

    // 2. Create company profile and initial report via backend
    console.log('2. Creating company profile and initial report...');
    const profilePayload = {
      email: credentials.email,
      password: credentials.password,
      company_name: testData.company.name,
      cin: testData.company.cin,
      year_of_incorporation: testData.company.year_of_incorporation,
      registered_office_address: testData.company.registered_office_address,
      corporate_address: testData.company.corporate_address,
      telephone: testData.company.telephone,
      website: testData.company.website,
      stock_exchange_listed: testData.company.stock_exchange_listed,
      paid_up_capital: testData.company.paid_up_capital,
      brsr_contact_name: testData.company.brsr_contact_name,
      brsr_contact_mail: testData.company.brsr_contact_mail,
      brsr_contact_number: testData.company.brsr_contact_number
    };
    const profileRes = await axios.post(`${API_URL}/auth/register`, profilePayload);
    if (!profileRes.data || !profileRes.data.company) throw new Error('Profile creation failed.');
    console.log('Profile and company created.');

    // 3. Initiate a new report
    const fy = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const reportRes = await axios.post(`${REPORTS_URL}/initiate`, {
      financial_year: fy,
      reporting_boundary: testData.reporting_boundary || 'Standalone'
    }, { headers: { Authorization: `Bearer ${token}` } });
    const reportId = reportRes.data.id;
    console.log('Report initiated:', reportId);

    // 4. Fill Section A (update report)
    const updateRes = await axios.put(`${REPORTS_URL}/${reportId}`, {
      ...testData.sectionA
    }, { headers: { Authorization: `Bearer ${token}` } });
    if (!updateRes.data || updateRes.data.id !== reportId) throw new Error('Section A update failed.');
    console.log('Section A filled.');

    // 5. Submit the report (simulate submission)
    const submitRes = await axios.post(`${REPORTS_URL}/${reportId}/submit`, {}, { headers: { Authorization: `Bearer ${token}` } });
    if (!submitRes.data || !submitRes.data.pdfUrl) throw new Error('Report submission or PDF generation failed.');
    console.log('Report submitted. PDF URL:', submitRes.data.pdfUrl);

    // 6. Download the PDF
    const pdfResponse = await axios.get(`${REPORTS_URL}/${reportId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });
    const pdfFileName = `autotest_report_${reportId}_${Date.now()}.pdf`;
    const pdfFilePath = path.join(DOWNLOADS_DIR, pdfFileName);
    fs.writeFileSync(pdfFilePath, pdfResponse.data);
    console.log('PDF saved to:', pdfFilePath);
    const fileSize = fs.statSync(pdfFilePath).size;
    console.log('PDF file size:', fileSize, 'bytes');
    // Check PDF signature
    const fd = fs.openSync(pdfFilePath, 'r');
    const buffer = Buffer.alloc(5);
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    if (buffer.toString() !== '%PDF-') throw new Error('Downloaded file is not a valid PDF.');
    console.log('PDF signature check passed.');
    console.log('✅ Automated test completed successfully.');
  } catch (err) {
    if (err.response) {
      console.error('❌ Automated test failed:', err.response.data);
    } else {
      console.error('❌ Automated test failed:', err.message);
    }
    process.exit(1);
  }
}

main();

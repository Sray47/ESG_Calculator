// Simple login test to get fresh token
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://czrxdrytvvbbtqfacnwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cnhkcnl0dnZiYnRxZmFjbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MjI3NzcsImV4cCI6MjA2MzI5ODc3N30.zPjoqzQ1JYRhSkctZyo1_KQhCMGb1YQppNRq-U3hUwQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
    try {
        console.log('Attempting to login...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'debug@test.com',
            password: 'Debug123!'
        });
        
        if (error) {
            console.error('Login error:', error);
        } else {
            console.log('Login successful!');
            console.log('Access token:', data.session.access_token);
            console.log('User ID:', data.user.id);
            console.log('Email:', data.user.email);
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

testLogin();

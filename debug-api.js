// Debug utility to check API configuration
// Add this to your browser console to debug API issues

console.log('=== BRSR API Debug Info ===');
console.log('Current URL:', window.location.href);
console.log('Environment Variables:');
console.log('- VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('- Mode:', import.meta.env.MODE);
console.log('- DEV:', import.meta.env.DEV);
console.log('- PROD:', import.meta.env.PROD);

// Test API connectivity
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3050';
console.log('API Base URL being used:', API_BASE);

// Test backend health
fetch(`${API_BASE}/api/test`)
  .then(response => {
    console.log('✅ Backend health check - Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Backend response:', data);
  })
  .catch(error => {
    console.error('❌ Backend health check failed:', error);
    console.log('Possible issues:');
    console.log('1. VITE_API_BASE_URL not set correctly');
    console.log('2. Backend not deployed');
    console.log('3. CORS issues');
  });

console.log('=== End Debug Info ===');

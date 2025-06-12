const pdfGenerator = require('./pdfGenerator_fixed.js');

// Test data from user
const jsonData = {
  'sc_p6_environment_protection': {
    'essential_indicators': {
      'operations_in_or_near_biodiversity_hotspots': 'sensitive'
    }
  }
};

console.log('Testing PDF generation with user data...');
try {
  // Try to call the renderPrinciple6 function directly
  if (pdfGenerator.renderPrinciple6) {
    const content = pdfGenerator.renderPrinciple6(jsonData.sc_p6_environment_protection, {});
    console.log('SUCCESS: PDF generation completed without errors');
  } else {
    console.log('renderPrinciple6 function not found in exports');
    console.log('Available exports:', Object.keys(pdfGenerator));
  }
} catch (error) {
  console.error('ERROR in PDF generation:', error.message);
  console.error('Stack trace:', error.stack);
}

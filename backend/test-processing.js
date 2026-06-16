const path = require('path');
const { processExcelFile } = require('./services/excelHandler');

async function test() {
  console.log('=== TESTING FULL PROCESSING ===');
  
  const filePath = 'C:\\Users\\i50055736\\Documents\\Cotizador\\Cotizacion EMEC Mar 9, 2026.xlsx';
  
  try {
    const result = await processExcelFile(filePath);
    
    console.log('\n=== RESULTS ===');
    console.log('Structure:', JSON.stringify(result.structure, null, 2));
    console.log('\nFormulas generated:', Object.keys(result.formulas).length);
    console.log('Sample formulas:', Object.entries(result.formulas).slice(0, 5));
    console.log('\nData rows extracted:', result.data.length);
    console.log('Sample data:', result.data.slice(0, 3));
    
    console.log('\n✅ SUCCESS: File processed correctly');
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

test();

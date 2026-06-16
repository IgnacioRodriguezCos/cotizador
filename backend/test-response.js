const { processExcelFile } = require('./services/excelHandler');

async function testResponse() {
  const filePath = 'C:\\Users\\i50055736\\Documents\\Cotizador\\Cotizacion EMEC Mar 9, 2026.xlsx';
  
  try {
    const result = await processExcelFile(filePath);
    
    console.log('\n=== RESPONSE DATA ===');
    console.log('Has rowColors:', !!result.rowColors);
    console.log('rowColors count:', result.rowColors ? Object.keys(result.rowColors).length : 0);
    console.log('Sample rowColors:', result.rowColors ? Object.entries(result.rowColors).slice(0, 10) : []);
    console.log('\nFormulas count:', Object.keys(result.formulas).length);
    console.log('Sample formulas:', Object.entries(result.formulas).slice(0, 10));
    console.log('\nStructure:', JSON.stringify(result.structure, null, 2));
    
    console.log('\n=== JSON RESPONSE SIMULATION ===');
    const jsonResult = {
      id: 'test-id',
      originalName: 'test.xlsx',
      structure: result.structure,
      formulas: result.formulas,
      data: result.data,
      rowColors: result.rowColors
    };
    
    console.log('JSON has rowColors:', !!jsonResult.rowColors);
    console.log('JSON rowColors keys:', jsonResult.rowColors ? Object.keys(jsonResult.rowColors).slice(0, 10) : []);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testResponse();

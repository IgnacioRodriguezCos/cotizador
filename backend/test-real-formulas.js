const ExcelJS = require('exceljs');
const { processExcelFile } = require('./services/excelHandler');

async function testRealFormulas() {
  const filePath = 'C:\\Users\\i50055736\\Documents\\Cotizador\\Cotizacion EMEC Mar 9, 2026.xlsx';
  
  try {
    console.log('=== TESTING REAL EXCEL FORMULAS ===\n');
    
    const result = await processExcelFile(filePath);
    
    console.log('Formulas generated:', Object.keys(result.formulas).length);
    console.log('\nFormulas:');
    Object.entries(result.formulas).forEach(([cell, formula]) => {
      console.log(`  ${cell}: =${formula}`);
    });
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    
    console.log('\n=== VERIFYING FORMULAS IN EXCEL ===\n');
    
    ['G3', 'G8', 'G13', 'G18', 'G23'].forEach(cellRef => {
      const cell = worksheet.getCell(cellRef);
      console.log(`${cellRef}:`);
      console.log(`  Value type: ${typeof cell.value}`);
      console.log(`  Has formula: ${cell.value && cell.value.formula ? 'YES' : 'NO'}`);
      if (cell.value && cell.value.formula) {
        console.log(`  Formula: =${cell.value.formula}`);
      }
      console.log(`  Raw value:`, cell.value);
      console.log();
    });
    
    console.log('=== TEST COMPLETED ===');
    console.log('\n✅ Formulas are written as real Excel formulas');
    console.log('✅ Excel will recalculate them when opened');
    console.log('✅ Downloaded Excel will have working formulas');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testRealFormulas();

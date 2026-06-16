const { processExcelFile } = require('./services/excelHandler');

async function testFormulaEvaluation() {
  const filePath = 'C:\\Users\\i50055736\\Documents\\Cotizador\\Cotizacion EMEC Mar 9, 2026.xlsx';
  
  try {
    const result = await processExcelFile(filePath);
    
    console.log('\n=== FORMULA EVALUATION TEST ===');
    console.log('Formulas generated:', Object.keys(result.formulas).length);
    console.log('Formula results:', Object.keys(result.formulaResults).length);
    
    console.log('\n=== SAMPLE FORMULAS AND RESULTS ===');
    Object.entries(result.formulas).forEach(([cellRef, formula]) => {
      const calculatedResult = result.formulaResults[cellRef];
      console.log(`${cellRef}: ${formula} = ${calculatedResult}`);
    });
    
    console.log('\n=== VERIFICATION ===');
    console.log('G3 should be sum of G4:G7');
    console.log('G8 should be sum of G9:G12');
    console.log('G13 should be sum of G14:G17');
    console.log('G18 should be sum of G19:G22');
    console.log('G23 should be G3+G8+G13+G18');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testFormulaEvaluation();

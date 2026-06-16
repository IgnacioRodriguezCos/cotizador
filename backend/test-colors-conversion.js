const { processExcelFile } = require('./services/excelHandler');

async function testColors() {
  const filePath = 'C:\\Users\\i50055736\\Documents\\Cotizador\\Cotizacion EMEC Mar 9, 2026.xlsx';
  
  try {
    const result = await processExcelFile(filePath);
    
    console.log('\n=== COLOR CONVERSION TEST ===');
    
    if (result.rowColors) {
      Object.entries(result.rowColors).forEach(([row, argb]) => {
        const hex = '#' + argb.substring(2);
        console.log(`Row ${row}: ARGB=${argb} → HEX=${hex}`);
      });
    }
    
    console.log('\n=== EXPECTED COLORS ===');
    console.log('Azul:    #1874CD (ARGB: FF1874CD)');
    console.log('Gris:    #DBDBDB (ARGB: FFDBDBDB)');
    console.log('Gris claro: #F5F5F5 (ARGB: FFF5F5F5)');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testColors();

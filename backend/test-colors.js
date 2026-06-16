const ExcelJS = require('exceljs');
const path = require('path');

async function test() {
  console.log('=== TESTING COLOR DETECTION ===');
  
  const filePath = 'C:\\Users\\i50055736\\Documents\\Cotizador\\Cotizacion EMEC Mar 9, 2026.xlsx';
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.worksheets[0];
  console.log('Worksheet:', worksheet.name);
  console.log('Rows:', worksheet.rowCount);
  
  for (let i = 1; i <= Math.min(10, worksheet.rowCount); i++) {
    const row = worksheet.getRow(i);
    const cell = row.getCell(1);
    
    console.log(`\nRow ${i}:`);
    console.log('  Cell value:', cell.value);
    
    if (cell.fill) {
      console.log('  Fill type:', cell.fill.type);
      console.log('  Fill fgColor:', JSON.stringify(cell.fill.fgColor, null, 2));
      console.log('  Fill bgColor:', JSON.stringify(cell.fill.bgColor, null, 2));
    } else {
      console.log('  No fill');
    }
  }
}

test().catch(console.error);

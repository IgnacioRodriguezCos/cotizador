const express = require('express');
const cors = require('cors');
const { processExcelFile } = require('./services/excelHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/test', async (req, res) => {
  const filePath = 'C:\\Users\\i50055736\\Documents\\Cotizador\\Cotizacion EMEC Mar 9, 2026.xlsx';
  
  try {
    const result = await processExcelFile(filePath);
    
    console.log('\n=== BACKEND SENDING ===');
    console.log('rowColors type:', typeof result.rowColors);
    console.log('rowColors sample:');
    
    Object.entries(result.rowColors).slice(0, 5).forEach(([row, color]) => {
      console.log(`  Row ${row}: "${color}" (length: ${color.length})`);
    });
    
    res.json({
      rowColors: result.rowColors,
      sample: Object.entries(result.rowColors).slice(0, 5)
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3333, () => console.log('Test server on http://localhost:3333/test'));

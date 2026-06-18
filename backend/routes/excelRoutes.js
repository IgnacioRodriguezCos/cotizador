const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const upload = require('../middleware/upload');
const { processExcelFile, updateCellValue, getExcelBuffer } = require('../services/excelHandler');
const { recalculateAffectedFormulas } = require('../services/formulaRecalculator');
const debugLogger = require('../services/debugLogger');
const { generateDebugReport, validateFormulaCalculation } = require('../services/debugService');
const pricingService = require('../services/pricingService');
const imagesService = require('../services/imagesService');

const fileMap = new Map();

router.post('/upload', upload.single('file'), async (req, res) => {
  console.log('=== UPLOAD REQUEST ===');
  debugLogger.addLog('UPLOAD', 'Iniciando upload de archivo');
  
  try {
    if (!req.file) {
      console.error('No file in request');
      debugLogger.addLog('ERROR', 'No se proporcionó archivo');
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const fileId = path.basename(req.file.filename, path.extname(req.file.filename));
    const filePath = req.file.path;

    console.log('File received:', req.file.originalname);
    console.log('File ID:', fileId);
    console.log('File path:', filePath);
    
    debugLogger.addLog('UPLOAD', `Archivo recibido: ${req.file.originalname}`, { fileId, filePath });

    const result = await processExcelFile(filePath, req.file.originalname);
    
    debugLogger.addLog('STRUCTURE', 'Estructura detectada', result.structure);
    debugLogger.addLog('FORMULAS', `Fórmulas generadas: ${Object.keys(result.formulas).length}`, result.formulas);

    fileMap.set(fileId, {
      path: filePath,
      originalName: req.file.originalname,
      processedAt: new Date(),
      structure: result.structure,
      region: result.region
    });
    
    debugLogger.addLog('UPLOAD', 'Archivo procesado exitosamente', { fileId, region: result.region });

    console.log('Upload successful');
    console.log('Sending response with rowColors:', !!result.rowColors);
    console.log('Region:', result.region);

    res.json({
      id: fileId,
      originalName: req.file.originalname,
      structure: result.structure,
      formulas: result.formulas,
      data: result.data,
      rowColors: result.rowColors,
      merges: result.merges,
      region: result.region
    });

  } catch (error) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    debugLogger.addLog('ERROR', 'Error en upload', { message: error.message, stack: error.stack });
    
    if (error.message.includes('theme') || error.message.includes('color')) {
      res.status(500).json({ 
        error: 'Error al detectar colores del archivo', 
        details: 'El archivo puede tener un formato de colores no soportado',
        suggestion: 'Intenta guardar el archivo con colores sólidos (no theme colors)'
      });
    } else if (error.message.includes('reading')) {
      res.status(500).json({ 
        error: 'Error al leer el archivo', 
        details: 'El archivo puede estar corrupto o no ser un Excel válido'
      });
    } else {
      res.status(500).json({ 
        error: 'Error al procesar el archivo', 
        details: error.message 
      });
    }
  }
});

router.put('/cell', async (req, res) => {
  try {
    const { id, row, col, value } = req.body;

    console.log('=== CELL UPDATE REQUEST ===');
    console.log('Cell:', `${col}${row}`);
    console.log('Value:', value);

    if (!id || !row || !col) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    debugLogger.addLog('CELL_UPDATE', `Actualizando celda ${col}${row}`, { id, value });

    const fileInfo = fileMap.get(id);
    if (!fileInfo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(fileInfo.path);
    const worksheet = workbook.worksheets[0];
    
    const cell = worksheet.getCell(`${col}${row}`);
    const numValue = parseFloat(value);
    cell.value = isNaN(numValue) ? value : numValue;
    
    console.log('Cell value set to:', cell.value);
    
    const updatedCells = recalculateAffectedFormulas(
      `${col}${row}`,
      worksheet,
      fileInfo.structure
    );
    
    console.log('Updated cells by recalculation:', updatedCells);
    
    debugLogger.addLog('RECALC', 'Celdas actualizadas por recálculo', updatedCells);
    
    await workbook.xlsx.writeFile(fileInfo.path);
    
    const data = [];
    for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
      const wsRow = worksheet.getRow(rowNum);
      const rowData = { row: rowNum, cells: {} };
      
      for (let colNum = 1; colNum <= worksheet.columnCount; colNum++) {
        const wsCell = wsRow.getCell(colNum);
        const colLetter = String.fromCharCode(64 + colNum);
        
        if (wsCell.value !== null && wsCell.value !== undefined) {
          if (typeof wsCell.value === 'object' && wsCell.value.formula) {
            let value = wsCell.value.result !== undefined ? wsCell.value.result : wsCell.value.formula;
            
            if (typeof value === 'object' && value.richText) {
              value = value.richText.map(rt => rt.text).join('');
            }
            
            rowData.cells[colLetter] = {
              value: value,
              formula: wsCell.value.formula,
              type: 'formula'
            };
          } else if (typeof wsCell.value === 'object' && wsCell.value.richText) {
            rowData.cells[colLetter] = {
              value: wsCell.value.richText.map(rt => rt.text).join(''),
              type: 'value'
            };
          } else if (typeof wsCell.value === 'object') {
            rowData.cells[colLetter] = {
              value: JSON.stringify(wsCell.value),
              type: 'value'
            };
          } else {
            rowData.cells[colLetter] = {
              value: wsCell.value,
              type: 'value'
            };
          }
        }
      }
      
      if (Object.keys(rowData.cells).length > 0) {
        data.push(rowData);
      }
    }

    res.json({ 
      success: true, 
      updatedCells,
      data 
    });

  } catch (error) {
    console.error('Error updating cell:', error);
    debugLogger.addLog('ERROR', 'Error actualizando celda', { message: error.message });
    res.status(500).json({ error: 'Error al actualizar celda', details: error.message });
  }
});

router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fileInfo = fileMap.get(id);

    if (!fileInfo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const buffer = await getExcelBuffer(fileInfo.path);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
    res.send(buffer);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Error al descargar archivo', details: error.message });
  }
});

router.get('/file/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fileInfo = fileMap.get(id);

    if (!fileInfo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const result = await processExcelFile(fileInfo.path);

    res.json({
      id,
      structure: result.structure,
      formulas: result.formulas,
      data: result.data,
      rowColors: result.rowColors
    });

  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: 'Error al obtener archivo', details: error.message });
  }
});

router.get('/debug/colors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fileInfo = fileMap.get(id);

    if (!fileInfo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(fileInfo.path);
    const worksheet = workbook.worksheets[0];
    
    const colors = [];
    for (let rowNum = 1; rowNum <= Math.min(worksheet.rowCount, 30); rowNum++) {
      const row = worksheet.getRow(rowNum);
      const firstCell = row.getCell(1);
      
      let colorInfo = {
        row: rowNum,
        color: null,
        colorType: null,
        fill: null
      };
      
      if (firstCell && firstCell.fill && firstCell.fill.fgColor) {
        const color = firstCell.fill.fgColor;
        colorInfo.color = color.rgb || null;
        colorInfo.colorType = color.type || null;
        colorInfo.fill = JSON.stringify(color);
      }
      
      colors.push(colorInfo);
    }

    res.json({
      fileName: fileInfo.originalName,
      totalRows: worksheet.rowCount,
      colors
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Error en debug', details: error.message });
  }
});

router.get('/debug/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fileInfo = fileMap.get(id);

    if (!fileInfo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    debugLogger.addLog('DEBUG', 'Generando reporte de debug');
    
    const report = await generateDebugReport(fileInfo.path, id, fileMap);
    
    res.json(report);

  } catch (error) {
    console.error('Error generating debug report:', error);
    debugLogger.addLog('ERROR', 'Error generando debug report', { message: error.message });
    res.status(500).json({ error: 'Error generando debug report', details: error.message });
  }
});

router.get('/debug/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const fileInfo = fileMap.get(id);

    if (!fileInfo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    debugLogger.addLog('DEBUG', 'Validando fórmulas');
    
    const validation = await validateFormulaCalculation(fileInfo.path, id, fileMap);
    
    res.json(validation);

  } catch (error) {
    console.error('Error validating formulas:', error);
    res.status(500).json({ error: 'Error validando fórmulas', details: error.message });
  }
});

router.get('/debug/logs', (req, res) => {
  const { category, limit } = req.query;
  const logs = debugLogger.getLogs(category, parseInt(limit) || 100);
  res.json({ logs, total: logs.length });
});

router.delete('/debug/logs', (req, res) => {
  debugLogger.clearLogs();
  res.json({ success: true, message: 'Logs cleared' });
});

router.get('/debug/filemap', (req, res) => {
  const files = [];
  fileMap.forEach((value, key) => {
    files.push({
      id: key,
      originalName: value.originalName,
      processedAt: value.processedAt,
      structure: value.structure
    });
  });
  res.json({ files, total: files.length });
});

router.post('/image-options', async (req, res) => {
  console.log('=== IMAGE OPTIONS REQUEST ===');
  console.log('Request body:', req.body);
  
  try {
    const { fileId, typeValue } = req.body;
    
    if (!fileId) {
      console.log('ERROR: Missing fileId');
      return res.status(400).json({ error: 'fileId requerido' });
    }
    
    const fileInfo = fileMap.get(fileId);
    if (!fileInfo) {
      console.log('ERROR: File not found for fileId:', fileId);
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    const region = fileInfo.region;
    console.log('Region:', region);
    console.log('Type value:', typeValue);
    
    const pricingResult = pricingService.getImageOptions(region, typeValue);
    
    console.log('Pricing result:', JSON.stringify(pricingResult, null, 2));
    
    if (pricingResult.error || !pricingResult.options || pricingResult.options.length === 0) {
      res.json(pricingResult);
      return;
    }
    
    const optionsWithFullNames = pricingResult.options.map(opt => {
      const fullNames = imagesService.getImagesByType(opt.value);
      
      return {
        label: opt.label,
        value: opt.value,
        price: opt.price,
        fullNames: fullNames
      };
    });
    
    const result = {
      region: pricingResult.region,
      category: pricingResult.category,
      flavor: pricingResult.flavor,
      options: optionsWithFullNames
    };
    
    console.log('Result with full names:', JSON.stringify(result, null, 2));
    
    debugLogger.addLog('IMAGE_OPTIONS', 'Opciones de imagen obtenidas', {
      region,
      typeValue,
      optionsCount: result.options?.length || 0
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('ERROR getting image options:', error);
    debugLogger.addLog('ERROR', 'Error obteniendo opciones de imagen', { message: error.message });
    res.status(500).json({ error: 'Error obteniendo opciones', details: error.message });
  }
});

module.exports = router;

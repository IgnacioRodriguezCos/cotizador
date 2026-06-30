const ExcelJS = require('exceljs');
const { getRowColor, COLORS } = require('./colorDetector');
const debugLogger = require('./debugLogger');
const pricingService = require('./pricingService');

async function generateDebugReport(filePath, fileId, fileMap) {
  const report = {
    timestamp: new Date().toISOString(),
    fileId,
    file: {},
    structure: {},
    colors: [],
    formulas: [],
    cells: [],
    validation: [],
    logs: [],
    region: null,
    regionSearch: null,
    typeCells: []
  };
  
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    
    report.file = {
      path: filePath,
      worksheetName: worksheet.name,
      totalRows: worksheet.rowCount,
      totalCols: worksheet.columnCount,
      hasFormulas: false,
      formulaCount: 0
    };
    
    const fileInfo = fileMap.get(fileId);
    if (fileInfo) {
      report.structure = {
        headerRows: fileInfo.structure.headerRows,
        serviceRows: fileInfo.structure.serviceRows,
        componentRows: fileInfo.structure.componentRows.length,
        componentRowsList: fileInfo.structure.componentRows.slice(0, 20),
        totalRow: fileInfo.structure.totalRow,
        footerRows: fileInfo.structure.footerRows,
        lastValidRow: fileInfo.structure.lastValidRow
      };
      
      report.region = fileInfo.region;
    }
    
    const regionSearch = {
      found: 0,
      regionCell: null,
      regionValue: null
    };
    
    for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);
      
      for (let colNum = 1; colNum <= worksheet.columnCount; colNum++) {
        const cell = row.getCell(colNum);
        const cellValue = cell.value ? String(cell.value).toLowerCase().trim() : '';
        
        if (cellValue === 'region') {
          regionSearch.found++;
          regionSearch.regionCell = `${String.fromCharCode(64 + colNum)}${rowNum}`;
          
          const nextRow = worksheet.getRow(rowNum + 1);
          const regionCell = nextRow.getCell(colNum);
          regionSearch.regionValue = regionCell.value ? String(regionCell.value).trim() : null;
        }
      }
    }
    
    report.regionSearch = regionSearch;
    
    if (!report.region) {
      report.validation.push({
        level: 'ERROR',
        message: 'Región no detectada',
        suggestion: 'Agrega una celda con texto "Region" y debajo "LA-Santiago" o "LA-Buenos Aires1"'
      });
    }
    
    const typeCellsSearch = [];
    
    for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);
      
      for (let colNum = 1; colNum <= worksheet.columnCount; colNum++) {
        const cell = row.getCell(colNum);
        const cellValue = cell.value ? String(cell.value).toLowerCase().trim() : '';
        
        if (cellValue === 'type' || cellValue === 'tipo') {
          const nextCol = colNum + 1;
          const typeCell = row.getCell(nextCol);
          const typeValue = typeCell.value ? String(typeCell.value).trim() : null;
          
          if (typeValue) {
            const parsed = pricingService.parseTypeCell(typeValue);
            const normalizedCategory = parsed ? pricingService.normalizeCategory(parsed.category) : null;
            
            const typeInfo = {
              row: rowNum,
              cell: `${String.fromCharCode(64 + colNum)}${rowNum}`,
              typeCell: `${String.fromCharCode(64 + nextCol)}${rowNum}`,
              typeValue: typeValue,
              parsed: parsed,
              normalizedCategory: normalizedCategory,
              imageOptions: null,
              validation: []
            };
            
            if (!parsed) {
              typeInfo.validation.push({
                level: 'ERROR',
                message: 'No se pudo parsear la celda Type',
                suggestion: 'Formato esperado: "arch | category | flavor | vcpus | ram"'
              });
            } else {
              if (report.region) {
                const imageOptions = pricingService.getAvailableImages(
                  report.region,
                  parsed.category,
                  parsed.flavor
                );
                
                typeInfo.imageOptions = imageOptions;
                
                if (imageOptions.error) {
                  typeInfo.validation.push({
                    level: 'WARNING',
                    message: imageOptions.error,
                    suggestion: imageOptions.availableCategories 
                      ? `Categorías disponibles: ${imageOptions.availableCategories.join(', ')}`
                      : imageOptions.availableFlavors
                      ? `Flavors disponibles: ${imageOptions.availableFlavors.slice(0, 5).join(', ')}...`
                      : null
                  });
                } else if (imageOptions.options && imageOptions.options.length === 0) {
                  typeInfo.validation.push({
                    level: 'WARNING',
                    message: 'No hay opciones de imagen disponibles',
                    suggestion: 'El flavor puede no tener precios configurados'
                  });
                } else {
                  typeInfo.validation.push({
                    level: 'SUCCESS',
                    message: `${imageOptions.options.length} opciones de imagen disponibles`,
                    options: imageOptions.options.map(o => o.label)
                  });
                }
              } else {
                typeInfo.validation.push({
                  level: 'WARNING',
                  message: 'No se puede validar sin región',
                  suggestion: 'Primero configura la región en el Excel'
                });
              }
            }
            
            typeCellsSearch.push(typeInfo);
          }
        }
      }
    }
    
    report.typeCells = typeCellsSearch;
    
    const billingInfo = {
      payPerUse: [],
      monthly: [],
      yearly: [],
      other: [],
      summary: {}
    };
    
    if (fileInfo && fileInfo.structure && fileInfo.structure.serviceRows) {
      for (const rowNum of fileInfo.structure.serviceRows) {
        const row = worksheet.getRow(rowNum);
        const eCell = row.getCell(5);
        const eValue = eCell.value ? String(eCell.value).toLowerCase().trim() : '';
        
        const billingType = {
          row: rowNum,
          cell: `E${rowNum}`,
          value: eCell.value || '',
          type: null
        };
        
        if (eValue === 'pay-per-use' || eValue === 'pago por uso' || eValue === 'pago-por-uso') {
          billingType.type = 'Pay-per-use';
          billingInfo.payPerUse.push(billingType);
        } else if (eValue === 'monthly' || eValue === 'mensual') {
          billingType.type = 'Monthly';
          billingInfo.monthly.push(billingType);
        } else if (eValue === 'yearly' || eValue === 'anual') {
          billingType.type = 'Yearly';
          billingInfo.yearly.push(billingType);
        } else if (eValue) {
          billingType.type = 'Other';
          billingInfo.other.push(billingType);
        }
      }
    }
    
    billingInfo.summary = {
      total: billingInfo.payPerUse.length + billingInfo.monthly.length + billingInfo.yearly.length + billingInfo.other.length,
      payPerUse: billingInfo.payPerUse.length,
      monthly: billingInfo.monthly.length,
      yearly: billingInfo.yearly.length,
      other: billingInfo.other.length
    };
    
    report.billing = billingInfo;
    
    for (let rowNum = 1; rowNum <= Math.min(worksheet.rowCount, 30); rowNum++) {
      const row = worksheet.getRow(rowNum);
      const firstCell = row.getCell(1);
      
      let colorInfo = {
        row: rowNum,
        argb: null,
        hex: null,
        type: null,
        resolved: null,
        matched: null
      };
      
      if (firstCell && firstCell.fill && firstCell.fill.fgColor) {
        const color = firstCell.fill.fgColor;
        colorInfo.type = color.type || 'argb';
        
        if (color.argb) {
          colorInfo.argb = color.argb;
          colorInfo.hex = '#' + color.argb.substring(2);
        } else if (color.rgb) {
          colorInfo.argb = color.rgb;
          colorInfo.hex = '#' + color.rgb;
        } else if (color.theme !== undefined) {
          colorInfo.argb = `theme:${color.theme}`;
          colorInfo.hex = `theme:${color.theme}`;
        }
        
        const resolved = getRowColor(worksheet, rowNum);
        colorInfo.resolved = resolved;
        
        if (resolved === COLORS.BLUE) {
          colorInfo.matched = 'BLUE (Header)';
        } else if (resolved === COLORS.GRAY) {
          colorInfo.matched = 'GRAY (Subheader)';
        } else if (resolved === COLORS.GRAY_LIGHT) {
          colorInfo.matched = 'GRAY_LIGHT (Component)';
        } else if (resolved === null) {
          colorInfo.matched = 'No color (Service/Total)';
        } else {
          colorInfo.matched = 'UNKNOWN';
        }
      } else {
        colorInfo.matched = 'No fill';
      }
      
      report.colors.push(colorInfo);
    }
    
    const formulaColumns = ['G', 'H', 'I'];
    for (let rowNum = 1; rowNum <= Math.min(worksheet.rowCount, 30); rowNum++) {
      formulaColumns.forEach(col => {
        const cell = worksheet.getCell(`${col}${rowNum}`);
        
        if (cell.value && typeof cell.value === 'object' && cell.value.formula) {
          report.file.hasFormulas = true;
          report.file.formulaCount++;
          
          report.formulas.push({
            cell: `${col}${rowNum}`,
            formula: cell.value.formula,
            result: cell.value.result,
            calculatedValue: cell.value.result !== undefined ? cell.value.result : 'N/A'
          });
        }
      });
    }
    
    const importantRows = [];
    if (fileInfo) {
      importantRows.push(...fileInfo.structure.headerRows);
      importantRows.push(...fileInfo.structure.serviceRows);
      importantRows.push(fileInfo.structure.totalRow);
    }
    
    importantRows.forEach(rowNum => {
      if (!rowNum) return;
      
      const row = worksheet.getRow(rowNum);
      const rowData = {
        row: rowNum,
        cells: {}
      };
      
      for (let colNum = 1; colNum <= 9; colNum++) {
        const colLetter = String.fromCharCode(64 + colNum);
        const cell = row.getCell(colNum);
        
        if (cell.value !== null && cell.value !== undefined) {
          if (typeof cell.value === 'object' && cell.value.formula) {
            rowData.cells[colLetter] = {
              value: cell.value.result !== undefined ? cell.value.result : cell.value.formula,
              formula: cell.value.formula,
              type: 'formula'
            };
          } else {
            rowData.cells[colLetter] = {
              value: cell.value,
              type: 'value'
            };
          }
        }
      }
      
      report.cells.push(rowData);
    });
    
    if (fileInfo) {
      if (fileInfo.structure.serviceRows.length === 0) {
        report.validation.push({
          level: 'ERROR',
          message: 'No se detectaron filas de servicio',
          suggestion: 'Verifica que las filas de servicio no tengan color de fondo'
        });
      }
      
      if (fileInfo.structure.componentRows.length === 0) {
        report.validation.push({
          level: 'ERROR',
          message: 'No se detectaron filas de componentes',
          suggestion: 'Verifica que las filas de componentes tengan color gris claro (#F5F5F5)'
        });
      }
      
      if (!fileInfo.structure.totalRow) {
        report.validation.push({
          level: 'WARNING',
          message: 'No se detectó fila de total',
          suggestion: 'Verifica que la última fila sin color sea el total'
        });
      }
      
      if (report.file.formulaCount === 0) {
        report.validation.push({
          level: 'WARNING',
          message: 'No hay fórmulas en el archivo',
          suggestion: 'Las fórmulas se generan automáticamente al procesar el archivo'
        });
      }
      
      fileInfo.structure.serviceRows.forEach((serviceRow, idx) => {
        const nextService = fileInfo.structure.serviceRows[idx + 1] || fileInfo.structure.totalRow;
        const components = fileInfo.structure.componentRows.filter(r => 
          r > serviceRow && r < nextService
        );
        
        if (components.length === 0) {
          report.validation.push({
            level: 'WARNING',
            message: `Servicio en fila ${serviceRow} no tiene componentes`,
            suggestion: `Verifica que haya filas con gris claro entre fila ${serviceRow} y ${nextService}`
          });
        }
      });
    }
    
    report.logs = debugLogger.getLogs(null, 50);
    
  } catch (error) {
    report.validation.push({
      level: 'ERROR',
      message: `Error generando reporte de debug: ${error.message}`,
      stack: error.stack
    });
  }
  
  return report;
}

async function validateFormulaCalculation(filePath, fileId, fileMap) {
  const results = {
    valid: true,
    errors: [],
    tests: []
  };
  
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    
    const fileInfo = fileMap.get(fileId);
    if (!fileInfo) {
      results.errors.push('Archivo no encontrado en fileMap');
      results.valid = false;
      return results;
    }
    
    fileInfo.structure.serviceRows.forEach((serviceRow, idx) => {
      const nextService = fileInfo.structure.serviceRows[idx + 1] || fileInfo.structure.totalRow;
      const components = fileInfo.structure.componentRows.filter(r => 
        r > serviceRow && r < nextService
      );
      
      ['G', 'H', 'I'].forEach(col => {
        const cell = worksheet.getCell(`${col}${serviceRow}`);
        
        if (cell.value && typeof cell.value === 'object' && cell.value.formula) {
          const formula = cell.value.formula;
          const expectedRange = components.length > 0 
            ? `SUM(${col}${Math.min(...components)}:${col}${Math.max(...components)})`
            : null;
          
          results.tests.push({
            cell: `${col}${serviceRow}`,
            type: 'service',
            formula,
            expectedRange,
            match: formula === expectedRange,
            components: components.length
          });
          
          if (expectedRange && formula !== expectedRange) {
            results.valid = false;
            results.errors.push(`Fórmula incorrecta en ${col}${serviceRow}: esperada ${expectedRange}, encontrada ${formula}`);
          }
        }
      });
    });
    
  } catch (error) {
    results.valid = false;
    results.errors.push(`Error en validación: ${error.message}`);
  }
  
  return results;
}

module.exports = {
  generateDebugReport,
  validateFormulaCalculation
};

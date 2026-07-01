const ExcelJS = require('exceljs');
const { detectStructure } = require('./colorDetector');
const { generateAllFormulas } = require('./formulaGenerator');
const { evaluateFormulaInMemory } = require('./formulaRecalculator');

function detectRegionFromExcel(worksheet) {
  for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    
    for (let colNum = 1; colNum <= worksheet.columnCount; colNum++) {
      const cell = row.getCell(colNum);
      const cellValue = cell.value ? String(cell.value).toLowerCase().trim() : '';
      
      if (cellValue === 'region') {
        const nextRow = worksheet.getRow(rowNum + 1);
        const regionCell = nextRow.getCell(colNum);
        const regionValue = regionCell.value ? String(regionCell.value).trim() : '';
        
        console.log(`Found "Region" at row ${rowNum}, col ${colNum}`);
        console.log(`Region value: "${regionValue}"`);
        
        if (regionValue.toLowerCase().includes('santiago')) {
          return 'santiago';
        } else if (regionValue.toLowerCase().includes('buenos aires')) {
          return 'argentina';
        }
      }
    }
  }
  
  console.log('No region found in Excel, defaulting to santiago');
  return 'santiago';
}

async function processExcelFile(filePath, originalFileName) {
  console.log('=== PROCESSING EXCEL FILE ===');
  console.log('File path:', filePath);
  console.log('Original file name:', originalFileName);
  
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    console.log('Workbook loaded successfully');
    console.log('Number of worksheets:', workbook.worksheets.length);
    
    const worksheet = workbook.worksheets[0];
    console.log('Using worksheet:', worksheet.name);
    
    const structure = detectStructure(worksheet);
    
    if (structure.serviceRows.length === 0) {
      console.warn('WARNING: No service rows detected!');
    }
    
    if (structure.componentRows.length === 0) {
      console.warn('WARNING: No component rows detected!');
    }
    
    const formulas = generateAllFormulas(worksheet, structure);
    console.log('Formulas generated:', Object.keys(formulas).length);
    
    const data = extractData(worksheet);
    
    const rowColors = extractRowColors(worksheet, structure);
    
    const merges = extractMerges(worksheet);
    console.log('Merged cells:', merges.length);
    
    const region = detectRegionFromExcel(worksheet);
    console.log('Detected region:', region);
    
    await workbook.xlsx.writeFile(filePath);
    console.log('File saved successfully');
    
    return {
      structure,
      formulas,
      data,
      rowColors,
      merges,
      region
    };
  } catch (error) {
    console.error('ERROR processing Excel file:', error);
    throw error;
  }
}

function extractRowColors(worksheet, structure) {
  const rowColors = {};
  
  const maxRowsToCheck = Math.min(worksheet.rowCount, 1000);
  
  for (let rowNum = 1; rowNum <= maxRowsToCheck; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const firstCell = row.getCell(1);
    
    if (firstCell && firstCell.fill && firstCell.fill.fgColor) {
      const color = firstCell.fill.fgColor;
      if (color.argb && color.argb !== '00000000') {
        rowColors[rowNum] = color.argb;
      }
    }
  }
  
  console.log('Extracted colors for', Object.keys(rowColors).length, 'rows');
  
  return rowColors;
}

function extractData(worksheet) {
  const data = [];
  
  console.log('=== EXTRACTING DATA ===');
  
  for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const rowData = {
      row: rowNum,
      cells: {}
    };
    
    for (let colNum = 1; colNum <= worksheet.columnCount; colNum++) {
      const cell = row.getCell(colNum);
      const colLetter = getColLetter(colNum);
      
      if (cell.value !== null && cell.value !== undefined) {
        try {
          if (typeof cell.value === 'object' && cell.value.formula) {
            let calculatedValue;
            
            if (cell.value.result !== undefined && cell.value.result !== null) {
              calculatedValue = cell.value.result;
              console.log(`Cell ${colLetter}${rowNum}: formula=${cell.value.formula}, result=${calculatedValue}, type=${typeof calculatedValue}`);
            } else {
              calculatedValue = evaluateFormulaInMemory(cell.value.formula, worksheet);
              console.log(`Cell ${colLetter}${rowNum}: formula=${cell.value.formula}, evaluated=${calculatedValue}, type=${typeof calculatedValue}`);
            }
            
            if (typeof calculatedValue === 'object') {
              if (calculatedValue.richText) {
                calculatedValue = calculatedValue.richText.map(rt => rt.text).join('');
              } else {
                console.error(`Cell ${colLetter}${rowNum}: calculatedValue is object!`, calculatedValue);
                calculatedValue = 0;
              }
            }
            
            rowData.cells[colLetter] = {
              value: calculatedValue,
              formula: cell.value.formula,
              type: 'formula'
            };
          } else if (typeof cell.value === 'object' && cell.value.richText) {
            const text = cell.value.richText.map(rt => rt.text).join('');
            rowData.cells[colLetter] = {
              value: text,
              type: 'value'
            };
          } else if (typeof cell.value === 'object' && cell.value.sharedString) {
            rowData.cells[colLetter] = {
              value: String(cell.value.sharedString),
              type: 'value'
            };
          } else if (typeof cell.value === 'object') {
            console.error(`Cell ${colLetter}${rowNum}: Unknown object type`, cell.value);
            rowData.cells[colLetter] = {
              value: JSON.stringify(cell.value),
              type: 'value'
            };
          } else {
            rowData.cells[colLetter] = {
              value: cell.value,
              type: 'value'
            };
          }
        } catch (error) {
          console.error(`Error extracting cell ${colLetter}${rowNum}:`, error.message);
          rowData.cells[colLetter] = {
            value: String(cell.value),
            type: 'value'
          };
        }
      }
    }
    
    if (Object.keys(rowData.cells).length > 0) {
      data.push(rowData);
    }
  }
  
  console.log(`Extracted ${data.length} rows of data`);
  
  return data;
}

function getColLetter(colNum) {
  let letter = '';
  while (colNum > 0) {
    const mod = (colNum - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    colNum = Math.floor((colNum - mod) / 26);
  }
  return letter;
}

async function updateCellValue(filePath, row, col, value) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.worksheets[0];
  const cell = worksheet.getCell(`${col}${row}`);
  cell.value = value;
  
  await workbook.xlsx.writeFile(filePath);
  
  return extractData(worksheet);
}

async function getExcelBuffer(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  if (workbook.worksheets.length > 1) {
    console.log(`Workbook has ${workbook.worksheets.length} worksheets, exporting only the first one`);
    
    const firstSheet = workbook.worksheets[0];
    
    const newWorkbook = new ExcelJS.Workbook();
    const newSheet = newWorkbook.addWorksheet(firstSheet.name);
    
    for (let rowNum = 1; rowNum <= firstSheet.rowCount; rowNum++) {
      const sourceRow = firstSheet.getRow(rowNum);
      const destRow = newSheet.getRow(rowNum);
      
      destRow.height = sourceRow.height;
      destRow.hidden = sourceRow.hidden;
      destRow.outlineLevel = sourceRow.outlineLevel;
      destRow.collapsed = sourceRow.collapsed;
      
      for (let colNum = 1; colNum <= firstSheet.columnCount; colNum++) {
        const sourceCell = sourceRow.getCell(colNum);
        const destCell = destRow.getCell(colNum);
        
        destCell.value = sourceCell.value;
        destCell.style = sourceCell.style;
        destCell.numFmt = sourceCell.numFmt;
        destCell.font = sourceCell.font;
        destCell.border = sourceCell.border;
        destCell.fill = sourceCell.fill;
        destCell.alignment = sourceCell.alignment;
      }
      
      destRow.commit();
    }
    
    for (let colNum = 1; colNum <= firstSheet.columnCount; colNum++) {
      const sourceCol = firstSheet.getColumn(colNum);
      const destCol = newSheet.getColumn(colNum);
      
      destCol.width = sourceCol.width;
      destCol.hidden = sourceCol.hidden;
      destCol.outlineLevel = sourceCol.outlineLevel;
      destCol.collapsed = sourceCol.collapsed;
    }
    
    try {
      const merges = firstSheet.model.merges || [];
      console.log(`Found ${merges.length} merged cells`);
      
      for (const merge of merges) {
        newSheet.mergeCells(merge);
      }
    } catch (err) {
      console.log('No merges found or error copying merges:', err.message);
    }
    
    const buffer = await newWorkbook.xlsx.writeBuffer();
    return buffer;
  }
  
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

function extractMerges(worksheet) {
  const merges = [];
  
  try {
    console.log('=== EXTRACTING MERGES ===');
    
    const maxRow = worksheet.rowCount;
    const maxCol = worksheet.columnCount;
    
    const cellValues = {};
    for (let row = 1; row <= maxRow; row++) {
      for (let col = 1; col <= maxCol; col++) {
        const colLetter = getColLetter(col);
        const cell = worksheet.getCell(`${colLetter}${row}`);
        
        let value = null;
        if (cell.value !== null && cell.value !== undefined) {
          if (typeof cell.value === 'object') {
            if (cell.value.richText) {
              value = cell.value.richText.map(rt => rt.text).join('');
            } else if (cell.value.formula) {
              value = cell.value.formula;
            } else {
              value = JSON.stringify(cell.value);
            }
          } else {
            value = String(cell.value);
          }
        }
        
        cellValues[`${colLetter}${row}`] = value;
      }
    }
    
    const merged = new Set();
    
    for (let row = 1; row <= maxRow; row++) {
      for (let col = 1; col <= maxCol; col++) {
        const colLetter = getColLetter(col);
        const cellKey = `${colLetter}${row}`;
        
        if (merged.has(cellKey)) continue;
        
        const value = cellValues[cellKey];
        if (!value) continue;
        
        let endCol = col;
        for (let c = col + 1; c <= maxCol; c++) {
          const cLetter = getColLetter(c);
          const nextValue = cellValues[`${cLetter}${row}`];
          
          if (nextValue === value) {
            endCol = c;
          } else {
            break;
          }
        }
        
        let endRow = row;
        if (endCol > col) {
          let allSame = true;
          for (let r = row + 1; r <= maxRow && allSame; r++) {
            for (let c = col; c <= endCol; c++) {
              const cLetter = getColLetter(c);
              const checkValue = cellValues[`${cLetter}${r}`];
              if (checkValue !== value) {
                allSame = false;
                break;
              }
            }
            if (allSame) {
              endRow = r;
            }
          }
        }
        
        const colSpan = endCol - col + 1;
        const rowSpan = endRow - row + 1;
        
        if (colSpan > 1 || rowSpan > 1) {
          const startCol = colLetter;
          const endColLetter = getColLetter(endCol);
          
          merges.push({
            start: `${startCol}${row}`,
            end: `${endColLetter}${endRow}`,
            startCol,
            startRow: row,
            endCol: endColLetter,
            endRow,
            colSpan,
            rowSpan
          });
          
          for (let r = row; r <= endRow; r++) {
            for (let c = col; c <= endCol; c++) {
              const cLetter = getColLetter(c);
              merged.add(`${cLetter}${r}`);
            }
          }
        }
      }
    }
    
    console.log(`Total merges detected: ${merges.length}`);
    
  } catch (error) {
    console.error('Error extracting merges:', error.message);
  }
  
  return merges;
}

module.exports = {
  processExcelFile,
  extractData,
  extractMerges,
  updateCellValue,
  getExcelBuffer,
  getColLetter
};

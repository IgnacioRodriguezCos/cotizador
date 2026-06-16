const COLORS = {
  BLUE: 'FF1874CD',
  GRAY: 'FFDBDBDB',
  GRAY_LIGHT: 'FFF5F5F5'
};

const THEME_COLOR_MAP = {
  '0': 'FFFFFF',
  '1': '000000',
  '2': 'E7E6E6',
  '3': '44546A',
  '4': '5B9BD5',
  '5': 'ED7D31',
  '6': 'A5A5A5',
  '7': 'FFC000',
  '8': '4472C4',
  '9': '70AD47'
};

function resolveColor(color, workbook) {
  if (!color) return null;
  
  if (color.argb && color.argb !== '00000000') {
    const argb = color.argb;
    return argb.startsWith('FF') ? argb : 'FF' + argb;
  }
  
  if (color.rgb && color.rgb !== '00000000') {
    const rgb = color.rgb;
    return rgb.startsWith('FF') ? rgb : 'FF' + rgb;
  }
  
  if (color.type === 'theme' && color.theme !== undefined) {
    const themeIndex = String(color.theme);
    if (THEME_COLOR_MAP[themeIndex]) {
      return 'FF' + THEME_COLOR_MAP[themeIndex];
    }
    
    if (workbook && workbook._themes) {
      try {
        const themeColor = workbook._themes.theme.colorScheme[`clr${color.theme}`];
        if (themeColor && themeColor.srgbClr && themeColor.srgbClr.val) {
          return 'FF' + themeColor.srgbClr.val;
        }
      } catch (e) {
        console.log('Could not resolve theme color:', color.theme);
      }
    }
  }
  
  if (color.type === 'indexed' && color.indexed !== undefined) {
    const indexedColors = [
      '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
      '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
      '800000', '008000', '000080', '808000', '800080', '008080', 'C0C0C0', 'E0E0E0',
      '999999', '333333', '993333', '339933', '333399', '993399', '339999', '666666'
    ];
    if (indexedColors[color.indexed]) {
      return 'FF' + indexedColors[color.indexed];
    }
  }
  
  return null;
}

function getRowColor(worksheet, rowNum) {
  try {
    const row = worksheet.getRow(rowNum);
    if (!row || row.cellCount === 0) {
      return null;
    }
    
    const firstCell = row.getCell(1);
    if (!firstCell || !firstCell.fill || !firstCell.fill.fgColor) {
      return null;
    }
    
    const color = resolveColor(firstCell.fill.fgColor, worksheet.workbook);
    return color;
  } catch (error) {
    console.error(`Error getting color for row ${rowNum}:`, error.message);
    return null;
  }
}

function detectStructure(worksheet) {
  const structure = {
    headerRows: [],
    serviceRows: [],
    componentRows: [],
    totalRow: null,
    footerRows: [],
    lastValidRow: worksheet.rowCount,
    maxRow: worksheet.rowCount,
    maxCol: worksheet.columnCount
  };
  
  const totalRows = worksheet.rowCount;
  const maxRowsToCheck = Math.min(totalRows, 1000);
  
  console.log('=== DETECTING STRUCTURE ===');
  console.log(`Total rows: ${totalRows}, Total cols: ${worksheet.columnCount}`);
  console.log(`Checking rows 1 to ${maxRowsToCheck}`);
  
  for (let rowNum = 1; rowNum <= maxRowsToCheck; rowNum++) {
    const color = getRowColor(worksheet, rowNum);
    
    if (color) {
      console.log(`Row ${rowNum}: Color ${color}`);
    }
    
    if (color === COLORS.BLUE || color === COLORS.GRAY) {
      structure.headerRows.push(rowNum);
      console.log(`  -> Header row`);
    } else if (color === COLORS.GRAY_LIGHT) {
      structure.componentRows.push(rowNum);
      console.log(`  -> Component row`);
    } else if (!color) {
      const nextColor = getRowColor(worksheet, rowNum + 1);
      
      if (nextColor === COLORS.GRAY_LIGHT) {
        structure.serviceRows.push(rowNum);
        console.log(`  -> Service row (has GRIS_LIGHT below)`);
      } else if (nextColor === COLORS.GRAY) {
        structure.totalRow = rowNum;
        console.log(`  -> Total row (has GRAY below)`);
      } else {
        console.log(`  -> No color row (unknown type)`);
      }
    }
  }
  
  if (structure.totalRow) {
    structure.footerRows = [structure.totalRow + 1, structure.totalRow + 2];
    structure.lastValidRow = structure.totalRow;
    console.log(`Footer rows: ${structure.footerRows.join(', ')}`);
    console.log(`Last valid row: ${structure.lastValidRow}`);
  }
  
  console.log('=== STRUCTURE DETECTED ===');
  console.log('Headers:', structure.headerRows);
  console.log('Services:', structure.serviceRows);
  console.log('Components:', structure.componentRows.length, 'rows');
  console.log('Total row:', structure.totalRow);
  console.log('Footer rows:', structure.footerRows);
  
  return structure;
}

function getComponentsForService(serviceRow, componentRows, nextServiceOrTotal) {
  return componentRows.filter(r => r > serviceRow && r < nextServiceOrTotal);
}

module.exports = {
  COLORS,
  getRowColor,
  detectStructure,
  getComponentsForService
};

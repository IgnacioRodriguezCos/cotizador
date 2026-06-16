function parseCellRef(cellRef) {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  
  return {
    col: match[1],
    row: parseInt(match[2])
  };
}

function getCellValue(worksheet, cellRef) {
  const ref = parseCellRef(cellRef);
  if (!ref) return 0;
  
  const cell = worksheet.getCell(cellRef);
  
  if (!cell || cell.value === null || cell.value === undefined) {
    return 0;
  }
  
  if (typeof cell.value === 'number') {
    return cell.value;
  }
  
  if (typeof cell.value === 'object') {
    if (cell.value.result !== undefined) {
      return typeof cell.value.result === 'number' ? cell.value.result : 0;
    }
    if (cell.value.formula) {
      return 0;
    }
  }
  
  const numValue = parseFloat(cell.value);
  return isNaN(numValue) ? 0 : numValue;
}

function evaluateFormula(formula, worksheet, formulaResults) {
  if (!formula || typeof formula !== 'string') {
    return 0;
  }
  
  const sumMatch = formula.match(/^SUM\(([A-Z]+\d+):([A-Z]+\d+)\)$/i);
  if (sumMatch) {
    const startRef = sumMatch[1];
    const endRef = sumMatch[2];
    
    const start = parseCellRef(startRef);
    const end = parseCellRef(endRef);
    
    if (!start || !end || start.col !== end.col) {
      return 0;
    }
    
    let sum = 0;
    for (let row = start.row; row <= end.row; row++) {
      const cellRef = `${start.col}${row}`;
      sum += getCellValue(worksheet, cellRef);
    }
    
    return sum;
  }
  
  const addMatch = formula.match(/^([A-Z]+\d+)(\+[A-Z]+\d+)+$/i);
  if (addMatch) {
    const cellRefs = formula.split('+');
    let sum = 0;
    
    for (const ref of cellRefs) {
      const trimmedRef = ref.trim();
      
      if (formulaResults && formulaResults[trimmedRef] !== undefined) {
        sum += formulaResults[trimmedRef];
      } else {
        sum += getCellValue(worksheet, trimmedRef);
      }
    }
    
    return sum;
  }
  
  return 0;
}

function evaluateAllFormulas(formulas, worksheet) {
  const results = {};
  
  for (const [cellRef, formula] of Object.entries(formulas)) {
    if (!formula.includes('+')) {
      results[cellRef] = evaluateFormula(formula, worksheet, results);
    }
  }
  
  for (const [cellRef, formula] of Object.entries(formulas)) {
    if (formula.includes('+')) {
      results[cellRef] = evaluateFormula(formula, worksheet, results);
    }
  }
  
  return results;
}

module.exports = {
  parseCellRef,
  getCellValue,
  evaluateFormula,
  evaluateAllFormulas
};

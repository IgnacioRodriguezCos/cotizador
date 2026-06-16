function parseCellRef(cellRef) {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  
  return {
    col: match[1],
    row: parseInt(match[2])
  };
}

function getCellValue(worksheet, cellRef) {
  const cell = worksheet.getCell(cellRef);
  
  if (!cell || cell.value === null || cell.value === undefined) {
    return 0;
  }
  
  if (typeof cell.value === 'number') {
    return cell.value;
  }
  
  if (typeof cell.value === 'object') {
    if (cell.value.formula) {
      return evaluateFormulaInMemory(cell.value.formula, worksheet);
    }
    
    if (cell.value.richText) {
      const text = cell.value.richText.map(rt => rt.text).join('');
      const num = parseFloat(text);
      return isNaN(num) ? 0 : num;
    }
    
    if (cell.value.sharedString) {
      const num = parseFloat(String(cell.value.sharedString));
      return isNaN(num) ? 0 : num;
    }
    
    if (cell.value.result !== undefined) {
      return typeof cell.value.result === 'number' ? cell.value.result : parseFloat(cell.value.result) || 0;
    }
    
    console.error(`Unknown object type in cell ${cellRef}:`, cell.value);
    return 0;
  }
  
  const numValue = parseFloat(cell.value);
  return isNaN(numValue) ? 0 : numValue;
}

function evaluateFormulaInMemory(formula, worksheet) {
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
      console.error(`Invalid SUM range: ${formula}`);
      return 0;
    }
    
    let sum = 0;
    for (let row = start.row; row <= end.row; row++) {
      const cellRef = `${start.col}${row}`;
      const cell = worksheet.getCell(cellRef);
      
      if (cell.value !== null && cell.value !== undefined) {
        if (typeof cell.value === 'number') {
          sum += cell.value;
        } else if (typeof cell.value === 'object' && cell.value.formula) {
          sum += evaluateFormulaInMemory(cell.value.formula, worksheet);
        } else {
          const num = parseFloat(cell.value);
          if (!isNaN(num)) sum += num;
        }
      }
    }
    
    console.log(`SUM(${startRef}:${endRef}) = ${sum}`);
    return sum;
  }
  
  const addMatch = formula.match(/^([A-Z]+\d+)(\+[A-Z]+\d+)+$/i);
  if (addMatch) {
    const cellRefs = formula.split('+');
    let sum = 0;
    
    for (const ref of cellRefs) {
      sum += getCellValue(worksheet, ref.trim());
    }
    
    console.log(`ADD(${formula}) = ${sum}`);
    return sum;
  }
  
  const simpleRefMatch = formula.match(/^([A-Z]+\d+)$/i);
  if (simpleRefMatch) {
    const value = getCellValue(worksheet, formula);
    console.log(`REF(${formula}) = ${value}`);
    return value;
  }
  
  console.error(`Unknown formula format: ${formula}`);
  return 0;
}

function recalculateAffectedFormulas(editedCellRef, worksheet, structure) {
  const parsed = parseCellRef(editedCellRef);
  if (!parsed) return {};
  
  const { col, row } = parsed;
  const updatedCells = {};
  
  if (!['G', 'H', 'I'].includes(col)) {
    return updatedCells;
  }
  
  for (let i = 0; i < structure.serviceRows.length; i++) {
    const serviceRow = structure.serviceRows[i];
    const nextService = structure.serviceRows[i + 1] || structure.totalRow;
    
    const components = structure.componentRows.filter(r => 
      r > serviceRow && r < nextService
    );
    
    if (components.includes(row)) {
      const cell = worksheet.getCell(`${col}${serviceRow}`);
      if (cell.value && cell.value.formula) {
        const newValue = evaluateFormulaInMemory(cell.value.formula, worksheet);
        updatedCells[`${col}${serviceRow}`] = newValue;
      }
    }
  }
  
  if (Object.keys(updatedCells).length > 0 && structure.totalRow) {
    const totalCell = worksheet.getCell(`${col}${structure.totalRow}`);
    if (totalCell.value && totalCell.value.formula) {
      const newValue = evaluateFormulaInMemory(totalCell.value.formula, worksheet);
      updatedCells[`${col}${structure.totalRow}`] = newValue;
    }
  }
  
  if (structure.totalRow) {
    const refRow = structure.totalRow + 1;
    const refCell = worksheet.getCell(`${col}${refRow}`);
    
    if (refCell.value && refCell.value.formula) {
      const formula = refCell.value.formula;
      const simpleRefMatch = formula.match(/^([A-Z]+\d+)$/i);
      
      if (simpleRefMatch) {
        const refTarget = simpleRefMatch[1];
        const refTargetParsed = parseCellRef(refTarget);
        
        if (refTargetParsed && refTargetParsed.row === structure.totalRow) {
          const newValue = evaluateFormulaInMemory(formula, worksheet);
          updatedCells[`${col}${refRow}`] = newValue;
          console.log(`Recalculated reference ${col}${refRow} = ${newValue}`);
        }
      }
    }
  }
  
  return updatedCells;
}

module.exports = {
  parseCellRef,
  getCellValue,
  evaluateFormulaInMemory,
  recalculateAffectedFormulas
};

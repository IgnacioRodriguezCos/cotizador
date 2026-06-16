const { getComponentsForService } = require('./colorDetector');

function generateServiceFormula(worksheet, serviceRow, componentRows, nextServiceOrTotal) {
  const components = getComponentsForService(serviceRow, componentRows, nextServiceOrTotal);
  
  if (components.length === 0) return null;
  
  const start = Math.min(...components);
  const end = Math.max(...components);
  
  const formulas = {};
  ['G', 'H', 'I'].forEach(col => {
    const formula = `SUM(${col}${start}:${col}${end})`;
    const cell = worksheet.getCell(`${col}${serviceRow}`);
    cell.value = { formula: formula };
    formulas[`${col}${serviceRow}`] = formula;
  });
  
  return formulas;
}

function generateTotalFormula(worksheet, serviceRows, totalRow) {
  if (!totalRow || serviceRows.length === 0) return null;
  
  const formulas = {};
  ['G', 'H', 'I'].forEach(col => {
    const references = serviceRows.map(r => `${col}${r}`).join('+');
    const cell = worksheet.getCell(`${col}${totalRow}`);
    cell.value = { formula: references };
    formulas[`${col}${totalRow}`] = references;
  });
  
  return formulas;
}

function generateTotalReference(worksheet, totalRow) {
  if (!totalRow) return null;
  
  const formulas = {};
  const nextRow = totalRow + 1;
  
  ['G', 'H', 'I'].forEach(col => {
    const formula = `${col}${totalRow}`;
    const cell = worksheet.getCell(`${col}${nextRow}`);
    cell.value = { formula: formula };
    formulas[`${col}${nextRow}`] = formula;
  });
  
  return formulas;
}

function generateFooterFormulas(worksheet, footerRows) {
  if (!footerRows || footerRows.length < 4) return null;
  
  const formulas = {};
  const sourceRow = footerRows[1];
  const targetRow = footerRows[2];
  
  ['G', 'H', 'I'].forEach(col => {
    const formula = `${col}${sourceRow}`;
    const cell = worksheet.getCell(`${col}${targetRow}`);
    cell.value = { formula: formula };
    formulas[`${col}${targetRow}`] = formula;
  });
  
  return formulas;
}

function generateAllFormulas(worksheet, structure) {
  const allFormulas = {};
  
  structure.serviceRows.forEach((serviceRow, index) => {
    const nextServiceOrTotal = structure.serviceRows[index + 1] || structure.totalRow;
    const formulas = generateServiceFormula(
      worksheet, 
      serviceRow, 
      structure.componentRows, 
      nextServiceOrTotal
    );
    if (formulas) {
      Object.assign(allFormulas, formulas);
    }
  });
  
  const totalFormulas = generateTotalFormula(worksheet, structure.serviceRows, structure.totalRow);
  if (totalFormulas) {
    Object.assign(allFormulas, totalFormulas);
  }
  
  const totalRefFormulas = generateTotalReference(worksheet, structure.totalRow);
  if (totalRefFormulas) {
    Object.assign(allFormulas, totalRefFormulas);
  }
  
  const footerFormulas = generateFooterFormulas(worksheet, structure.footerRows);
  if (footerFormulas) {
    Object.assign(allFormulas, footerFormulas);
  }
  
  return allFormulas;
}

module.exports = {
  generateServiceFormula,
  generateTotalFormula,
  generateTotalReference,
  generateFooterFormulas,
  generateAllFormulas
};

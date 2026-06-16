import React, { useState, useEffect } from 'react';
import { getColorHex } from '../utils/colorUtils';
import { COLORS } from '../utils/colors';
import { API_URL } from '../config';

function SpreadsheetGrid({ data, formulas, structure, rowColors, merges, region, fileId, onCellUpdate }) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [imageOptions, setImageOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [originalValues, setOriginalValues] = useState({});

  console.log('SpreadsheetGrid - merges:', merges);
  console.log('SpreadsheetGrid - region:', region);
  
  useEffect(() => {
    if (!fileId || Object.keys(originalValues).length > 0) return;
    
    const originals = {};
    data.forEach(rowData => {
      Object.keys(rowData.cells).forEach(col => {
        const prevCol = String.fromCharCode(col.charCodeAt(0) - 1);
        const prevCellData = rowData.cells[prevCol];
        const prevCellValue = prevCellData ? String(prevCellData.value).toLowerCase().trim() : '';
        
        if (prevCellValue === 'image') {
          const cellRef = `${col}${rowData.row}`;
          originals[cellRef] = rowData.cells[col].value;
          
          const typeRow = rowData.row - 1;
          const typeRowData = data.find(r => r.row === typeRow);
          
          if (typeRowData) {
            const gCell = typeRowData.cells['G'];
            const iCell = typeRowData.cells['I'];
            
            if (gCell) {
              originals[`G${typeRow}`] = gCell.value;
            }
            if (iCell) {
              originals[`I${typeRow}`] = iCell.value;
            }
          }
        }
      });
    });
    setOriginalValues(originals);
    console.log('Original values initialized:', originals);
  }, [fileId]);

  if (!data || data.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: COLORS.GRAY_MEDIUM }}>No hay datos para mostrar</div>;
  }

  const maxCol = Math.max(...data.map(row => 
    Math.max(...Object.keys(row.cells).map(c => c.charCodeAt(0) - 64))
  ));

  const colLetters = [];
  for (let i = 1; i <= maxCol; i++) {
    colLetters.push(String.fromCharCode(64 + i));
  }

  const getTypeValue = (row) => {
    const typeRow = row - 1;
    
    console.log(`Looking for Type in row ${typeRow} (above Image row ${row})`);
    
    const rowData = data.find(r => r.row === typeRow);
    if (!rowData) {
      console.log('No rowData found for row', typeRow);
      return null;
    }
    
    for (const col of colLetters) {
      const cellData = rowData.cells[col];
      const cellValue = cellData ? String(cellData.value).toLowerCase().trim() : '';
      
      if (cellValue === 'type') {
        const nextCol = String.fromCharCode(col.charCodeAt(0) + 1);
        const typeCellData = rowData.cells[nextCol];
        
        console.log(`Found "Type" at ${col}${typeRow}, value at ${nextCol}${typeRow}:`, typeCellData?.value);
        
        if (typeCellData && typeCellData.value) {
          return typeCellData.value;
        }
      }
    }
    
    console.log('No "Type" cell found in row', typeRow);
    return null;
  };

  const fetchImageOptions = async (row) => {
    console.log('=== fetchImageOptions called ===');
    console.log('fileId:', fileId);
    console.log('row:', row);
    
    if (!fileId) {
      console.warn('No fileId provided for fetching image options');
      return [];
    }
    
    const typeValue = getTypeValue(row);
    console.log('typeValue:', typeValue);
    
    if (!typeValue) {
      console.log('No Type value found for row', row);
      return [];
    }
    
    console.log('Setting loadingOptions to true');
    setLoadingOptions(true);
    
    try {
      console.log('Calling API with:', { fileId, typeValue });
      
      const response = await fetch(`${API_URL}/image-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, typeValue })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('Image options result:', result);
      
      if (result.error) {
        console.warn('Error from server:', result.error);
        return [];
      }
      
      console.log('Returning options:', result.options);
      return result.options || [];
      
    } catch (error) {
      console.error('Error fetching image options:', error);
      return [];
    } finally {
      console.log('Setting loadingOptions to false');
      setLoadingOptions(false);
    }
  };

  const getRowColor = (rowNum) => {
    if (rowColors && rowColors[rowNum]) {
      const argb = rowColors[rowNum];
      
      let hex;
      if (argb.length === 8) {
        hex = '#' + argb.substring(2);
      } else if (argb.length === 6) {
        hex = '#' + argb;
      } else {
        hex = '#' + argb;
      }
      
      return hex;
    }
    
    return COLORS.WHITE;
  };

  const colToNumber = (col) => {
    let num = 0;
    for (let i = 0; i < col.length; i++) {
      num = num * 26 + (col.charCodeAt(i) - 64);
    }
    return num;
  };

  const getMergeInfo = (row, col) => {
    if (!merges || merges.length === 0) return null;
    
    const colNum = colToNumber(col);
    
    for (const merge of merges) {
      const startColNum = colToNumber(merge.startCol);
      const endColNum = colToNumber(merge.endCol);
      
      if (merge.startRow === row && merge.startCol === col) {
        return merge;
      }
      if (row >= merge.startRow && row <= merge.endRow && 
          colNum >= startColNum && colNum <= endColNum) {
        return 'skip';
      }
    }
    
    return null;
  };

  const handleCellClick = async (row, col, cellData) => {
    if (formulas && formulas[`${col}${row}`]) {
      return;
    }

    if (structure.headerRows.includes(row)) {
      return;
    }

    if (col < 'F') {
      const prevCol = String.fromCharCode(col.charCodeAt(0) - 1);
      const prevCellData = data.find(r => r.row === row)?.cells[prevCol];
      const prevCellValue = prevCellData ? String(prevCellData.value).toLowerCase().trim() : '';
      const isImageCell = prevCellValue === 'image';
      
      if (!isImageCell) {
        return;
      }
    }

    const prevCol = String.fromCharCode(col.charCodeAt(0) - 1);
    const prevCellData = data.find(r => r.row === row)?.cells[prevCol];
    const prevCellValue = prevCellData ? String(prevCellData.value).toLowerCase().trim() : '';
    const isImageCell = prevCellValue === 'image';
    
    if (isImageCell) {
      const options = await fetchImageOptions(row);
      setImageOptions(options);
    }

    const cellRef = `${col}${row}`;
    setEditingCell({ row, col });
    setEditValue(cellData ? String(cellData.value || '') : '');
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const { row, col } = editingCell;
      const cellData = data.find(r => r.row === row)?.cells[col];
      const originalValue = cellData ? cellData.value : '';

      if (editValue !== String(originalValue)) {
        onCellUpdate(row, col, editValue);
      }
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleSelectChange = async (e) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    
    if (editingCell) {
      const { row, col } = editingCell;
      const cellData = data.find(r => r.row === row)?.cells[col];
      const originalValue = cellData ? cellData.value : '';

      if (newValue !== String(originalValue)) {
        await onCellUpdate(row, col, newValue);
        
        const cellRef = `${col}${row}`;
        const isRestoringOriginal = newValue === originalValues[cellRef];
        
        if (isRestoringOriginal) {
          const typeRow = row - 1;
          const originalG = originalValues[`G${typeRow}`];
          const originalI = originalValues[`I${typeRow}`];
          
          console.log(`Restoring original values for Type row ${typeRow}:`);
          console.log(`  G: ${originalG}`);
          console.log(`  I: ${originalI}`);
          
          if (originalG !== undefined) {
            await onCellUpdate(typeRow, 'G', originalG);
          }
          if (originalI !== undefined) {
            await onCellUpdate(typeRow, 'I', originalI);
          }
        } else {
          const selectedOption = imageOptions.find(opt => opt.value === newValue);
          
          if (selectedOption && selectedOption.price) {
            const typeRow = row - 1;
            const typeRowData = data.find(r => r.row === typeRow);
            
            if (typeRowData) {
              const fCell = typeRowData.cells['F'];
              const fValue = fCell ? parseFloat(fCell.value) || 0 : 0;
              
              const calculatedValue = selectedOption.price * fValue;
              
              console.log(`Updating Type row ${typeRow}:`);
              console.log(`  Price: ${selectedOption.price}`);
              console.log(`  F value: ${fValue}`);
              console.log(`  Calculated: ${calculatedValue}`);
              
              await onCellUpdate(typeRow, 'G', calculatedValue);
              await onCellUpdate(typeRow, 'I', calculatedValue);
            }
          }
        }
      }
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  return (
    <div style={{ overflow: 'auto', maxHeight: '70vh', border: `2px solid ${COLORS.BLACK}`, borderRadius: '4px' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1200px' }}>
        <thead>
          <tr style={{ backgroundColor: COLORS.BLACK, color: COLORS.WHITE }}>
            <th style={{ padding: '10px', border: `1px solid ${COLORS.GRAY_DARK}`, minWidth: '40px', fontWeight: 'bold' }}>#</th>
            {colLetters.map(col => (
              <th key={col} style={{ padding: '10px', border: `1px solid ${COLORS.GRAY_DARK}`, minWidth: '120px', fontWeight: 'bold' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(rowData => {
            const rowColor = getRowColor(rowData.row);
            return (
              <tr key={rowData.row} style={{ backgroundColor: rowColor }}>
                <td style={{ 
                  padding: '6px', 
                  border: `1px solid ${COLORS.GRAY_BORDER}`, 
                  fontWeight: 'bold',
                  backgroundColor: COLORS.GRAY_BACKGROUND,
                  textAlign: 'center',
                  color: COLORS.BLACK
                }}>
                  {rowData.row}
                </td>
                {colLetters.map(col => {
                  const mergeInfo = getMergeInfo(rowData.row, col);
                  
                  if (mergeInfo === 'skip') {
                    return null;
                  }
                  
                   const cellData = rowData.cells[col];
                   const cellRef = `${col}${rowData.row}`;
                   const hasFormula = formulas && formulas[cellRef];
                   const isEditing = editingCell && 
                                    editingCell.row === rowData.row && 
                                    editingCell.col === col;
                   
                   const displayValue = cellData ? cellData.value : '';
                   
                   const prevCol = String.fromCharCode(col.charCodeAt(0) - 1);
                   const prevCellData = rowData.cells[prevCol];
                   const prevCellValue = prevCellData ? String(prevCellData.value).toLowerCase().trim() : '';
                   const isImageCell = prevCellValue === 'image';
                   
                   const isEditable = !hasFormula && 
                                    !structure.headerRows.includes(rowData.row) &&
                                    (col >= 'F' || isImageCell);
                   
                   const isComboBox = isImageCell && isEditable;
                   
                   if (isEditing && col >= 'A' && col <= 'E' && !isImageCell) {
                     console.warn(`WARNING: Editing cell ${col}${rowData.row} which should not be editable!`);
                     console.log('  hasFormula:', hasFormula);
                     console.log('  isHeader:', structure.headerRows.includes(rowData.row));
                     console.log('  isImageCell:', isImageCell);
                     console.log('  isEditable:', isEditable);
                   }

                   return (
                    <td
                      key={col}
                      onClick={() => handleCellClick(rowData.row, col, cellData)}
                      colSpan={mergeInfo ? mergeInfo.colSpan : 1}
                      rowSpan={mergeInfo ? mergeInfo.rowSpan : 1}
                      style={{
                        padding: '6px',
                        border: `1px solid ${COLORS.GRAY_BORDER}`,
                        cursor: isEditable ? 'pointer' : 'default',
                        position: 'relative',
                        minWidth: '100px',
                        textAlign: mergeInfo ? 'center' : 'left',
                        verticalAlign: 'middle'
                      }}
                    >
                      {isEditing ? (
                        isComboBox ? (
                          loadingOptions ? (
                            <div style={{ 
                              padding: '4px', 
                              color: COLORS.GRAY_MEDIUM,
                              fontSize: '12px',
                              fontStyle: 'italic'
                            }}>
                              Cargando opciones...
                            </div>
                          ) : (
                            <select
                              value={editValue}
                              onChange={handleSelectChange}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              autoFocus
                              style={{
                                width: '100%',
                                border: `2px solid ${COLORS.HUAWEI_RED}`,
                                padding: '4px',
                                fontSize: 'inherit',
                                fontFamily: 'inherit',
                                backgroundColor: COLORS.WHITE
                              }}
                            >
                              <option value="">-</option>
                              {(() => {
                                const cellRef = `${col}${rowData.row}`;
                                const originalVal = originalValues[cellRef];
                                if (originalVal && !imageOptions.find(opt => opt.value === originalVal)) {
                                  return <option value={originalVal}>{originalVal} (original)</option>;
                                }
                                return null;
                              })()}
                              {imageOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          )
                        ) : (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            style={{
                              width: '100%',
                              border: `2px solid ${COLORS.HUAWEI_RED}`,
                              padding: '4px',
                              fontSize: 'inherit',
                              fontFamily: 'inherit'
                            }}
                          />
                        )
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: mergeInfo ? 'center' : 'flex-start' }}>
                          {hasFormula && (
                            <span style={{ 
                              color: COLORS.HUAWEI_RED, 
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              Σ
                            </span>
                          )}
                          <span style={{ 
                            color: hasFormula ? COLORS.HUAWEI_RED : COLORS.BLACK,
                            fontStyle: hasFormula ? 'italic' : 'normal',
                            fontWeight: hasFormula ? 'bold' : 'normal'
                          }}>
                            {displayValue !== null && displayValue !== undefined 
                              ? (typeof displayValue === 'number' 
                                  ? (Number.isInteger(displayValue) 
                                      ? displayValue 
                                      : displayValue.toFixed(2))
                                  : String(displayValue))
                              : ''}
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default SpreadsheetGrid;

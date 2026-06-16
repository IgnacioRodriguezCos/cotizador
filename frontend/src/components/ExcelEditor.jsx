import React from 'react';
import SpreadsheetGrid from './SpreadsheetGrid';
import Toolbar from './Toolbar';
import DebugPanel from './DebugPanel';
import { COLORS } from '../utils/colors';

function ExcelEditor({ fileId, data, formulas, structure, rowColors, merges, region, originalName, onCellUpdate, onDownload }) {
  const [hasChanges, setHasChanges] = React.useState(false);

  const handleCellUpdate = async (row, col, value) => {
    try {
      await onCellUpdate(row, col, value);
      setHasChanges(true);
    } catch (error) {
      console.error('Error updating cell:', error);
      alert('Error al actualizar celda: ' + error.message);
    }
  };

  const handleDownload = () => {
    onDownload();
    setHasChanges(false);
  };

  return (
    <div>
      <Toolbar
        fileName={originalName}
        hasChanges={hasChanges}
        onDownload={handleDownload}
      />
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: COLORS.WHITE, borderRadius: '4px', border: `2px solid ${COLORS.BLACK}` }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: COLORS.HUAWEI_RED, fontWeight: 'bold' }}>📋 Información del Archivo</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px', color: COLORS.BLACK }}>
          <div><strong>Filas de encabezado:</strong> {structure.headerRows.join(', ')}</div>
          <div><strong>Filas de servicio:</strong> {structure.serviceRows.join(', ')}</div>
          <div><strong>Filas de componentes:</strong> {structure.componentRows.length}</div>
          <div><strong>Fila de total:</strong> {structure.totalRow || 'N/A'}</div>
          <div><strong>Fórmulas generadas:</strong> {Object.keys(formulas).length}</div>
        </div>
      </div>

      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: COLORS.BLACK, borderRadius: '4px', fontSize: '14px', color: COLORS.WHITE }}>
        <strong>Leyenda:</strong>
        <span style={{ marginLeft: '15px', marginRight: '5px', display: 'inline-block', width: '20px', height: '20px', backgroundColor: '#1874CD', verticalAlign: 'middle', border: `1px solid ${COLORS.GRAY_BORDER}` }}></span>
        <span style={{ marginRight: '20px' }}>Fila azul: Encabezado principal</span>
        <span style={{ marginRight: '5px', display: 'inline-block', width: '20px', height: '20px', backgroundColor: '#DBDBDB', verticalAlign: 'middle', border: `1px solid ${COLORS.GRAY_BORDER}` }}></span>
        <span style={{ marginRight: '20px' }}>Fila gris: Subencabezado</span>
        <span style={{ marginRight: '5px', display: 'inline-block', width: '20px', height: '20px', backgroundColor: '#F5F5F5', verticalAlign: 'middle', border: `1px solid ${COLORS.GRAY_BORDER}` }}></span>
        <span style={{ marginRight: '20px' }}>Fila gris claro: Componentes (editable)</span>
        <span style={{ marginRight: '5px', display: 'inline-block', width: '20px', height: '20px', backgroundColor: COLORS.WHITE, verticalAlign: 'middle', border: `1px solid ${COLORS.GRAY_BORDER}` }}></span>
        <span style={{ marginRight: '20px' }}>Sin color: Servicios y Total (fórmulas)</span>
        <span style={{ fontWeight: 'bold', color: COLORS.HUAWEI_RED }}>Σ</span>
        <span> = Celda con fórmula automática</span>
      </div>

      {rowColors && Object.keys(rowColors).length > 0 && (
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: COLORS.WHITE, borderRadius: '4px', border: `2px solid ${COLORS.GRAY_BORDER}`, fontSize: '12px' }}>
          <strong style={{ color: COLORS.HUAWEI_RED }}>Colores detectados:</strong>
          <div style={{ display: 'flex', gap: '10px', marginTop: '5px', flexWrap: 'wrap', color: COLORS.BLACK }}>
            {Object.entries(rowColors).slice(0, 10).map(([row, argb]) => {
              let hex;
              if (argb.length === 8) {
                hex = '#' + argb.substring(2);
              } else if (argb.length === 6) {
                hex = '#' + argb;
              } else {
                hex = '#' + argb;
              }
              
              return (
                <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '20px', height: '20px', backgroundColor: hex, border: `1px solid ${COLORS.GRAY_BORDER}` }}></div>
                  <span>Fila {row}: {hex} (ARGB: {argb})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <SpreadsheetGrid
        data={data}
        formulas={formulas}
        structure={structure}
        rowColors={rowColors}
        merges={merges}
        region={region}
        fileId={fileId}
        onCellUpdate={handleCellUpdate}
      />
      
      <DebugPanel fileId={fileId} />
    </div>
  );
}

export default ExcelEditor;

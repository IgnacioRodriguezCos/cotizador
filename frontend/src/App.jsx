import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ExcelEditor from './components/ExcelEditor';
import api from './services/api';
import { COLORS } from './utils/colors';

function App() {
  const [fileData, setFileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await api.uploadFile(file);
      console.log('Archivo procesado:', {
        rowColors: result.rowColors ? Object.keys(result.rowColors).length : 0,
        formulas: result.formulas ? Object.keys(result.formulas).length : 0,
        services: result.structure?.serviceRows?.length || 0,
        merges: result.merges ? result.merges.length : 0,
        region: result.region
      });
      console.log('Full result:', result);
      setFileData(result);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.error || 'Error al subir archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCellUpdate = async (row, col, value) => {
    if (!fileData) return;
    
    try {
      const result = await api.updateCell(fileData.id, row, col, value);
      
      console.log('Cell updated, recalculated cells:', result.updatedCells);
      
      setFileData(prev => {
        const newData = [...prev.data];
        
        const rowIdx = newData.findIndex(d => d.row === row);
        if (rowIdx >= 0) {
          newData[rowIdx] = {
            ...newData[rowIdx],
            cells: {
              ...newData[rowIdx].cells,
              [col]: {
                value: value,
                type: 'value'
              }
            }
          };
        }
        
        if (result.updatedCells && Object.keys(result.updatedCells).length > 0) {
          for (const [cellRef, newValue] of Object.entries(result.updatedCells)) {
            const match = cellRef.match(/^([A-Z]+)(\d+)$/);
            if (match) {
              const cellCol = match[1];
              const cellRow = parseInt(match[2]);
              const rowIdx = newData.findIndex(d => d.row === cellRow);
              
              if (rowIdx >= 0) {
                newData[rowIdx] = {
                  ...newData[rowIdx],
                  cells: {
                    ...newData[rowIdx].cells,
                    [cellCol]: {
                      value: newValue,
                      type: 'formula',
                      formula: prev.formulas[cellRef]
                    }
                  }
                };
              }
            }
          }
        }
        
        return { ...prev, data: newData };
      });
    } catch (error) {
      console.error('Error updating cell:', error);
      throw error;
    }
  };

  const handleDownload = async () => {
    if (!fileData) return;
    
    try {
      const blob = await api.downloadFile(fileData.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Error al descargar archivo');
    }
  };

  const handleReset = () => {
    setFileData(null);
    setError(null);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.GRAY_BACKGROUND }}>
      <header style={{
        backgroundColor: COLORS.HUAWEI_RED,
        color: COLORS.WHITE,
        padding: '20px 30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>📊 Cotizador Excel</h1>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              Editor de Excel con generación automática de fórmulas
            </p>
          </div>
          {fileData && (
            <button
              onClick={handleReset}
              style={{
                padding: '10px 20px',
                backgroundColor: COLORS.BLACK,
                color: COLORS.WHITE,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = COLORS.GRAY_MEDIUM}
              onMouseOut={(e) => e.target.style.backgroundColor = COLORS.BLACK}
            >
              ← Subir nuevo archivo
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px' }}>
        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: '#fee',
            border: `2px solid ${COLORS.HUAWEI_RED}`,
            borderRadius: '4px',
            marginBottom: '20px',
            color: COLORS.HUAWEI_RED,
            fontWeight: 'bold'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {!fileData ? (
          <div>
            <div style={{
              backgroundColor: COLORS.WHITE,
              padding: '30px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: `3px solid ${COLORS.HUAWEI_RED}`
            }}>
              <h2 style={{ marginTop: 0, marginBottom: '20px', color: COLORS.BLACK }}>
                Subir archivo Excel
              </h2>
              <FileUpload 
                onFileUpload={handleFileUpload} 
                isLoading={isLoading} 
              />
            </div>

            <div style={{
              marginTop: '30px',
              backgroundColor: COLORS.WHITE,
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: `2px solid ${COLORS.GRAY_BORDER}`
            }}>
              <h3 style={{ marginTop: 0, color: COLORS.HUAWEI_RED, fontWeight: 'bold' }}>ℹ️ Cómo funciona</h3>
              <ol style={{ lineHeight: '1.8', color: COLORS.GRAY_MEDIUM }}>
                <li>Sube un archivo Excel <strong>sin fórmulas de suma</strong></li>
                <li>El sistema detecta automáticamente los <strong>colores de las filas</strong></li>
                <li>Se generan <strong>fórmulas SUM</strong> automáticas en columnas G, H e I</li>
                <li>Edita los valores de los componentes en las filas gris claro</li>
                <li>Los totales se recalculan automáticamente</li>
                <li>Descarga el Excel con todas las fórmulas incluidas</li>
              </ol>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: COLORS.WHITE,
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: `2px solid ${COLORS.GRAY_BORDER}`
          }}>
            <ExcelEditor
              fileId={fileData.id}
              data={fileData.data}
              formulas={fileData.formulas}
              structure={fileData.structure}
              rowColors={fileData.rowColors}
              merges={fileData.merges}
              region={fileData.region}
              originalName={fileData.originalName}
              onCellUpdate={handleCellUpdate}
              onDownload={handleDownload}
            />
          </div>
        )}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '20px',
        color: COLORS.GRAY_LIGHT,
        fontSize: '14px',
        backgroundColor: COLORS.BLACK,
        color: COLORS.WHITE
      }}>
        <p>Cotizador Excel Platform © 2026</p>
      </footer>
    </div>
  );
}

export default App;

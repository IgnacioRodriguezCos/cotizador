import React from 'react';
import { COLORS } from '../utils/colors';

function Toolbar({ onDownload, onSave, hasChanges, fileName }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '15px 20px',
      backgroundColor: COLORS.BLACK,
      borderBottom: `3px solid ${COLORS.HUAWEI_RED}`,
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: COLORS.WHITE, fontWeight: 'bold' }}>
          📊 {fileName || 'Excel Editor'}
        </h2>
        {hasChanges && (
          <span style={{
            backgroundColor: COLORS.HUAWEI_RED,
            color: COLORS.WHITE,
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            Cambios sin guardar
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        {onSave && (
          <button
            onClick={onSave}
            disabled={!hasChanges}
            style={{
              padding: '10px 20px',
              backgroundColor: hasChanges ? COLORS.HUAWEI_RED : COLORS.GRAY_LIGHTER,
              color: COLORS.WHITE,
              border: 'none',
              borderRadius: '4px',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
          >
            💾 Guardar
          </button>
        )}
        
        <button
          onClick={onDownload}
          style={{
            padding: '10px 20px',
            backgroundColor: COLORS.HUAWEI_RED,
            color: COLORS.WHITE,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = COLORS.HUAWEI_RED_DARK}
          onMouseOut={(e) => e.target.style.backgroundColor = COLORS.HUAWEI_RED}
        >
          ⬇️ Descargar Excel
        </button>
      </div>
    </div>
  );
}

export default Toolbar;

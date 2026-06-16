import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { COLORS } from '../utils/colors';

function FileUpload({ onFileUpload, isLoading }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: isLoading
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: `3px dashed ${COLORS.HUAWEI_RED}`,
        borderRadius: '8px',
        padding: '60px 40px',
        textAlign: 'center',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        backgroundColor: isDragActive ? '#FFE8EC' : COLORS.GRAY_BACKGROUND,
        transition: 'all 0.3s ease',
        opacity: isLoading ? 0.6 : 1
      }}
    >
      <input {...getInputProps()} />
      
      {isLoading ? (
        <div>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ fontSize: '18px', color: COLORS.GRAY_MEDIUM, fontWeight: 'bold' }}>Procesando archivo...</p>
        </div>
      ) : isDragActive ? (
        <div>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📥</div>
          <p style={{ fontSize: '18px', color: COLORS.HUAWEI_RED, fontWeight: 'bold' }}>
            Suelta el archivo aquí
          </p>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
          <p style={{ fontSize: '18px', color: COLORS.BLACK, marginBottom: '10px', fontWeight: 'bold' }}>
            Arrastra y suelta un archivo Excel aquí
          </p>
          <p style={{ fontSize: '14px', color: COLORS.GRAY_MEDIUM }}>
            o haz clic para seleccionar
          </p>
          <p style={{ fontSize: '12px', color: COLORS.GRAY_LIGHTER, marginTop: '15px' }}>
            Formatos aceptados: .xlsx, .xls
          </p>
        </div>
      )}
    </div>
  );
}

export default FileUpload;

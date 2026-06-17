import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

function DebugPanel({ fileId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [debugData, setDebugData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && fileId) {
      fetchDebugData();
    }
  }, [isOpen, fileId]);

  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [debugRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/debug/${fileId}`),
        fetch(`${API_URL}/debug/logs?limit=50`)
      ]);
      
      if (debugRes.ok) {
        const data = await debugRes.json();
        setDebugData(data);
      }
      
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/debug/${fileId}/validate`);
      if (res.ok) {
        const data = await res.json();
        setValidation(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      await fetch(`${API_URL}/debug/logs`, { method: 'DELETE' });
      setLogs([]);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#6c5ce7',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(108, 92, 231, 0.4)',
          zIndex: 9999
        }}
        title="Abrir Debug Panel"
      >
        🐛
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '600px',
      height: '100vh',
      backgroundColor: '#1e1e1e',
      color: '#fff',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Consolas, Monaco, monospace'
    }}>
      <div style={{
        padding: '15px',
        backgroundColor: '#2d2d2d',
        borderBottom: '1px solid #444',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>🐛 Debug Panel</h2>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>

      <div style={{
        padding: '10px',
        backgroundColor: '#2d2d2d',
        borderBottom: '1px solid #444',
        display: 'flex',
        gap: '5px'
      }}>
        {['overview', 'region', 'billing', 'types', 'colors', 'formulas', 'logs', 'validation'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === tab ? '#6c5ce7' : '#3d3d3d',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{
        padding: '10px',
        backgroundColor: '#2d2d2d',
        borderBottom: '1px solid #444',
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={fetchDebugData}
          disabled={loading}
          style={{
            padding: '6px 12px',
            backgroundColor: '#00b894',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {loading ? '⏳ Cargando...' : '🔄 Actualizar'}
        </button>
        <button
          onClick={runValidation}
          disabled={loading}
          style={{
            padding: '6px 12px',
            backgroundColor: '#fdcb6e',
            border: 'none',
            borderRadius: '4px',
            color: '#000',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ✓ Validar Fórmulas
        </button>
        <button
          onClick={clearLogs}
          style={{
            padding: '6px 12px',
            backgroundColor: '#e17055',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🗑️ Limpiar Logs
        </button>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '15px'
      }}>
        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: '#d63031',
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            Error: {error}
          </div>
        )}

        {loading && !debugData && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Cargando datos de debug...
          </div>
        )}

        {activeTab === 'overview' && debugData && (
          <div>
            <Section title="📁 Archivo">
              <DataGrid data={[
                ['Worksheet', debugData.file.worksheetName],
                ['Filas', debugData.file.totalRows],
                ['Columnas', debugData.file.totalCols],
                ['Tiene Fórmulas', debugData.file.hasFormulas ? '✓ Sí' : '✗ No'],
                ['Total Fórmulas', debugData.file.formulaCount]
              ]} />
            </Section>

            <Section title="🏗️ Estructura">
              <DataGrid data={[
                ['Headers', debugData.structure.headerRows?.join(', ') || 'N/A'],
                ['Servicios', debugData.structure.serviceRows?.join(', ') || 'N/A'],
                ['Componentes', `${debugData.structure.componentRows || 0} filas`],
                ['Total Row', debugData.structure.totalRow || 'N/A']
              ]} />
            </Section>

            <Section title="⚠️ Validación">
              {debugData.validation.length === 0 ? (
                <div style={{ color: '#00b894' }}>✓ Sin errores o warnings</div>
              ) : (
                debugData.validation.map((v, i) => (
                  <div key={i} style={{
                    padding: '8px',
                    marginBottom: '5px',
                    backgroundColor: v.level === 'ERROR' ? '#d63031' : '#fdcb6e',
                    color: v.level === 'ERROR' ? '#fff' : '#000',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    <strong>[{v.level}]</strong> {v.message}
                    {v.suggestion && <div style={{ marginTop: '4px', opacity: 0.8 }}>💡 {v.suggestion}</div>}
                  </div>
                ))
              )}
            </Section>
          </div>
        )}

        {activeTab === 'region' && debugData && (
          <div>
            <Section title="🌍 Detección de Región">
              {!debugData.region ? (
                <div style={{
                  padding: '15px',
                  backgroundColor: '#d63031',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>❌</div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>ERROR: Región no detectada</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    No se encontró una celda con el texto "Region" o la celda inferior no contiene "LA-Santiago" o "LA-Buenos Aires1"
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    padding: '15px',
                    backgroundColor: debugData.region === 'santiago' ? '#0984e3' : '#e17055',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                      {debugData.region === 'santiago' ? '🇨🇱' : '🇦🇷'}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {debugData.region === 'santiago' ? 'SANTIAGO' : 'ARGENTINA'}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
                      {debugData.region === 'santiago' ? 'LA-Santiago' : 'LA-Buenos Aires1'}
                    </div>
                  </div>
                  
                  <DataGrid data={[
                    ['Región Detectada', debugData.region.toUpperCase()],
                    ['Estado', '✓ Detectado correctamente'],
                    ['Archivo de Pricing', debugData.region === 'santiago' ? 'Santiago Pricing.xlsx' : 'Argentina Pricing.xlsx']
                  ]} />
                </div>
              )}
            </Section>

            <Section title="📋 Instrucciones">
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 10px 0' }}>
                  <strong>Para que la región se detecte correctamente:</strong>
                </p>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '5px' }}>
                    El Excel debe tener una celda con el texto exacto <strong>"Region"</strong>
                  </li>
                  <li style={{ marginBottom: '5px' }}>
                    La celda inmediatamente abajo debe contener:
                    <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                      <li><strong>"LA-Santiago"</strong> para Chile</li>
                      <li><strong>"LA-Buenos Aires1"</strong> para Argentina</li>
                    </ul>
                  </li>
                  <li>
                    Si no se detecta, se usará <strong>Santiago</strong> por defecto
                  </li>
                </ol>
              </div>
            </Section>

            <Section title="🔍 Búsqueda de 'Region' en el archivo">
              {debugData.regionSearch ? (
                <div>
                  <DataGrid data={[
                    ['Celdas encontradas', debugData.regionSearch.found],
                    ['Celda "Region"', debugData.regionSearch.regionCell || 'No encontrado'],
                    ['Valor celda inferior', debugData.regionSearch.regionValue || 'N/A']
                  ]} />
                </div>
              ) : (
                <div style={{ color: '#b2bec3', fontSize: '12px' }}>
                  Información de búsqueda no disponible
                </div>
              )}
            </Section>
          </div>
        )}

        {activeTab === 'billing' && debugData && (
          <div>
            <Section title="💳 Tipos de Billing">
              {!debugData.billing ? (
                <div style={{ color: '#b2bec3', fontSize: '12px' }}>
                  Información de billing no disponible
                </div>
              ) : (
                <div>
                  <div style={{ 
                    marginBottom: '15px', 
                    padding: '15px', 
                    backgroundColor: '#2d2d2d', 
                    borderRadius: '4px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '10px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00b894' }}>
                        {debugData.billing.summary?.total || 0}
                      </div>
                      <div style={{ fontSize: '11px', color: '#b2bec3' }}>Total</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0984e3' }}>
                        {debugData.billing.summary?.payPerUse || 0}
                      </div>
                      <div style={{ fontSize: '11px', color: '#b2bec3' }}>Pay-per-use</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fdcb6e' }}>
                        {debugData.billing.summary?.monthly || 0}
                      </div>
                      <div style={{ fontSize: '11px', color: '#b2bec3' }}>Monthly</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e17055' }}>
                        {debugData.billing.summary?.yearly || 0}
                      </div>
                      <div style={{ fontSize: '11px', color: '#b2bec3' }}>Yearly</div>
                    </div>
                    {debugData.billing.summary?.other > 0 && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d63031' }}>
                          {debugData.billing.summary.other}
                        </div>
                        <div style={{ fontSize: '11px', color: '#b2bec3' }}>Other</div>
                      </div>
                    )}
                  </div>

                  {debugData.billing.payPerUse?.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ 
                        padding: '8px', 
                        backgroundColor: '#0984e3', 
                        borderRadius: '4px', 
                        marginBottom: '10px',
                        fontWeight: 'bold'
                      }}>
                        💵 Pay-per-use ({debugData.billing.payPerUse.length} filas)
                      </div>
                      <div style={{ fontSize: '11px', color: '#b2bec3' }}>
                        Filas: {debugData.billing.payPerUse.map(b => b.row).join(', ')}
                      </div>
                    </div>
                  )}

                  {debugData.billing.monthly?.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ 
                        padding: '8px', 
                        backgroundColor: '#fdcb6e', 
                        borderRadius: '4px', 
                        marginBottom: '10px',
                        fontWeight: 'bold',
                        color: '#000'
                      }}>
                        📅 Monthly ({debugData.billing.monthly.length} filas)
                      </div>
                      <div style={{ fontSize: '11px', color: '#b2bec3' }}>
                        Filas: {debugData.billing.monthly.map(b => b.row).join(', ')}
                      </div>
                    </div>
                  )}

                  {debugData.billing.yearly?.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ 
                        padding: '8px', 
                        backgroundColor: '#e17055', 
                        borderRadius: '4px', 
                        marginBottom: '10px',
                        fontWeight: 'bold'
                      }}>
                        📆 Yearly ({debugData.billing.yearly.length} filas)
                      </div>
                      <div style={{ fontSize: '11px', color: '#b2bec3' }}>
                        Filas: {debugData.billing.yearly.map(b => b.row).join(', ')}
                      </div>
                    </div>
                  )}

                  {debugData.billing.other?.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ 
                        padding: '8px', 
                        backgroundColor: '#d63031', 
                        borderRadius: '4px', 
                        marginBottom: '10px',
                        fontWeight: 'bold'
                      }}>
                        ❓ Other ({debugData.billing.other.length} filas)
                      </div>
                      <div style={{ fontSize: '11px' }}>
                        {debugData.billing.other.map((b, i) => (
                          <div key={i} style={{ marginBottom: '3px' }}>
                            Fila {b.row}: "{b.value}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Section>

            <Section title="ℹ️ Información">
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 10px 0' }}>
                  <strong>El tipo de billing se detecta en la columna E:</strong>
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '5px' }}>
                    <strong>Pay-per-use:</strong> El ComboBox de Image está habilitado
                  </li>
                  <li style={{ marginBottom: '5px' }}>
                    <strong>Monthly/Yearly:</strong> El ComboBox de Image está deshabilitado
                  </li>
                  <li>
                    <strong>Other:</strong> Valores no reconocidos
                  </li>
                </ul>
              </div>
            </Section>
          </div>
        )}

        {activeTab === 'types' && debugData && (
          <div>
            <Section title="🏷️ Celdas Type Detectadas">
              {!debugData.typeCells || debugData.typeCells.length === 0 ? (
                <div style={{
                  padding: '15px',
                  backgroundColor: '#fdcb6e',
                  borderRadius: '4px',
                  textAlign: 'center',
                  color: '#000'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>No se encontraron celdas "Type"</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    El Excel debe tener celdas con el texto "Type" y el valor de tipo al lado
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#2d2d2d', borderRadius: '4px' }}>
                    <strong>Total de celdas Type:</strong> {debugData.typeCells.length}
                  </div>
                  
                  {debugData.typeCells.map((typeCell, i) => (
                    <div key={i} style={{
                      marginBottom: '15px',
                      padding: '15px',
                      backgroundColor: '#2d2d2d',
                      borderRadius: '4px',
                      border: '1px solid #444'
                    }}>
                      <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: '#0984e3' }}>
                        Fila {typeCell.row} - Celda {typeCell.typeCell}
                      </div>
                      
                      {typeCell.parsed ? (
                        <div>
                          <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#1e1e1e', borderRadius: '4px', fontSize: '11px' }}>
                            <div style={{ marginBottom: '5px' }}><strong>Valor completo:</strong></div>
                            <div style={{ color: '#b2bec3', wordBreak: 'break-all' }}>{typeCell.typeValue}</div>
                          </div>
                          
                          <table style={{ width: '100%', fontSize: '12px', marginBottom: '10px' }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: '4px', fontWeight: 'bold', width: '30%' }}>Arquitectura:</td>
                                <td style={{ padding: '4px' }}>{typeCell.parsed.arch}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '4px', fontWeight: 'bold' }}>Categoría Original:</td>
                                <td style={{ padding: '4px' }}>{typeCell.parsed.category}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '4px', fontWeight: 'bold' }}>Categoría Normalizada:</td>
                                <td style={{ padding: '4px', color: '#00b894' }}>{typeCell.normalizedCategory}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '4px', fontWeight: 'bold' }}>Flavor:</td>
                                <td style={{ padding: '4px', color: '#fdcb6e' }}>{typeCell.parsed.flavor}</td>
                              </tr>
                              {typeCell.parsed.vcpus && (
                                <tr>
                                  <td style={{ padding: '4px', fontWeight: 'bold' }}>vCPUs:</td>
                                  <td style={{ padding: '4px' }}>{typeCell.parsed.vcpus}</td>
                                </tr>
                              )}
                              {typeCell.parsed.ram && (
                                <tr>
                                  <td style={{ padding: '4px', fontWeight: 'bold' }}>RAM:</td>
                                  <td style={{ padding: '4px' }}>{typeCell.parsed.ram}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                          
                          {typeCell.imageOptions && (
                            <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#1e1e1e', borderRadius: '4px' }}>
                              <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Opciones de Imagen:</div>
                              {typeCell.imageOptions.error ? (
                                <div style={{ color: '#d63031', fontSize: '11px' }}>
                                  {typeCell.imageOptions.error}
                                </div>
                              ) : (
                                <div>
                                  <div style={{ fontSize: '11px', color: '#00b894', marginBottom: '5px' }}>
                                    {typeCell.imageOptions.options?.length || 0} opciones disponibles
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {typeCell.imageOptions.options?.map((opt, j) => (
                                      <span key={j} style={{
                                        padding: '3px 8px',
                                        backgroundColor: '#0984e3',
                                        borderRadius: '3px',
                                        fontSize: '10px'
                                      }}>
                                        {opt.label}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ padding: '8px', backgroundColor: '#d63031', borderRadius: '4px', fontSize: '12px' }}>
                          No se pudo parsear el valor
                        </div>
                      )}
                      
                      {typeCell.validation && typeCell.validation.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          {typeCell.validation.map((v, j) => (
                            <div key={j} style={{
                              padding: '6px',
                              marginBottom: '5px',
                              backgroundColor: v.level === 'ERROR' ? '#d63031' : 
                                             v.level === 'WARNING' ? '#fdcb6e' : '#00b894',
                              color: v.level === 'WARNING' ? '#000' : '#fff',
                              borderRadius: '4px',
                              fontSize: '11px'
                            }}>
                              <strong>[{v.level}]</strong> {v.message}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>
            
            <Section title="📋 Formato Esperado">
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 10px 0' }}>
                  <strong>El valor de la celda Type debe tener el formato:</strong>
                </p>
                <div style={{
                  padding: '10px',
                  backgroundColor: '#1e1e1e',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  marginBottom: '10px'
                }}>
                  arch | category | flavor | vcpus | ram
                </div>
                <p style={{ margin: '0 0 10px 0' }}>
                  <strong>Ejemplo:</strong>
                </p>
                <div style={{
                  padding: '10px',
                  backgroundColor: '#1e1e1e',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  wordBreak: 'break-all'
                }}>
                  x86 | General computing-plus | c6.6xlarge.4 | 24 vCPUs | 96GiB
                </div>
              </div>
            </Section>
          </div>
        )}

        {activeTab === 'colors' && debugData && (
          <div>
            <Section title="🎨 Colores Detectados (primeras 30 filas)">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#3d3d3d' }}>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Fila</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>ARGB</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Tipo</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Match</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Color</th>
                  </tr>
                </thead>
                <tbody>
                  {debugData.colors.map((c, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#2d2d2d' : '#252525' }}>
                      <td style={{ padding: '4px' }}>{c.row}</td>
                      <td style={{ padding: '4px', fontSize: '10px' }}>{c.argb || '-'}</td>
                      <td style={{ padding: '4px' }}>{c.type || '-'}</td>
                      <td style={{ padding: '4px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: c.matched?.includes('BLUE') ? '#0984e3' :
                                          c.matched?.includes('GRAY_LIGHT') ? '#b2bec3' :
                                          c.matched?.includes('GRAY') ? '#636e72' :
                                          c.matched?.includes('No color') ? 'transparent' :
                                          c.matched?.includes('No fill') ? 'transparent' : '#d63031',
                          fontSize: '10px'
                        }}>
                          {c.matched || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '4px' }}>
                        {c.hex && c.hex.startsWith('#') && (
                          <div style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: c.hex,
                            border: '1px solid #666',
                            borderRadius: '2px',
                            display: 'inline-block'
                          }}></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </div>
        )}

        {activeTab === 'formulas' && debugData && (
          <div>
            <Section title={`📐 Fórmulas (${debugData.formulas.length})`}>
              {debugData.formulas.length === 0 ? (
                <div style={{ color: '#fdcb6e' }}>No hay fórmulas en el archivo</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#3d3d3d' }}>
                      <th style={{ padding: '6px', textAlign: 'left' }}>Celda</th>
                      <th style={{ padding: '6px', textAlign: 'left' }}>Fórmula</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugData.formulas.map((f, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#2d2d2d' : '#252525' }}>
                        <td style={{ padding: '4px', fontWeight: 'bold', color: '#0984e3' }}>{f.cell}</td>
                        <td style={{ padding: '4px', fontSize: '10px' }}>= {f.formula}</td>
                        <td style={{ padding: '4px', textAlign: 'right', color: '#00b894' }}>
                          {typeof f.calculatedValue === 'number' ? f.calculatedValue.toFixed(2) : f.calculatedValue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            <Section title="📊 Celdas Importantes">
              {debugData.cells.map((row, i) => (
                <div key={i} style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#2d2d2d', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#0984e3' }}>Fila {row.row}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', fontSize: '11px' }}>
                    {Object.entries(row.cells).map(([col, cell]) => (
                      <div key={col} style={{ padding: '4px', backgroundColor: '#1e1e1e', borderRadius: '2px' }}>
                        <span style={{ color: '#fdcb6e' }}>{col}:</span>{' '}
                        {cell.formula ? (
                          <span style={{ color: '#00b894' }}>= {cell.formula}</span>
                        ) : (
                          <span>{cell.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Section>
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <Section title={`📋 Logs (${logs.length})`}>
              {logs.length === 0 ? (
                <div style={{ color: '#b2bec3' }}>No hay logs</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} style={{
                    padding: '6px',
                    marginBottom: '4px',
                    backgroundColor: log.category === 'ERROR' ? '#d63031' :
                                    log.category === 'UPLOAD' ? '#0984e3' :
                                    log.category === 'STRUCTURE' ? '#6c5ce7' :
                                    log.category === 'FORMULAS' ? '#00b894' :
                                    log.category === 'RECALC' ? '#fdcb6e' : '#3d3d3d',
                    borderRadius: '3px',
                    fontSize: '11px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 'bold' }}>[{log.category}]</span>
                      <span style={{ opacity: 0.7 }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div>{log.message}</div>
                    {log.data && (
                      <pre style={{
                        marginTop: '4px',
                        padding: '4px',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: '2px',
                        fontSize: '10px',
                        overflow: 'auto',
                        maxHeight: '100px'
                      }}>
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </Section>
          </div>
        )}

        {activeTab === 'validation' && (
          <div>
            {validation ? (
              <div>
                <div style={{
                  padding: '15px',
                  marginBottom: '15px',
                  backgroundColor: validation.valid ? '#00b894' : '#d63031',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {validation.valid ? '✓ Fórmulas Válidas' : '✗ Errores Encontrados'}
                </div>

                {validation.errors.length > 0 && (
                  <Section title="❌ Errores">
                    {validation.errors.map((err, i) => (
                      <div key={i} style={{
                        padding: '8px',
                        marginBottom: '5px',
                        backgroundColor: '#d63031',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {err}
                      </div>
                    ))}
                  </Section>
                )}

                <Section title={`🧪 Tests (${validation.tests.length})`}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#3d3d3d' }}>
                        <th style={{ padding: '6px', textAlign: 'left' }}>Celda</th>
                        <th style={{ padding: '6px', textAlign: 'left' }}>Tipo</th>
                        <th style={{ padding: '6px', textAlign: 'left' }}>Fórmula</th>
                        <th style={{ padding: '6px', textAlign: 'left' }}>Esperada</th>
                        <th style={{ padding: '6px', textAlign: 'center' }}>OK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.tests.map((t, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#2d2d2d' : '#252525' }}>
                          <td style={{ padding: '4px', fontWeight: 'bold', color: '#0984e3' }}>{t.cell}</td>
                          <td style={{ padding: '4px' }}>{t.type}</td>
                          <td style={{ padding: '4px', fontSize: '10px' }}>= {t.formula}</td>
                          <td style={{ padding: '4px', fontSize: '10px' }}>{t.expectedRange || '-'}</td>
                          <td style={{ padding: '4px', textAlign: 'center' }}>
                            <span style={{
                              color: t.match ? '#00b894' : '#d63031',
                              fontWeight: 'bold'
                            }}>
                              {t.match ? '✓' : '✗'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Section>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#b2bec3' }}>
                Haz clic en "Validar Fórmulas" para ejecutar la validación
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{
        margin: '0 0 10px 0',
        padding: '8px',
        backgroundColor: '#3d3d3d',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function DataGrid({ data }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gap: '5px',
      fontSize: '12px'
    }}>
      {data.map(([label, value], i) => [
        <div key={`${i}-label`} style={{ padding: '4px', color: '#b2bec3' }}>{label}:</div>,
        <div key={`${i}-value`} style={{ padding: '4px', fontWeight: 'bold' }}>{value}</div>
      ])}
    </div>
  );
}

export default DebugPanel;

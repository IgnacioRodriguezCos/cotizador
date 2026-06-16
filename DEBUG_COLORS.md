# 🔍 DEBUG DE CONVERSIÓN DE COLORES

## ✅ Backend envía correctamente

```json
{
  "rowColors": {
    "1": "FF1874CD",
    "2": "FFDBDBDB",
    "4": "FFF5F5F5"
  }
}
```

Todos los ARGB tienen **8 caracteres** (AARRGGBB).

---

## ❌ Frontend muestra incorrecto

```
#74CD   ← Solo 4 caracteres
#DBDB   ← Solo 4 caracteres
#F5F5   ← Solo 4 caracteres
```

---

## 🔧 Pasos para Debug

### 1. Recargar frontend
```
Ctrl + Shift + R  (hard refresh)
```

### 2. Abrir consola
```
F12 → Console
```

### 3. Subir archivo

### 4. Buscar estos logs:

```
=== FRONTEND RECEIVED DATA ===
Full result: {...}
Has rowColors: true
rowColors type: object
rowColors count: 19
Sample rowColors:
  Row 1: "FF1874CD" (length: 8, type: string)
  Row 2: "FFDBDBDB" (length: 8, type: string)
  Row 4: "FFF5F5F5" (length: 8, type: string)
```

**SI ves length: 8** → El frontend recibe correctamente
**SI ves length: 6 o menos** → Hay problema de serialización

---

## 🎯 Posibles Problemas

### Problema 1: JSON.parse truncando

Si el JSON se está parseando incorrectamente, puede truncar strings.

**Solución**: Verificar Network tab
```
F12 → Network → upload → Response
```

Ver respuesta raw del servidor.

### Problema 2: Axios transformResponse

Axios puede estar transformando la respuesta.

**Solución**: Verificar api.js

### Problema 3: React state

El estado de React puede estar mutando los datos.

**Solución**: Usar Immer o copia profunda

---

## 📊 Conversión Correcta

| ARGB | Operación | HEX |
|------|-----------|-----|
| FF1874CD | substring(2) | #1874CD |
| FFDBDBDB | substring(2) | #DBDBDB |
| FFF5F5F5 | substring(2) | #F5F5F5 |

**SI length === 8**: `hex = '#' + argb.substring(2)`
**SI length === 6**: `hex = '#' + argb`
**SI length < 6**: Error - ARGB incompleto

---

## 🚀 Próximo Paso

1. Recarga página (Ctrl+Shift+R)
2. Sube archivo
3. Revisa consola
4. Busca: `Row 1: "..." (length: X)`
5. Reporta qué **length** muestra

Si length = 8, el problema está en la conversión HEX.
Si length < 8, el problema está en la recepción de datos.

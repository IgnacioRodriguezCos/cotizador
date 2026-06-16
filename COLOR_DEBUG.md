# 🎨 DEBUG DE COLORES

## ✅ Backend está enviando colores correctos

```
Row 1: #1874CD (azul)
Row 2: #DBDBDB (gris)
Row 4-22: #F5F5F5 (gris claro)
```

## 🔍 Si ves tonalidades de ROSA

### Posible Causa 1: Archivo diferente

El archivo que subes puede tener colores diferentes al ejemplo.

**Solución**: 
- Abre la consola del navegador (F12 → Console)
- Busca los logs: "Row X color: ARGB=..., HEX=..."
- Verifica qué colores HEX se están mostrando

### Posible Causa 2: Colores del archivo

**Verifica en el panel de debug**:
- Debajo de la leyenda, ahora hay un panel "Colores detectados"
- Muestra cuadros de color con el HEX real
- Si los cuadros son rosa, el archivo tiene colores rosa

### Posible Causa 3: Problema de monitor

**Verifica**:
- Los colores HEX deben ser:
  - Azul: #1874CD
  - Gris: #DBDBDB  
  - Gris claro: #F5F5F5

---

## 🛠️ Cómo verificar

### Paso 1: Abrir consola del navegador
```
F12 → Console
```

### Paso 2: Buscar logs de color
Deberías ver:
```
Row 1 color: ARGB=FF1874CD, HEX=#1874CD
Row 2 color: ARGB=FFDBDBDB, HEX=#DBDBDB
Row 4 color: ARGB=FFF5F5F5, HEX=#F5F5F5
...
```

### Paso 3: Verificar panel de colores
Debajo de la leyenda, verás cuadros de color:
```
■ Fila 1: #1874CD  (debe ser azul)
■ Fila 2: #DBDBDB  (debe ser gris)
■ Fila 4: #F5F5F5  (debe ser gris claro)
```

---

## 📸 Si los colores son rosa

Si ves algo como:
```
■ Fila 1: #CD1874  (rosa)
■ Fila 2: #DBDBDB  (gris - correcto)
■ Fila 4: #F5F5F5  (gris claro - correcto)
```

Entonces el problema es que **tu archivo tiene colores diferentes**.

### Solución:
1. Abre tu archivo Excel original
2. Verifica los colores de las filas
3. El archivo de ejemplo tiene:
   - Fila 1: Azul (RGB: 24, 116, 205)
   - Fila 2: Gris (RGB: 219, 219, 219)
   - Filas componentes: Gris claro (RGB: 245, 245, 245)

---

## 🔄 Si quieres usar el archivo de ejemplo

El archivo de ejemplo está en:
```
C:\Users\i50055736\Documents\Cotizador\Cotizacion EMEC Mar 9, 2026.xlsx
```

Úsalo para probar que el sistema funciona correctamente.

---

## 💡 Interpretación de colores HEX

| HEX | Color | RGB |
|-----|-------|-----|
| #1874CD | Azul | (24, 116, 205) |
| #DBDBDB | Gris | (219, 219, 219) |
| #F5F5F5 | Gris claro | (245, 245, 245) |
| #CD1874 | Rosa | (205, 24, 116) |
| #FFC0CB | Rosa claro | (255, 192, 203) |

Si ves #CD1874 en lugar de #1874CD, los componentes están invertidos (BGR en lugar de RGB).

---

Recarga la página (Ctrl+Shift+R) y verifica los colores en el panel de debug.

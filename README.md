# Cotizador Excel

Editor de Excel con generación automática de fórmulas y detección de región.

## Despliegue en Render

### Opción 1: Usando render.yaml (Recomendado)

1. **Crear cuenta en Render**
   - Ve a https://render.com
   - Crea una cuenta gratuita
   - Conecta tu cuenta de GitHub

2. **Crear Blueprint**
   - En el dashboard de Render, haz clic en "New" → "Blueprint"
   - Selecciona tu repositorio: `IgnacioRodriguezCos/cotizador`
   - Render detectará automáticamente el archivo `render.yaml`
   - Haz clic en "Apply"

3. **Esperar despliegue**
   - Render instalará dependencias
   - Build del frontend
   - Iniciará el servidor
   - URL final: `https://cotizador.onrender.com`

### Opción 2: Manual

1. **Crear Web Service**
   - En Render dashboard, haz clic en "New" → "Web Service"
   - Conecta repositorio: `IgnacioRodriguezCos/cotizador`
   - Configura:
     - **Name:** cotizador
     - **Root Directory:** backend
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`
     - **Environment:** Node

2. **Agregar variable de entorno**
   - En la sección "Environment Variables"
   - Agregar: `NODE_ENV=production`

3. **Deploy**
   - Haz clic en "Create Web Service"
   - Espera a que termine el build

## Desarrollo Local

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Estructura del Proyecto

```
cotizador/
├── backend/
│   ├── server.js          # Servidor Express
│   ├── routes/            # API endpoints
│   ├── services/          # Lógica de negocio
│   ├── middleware/        # Middleware Express
│   └── package.json       # Dependencias backend
├── frontend/
│   ├── src/               # Código React
│   ├── public/            # Archivos estáticos
│   └── package.json       # Dependencias frontend
├── pricing.json           # Precios por región
└── render.yaml            # Configuración Render
```

## Características

- ✅ Detección automática de región (Santiago/Buenos Aires)
- ✅ ComboBox dinámico con opciones de imagen
- ✅ Cálculo automático de precios
- ✅ Generación de fórmulas Excel
- ✅ Recálculo automático de totales
- ✅ Debug panel integrado

## Tecnologías

- **Backend:** Node.js, Express, ExcelJS
- **Frontend:** React, Axios
- **Deploy:** Render

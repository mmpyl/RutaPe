<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RutaPe

MVP de monitoreo y operación logística de última milla para PYMEs, con dashboard operativo, simulación de rutas, tracking en tiempo real y análisis comparativo por carrier.

## Stack principal

- React 19 + Vite
- Express + WebSocket (`ws`)
- Tailwind CSS + Motion
- Recharts para analítica
- Google Maps vía `@vis.gl/react-google-maps` (opcional)

## Ejecutar localmente

**Prerequisitos:**
- Node.js 20+
- npm

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno opcionales

El proyecto **no requiere `GEMINI_API_KEY`** para correr el dashboard actual.

Si quieres habilitar la experiencia de mapa con Google Maps, configura una de estas variables antes de iniciar la app:

```bash
GOOGLE_MAPS_PLATFORM_KEY=tu_api_key
```

O en frontend con Vite:

```bash
VITE_GOOGLE_MAPS_PLATFORM_KEY=tu_api_key
```

Si no configuras esa clave, la aplicación seguirá funcionando y mostrará un estado guiado indicando que falta la integración del mapa.

### 3. Levantar el servidor de desarrollo

```bash
npm run dev
```

La app queda disponible en:

- http://localhost:3000

## Scripts útiles

```bash
npm run dev
npm run lint
npm run build
```

## Notas importantes

- Los datos actuales de pedidos, repartidores y rutas viven en memoria dentro de `server.ts`, por lo que se reinician al reiniciar el servidor.
- El endpoint de WhatsApp y varias acciones del dashboard siguen siendo simulaciones propias de un MVP.
- El mapa es opcional; sin API key el resto del producto sigue siendo usable.


## Despliegue en Netlify

El proyecto ya incluye configuración para desplegar el frontend en **Netlify** sin depender del servidor Express local.

### ¿Cómo funciona en Netlify?

- Netlify compila una versión estática con `VITE_DATA_MODE=browser`.
- En ese modo, RutaPe usa un dataset demo persistido en `localStorage` del navegador.
- Las acciones de crear pedido, actualizar estado, optimizar rutas y enviar alertas se simulan del lado cliente para facilitar pruebas funcionales.
- También se incluye configuración SPA (`netlify.toml` y `_redirects`) para que recargar rutas no rompa la app.

### Pasos de despliegue

1. Conecta este repositorio en Netlify.
2. Usa estos valores si Netlify no los detecta automáticamente:

```bash
Build command: npm run build
Publish directory: dist
```

3. Despliega.

### Importante

- El deploy en Netlify es ideal para **demos y QA funcional**.
- El backend Express/WebSocket sigue siendo la opción correcta para desarrollo local o para una futura versión con persistencia real.

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


## Uso desde VS Code

1. Abre la carpeta del proyecto en VS Code.
2. Ejecuta la tarea **`RutaPe: install`** si aún no instalaste dependencias.
3. Presiona `F5` y selecciona **`RutaPe: Dev Server`**.
4. VS Code levantará `npm run dev` y abrirá automáticamente `http://localhost:3000` cuando el servidor esté listo.

También quedan disponibles estas tareas en **Terminal > Run Task**:

- `RutaPe: install`
- `RutaPe: dev`
- `RutaPe: lint`
- `RutaPe: build`

### Archivos agregados para VS Code

- `.vscode/launch.json`: arranque y depuración local.
- `.vscode/tasks.json`: tareas comunes del proyecto.
- `.vscode/settings.json`: oculta `.rutape-data` para no ensuciar el explorador.
- `.vscode/extensions.json`: recomendaciones básicas para trabajar el proyecto.

## Notas importantes

- El estado operativo ya no vive solo en memoria: el backend persiste pedidos, conductores y rutas en `.rutape-data/logistics-state.json` para reducir retrabajo entre reinicios del servidor.
- El endpoint de WhatsApp y varias acciones del dashboard siguen siendo simulaciones propias de un MVP.
- El mapa es opcional; sin API key el resto del producto sigue siendo usable.


## Mejoras recomendadas (visión especialista)

Si el objetivo es madurar RutaPe más allá del demo/MVP, priorizaría este orden:

1. **Persistencia real** para pedidos, conductores, rutas y POD.
2. **Contratos compartidos runtime** (por ejemplo con esquemas validados) entre frontend y backend.
3. **Extracción del optimizador de rutas** a un servicio aislado y testeable.
4. **Auditoría y trazabilidad** de cambios de estado, alertas y entregas.
5. **Tests de dominio y de integración** para flujos críticos como creación de pedidos, optimización y cierre POD.
6. **Observabilidad**: logs estructurados, métricas de errores y tiempos de respuesta.
7. **Seguridad operativa**: secretos por entorno, rate limiting, validación más estricta y endurecimiento de inputs.

Estas mejoras ofrecen más retorno que abrir nuevos canales de despliegue antes de tener una base operativa más consistente.


### Persistencia actual

- La persistencia implementada es intencionalmente simple: un repositorio en disco basado en JSON para acelerar validación funcional y reducir retrabajo del MVP.
- El siguiente salto recomendado sigue siendo migrar esta capa a repositorios desacoplados con una base de datos real y storage para POD.


## Documento de rediseño de producto

Para el blueprint completo de RutaPe como agregador logístico SaaS/marketplace, revisa `docs/rutape-saas-platform-blueprint.md`.

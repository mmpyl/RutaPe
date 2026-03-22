# RutaPe - Plan Inicial de Refactor Arquitectónico

## Objetivo
Reducir el acoplamiento actual del MVP y preparar la base para persistencia real, almacenamiento de evidencia POD, analítica más confiable y futuras integraciones con carriers.

## Problemas actuales
- `server.ts` concentra validación, mock data, transporte HTTP/WebSocket y lógica operativa.
- `useApi` mezcla fetch inicial, WebSocket, mutaciones y estado del cliente.
- La lógica de negocio del dashboard vive dentro de componentes UI.
- El proyecto diferencia poco entre modo demo y comportamiento real.

## Arquitectura objetivo (faseada)

### Backend
- `server/data/` para fixtures y fuentes de datos demo.
- `server/validation/` para validación y sanitización de payloads.
- `server/services/` para reglas de negocio (pedidos, optimización, realtime).
- `server/http/` para handlers y rutas.

### Frontend
- `src/features/orders/`
- `src/features/routes/`
- `src/features/dashboard/`
- `src/features/pod/`
- `src/shared/api/`
- `src/shared/realtime/`
- `src/shared/selectors/`

## Orden recomendado de ejecución
1. Extraer `server.ts` en módulos pequeños sin cambiar comportamiento.
2. Separar `useApi` en cliente API, realtime y estado.
3. Mover métricas del dashboard a selectors puros.
4. Introducir contratos runtime compartidos.
5. Reemplazar datos en memoria por repositorios con persistencia.

## Inicio de refactor aplicado en esta iteración
- Extracción de mock data inicial a `server/data/mockData.ts`.
- Extracción de validación/sanitización de pedidos a `server/validation/orders.ts`.
- Simplificación de `server.ts` para que quede más cerca de composición y orquestación.

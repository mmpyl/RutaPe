# RutaPe · Roadmap de mejoras recomendado

## Objetivo

Pasar de un MVP convincente a una base técnicamente sostenible para pilotos reales.

## Prioridad 1 · Persistencia y repositorios

- Sustituir el estado en memoria por repositorios (`orders`, `drivers`, `routes`, `pods`).
- Definir interfaces de repositorio para no acoplarse a una sola base de datos.
- Persistir evidencias POD fuera del proceso (storage de objetos + metadata en DB).

## Prioridad 2 · Contratos runtime compartidos

- Introducir esquemas validados para requests/responses compartidos entre frontend y backend.
- Evitar divergencia entre `types.ts` y validaciones manuales del servidor.
- Estandarizar errores de API con códigos y mensajes consistentes.

## Prioridad 3 · Servicios de dominio

- Extraer la optimización de rutas del entrypoint del servidor.
- Separar casos de uso:
  - crear pedido,
  - asignar conductor,
  - optimizar rutas,
  - cerrar entrega con POD,
  - disparar alertas.
- Mantener `server.ts` como bootstrap, no como concentrador de negocio.

## Prioridad 4 · Calidad y testing

- Tests unitarios para selectores, validadores y sincronización de rutas.
- Tests de integración API para `POST /api/orders`, `PATCH /api/orders/:id` y `POST /api/routes/optimize`.
- Fixtures determinísticos para evitar comportamiento aleatorio en pruebas.

## Prioridad 5 · Observabilidad y operación

- Logging estructurado por request y por evento de negocio.
- Métricas: pedidos creados, retrasados, entregados, tiempo de optimización, errores POD.
- Healthcheck y readiness checks si el backend evoluciona a un entorno persistente.

## Prioridad 6 · Seguridad y compliance básica

- Límite de tamaño y tipo para uploads de evidencia.
- Sanitización más estricta de strings y payloads opcionales.
- Rate limiting para endpoints sensibles y futura autenticación por rol.

## Prioridad 7 · Producto / UX

- Timeline de pedido con historial real.
- Vista de detalle POD consultable después de la entrega.
- Estados de error más accionables para operaciones.
- Dashboard con series temporales reales, no inferidas desde snapshots.

## Recomendación táctica

Antes de reactivar el frente de despliegue en Netlify u otros canales, conviene cerrar al menos las prioridades 1 a 3. Eso reducirá retrabajo y hará que cualquier despliegue posterior represente mejor el estado real del producto.

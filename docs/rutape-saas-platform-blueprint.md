# RutaPe · Blueprint de plataforma SaaS tipo marketplace logístico (MVP funcional)

## 0. Resumen ejecutivo

RutaPe debe evolucionar desde un panel operativo de última milla a una **plataforma SaaS agregadora logística para empresas en Perú**, donde una empresa pueda:

1. registrar envíos,
2. cotizar con múltiples couriers,
3. comparar precio, tiempo y SLA,
4. seleccionar la mejor opción,
5. monitorear tracking consolidado,
6. operar incidentes y entregas,
7. recibir recomendaciones inteligentes basadas en datos.

La mejor estrategia para el MVP no es construir un “Uber de couriers” completo desde el día 1, sino una **web platform B2B** con:

- panel multiempresa,
- motor de cotización y comparación,
- gestión de órdenes/envíos,
- tracking consolidado,
- analítica operativa,
- capa inicial de optimización y recomendación.

El diferencial de RutaPe no será solo “mostrar couriers”, sino convertirse en la **capa de decisión y operación** entre empresa y proveedores logísticos.

---

# 1. Arquitectura general del sistema

## 1.1 Tipo de producto recomendado

### Recomendación
**Web App primero + mobile app después**.

### ¿Por qué?
Para el MVP, el usuario principal es la **empresa / operador logístico / analista / backoffice**, y su trabajo ocurre principalmente desde laptop o desktop:

- registrar cargas masivas,
- comparar cotizaciones,
- revisar dashboards,
- gestionar incidencias,
- ver reportes,
- configurar integraciones.

Eso hace que la **Web App** tenga el mayor retorno inicial.

### Mobile app sí, pero en segunda fase
La app móvil tiene más sentido para:

- repartidores,
- conductores,
- tracking ejecutivo,
- captura POD,
- alertas operativas en campo.

**Conclusión:**
- **MVP:** Web App responsive.
- **V2:** app móvil para repartidor/courier y tracking ejecutivo.

---

## 1.2 Arquitectura lógica recomendada

```text
[Frontend Web SaaS]
    |
    v
[API Gateway / Backend for Frontend]
    |
    +--> [Auth & Multi-tenant Service]
    +--> [Shipment Service]
    +--> [Quotation & Courier Aggregation Service]
    +--> [Tracking Service]
    +--> [Recommendation / RutaPe Engine]
    +--> [Billing & Plans Service]
    +--> [Notification Service]
    |
    +--> [PostgreSQL]
    +--> [Redis / Queue]
    +--> [Object Storage for POD]
    +--> [External Courier APIs]
    +--> [Maps / Geocoding / Routing APIs]
```

---

## 1.3 Capas del sistema

### Frontend
Responsable de:
- UX SaaS multiempresa,
- dashboards,
- formularios de envío,
- comparador de couriers,
- tracking consolidado,
- configuración de cuenta,
- gestión de usuarios y planes.

### Backend
Responsable de:
- autenticación,
- permisos y multi-tenancy,
- lógica de negocio,
- normalización de couriers,
- cálculo de cotizaciones,
- tracking unificado,
- auditoría,
- reportes,
- recomendaciones.

### Datos
Responsable de:
- persistir empresas, usuarios, couriers, tarifas, envíos, tracking, pagos,
- almacenar logs de eventos,
- guardar POD (firma/foto),
- mantener histórico para analítica y ML.

### Integraciones externas
Responsable de:
- cotización y órdenes con couriers,
- tracking API,
- mapas,
- mensajería,
- pagos,
- facturación electrónica si aplica.

---

## 1.4 Tecnologías recomendadas

## Opción recomendada para MVP (alta velocidad + buena base futura)

### Frontend Web
- **React + Next.js** o **React + Vite**.
- UI: **Tailwind CSS** + sistema de componentes.
- Charts: **Recharts** / **ECharts**.
- Estado remoto: **TanStack Query**.
- Formularios: **React Hook Form**.

### Backend
- **Node.js + TypeScript**.
- Framework: **NestJS** o **Express/Fastify** con arquitectura modular.
- Validación runtime: **Zod** o **Valibot**.
- Realtime: **WebSocket / Socket.IO** para tracking y eventos operativos.

### Base de datos
- **PostgreSQL** como base principal.
- **Redis** para caché, colas, rate limiting y sesiones efímeras.

### Storage
- **S3 / Cloudflare R2 / Supabase Storage** para POD, etiquetas, guías y documentos.

### Infraestructura
- Contenedores con **Docker**.
- Despliegue en **Railway / Render / Fly.io / AWS ECS** para MVP.
- Observabilidad con **OpenTelemetry + Grafana / Sentry**.

### Machine Learning / analítica avanzada
- **Python** para entrenamiento y pipelines de ML.
- **FastAPI** o jobs offline para exponer inferencias si el motor crece.

---

## 1.5 Integración del algoritmo RutaPe

El algoritmo RutaPe debe existir como un **servicio de decisión**, no embebido como lógica dispersa del frontend.

### RutaPe Engine tendrá 3 responsabilidades:
1. **Scoring de courier**
2. **Predicción de tiempo estimado**
3. **Optimización de asignación/ruta**

### Flujo recomendado
- El módulo de cotización consulta tarifas y tiempos base de couriers.
- RutaPe agrega contexto interno:
  - historial de entregas,
  - congestión por zona,
  - nivel de incidencias,
  - comportamiento del courier,
  - prioridad/SLA del envío.
- Luego devuelve:
  - mejor courier recomendado,
  - score por proveedor,
  - explicación de la recomendación,
  - ETA ajustado,
  - ruta sugerida si es flota propia.

---

## 1.6 Uso de Machine Learning

ML debe incorporarse progresivamente, no como dependencia del MVP base.

### Casos de uso recomendados

#### a) Predicción de tiempos de entrega (ETA)
Modelar:
- distrito origen/destino,
- hora del día,
- día de la semana,
- tipo de courier,
- peso/volumen,
- historial de cumplimiento,
- clima/tráfico si se integra.

#### b) Recomendación del mejor courier
Modelar:
- costo,
- ETA real vs prometido,
- tasa de incidencias,
- tasa de entregas exitosas,
- cobertura por zona,
- tipo de paquete,
- preferencia comercial por cuenta.

#### c) Detección de riesgo
Modelar probabilidad de:
- retraso,
- devolución,
- intento fallido,
- SLA incumplido.

#### d) Optimización de rutas
En etapas posteriores, combinar heurísticas + ML para priorizar secuencias más eficientes.

---

# 2. Módulos del sistema

## 2.1 Autenticación y autorización
Responsable de:
- login,
- registro,
- recuperación de contraseña,
- SSO futuro,
- roles y permisos,
- aislamiento por empresa (multi-tenant).

## 2.2 Módulo de empresas
Responsable de:
- crear empresa,
- administrar sucursales,
- datos fiscales,
- usuarios internos,
- direcciones frecuentes,
- preferencias operativas.

## 2.3 Módulo de couriers
Responsable de:
- catálogo de couriers,
- cobertura por zona,
- SLA,
- conectividad API/manual,
- performance histórica,
- reglas de disponibilidad.

## 2.4 Módulo de envíos
Responsable de:
- crear envío,
- editar envío,
- cancelar,
- reprogramar,
- adjuntar metadata,
- asociar documentos y POD.

## 2.5 Módulo de cotización
Responsable de:
- consultar tarifas,
- aplicar reglas comerciales,
- calcular costos estimados,
- mostrar tiempos prometidos,
- devolver opciones comparables.

## 2.6 Módulo de tracking
Responsable de:
- tracking consolidado multi-courier,
- timeline de estados,
- incidencias,
- ETA,
- alertas proactivas.

## 2.7 Módulo de reportes
Responsable de:
- reportes por empresa, courier, zona y período,
- volumen enviado,
- costo total,
- SLA,
- incidencias,
- entregas exitosas,
- exportaciones CSV/PDF.

## 2.8 Módulo de pagos y planes
Responsable de:
- suscripciones SaaS,
- límites por plan,
- facturación,
- renovaciones,
- historial de pagos.

## 2.9 Módulo de recomendaciones inteligentes
Responsable de:
- ranking de couriers,
- score de riesgo,
- sugerencia de courier ideal,
- priorización de envíos,
- recomendaciones operativas.

## 2.10 Módulo administrativo
Responsable de:
- gestión de empresas,
- planes,
- couriers,
- tarifas,
- auditoría,
- soporte,
- métricas globales.

---

# 3. Diseño de pantallas (UI/UX)

## Principios UX del producto
La experiencia debe sentirse más cercana a:
- **Booking/Trivago** para comparar opciones,
- **Uber** para tracking y ETA,
- **SaaS B2B** para operar y reportar.

El usuario debe entender rápidamente:
1. qué envíos tiene,
2. cuál courier conviene,
3. qué envíos están en riesgo,
4. dónde actuar ahora.

---

## 3.1 Pantallas para empresas

## Login / Registro
**Debe contener:**
- email,
- contraseña,
- CTA de ingreso,
- recuperación de contraseña,
- registro de empresa,
- branding claro de propuesta de valor.

**Botones:**
- Ingresar
- Crear cuenta
- Recuperar contraseña

---

## Dashboard
**Debe contener:**
- KPIs principales:
  - envíos de hoy,
  - entregados,
  - en tránsito,
  - incidencias,
  - gasto logístico,
  - SLA.
- gráfico de evolución semanal,
- ranking de couriers,
- alertas críticas,
- envíos recientes,
- accesos rápidos.

**Botones:**
- Registrar envío
- Cotizar envío
- Ver tracking
- Exportar reporte

---

## Registrar envío
**Debe contener:**
- datos del remitente,
- destinatario,
- dirección,
- distrito/provincia,
- peso/volumen,
- tipo de paquete,
- valor declarado,
- prioridad,
- ventana horaria,
- observaciones,
- carga masiva CSV/Excel.

**Botones:**
- Guardar borrador
- Cotizar ahora
- Crear envío

---

## Cotizar envío
**Debe contener:**
- resumen del envío,
- opciones de courier,
- precio,
- tiempo estimado,
- SLA,
- score RutaPe,
- badges: recomendado / más barato / más rápido.

**Botones:**
- Comparar
- Seleccionar courier
- Volver a editar

---

## Comparar couriers
**Debe contener:**
- tabla comparativa,
- filtros por precio/tiempo/SLA,
- detalle de cobertura,
- historial de performance,
- explicación del score.

**Botones:**
- Elegir courier
- Ver detalle
- Recalcular

---

## Tracking de envíos
**Debe contener:**
- mapa,
- timeline de estados,
- ETA,
- estado actual,
- courier asignado,
- repartidor si aplica,
- evidencia POD al cierre.

**Botones:**
- Ver detalle
- Reprogramar
- Reportar incidencia
- Contactar soporte/courier

---

## Historial de envíos
**Debe contener:**
- tabla filtrable,
- búsqueda por guía/cliente/courier,
- estado final,
- costo,
- tiempo real,
- resultado POD,
- exportación.

**Botones:**
- Ver detalle
- Exportar
- Duplicar envío

---

## Reportes y estadísticas
**Debe contener:**
- gasto por courier,
- costo promedio por envío,
- SLA por zona,
- volumen por período,
- incidencia por courier,
- heatmap de distritos.

**Botones:**
- Exportar CSV
- Exportar PDF
- Programar reporte

---

## Configuración
**Debe contener:**
- datos de empresa,
- usuarios y roles,
- integraciones,
- webhooks,
- claves/API,
- direcciones frecuentes,
- políticas operativas.

**Botones:**
- Guardar cambios
- Invitar usuario
- Conectar integración

---

## Facturación / Planes
**Debe contener:**
- plan actual,
- consumo,
- límites,
- historial de pagos,
- próxima renovación,
- upgrade/downgrade.

**Botones:**
- Cambiar plan
- Descargar factura
- Actualizar método de pago

---

## 3.2 Pantallas para administrador

## Dashboard administrativo
**Debe contener:**
- empresas activas,
- MRR/ARR,
- volumen total,
- couriers conectados,
- incidentes abiertos,
- churn de cuentas,
- tickets soporte.

## Gestión de empresas
**Debe contener:**
- listado de empresas,
- estado de suscripción,
- consumo,
- usuarios,
- actividad reciente.

## Gestión de couriers
**Debe contener:**
- catálogo,
- estado de integración,
- cobertura,
- SLA,
- performance.

## Gestión de tarifas
**Debe contener:**
- matrices tarifarias,
- reglas por zona/peso,
- vigencia,
- overrides manuales.

## Gestión de envíos
**Debe contener:**
- buscador global,
- incidentes,
- reintentos,
- estado de tracking,
- trazabilidad.

---

# 4. Flujo del usuario (User Flow)

## Flujo principal empresa

1. **La empresa inicia sesión**.
2. Entra al **Dashboard** y hace clic en **Registrar envío**.
3. Completa datos del paquete y destino.
4. El sistema ejecuta el **módulo de cotización**.
5. RutaPe consulta couriers y genera una **comparación**.
6. La empresa revisa precio, tiempo, SLA y recomendación inteligente.
7. Selecciona courier o deja que RutaPe elija por regla automática.
8. El envío se registra y se genera guía/orden.
9. El envío pasa a **tracking**.
10. Se actualizan estados: recibido, recogido, en tránsito, en reparto, entregado o incidente.
11. Si se entrega, se registra **POD**.
12. El envío queda en historial y alimenta reportes/ML.
13. La empresa revisa métricas y toma mejores decisiones en próximos envíos.

---

# 5. Diseño de base de datos

## 5.1 Tablas principales

## empresas
- id
- razon_social
- ruc
- nombre_comercial
- email
- telefono
- direccion_fiscal
- plan_id
- estado
- created_at
- updated_at

## usuarios
- id
- empresa_id
- nombre
- email
- password_hash
- rol
- estado
- ultimo_login_at
- created_at

## couriers
- id
- nombre
- tipo (`api`, `manual`, `fleet`, `broker`)
- cobertura_json
- estado_integracion
- sla_base
- rating_interno
- created_at

## tarifas
- id
- courier_id
- zona_origen
- zona_destino
- peso_desde
- peso_hasta
- precio_base
- precio_por_kg
- tiempo_estimado_horas
- vigente_desde
- vigente_hasta

## envios
- id
- empresa_id
- courier_id (nullable hasta seleccionar)
- codigo_guia
- referencia_cliente
- origen_json
- destino_json
- peso
- volumen
- valor_declarado
- categoria
- prioridad
- estado
- precio_cotizado
- eta_prometido
- eta_predicho
- score_recomendacion
- created_at
- updated_at

## cotizaciones
- id
- envio_id
- courier_id
- precio
- eta_horas
- sla_score
- recommendation_score
- payload_respuesta_json
- created_at

## tracking_eventos
- id
- envio_id
- courier_id
- estado
- descripcion
- lat
- lng
- fecha_evento
- raw_payload_json

## pods
- id
- envio_id
- recipient_name
- recipient_document
- photo_url
- signature_url
- delivered_at
- notes
- acknowledged_by_driver

## planes
- id
- nombre
- precio_mensual
- limite_envios
- limite_usuarios
- limite_integraciones
- features_json

## pagos
- id
- empresa_id
- plan_id
- monto
- moneda
- estado
- proveedor_pago
- external_payment_id
- paid_at

## reportes_generados
- id
- empresa_id
- tipo
- filtros_json
- file_url
- created_at

## courier_performance_daily
- id
- courier_id
- fecha
- envios
- entregados
- retrasados
- fallidos
- costo_promedio
- eta_promedio_real

---

## 5.2 Relaciones

- **empresa 1:N usuarios**
- **empresa 1:N envios**
- **envio 1:N cotizaciones**
- **courier 1:N tarifas**
- **courier 1:N tracking_eventos**
- **envio 1:N tracking_eventos**
- **envio 1:1 pod**
- **empresa N:1 plan**
- **empresa 1:N pagos**

---

# 6. Algoritmo de recomendación (RutaPe)

## 6.1 Objetivo
Encontrar el **mejor courier** para cada envío considerando no solo precio, sino resultado esperado.

## 6.2 Variables clave
- distancia,
- origen/destino,
- distrito/zona,
- peso,
- volumen,
- hora del día,
- día de la semana,
- tráfico,
- clima,
- SLA histórico,
- tasa de entrega exitosa,
- costo,
- historial del courier en esa ruta,
- tipo de paquete,
- prioridad del cliente,
- incidencias previas.

## 6.3 Fórmula inicial (MVP)
En el MVP puede empezar como un **score heurístico**:

```text
score = w1*(costo_normalizado)
      + w2*(tiempo_normalizado)
      + w3*(sla_historico)
      + w4*(cobertura_zona)
      + w5*(riesgo_incidente)
```

Donde:
- menor costo suma puntos,
- menor tiempo suma puntos,
- mayor SLA suma puntos,
- cobertura confiable suma puntos,
- alto riesgo resta puntos.

## 6.4 Evolución del algoritmo

### Nivel 1
Reglas + scoring manual.

### Nivel 2
Modelos predictivos para ETA y probabilidad de incidencia.

### Nivel 3
Motor híbrido:
- predicción de tiempo,
- predicción de éxito,
- optimización de asignación,
- personalización por empresa.

## 6.5 Optimización de rutas

### Para flota propia o transportistas integrados
Usar:
- clustering por zona,
- nearest neighbor / savings / 2-opt para MVP,
- luego VRP con restricciones.

### Restricciones futuras
- ventanas horarias,
- capacidad del vehículo,
- prioridad,
- tiempos de servicio,
- devolución/reintentos.

---

# 7. MVP (versión 1, construible en 2–3 meses)

## 7.1 Qué sí entra

### Core B2B
- autenticación básica,
- multiempresa simple,
- registro de envíos,
- cotización comparativa manual/API con 2–4 couriers,
- recomendación heurística inicial,
- tracking consolidado,
- dashboard operativo,
- historial,
- reportes básicos,
- POD básico,
- roles Empresa/Admin.

### Integraciones iniciales
- 1–2 couriers vía API si es posible,
- 1 flujo manual/importado para couriers sin API.

### Analítica MVP
- costo por courier,
- SLA,
- entregas vs incidencias,
- tiempos promedio.

---

## 7.2 Qué no entra en V1
- app móvil completa,
- facturación electrónica avanzada,
- marketplace abierto con cientos de couriers,
- pagos complejos por uso,
- ML avanzado online,
- optimización multicriterio sofisticada,
- motor de pricing dinámico,
- panel completo para repartidor externo.

---

# 8. Roadmap de desarrollo

## Fase 1 · MVP
- autenticación,
- empresas,
- envíos,
- cotización,
- comparador,
- tracking,
- dashboard,
- POD,
- reportes básicos,
- recomendación heurística.

## Fase 2 · Automatización
- más couriers,
- reglas automáticas de asignación,
- webhooks,
- tracking más robusto,
- billing SaaS,
- panel courier/repartidor básico.

## Fase 3 · Machine Learning
- ETA predictivo,
- recomendación inteligente avanzada,
- scoring de riesgo,
- incident prediction,
- personalización por cuenta.

## Fase 4 · Escalamiento
- arquitectura por servicios,
- alta disponibilidad,
- colas/event-driven,
- observabilidad avanzada,
- optimización masiva,
- expansión regional.

---

# 9. Roles de usuario

## Empresa
Puede:
- crear envíos,
- cotizar,
- comparar,
- elegir courier,
- ver tracking,
- ver reportes,
- administrar usuarios internos.

## Courier
Puede:
- recibir órdenes asignadas,
- actualizar estados,
- reportar incidencias,
- exponer tracking,
- gestionar tarifas si el modelo lo permite.

## Administrador
Puede:
- gestionar empresas,
- planes,
- couriers,
- tarifas,
- auditoría,
- soporte,
- métricas globales.

## Repartidor
Puede:
- ver entregas asignadas,
- navegar ruta,
- actualizar estado,
- capturar POD,
- reportar incidencias.

---

# Recomendación final como Architect + Product + UX

Si RutaPe quiere parecerse a Booking/Trivago/Uber, el producto debe combinar tres capas:

1. **Marketplace de comparación** → ver y elegir courier.
2. **Sistema operativo logístico** → gestionar envíos y tracking.
3. **Motor inteligente de decisión** → recomendar y optimizar.

La clave del MVP no es “hacer todo”, sino construir primero el loop de valor:

**registrar → cotizar → comparar → elegir → trackear → medir → aprender**

Si ese loop funciona bien, RutaPe ya tiene una propuesta SaaS vendible para empresas.

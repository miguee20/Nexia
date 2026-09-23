# Nexia — Project Execution Progress & Milestone Tracker

Este documento constituye la bitácora activa de seguimiento del proyecto. Cada tarea se irá marcando con `[x]` a medida que sea completada, testeada y validada en su respectivo bloque de trabajo.

---

## Resumen Global de Avance

- [ ] **Fase 0: Infraestructura y Scaffolding (Cimientos)** (0 / 11 completadas)
- [ ] **Fase 1: Autenticación, Tenants y Modelo Base** (0 / 11 completadas)
- [ ] **Fase 2: Propiedades, Residentes, Vehículos y Marbetes** (0 / 10 completadas)
- [ ] **Fase 3: Módulo de Garita, Pases QR, Alertas de Delivery y Fallback** (0 / 17 completadas)
- [ ] **Fase 4: Módulo Financiero** (0 / 11 completadas)
- [ ] **Fase 5: Módulo de Amenidades** (0 / 6 completadas)
- [ ] **Fase 6: Notificaciones, Pulido y Documentación** (0 / 8 completadas)
- [ ] **Fase 7: Despliegue, Demo y Portafolio** (0 / 8 completadas)

---

## Fase 0 — Infraestructura y Scaffolding (Cimientos)
- **Objetivo:** Establecer la base del monorepo, configuración de TypeScript estricto, entorno de contenedores Docker y estructura inicial de Clean Architecture para la API y Next.js para el Frontend.
- **Entregable:** Monorepo funcional que compila sin errores, se levanta con Docker y responde a un endpoint de health check (`GET /health`).
- **Duración estimada:** 2-3 días.

- [ ] Inicializar repositorio Git con `.gitignore`, `LICENSE`, `README.md` inicial.
- [ ] Configurar Monorepo con npm workspaces (`apps/api`, `apps/web`, `packages/shared-types`).
- [ ] Configurar TypeScript estricto en los 3 paquetes.
- [ ] Configurar ESLint + Prettier con reglas compartidas.
- [ ] Configurar Express con estructura Clean Architecture (carpetas base con `index.ts`).
- [ ] Configurar Prisma con PostgreSQL (schema inicial con modelo `Condominio`).
- [ ] Crear `docker-compose.yml` que levante PostgreSQL 16.
- [ ] Implementar endpoint `GET /health` que verifica conexión a BD.
- [ ] Configurar variables de entorno con `.env.example`.
- [ ] Configurar Next.js con Tailwind CSS y shadcn/ui (página de landing placeholder).
- [ ] Verificar: `docker compose up` levanta BD + API funcional.

---

## Fase 1 — Autenticación, Tenants y Modelo Base
- **Objetivo:** Implementar la base de datos relacional multi-tenant completa, el mecanismo de autenticación segura (JWT Access + Refresh tokens) y el control de acceso basado en roles (RBAC).
- **Entregable:** Sistema de login funcional con JWT, creación y configuración dinámica de tenants por SuperAdmin, y modelo de datos base migrado y sembrado con datos de prueba.
- **Duración estimada:** 4-5 días.

- [ ] Diseñar y migrar el schema Prisma completo (todas las tablas del ERD).
- [ ] Implementar hashing de passwords (bcrypt).
- [ ] Implementar generación y verificación de JWT (access + refresh tokens).
- [ ] Implementar middlewares: `authMiddleware`, `tenantMiddleware`, `rbacMiddleware`.
- [ ] Implementar middleware global de manejo de errores.
- [ ] Implementar `LoginUseCase` y `RefreshTokenUseCase`.
- [ ] Implementar CRUD de Tenants (SuperAdmin): crear, listar, actualizar config.
- [ ] Crear seed de datos de prueba (1 condominio, 1 admin, 2 residentes, 1 guardia).
- [ ] Frontend: Página de Login funcional conectada al API.
- [ ] Frontend: Layout base con Sidebar (varía según rol del usuario autenticado).
- [ ] Tests unitarios: Login, validación de JWT, middleware de tenant.

---

## Fase 2 — Propiedades, Residentes, Vehículos y Marbetes
- **Objetivo:** Desarrollar el directorio completo de propiedades, asignación de residentes (propietarios e inquilinos con campos configurables por tenant), vehículos autorizados y gestión opcional de marbetes.
- **Entregable:** El Administrador puede gestionar propiedades, asignar residentes, registrar vehículos y (si el módulo está activo) administrar y renovar marbetes con cálculo de cobros extras.
- **Duración estimada:** 4-5 días.

- [ ] Implementar casos de uso de Propiedades (CRUD).
- [ ] Implementar asignación de Propietario e Inquilino a una Propiedad.
- [ ] Implementar CRUD de Vehículos por Propiedad.
- [ ] Implementar lógica de Marbetes (emisión, renovación, cancelación) condicionada a config del tenant.
- [ ] Implementar validación de marbetes incluidos vs extras con generación de cargo automático.
- [ ] Frontend: Dashboard del Admin con vista de Propiedades (tabla con filtros y búsqueda).
- [ ] Frontend: Modal/formulario para crear/editar propiedad y asignar residente.
- [ ] Frontend: Sección de vehículos y marbetes dentro del detalle de propiedad.
- [ ] Validaciones Zod para todos los endpoints de esta fase.
- [ ] Tests: Emisión de marbetes, límite de incluidos, cargo por extras.

---

## Fase 3 — Módulo de Garita, Pases QR, Alertas de Delivery y Fallback
- **Objetivo:** Construir el subsistema de seguridad física: generación de pases QR por residentes, escáner de alta velocidad para guardias, sistema de alertas directas de delivery sin fricción y mecanismo de fallback telefónico auditado.
- **Entregable:** El residente genera pases QR y alertas de delivery; el guardia valida en tiempo real con UI optimizada para tablets/móviles y cuenta con fallback de llamada; toda entrada/salida queda registrada en la bitácora inmutable.
- **Duración estimada:** 6-7 días.

- [ ] Implementar `GenerateVisitPassUseCase` (genera token UUID + firma HMAC + QR).
- [ ] Implementar `ValidateQRUseCase` (verifica firma, vigencia, estado de morosidad del anfitrión).
- [ ] Implementar `RegisterEntryUseCase` y `RegisterExitUseCase`.
- [ ] Implementar `ManualEntryUseCase` (registro sin QR).
- [ ] Implementar `CreateDeliveryAlertUseCase` (crea alerta que aparece en el panel del guardia, con vigencia configurable).
- [ ] Implementar listado de alertas de delivery activas para el guardia.
- [ ] Implementar `RegisterDeliveryUseCase` (guardia registra ingreso de delivery desde la alerta).
- [ ] Implementar `GetPropertyContactUseCase` (guardia consulta teléfono de la propiedad).
- [ ] Implementar `RegisterCallVerificationUseCase` (guardia registra ingreso verificado por llamada telefónica).
- [ ] Implementar consulta de placas autorizadas y código de marbete.
- [ ] Implementar bitácora con filtros y exportación CSV (incluye tipos `DELIVERY` y `VERIFICACION_LLAMADA`).
- [ ] Frontend (Residente): Pantalla para generar pase QR con formulario simple, ver mis pases activos, compartir QR como imagen.
- [ ] Frontend (Residente): Botón "Espero un delivery" con formulario simple (descripción + repartidor opcional).
- [ ] Frontend (Garita): Vista dedicada con escáner de cámara, resultado visual VERDE/ROJO/AMARILLO, botones grandes para registrar entrada/salida.
- [ ] Frontend (Garita): Sección "Deliveries Esperados" con alertas activas y botón "Registrar Delivery".
- [ ] Frontend (Garita): Botón "Verificar con Residente" que muestra teléfono de la propiedad y permite registrar ingreso por llamada.
- [ ] Frontend (Admin): Vista de bitácora con filtros.
- [ ] Tests: Validación de QR expirado, QR ya usado, QR de moroso, alerta de delivery expirada, registro por llamada.

---

## Fase 4 — Módulo Financiero
- **Objetivo:** Desarrollar el motor de facturación interna, recargos automáticos por mora, conciliación de transferencias bancarias y generación de estados de cuenta y recibos.
- **Entregable:** Ciclo financiero completo: emisión masiva de cuotas → carga de boleta por residente → conciliación/aprobación por admin → generación de recibos PDF y semáforo de morosidad.
- **Duración estimada:** 5-7 días.

- [ ] Implementar `EmitFeesUseCase` (individual y masiva).
- [ ] Implementar lógica de recargo automático por mora.
- [ ] Implementar `SubmitPaymentUseCase` (subida de comprobante con imagen).
- [ ] Implementar `ApprovePaymentUseCase` y `RejectPaymentUseCase`.
- [ ] Implementar consulta de estado de cuenta del residente.
- [ ] Implementar semáforo de morosidad (query con joins y aggregations).
- [ ] Implementar generación de recibo PDF.
- [ ] Implementar reporte mensual con exportación PDF/Excel.
- [ ] Frontend (Admin): Panel de emisión de cuotas, panel de conciliación de pagos, semáforo de morosidad, reportes.
- [ ] Frontend (Residente): Mi estado de cuenta, subir comprobante, descargar recibos.
- [ ] Tests: Emisión masiva, cálculo de recargos, concurrencia en pagos.

---

## Fase 5 — Módulo de Amenidades
- **Objetivo:** Proporcionar un sistema dinámico de gestión de áreas comunes con control de reservas, verificación de solvencia del residente y prevención estricta de solapamientos horarios.
- **Entregable:** El Admin crea amenidades dinámicas y gestiona el calendario; el residente reserva con validación automática de no-morosidad y control de concurrencia ACID.
- **Duración estimada:** 3-4 días.

- [ ] Implementar CRUD de Amenidades (admin).
- [ ] Implementar `BookAmenityUseCase` con validaciones (solvencia, solapamiento, anticipación).
- [ ] Implementar calendario de reservas.
- [ ] Frontend (Admin): Gestión de amenidades y vista de calendario.
- [ ] Frontend (Residente): Ver amenidades disponibles, crear reserva, ver mis reservas.
- [ ] Tests: Concurrencia en reservas (dos residentes al mismo tiempo), bloqueo por morosidad.

---

## Fase 6 — Notificaciones, Pulido y Documentación
- **Objetivo:** Implementar notificaciones in-app reactivas, documentación interactiva de la API con Swagger/OpenAPI, endurecimiento de seguridad y presentación profesional de nivel producción.
- **Entregable:** Sistema de notificaciones in-app operativo, Swagger funcional con todos los endpoints probables, rate limiting activo y README.md con arquitectura visual y guías completas.
- **Duración estimada:** 3-4 días.

- [ ] Implementar sistema de notificaciones in-app (CRUD + campana con badge).
- [ ] Disparar notificaciones automáticas en eventos clave (cuota emitida, pago aprobado/rechazado, etc.).
- [ ] Configurar Swagger/OpenAPI con documentación de todos los endpoints.
- [ ] Implementar Rate Limiting en endpoints sensibles.
- [ ] Frontend: Componente de notificaciones (campana + dropdown).
- [ ] Frontend: Modo oscuro / claro.
- [ ] Frontend: Responsive final (mobile-first para vista de garita).
- [ ] README.md profesional: badges, screenshots, diagrama de arquitectura, guía de instalación, link a demo, credenciales demo.

---

## Fase 7 — Despliegue, Demo y Portafolio
- **Objetivo:** Poner la plataforma en producción en infraestructura cloud pública (Vercel, Render/Railway, Supabase) con datos de demostración y credenciales públicas para evaluadores y clientes.
- **Entregable:** Aplicación 100% navegable en internet, con datos demo representativos, enlaces en el README y publicación profesional en LinkedIn.
- **Duración estimada:** 2-3 días.

- [ ] Crear base de datos PostgreSQL en Supabase o Render.
- [ ] Desplegar backend API en Render o Railway.
- [ ] Desplegar frontend en Vercel.
- [ ] Poblar base de datos de producción con datos demo realistas (2 condominios de ejemplo con residentes, cuotas y visitas).
- [ ] Crear credenciales demo públicas (usuario demo para cada rol).
- [ ] Verificar flujo completo end-to-end en producción.
- [ ] Actualizar README con link de la demo en vivo.
- [ ] Publicar en LinkedIn con post describiendo el proyecto y la arquitectura.

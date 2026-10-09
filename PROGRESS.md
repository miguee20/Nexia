# Nexia — Project Execution Progress & Milestone Tracker

Este documento constituye la bitácora activa de seguimiento del proyecto. Cada tarea se irá marcando con `[x]` a medida que sea completada, testeada y validada en su respectivo bloque de trabajo.

---

## Resumen Global de Avance

- [x] **Fase 0: Infraestructura y Scaffolding (Cimientos)** (11 / 11 completadas)
- [x] **Fase 1: Autenticación, Tenants y Modelo Base** (11 / 11 completadas)
- [x] **Fase 2: Propiedades, Residentes, Vehículos y Marbetes** (10 / 10 completadas)
- [x] **Fase 3: Módulo de Garita, Pases QR, Alertas de Delivery y Fallback** (19 / 19 completadas)
- [x] **Refactor UI/UX: Rediseño Estético B2B (Tokens, Shell y Pantallas)** (2 / 2 bloques completados)
- [ ] **Fase 4: Módulo Financiero** (0 / 11 completadas)
- [ ] **Fase 5: Módulo de Amenidades** (0 / 6 completadas)
- [ ] **Fase 6: Notificaciones, Pulido y Documentación** (0 / 8 completadas)
- [ ] **Fase 7: Despliegue, Demo y Portafolio** (0 / 8 completadas)

---

## Fase 0 — Infraestructura y Scaffolding (Cimientos)
- **Objetivo:** Establecer la base del monorepo, configuración de TypeScript estricto, entorno de contenedores Docker y estructura inicial de Clean Architecture para la API y Next.js para el Frontend.
- **Entregable:** Monorepo funcional que compila sin errores, se levanta con Docker y responde a un endpoint de health check (`GET /health`).
- **Duración estimada:** 2-3 días.

- [x] Inicializar repositorio Git con `.gitignore`, `LICENSE`, `README.md` inicial.
- [x] Configurar Monorepo con npm workspaces (`apps/api`, `apps/web`, `packages/shared-types`).
- [x] Configurar TypeScript estricto en los 3 paquetes.
- [x] Configurar ESLint + Prettier con reglas compartidas.
- [x] Configurar Express con estructura Clean Architecture (carpetas base con `index.ts`).
- [x] Configurar Prisma con PostgreSQL (schema inicial con modelo `Condominio`).
- [x] Crear `docker-compose.yml` que levante PostgreSQL 16.
- [x] Implementar endpoint `GET /health` que verifica conexión a BD.
- [x] Configurar variables de entorno con `.env.example`.
- [x] Configurar Next.js con Tailwind CSS y shadcn/ui (página de landing placeholder).
- [x] Verificar: `docker compose up` levanta BD + API funcional.

---

## Fase 1 — Autenticación, Tenants y Modelo Base
- **Objetivo:** Implementar la base de datos relacional multi-tenant completa, el mecanismo de autenticación segura (JWT Access + Refresh tokens) y el control de acceso basado en roles (RBAC).
- **Entregable:** Sistema de login funcional con JWT, creación y configuración dinámica de tenants por SuperAdmin, y modelo de datos base migrado y sembrado con datos de prueba.
- **Duración estimada:** 4-5 días.

- [x] Diseñar y migrar el schema Prisma completo (todas las tablas del ERD).
- [x] Implementar hashing de passwords (bcrypt).
- [x] Implementar generación y verificación de JWT (access + refresh tokens).
- [x] Implementar middlewares: `authMiddleware`, `tenantMiddleware`, `rbacMiddleware`.
- [x] Implementar middleware global de manejo de errores.
- [x] Implementar `LoginUseCase` y `RefreshTokenUseCase`.
- [x] Implementar CRUD de Tenants (SuperAdmin): crear, listar, actualizar config.
- [x] Crear seed de datos de prueba (1 condominio, 1 admin, 2 residentes, 1 guardia).
- [x] Frontend: Página de Login funcional conectada al API.
- [x] Frontend: Layout base con Sidebar (varía según rol del usuario autenticado).
- [x] Tests unitarios: Login, validación de JWT, middleware de tenant.

---

## Fase 2 — Propiedades, Residentes, Vehículos y Marbetes
- **Objetivo:** Desarrollar el directorio completo de propiedades, asignación de residentes (propietarios e inquilinos con campos configurables por tenant), vehículos autorizados y gestión opcional de marbetes.
- **Entregable:** El Administrador puede gestionar propiedades, asignar residentes, registrar vehículos y (si el módulo está activo) administrar y renovar marbetes con cálculo de cobros extras.
- **Duración estimada:** 4-5 días.

- [x] Implementar casos de uso de Propiedades (CRUD).
- [x] Implementar asignación de Propietario e Inquilino a una Propiedad.
- [x] Implementar CRUD de Vehículos por Propiedad.
- [x] Implementar lógica de Marbetes (emisión, renovación, cancelación) condicionada a config del tenant.
- [x] Implementar validación de marbetes incluidos vs extras con generación de cargo automático.
- [x] Frontend: Dashboard del Admin con vista de Propiedades (tabla con filtros y búsqueda).
- [x] Frontend: Modal/formulario para crear/editar propiedad y asignar residente.
- [x] Frontend: Sección de vehículos y marbetes dentro del detalle de propiedad.
- [x] Validaciones Zod para todos los endpoints de esta fase.
- [x] Tests: Emisión de marbetes, límite de incluidos, cargo por extras.

---

## Fase 3 — Módulo de Garita, Pases QR, Alertas de Delivery y Fallback
- **Objetivo:** Construir el subsistema de seguridad física: generación de pases QR por residentes, escáner de alta velocidad para guardias, sistema de alertas directas de delivery sin fricción y mecanismo de fallback telefónico auditado.
- **Entregable:** El residente genera pases QR y alertas de delivery; el guardia valida en tiempo real con UI optimizada para tablets/móviles y cuenta con fallback de llamada; toda entrada/salida queda registrada en la bitácora inmutable.
- **Duración estimada:** 6-7 días.

- [x] Implementar `GenerateVisitPassUseCase` (genera token UUID + firma HMAC + QR).
- [x] Implementar `ValidateQRUseCase` (verifica firma, vigencia, estado de morosidad del anfitrión).
- [x] Implementar `RegisterEntryUseCase` y `RegisterExitUseCase`.
- [x] Implementar `ManualEntryUseCase` (registro sin QR).
- [x] Implementar `CreateDeliveryAlertUseCase` (crea alerta que aparece en el panel del guardia, con vigencia configurable).
- [x] Implementar listado de alertas de delivery activas para el guardia.
- [x] Implementar `RegisterDeliveryUseCase` (guardia registra ingreso de delivery desde la alerta).
- [x] Implementar `GetPropertyContactUseCase` (guardia consulta teléfono de la propiedad).
- [x] Implementar `RegisterCallVerificationUseCase` (guardia registra ingreso verificado por llamada telefónica).
- [x] Implementar consulta de placas autorizadas y código de marbete.
- [x] Implementar bitácora con filtros y exportación CSV (incluye tipos `DELIVERY` y `VERIFICACION_LLAMADA`).
- [x] Frontend (Residente): Pantalla para generar pase QR con formulario simple, ver mis pases activos, compartir QR como imagen.
- [x] Frontend (Residente): Botón "Espero un delivery" con formulario simple (descripción + repartidor opcional).
- [x] Frontend (Garita): Vista dedicada con escáner de cámara, resultado visual VERDE/ROJO/AMARILLO, botones grandes para registrar entrada/salida.
- [x] Frontend (Garita): Sección "Deliveries Esperados" con alertas activas y botón "Registrar Delivery".
- [x] Frontend (Garita): Botón "Verificar con Residente" que muestra teléfono de la propiedad y permite registrar ingreso por llamada.
- [x] Frontend (Admin): Vista de bitácora con filtros.
- [x] Frontend (Residente): Revocación y cancelación de pases activos con modal de confirmación y descarga del pase en imagen PNG tipo credencial.
- [x] Migración global: Reemplazo total de alerts y confirms por componentes Dialog y Toasts (sonner).
- [x] Tests: Validación de QR expirado, QR ya usado, QR de moroso, alerta de delivery expirada, registro por llamada, cancelación de pase.

---

## Refactor UI/UX — Rediseño Estético B2B (Estilo Linear / Vercel)
- **Objetivo:** Transformar la interfaz de usuario en un estándar de software B2B moderno, minimalista y profesional, eliminando la estética genérica de IA bajo las directrices de `DESIGN.md` e Impeccable (0 anti-patterns).
- **Entregable:** Shell de navegación refinado, componentes primitivos con tokens sobrios HSL (paleta zinc), y rediseño integral de las pantallas clave de la aplicación sin alterar la lógica de negocio ni endpoints.
- **Estado:** Completado y verificado con `impeccable detect` (0 anti-patterns) y `npm run type-check` (0 errores).

### Bloque UI-1: Tokens, Layout Shell y Componentes Primitivos
- [x] **Tokens y Browser Surfaces (`globals.css` & `tailwind.config.ts`):**
  - Scrollbars ultrafinos personalizados con thumb `bg-zinc-300 hover:bg-zinc-400 rounded-full`.
  - Selección de texto sobria en `selection:bg-zinc-900 selection:text-white`.
  - Paleta HSL en escala Zinc: fondo canvas `zinc-50`, superficies primarias blancas, bordes nítidos `border-zinc-200/70`.
  - Extensiones Tailwind para compatibilidad: `shadow-2xs`, `shadow-xs`, `backdrop-blur-xs`.
- [x] **Componentes Primitivos (`components/ui/*`):**
  - `button.tsx`: Alturas ergonómicas (h-9 default, h-8 sm), micro-elevación `shadow-2xs`, variantes sobrias en `zinc-900` y outlines con micro-bordes.
  - `card.tsx`: Elevación sutil basada en bordes `border-zinc-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.03)] rounded-xl`.
  - `badge.tsx`: Nuevas variantes semánticas suaves (`success`, `warning`, `neutral`) preservando compatibilidad regresiva.
  - `input.tsx` & `select.tsx`: Altura `h-9`, bordes sutiles `border-zinc-200` y focus ring en `zinc-900`.
  - `dialog.tsx`: Modales con radio `rounded-2xl`, overlay `bg-zinc-950/40 backdrop-blur-xs` y sombras refinadas.
  - `table.tsx`: Headers sobrios en `bg-zinc-50/75 text-zinc-500 uppercase tracking-wider text-xs`, hover suave y bordes interiores `border-zinc-100`.
- [x] **Layout Shell (`Sidebar.tsx`, `Topbar.tsx`, `AuthenticatedLayout.tsx`):**
  - `Sidebar.tsx`: Fondo `bg-zinc-950` con borde `border-zinc-800/60`, logotipo tipográfico sobrio "Nexia", ítems con píldora discreta `bg-zinc-800/80 text-white text-xs` e íconos a escala uniforme `h-4 w-4`.
  - `Topbar.tsx`: Altura `h-14`, fondo `bg-white/80 backdrop-blur-md border-b border-zinc-200/70`, breadcrumb jerárquico legible y perfil de usuario compacto.
  - `AuthenticatedLayout.tsx`: Fondo de trabajo `bg-zinc-50/50` y contenedor estructurado.

### Bloque UI-2: Rediseño de Pantallas Clave
- [x] **Login (`login/page.tsx`):**
  - Eliminado bloque flotante morado (`bg-indigo-600`).
  - Card central minimalista `rounded-2xl border-zinc-200/80 p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]`.
  - Callout de error en `bg-rose-50 text-rose-700 border-rose-200/60 text-xs` y botón primario en `bg-zinc-900`.
- [x] **Dashboard y Directorio de Propiedades (`propiedades/page.tsx` & `propiedades/[id]/page.tsx`):**
  - Stat Cards de KPIs transformadas en tarjetas métricas limpias con valores `text-3xl tabular-nums` y sin íconos gigantes saturados.
  - Barra de búsqueda y filtros unificados en una sola fila compacta con botón primario "Nueva Propiedad".
  - Tabla de propiedades envuelta en contenedor `border-zinc-200/80` con identificadores en `tabular-nums` y badges semánticos.
  - Detalle de propiedad con breadcrumb de navegación, tabs de línea sobria y grids organizados con bordes de 1px.
- [x] **Módulo de Visitas y Accesos (`visitas/page.tsx`):**
  - Segmented control moderno en `bg-zinc-100/80 p-1` para selector de pestañas.
  - Pases activos y deliveries en cards limpias con badges `success`/`neutral`, fechas y placas en `tabular-nums`.
  - Botón "Mostrar QR" en variante `outline` y acción de cancelar con hover en tono rose suave.
- [x] **Consola de Garita (`garita/page.tsx`):**
  - Eliminado anti-patrón de franja lateral verde (`w-2 bg-emerald-500 stripe`).
  - Tarjetas de resultado de escaneo (VERDE/AMARILLO/ROJO) con fondos tonales suaves y bordes de estado claros (`bg-emerald-50/90 border-2 border-emerald-500`).
  - Visor de cámara enmarcado en contenedor oscuro `bg-zinc-950 border-zinc-800`.
  - Botones táctiles de alta velocidad en `bg-zinc-900` y `bg-zinc-800`.
- [x] **Bitácora de Seguridad (`bitacora/page.tsx`):**
  - Eliminado anti-patrón de animación anticuada (`animate-bounce`).
  - Tabla de auditoría con timestamps y placas en `tabular-nums`, badges semánticos y botón "Exportar CSV" en variante `outline`.

---

## Fase 4 — Módulo Financiero
- **Objetivo:** Desarrollar el motor de facturación interna, recargos automáticos por mora, conciliación de transferencias bancarias y generación de estados de cuenta y recibos.
- **Entregable:** Ciclo financiero completo: emisión masiva de cuotas → carga de boleta por residente → conciliación/aprobación por admin → generación de recibos PDF y semáforo de morosidad.
- **Reglas Críticas:** Obligatorio usar `Prisma.$transaction` (All-or-Nothing) para movimientos, y tipos `Decimal` / `decimal.js` para cálculos (cero JS floats nativos).
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

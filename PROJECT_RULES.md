# Nexia — Project Operational Rules & Engineering Standards

Este documento define las reglas operativas, arquitectónicas y de flujo de trabajo inmutables para el desarrollo de **Nexia**. Todo agente, desarrollador y colaborador debe regirse estrictamente por estas directrices en cada sesión de trabajo.

---

## 1. Stack Tecnológico Estricto

### 1.1 Entorno y Lenguaje
- **Runtime:** Node.js LTS (v20+).
- **Lenguaje:** TypeScript 5.x configurado en **Strict Mode** en todos los paquetes y aplicaciones.
- **Tipado Estricto:** Prohibido rotundamente el uso de `any`. Se deben definir interfaces, tipos nominales o `unknown` con type guards y validadores según corresponda. Cero suppressions (`@ts-ignore`, `@ts-nocheck`) salvo causa justificada y documentada.

### 1.2 Estructura del Repositorio (Monorepo)
Monorepo gestionado mediante **`npm workspaces`**:
```text
Nexia/
├── apps/
│   ├── api/             # Backend REST API
│   └── web/             # Frontend Web Application
├── packages/
│   └── shared-types/    # Contratos, DTOs y tipos compartidos
├── docker/              # Dockerfiles y docker-compose
├── docs/                # Documentación técnica y diagramas
├── PROJECT_RULES.md     # Reglas de gobierno e ingeniería (este archivo)
├── PROGRESS.md          # Bitácora de seguimiento activa
└── implementation_plan.md # PRD y especificación funcional
```

### 1.3 Backend: Clean Architecture (Hexagonal)
La API REST (`apps/api`) utiliza **Express 4.x** estructurado de manera estricta en las siguientes 4 capas concéntricas:

1. **`domain/` (Capa de Dominio):**
   - **Regla:** CERO dependencias externas (ni Express, ni Prisma, ni librerías de terceros, salvo utilidades puras si son estrictamente necesarias).
   - Contiene: Entidades puras, errores de dominio (`DomainError`, `NotFoundError`, etc.), Enums de negocio e interfaces/contratos de repositorios (`IUserRepository`, `IPropertyRepository`, etc.).
2. **`application/` (Capa de Aplicación):**
   - **Regla:** Solo depende de `domain/`. No conoce Express ni Prisma.
   - Contiene: Casos de uso (`use-cases`), lógica de orquestación de negocio y DTOs de entrada/salida.
3. **`infrastructure/` (Capa de Infraestructura):**
   - **Regla:** Implementa los contratos e interfaces definidos en `domain/`.
   - Contiene: Prisma ORM, generación y verificación de JWT, almacenamiento de archivos, generación de códigos QR, utilidades de PDF y servicios externos.
4. **`presentation/` (Capa de Presentación):**
   - **Regla:** Maneja la interacción HTTP y delega inmediatamente a los casos de uso.
   - Contiene: Rutas Express, controladores, validadores estrictos con Zod (para `body`, `query` y `params`) y middlewares (autenticación JWT, RBAC, scoping de tenant, manejo centralizado de errores).

### 1.4 Frontend
- **Framework:** Next.js 15 (App Router).
- **Estilos:** Tailwind CSS 4.x.
- **Componentes:** shadcn/ui + Radix UI primitives.
- **Iconografía:** Lucide React.
- **Consumo API:** Fetch nativo tipado o Axios estructurado con manejo de errores y estado tipado.

### 1.4.1 Directrices de UI y Sistema de Diseño
- **Fondos:** `bg-zinc-50` para el canvas de trabajo, `bg-white` para cards y tablas.
- **Jerarquía:** Tablas y listas siempre contenidas en cards con `border border-zinc-200 shadow-sm rounded-xl`.
- **Acciones:** Evitar botones con colores saturados masivos para acciones destructivas en tablas; usar variantes `outline`, `ghost` o dropdowns contextuales.
- **Layout Shell:** Toda vista autenticada debe respetar el contenedor de `max-w-7xl mx-auto p-6 md:p-8`.
- **Alertas y Confirmaciones Estrictas:** Queda terminantemente prohibido el uso de las funciones nativas `alert()`, `confirm()` o `prompt()` del navegador. Cualquier mensaje de éxito, fallo, alerta o solicitud de confirmación debe implementarse utilizando Modales de Shadcn (`Dialog`), Toasts o componentes visuales integrados, garantizando una experiencia inmersiva e ideal para pantallas táctiles (tablets/móviles).

### 1.5 Persistencia y Multi-Tenancy
- **ORM:** Prisma 6.x.
- **Motor de BD:** PostgreSQL 16 ejecutándose en contenedor Docker (`docker-compose.yml`).
- **Aislamiento Multi-Tenant:** Patrón de Base de Datos Compartida con discriminador `condominio_id` (Tenant Discriminator). Cada consulta sensible a nivel de repositorio y middleware debe aplicar obligatoriamente el filtro de `condominio_id` para garantizar cero fuga de información entre condominios.

---

## 2. Reglas de Git, Commits y Código

### 2.1 Terminal y Ejecución
- Todo el trabajo, ejecución de comandos y commits se coordina mediante terminal CMD / PowerShell en el entorno local.

### 2.2 Convención de Commits (Conventional Commits)
- **Idioma obligatorio:** Inglés tanto para los mensajes de commit como para los comentarios dentro del código fuente.
- **Estructura obligatoria:**
  ```text
  <type>(<scope>): <short description in english>
  ```
- **Tipos permitidos (`type`):**
  - `feat`: Nueva funcionalidad.
  - `fix`: Corrección de errores.
  - `chore`: Mantenimiento, configuración o dependencias.
  - `refactor`: Refactorización de código sin cambio de comportamiento.
  - `docs`: Modificación o adición de documentación.
  - `test`: Adición o actualización de pruebas.
- **Alcances habituales (`scope`):**
  - `monorepo`, `api`, `web`, `shared-types`, `docker`, `db`, `auth`, `gate`, `finances`, `amenities`.
- **Ejemplos válidos:**
  - `chore(monorepo): configure base tsconfig and npm workspaces`
  - `feat(api): implement health check endpoint and error middleware`
  - `feat(shared-types): define user and tenant DTOs`
  - `fix(gate): validate expiration on qr visitor pass`

### 2.3 Estrategia de Ramas (GitHub Flow) y Protocolo de Ejecución

1. **Estado de `main`:**
   - La rama `main` es el tronco estable de producción. Siempre debe compilar con `npm run type-check`, pasar tests y permanecer limpia.

2. **Creación Automática de Ramas por el Agente:**
   - Antes de escribir o modificar código al inicio de cualquier fase, bloque de trabajo o refactor, el agente debe verificar que se encuentre en `main` actualizado y ejecutar en consola la creación y cambio a la rama correspondiente.
   - Nomenclatura estricta de ramas:
     * `feat/fase-X-<modulo>` (ej. `feat/fase-3-garita-backend`)
     * `refactor/web-<descripcion>`
     * `fix/<modulo>-<descripcion>`

3. **Commits Exclusivos del Desarrollador (Prohibición al Agente):**
   - El agente tiene **terminantemente prohibido ejecutar `git commit`** por su cuenta, salvo instrucción explícita del usuario.
   - Tras completar las tareas asignadas y validar que `npm run type-check` (y los tests respectivos) pasen con 0 errores, el agente debe limitar su acción a proporcionar el comando `git commit -m "..."` sugerido en inglés bajo Conventional Commits para que el desarrollador lo ejecute manualmente desde su terminal CMD.

4. **Integración (Merge):**
   - Al finalizar y verificar un bloque o fase completa en la rama activa, el agente sugerirá los comandos de integración hacia `main` mediante merge sin fast-forward (`git merge --no-ff`) para mantener la trazabilidad en el historial.

---

## 3. Flujo de Ejecución y Calidad

1. **Desarrollo Incremental:**
   - Queda estrictamente prohibido generar código masivo sin verificación intermedia.
   - Se debe avanzar en bloques pequeños de **2 a 3 tareas como máximo** por interacción.
2. **Validación Previa a Commit:**
   - Antes de sugerir un commit o dar por concluido un bloque de tareas, el código debe compilar y verificarse:
     * `npm run type-check` (sin errores de TypeScript).
     * `npm run build` o `npm run lint` (sin advertencias ni fallos).
3. **Gestión de Progreso:**
   - El avance se registra exclusivamente marcando las casillas correspondientes en `PROGRESS.md`.

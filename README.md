# Nexia

![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg?style=for-the-badge&logo=nodedotjs)
![Next.js](https://img.shields.io/badge/Next.js-15.x-black.svg?style=for-the-badge&logo=nextdotjs)
![Express.js](https://img.shields.io/badge/Express-4.x-white.svg?style=for-the-badge&logo=express)
![Prisma](https://img.shields.io/badge/Prisma-5.20-1B222D.svg?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg?style=for-the-badge&logo=docker)

**Nexia** es una plataforma SaaS multi-tenant diseñada para la gestión inteligente, segura y eficiente de condominios residenciales. Proporciona herramientas tanto para la administración (finanzas, amenidades) como para la garita de seguridad (control de accesos, alertas de delivery) y los residentes.

---

## 🏗️ Arquitectura y Stack Tecnológico

El proyecto está estructurado como un **Monorepo** gestionado con npm workspaces, dividiendo el ecosistema en aplicaciones y paquetes compartidos para maximizar la reutilización de código y mantener una separación estricta de responsabilidades.

- **Frontend (`apps/web`):** Next.js 15 (App Router), React, Tailwind CSS v3, shadcn/ui.
- **Backend (`apps/api`):** Node.js, Express, diseñado bajo los principios de **Clean Architecture** (Dominio, Aplicación, Infraestructura, Presentación).
- **Base de Datos:** PostgreSQL 16 con Prisma ORM (estrategia multi-tenant mediante discriminador por fila).
- **Tipos Compartidos (`packages/shared-types`):** Interfaces, DTOs y Enums unificados consumidos por ambos extremos.

## 🚀 Requisitos Previos

Asegúrate de tener instalados los siguientes componentes en tu entorno local:
- [Node.js](https://nodejs.org/) (v20 o superior) - Puedes usar el archivo `.nvmrc` incluido.
- [Docker](https://www.docker.com/) y Docker Compose.
- Git.

## 💻 Instalación y Configuración Local

Sigue estos pasos para levantar el entorno de desarrollo en tu máquina:

**1. Clonar el repositorio:**
```bash
git clone https://github.com/TU_USUARIO/Nexia.git
cd Nexia
```

**2. Configurar variables de entorno:**
Copia el archivo de ejemplo y configura tus credenciales (los valores por defecto son válidos para desarrollo local):
```bash
cp .env.example .env
cp .env apps/api/.env
```

**3. Instalar dependencias:**
El proyecto utiliza npm workspaces. Este comando instalará las dependencias de todas las aplicaciones:
```bash
npm install
```

**4. Levantar la Base de Datos:**
Inicia el contenedor de PostgreSQL utilizando Docker Compose:
```bash
docker-compose up -d
```

**5. Ejecutar migraciones de Prisma:**
Sincroniza el esquema de Prisma con tu base de datos:
```bash
npm run prisma:migrate --workspace=@nexia/api
```

**6. Levantar los servidores de desarrollo:**
Puedes ejecutar ambos proyectos simultáneamente.

Para la API (http://localhost:3001):
```bash
npm run dev --workspace=@nexia/api
```

Para el Frontend (http://localhost:3000):
```bash
npm run dev --workspace=@nexia/web
```

## 🛠️ Comandos Útiles

- **Validación de tipos (Type Check):** `npm run type-check`
- **Formateo de código:** `npm run format`
- **Linting:** `npm run lint`
- **Prisma Studio (Explorador de BD):** `npm run prisma:studio --workspace=@nexia/api`

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---
*Desarrollado con pasión por Miguel Salguero.*

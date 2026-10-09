# Nexia — Design System & Visual Specification (Impeccable Standard)

Este documento establece la **verdad visual y el sistema de diseño** para **Nexia**, basado en los principios de **Impeccable** (`pbakaus/impeccable`) adaptados a un software SaaS B2B moderno de administración de condominios.

Toda pantalla existente y futura debe adherirse a este estándar para evitar la estética de "app genérica de IA" y ofrecer una experiencia de software profesional, limpia, minimalista y de alto nivel artesanal (estilo Linear, Vercel, Supabase).

---

## 1. Filosofía Visual: Modo "Operate" (B2B Utility & Quiet Confidence)

Nexia es una herramienta de misión crítica para administradores, guardias y residentes. La interfaz no debe competir con el contenido: debe **desaparecer en la tarea**.

### Principios Fundamentales:
1. **Calma Visual y Densidad Funcional:** Sin gradientes morados/azules estridentes, sin cajas flotantes innecesarias. La jerarquía la marcan la tipografía, los bordes sutiles y el espacio en blanco deliberado.
2. **Elevación por Bordes (Border-Driven Depth):** En lugar de sombras pesadas o desenfocadas que ensucian la vista, la profundidad se logra mediante capas tonales (`bg-zinc-50` para el canvas, `bg-white` para tarjetas) delimitadas por bordes finos de 1px (`border-zinc-200/80` o `border-zinc-200/60`) y sombras micro-sutiles (`shadow-[0_1px_2px_rgba(0,0,0,0.03)]`).
3. **Control de Superficies del Navegador (Browser Surfaces):** Los detalles que los modelos de IA suelen olvidar se estilizan obligatoriamente:
   - Selección de texto (`selection:bg-zinc-900 selection:text-white`).
   - Scrollbars minimalistas ultrafinos con thumb redondeado (`scrollbar-thin`).
   - Anillos de foco sutiles (`focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-1`).
   - Números tabulares (`tabular-nums`) en tablas, montos, fechas, placas y contadores.

---

## 2. Anti-Patrones Estrictos (Lo que queda prohibido eliminar / evitar)

Inspirado en los detectores de Impeccable:
- ❌ **Prohibido el "Icon Tile flotante":** Nunca colocar un recuadro redondeado de color sólido saturado con un ícono solitario flotando arriba de títulos o tarjetas (típico indicador de código de IA genérico). Los íconos deben integrarse orgánicamente en línea con el texto (`inline-flex items-center gap-2`) o en avatares contextualmente justificados.
- ❌ **Prohibido el anidamiento de Cards (Cards dentro de Cards):** No meter tarjetas dentro de otras tarjetas. Si un elemento necesita subdivisión, usar divisores de línea sutiles (`border-t border-zinc-100`) o fondos contrastados suaves (`bg-zinc-50/60 rounded-lg p-3`).
- ❌ **Prohibido texto gris sobre fondos de color:** Todo texto secundario sobre fondos con tinte debe tomar matiz del color primario o usar blanco con opacidad calculada, nunca gris plano sobre azul o verde.
- ❌ **Prohibido botones con colores saturados destructivos masivos:** Acciones de eliminar/cancelar usan variantes `outline` o `ghost` con hover suave (`hover:bg-red-50 hover:text-red-600 hover:border-red-200`), no bloques sólidos rojos.
- ❌ **Prohibidos los alertas y confirms nativos (`alert()`, `confirm()`):** Usar siempre Shadcn `Dialog` o Toasts `Sonner`.

---

## 3. Paleta de Color & Tokens Semánticos

La paleta se basa en **neutros entintados fríos (Zinc/Slate)** con un acento sobrio monocromático y colores semánticos quirúrgicos:

```text
Canvas Global:        bg-zinc-50 / bg-[#fafafa]
Superficie Primaria:  bg-white (Cards, Modales, Tablas)
Superficie Secundaria:bg-zinc-100/70 (Inputs inactivos, headers de tabla, badges neutros)
Bordes Estándar:      border-zinc-200/70 (Borde nítido, sutil)
Bordes Interiores:    border-zinc-100 (Separadores secundarios)

Texto Principal:      text-zinc-900 (font-semibold para títulos, font-normal para cuerpo)
Texto Secundario:     text-zinc-500 (labels, metadatos, descripciones)
Texto Muted:          text-zinc-400 (placeholders, timestamps auxiliares)

Acento Principal:     bg-zinc-900 text-white (Botón primario, selección activa)
                      hover:bg-zinc-800 transition-colors
```

### Estados Semánticos (Status Badges & Alertas):
Los indicadores de estado deben usar combinaciones suaves con borde fino:
- **Éxito (Activo, Solventes, Pagado):** `bg-emerald-50 text-emerald-700 border-emerald-200/60`
- **Advertencia (1 mes mora, Pendiente de revisión):** `bg-amber-50 text-amber-700 border-amber-200/60`
- **Peligro / Destructivo (Moroso, Cancelado, Expirado):** `bg-rose-50 text-rose-700 border-rose-200/60`
- **Informativo / Neutro:** `bg-zinc-100 text-zinc-700 border-zinc-200/60`

---

## 4. Tipografía y Jerarquía

- **Escala de fuentes:**
  - Títulos de página: `text-xl md:text-2xl font-semibold tracking-tight text-zinc-900`
  - Subtítulos / Descripciones: `text-sm text-zinc-500 font-normal`
  - Títulos de Sección / Card: `text-sm font-medium text-zinc-900`
  - Datos en tabla / Texto regular: `text-sm text-zinc-700`
  - Etiquetas y metadatos: `text-xs font-medium text-zinc-500 uppercase tracking-wider`
- **Manejo numérico:**
  - Todo elemento numérico (montos, fechas, placas de carro, códigos de marbete, horas de garita) debe llevar la clase Tailwind `tabular-nums` para alineación vertical perfecta.

---

## 5. Arquitectura del Shell (Navegación & Layout)

### Sidebar:
- Rediseño hacia un estilo moderno y sobrio: fondo `bg-zinc-950` o `bg-zinc-900/95` con borde derecho sutil `border-zinc-800/80`.
- Íconos ópticos limpios (tamaño uniforme `h-4 w-4` o `h-4.5 w-4.5`).
- Items de menú con padding ergonómico (`py-2 px-3 text-xs font-medium rounded-md`).
- Estado activo con badge o píldora sutil (`bg-zinc-800 text-zinc-100 font-medium shadow-xs`).
- Identidad de marca minimalista: tipografía `tracking-tight font-semibold text-lg text-white`, sin íconos caricaturescos gigantes.

### Topbar:
- Altura controlada (`h-14` o `h-16`).
- Fondo `bg-white/80 backdrop-blur-md border-b border-zinc-200/70 sticky top-0 z-30`.
- Breadcrumb claro y legible + indicador de usuario con dropdown discreto.

### Contenedor de Vistas:
- `max-w-7xl mx-auto p-6 md:p-8 space-y-6`.
- Separación generosa entre bloques principales (`space-y-6` o `gap-6`), pero agrupaciones compactas dentro de cada tarjeta.

---

## 6. Componentes Específicos

### Tablas de Datos (`Table`):
- Encapsuladas en contenedor `bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-hidden`.
- Header de tabla: `bg-zinc-50/75 text-zinc-500 text-xs font-medium uppercase tracking-wider py-3 border-b border-zinc-200/70`.
- Filas: `hover:bg-zinc-50/50 transition-colors border-b border-zinc-100 last:border-0`.
- Acciones en tabla: Botones tipo `ghost` o `outline` discretos con ícono `h-4 w-4 text-zinc-500 hover:text-zinc-900`.

### Formularios y Modales (`Dialog`, `Input`, `Select`):
- Modales con fondo blanco puro, bordes redondeados `rounded-2xl`, desenfoque de fondo elegante (`backdrop-blur-sm bg-zinc-950/40`).
- Headers de modal limpios con títulos precisos y texto explicativo en `text-sm text-zinc-500`.
- Inputs: `bg-white border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 text-sm rounded-lg h-9`.
- Footers de formulario: Botón cancelar en `variant="ghost"` o `variant="outline"`, botón de acción principal en `variant="default"` (`bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs`).

### Credenciales y Pases QR:
- El renderizado en canvas para descarga debe mantener la estética suiza minimalista: bordes nítidos, tipografía limpia en altas y bajas, código QR sin aberraciones y con margen amplio, colores monocromáticos elegantes.

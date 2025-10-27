# 🎯 BPMN Graficador Interactivo

Sistema completo de visualización y edición de diagramas BPMN 2.0 construido con **SvelteKit 5**. Incluye constructor con tabla editable, sincronización bidireccional, swimlanes por responsable y actualizaciones incrementales.

[![SvelteKit](https://img.shields.io/badge/SvelteKit-5-orange)](https://kit.svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![BPMN.js](https://img.shields.io/badge/bpmn.js-18-green)](https://bpmn.io/)

---

## ✨ Características

- ✅ **Constructor Tabla-Diagrama**: Edita actividades en tabla, ve el diagrama en tiempo real
- ✅ **Sincronización Bidireccional**: Cambios en tabla → diagrama y diagrama → tabla
- ✅ **Actualizaciones Incrementales**: Sin regenerar todo el diagrama (preserva posiciones manuales)
- ✅ **Swimlanes por Responsable**: Organización automática en columnas verticales
- ✅ **Drag-to-Change-Column**: Arrastra elemento a otra columna para cambiar responsable
- ✅ **Waypoint Routing Inteligente**: Conexiones limpias que evitan obstáculos
- ✅ **Modo Edición/Lectura**: Intercambiable on-the-fly
- ✅ **Exportar XML/SVG**: Diagramas exportables en formatos estándar
- ✅ **Persistencia Local**: Auto-guardado con localStorage
- ✅ **16+ Tipos de Nodos BPMN**: Eventos, tareas, gateways, subprocesos
- ✅ **TypeScript Completo**: 100% tipado
- ✅ **Accesibilidad (a11y)**: Componentes con soporte de teclado y ARIA

---

## 🚀 Quick Start

```bash
# Clonar y instalar
git clone https://github.com/tu-usuario/bpmn-test.git
cd bpmn-test
pnpm install

# Desarrollo
pnpm run dev

# Abrir en navegador
http://localhost:5173/bpmn/constructor
```

**O sigue la guía rápida**: [QUICK-START.md](./QUICK-START.md)

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [QUICK-START.md](./QUICK-START.md) | ⚡ Empezar en 5 minutos |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 🏗️ Arquitectura del sistema completo |
| [docs/API-REFERENCE.md](./docs/API-REFERENCE.md) | 📖 Referencia completa de API |
| [docs/INTEGRATION-GUIDE.md](./docs/INTEGRATION-GUIDE.md) | 🔌 Guía de integración en otros proyectos |
| [BPMN_README.md](./BPMN_README.md) | 📘 Documentación original del visor BPMN |

---

## 🎨 Demo

### Constructor Tabla-Diagrama

Página: `/bpmn/constructor`

**Features**:
- Tabla editable con validación
- Generación automática de diagrama con swimlanes
- Drag elemento → cambia responsable con confirmación
- Botón "Reconstruir Layout" para regenerar posiciones
- Persistencia automática en localStorage

### Visor de Ejemplos

Página: `/bpmn`

Visualiza 3 flujos de ejemplo pre-construidos con modo edición/lectura.

---

## 🏗️ Arquitectura

```
┌─────────────┐
│  FlowTable  │ ← Usuario edita actividades en tabla
└──────┬──────┘
       │ onChange(rows)
       ▼
┌──────────────────┐
│  BpmnBuilder     │ ← Genera XML BPMN 2.0
│  + autoLayout()  │   (con swimlanes)
└──────┬───────────┘
       │ XML
       ▼
┌──────────────────┐
│  BpmnModeler     │ ← Renderiza diagrama interactivo
│  (bpmn-js)       │
└──────┬───────────┘
       │ onElementMoved
       ▼
┌──────────────────┐
│ ConfirmDialog    │ ← "¿Cambiar responsable?"
│ + Revert/Apply   │
└──────────────────┘
```

**Ver documentación completa**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## 💻 Estructura del Proyecto

```
bpmn-test/
├── docs/                           # 📚 Documentación completa
│   ├── ARCHITECTURE.md
│   ├── API-REFERENCE.md
│   └── INTEGRATION-GUIDE.md
│
├── src/
│   ├── lib/
│   │   ├── components/            # 🧩 Componentes Svelte
│   │   │   ├── BpmnModeler.svelte       # Editor BPMN
│   │   │   ├── BpmnViewer.svelte        # Visor read-only
│   │   │   ├── FlowTable.svelte         # Tabla editable
│   │   │   ├── SwimlaneHeaders.svelte   # Overlay de columnas
│   │   │   ├── ConfirmDialog.svelte     # Diálogo reutilizable
│   │   │   └── ...
│   │   │
│   │   ├── services/              # 🔧 Lógica de negocio
│   │   │   ├── bpmn-builder.ts             # Generador XML
│   │   │   └── bpmn-incremental-updater.ts # Updates incrementales
│   │   │
│   │   └── types/                 # 📝 Tipos TypeScript
│   │       ├── bpmn.types.ts
│   │       └── flow-table.types.ts
│   │
│   └── routes/
│       ├── bpmn/
│       │   ├── constructor/+page.svelte  # 🎯 Constructor tabla
│       │   ├── crear/+page.svelte        # Creador código
│       │   └── +page.svelte              # Demo viewer
│       └── +page.svelte
│
├── QUICK-START.md                 # ⚡ Inicio rápido
├── README.md                      # 👈 Estás aquí
└── package.json
```

---

## 🔧 Tecnologías

- **SvelteKit 5** - Framework con Svelte 5 runes ($state, $derived)
- **bpmn-js 18** - Rendering y edición de diagramas BPMN
- **bpmn-moddle 9** - Meta-modelo BPMN 2.0
- **diagram-js 15** - Motor de renderizado
- **bpmn-auto-layout** - Layout automático avanzado
- **TypeScript 5** - Tipado estático completo
- **Tailwind CSS 4** - Estilos utility-first
- **Playwright** - Testing e2e
- **Vitest** - Testing unitario

---

## 📦 Reutilización en Otros Proyectos

Este proyecto está diseñado para ser fácilmente reutilizable:

### Archivos Core (mínimos)

```
src/lib/
├── components/BpmnModeler.svelte     # ← CORE
├── services/bpmn-builder.ts          # ← CORE
├── types/bpmn.types.ts               # ← CORE
└── styles/bpmn.css                   # ← CORE
```

### Instalación Rápida

```bash
# 1. Instalar dependencias
pnpm add bpmn-js bpmn-moddle diagram-js

# 2. Copiar archivos core a tu proyecto

# 3. Usar
import BpmnModeler from '$lib/components/BpmnModeler.svelte';
import '$lib/styles/bpmn.css';
```

**Ver guía completa**: [docs/INTEGRATION-GUIDE.md](./docs/INTEGRATION-GUIDE.md)

---

## 🎯 Casos de Uso

- ✅ **Workflow Management Systems**: Definir y visualizar flujos de trabajo
- ✅ **Process Documentation**: Documentar procesos empresariales
- ✅ **Approval Workflows**: Sistemas de aprobación multi-nivel
- ✅ **Onboarding Processes**: Procesos de inducción de empleados
- ✅ **BPM Tools**: Herramientas de gestión de procesos de negocio
- ✅ **Educational Tools**: Enseñanza de BPMN y modelado de procesos

---

## 🧪 Testing

```bash
# Todos los tests
pnpm test

# Solo unit tests
pnpm run test:unit

# Solo e2e tests
pnpm run test:e2e

# Type checking
pnpm run check
```

---

## 🌍 i18n

El proyecto incluye soporte completo de internacionalización con **Paraglide.js**:

- 🇬🇧 Inglés (default)
- 🇪🇸 Español

Archivos de mensajes: `messages/en.json`, `messages/es.json`

Acceder en URLs: `/en/bpmn`, `/es/bpmn`

---

## 📝 Comandos Disponibles

```bash
pnpm run dev          # Servidor de desarrollo
pnpm run build        # Build para producción
pnpm run preview      # Preview del build
pnpm run check        # Type-checking con svelte-check
pnpm run format       # Formatear con Prettier
pnpm run lint         # Linting con ESLint
pnpm test             # Ejecutar todos los tests
```

---

## 🤝 Contribuir

Este es un proyecto de pruebas/aprendizaje, pero las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crear branch (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

---

## 📄 Licencia

Ver archivo [LICENSE](./LICENSE)

---

## 🙏 Agradecimientos

- [bpmn.io](https://bpmn.io/) - Toolkit BPMN excelente
- [Svelte](https://svelte.dev/) - Framework reactivo increíble
- [SvelteKit](https://kit.svelte.dev/) - Meta-framework potente

---

## 📧 Contacto

Si tienes preguntas o sugerencias, abre un issue en GitHub.

---

**¿Listo para empezar?** → [QUICK-START.md](./QUICK-START.md)

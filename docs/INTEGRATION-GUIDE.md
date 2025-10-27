# Guía de Integración

Guía paso a paso para integrar el sistema BPMN en otros proyectos.

## 📋 Tabla de Contenidos

- [Setup Completo SvelteKit](#setup-completo-sveltekit)
- [Integración en Proyecto Existente](#integración-en-proyecto-existente)
- [Integración con Otros Frameworks](#integración-con-otros-frameworks)
- [Backend Integration](#backend-integration)
- [Casos de Uso Comunes](#casos-de-uso-comunes)

---

## Setup Completo SvelteKit

### 1. Instalación de Dependencias

```bash
# Core BPMN dependencies
pnpm add bpmn-js bpmn-moddle diagram-js bpmn-auto-layout

# Tailwind (opcional, para estilos)
pnpm add -D tailwindcss @tailwindcss/vite @tailwindcss/forms
```

**Versiones recomendadas** (package.json):
```json
{
  "dependencies": {
    "bpmn-js": "^18.8.0",
    "bpmn-moddle": "^9.0.4",
    "diagram-js": "^15.4.0",
    "bpmn-auto-layout": "^1.0.1"
  }
}
```

### 2. Estructura de Archivos a Copiar

Copia estos archivos desde este proyecto:

```
tu-proyecto/
├── src/
│   └── lib/
│       ├── components/
│       │   ├── BpmnModeler.svelte       ← CORE
│       │   ├── BpmnViewer.svelte        ← Opcional (read-only)
│       │   ├── FlowTable.svelte         ← Para constructor tabla
│       │   ├── ConnectionsCell.svelte
│       │   ├── NodeTypeSelect.svelte
│       │   ├── ResponsableAutocomplete.svelte
│       │   ├── SwimlaneHeaders.svelte   ← Para swimlanes
│       │   ├── ConfirmDialog.svelte     ← Componente reusable
│       │   └── ViewSwitcher.svelte
│       │
│       ├── services/
│       │   ├── bpmn-builder.ts          ← CORE
│       │   └── bpmn-incremental-updater.ts  ← Para updates incrementales
│       │
│       ├── types/
│       │   ├── bpmn.types.ts            ← CORE
│       │   ├── flow-table.types.ts
│       │   └── bpmn-js.d.ts             ← Type declarations
│       │
│       └── styles/
│           └── bpmn.css                 ← CORE (estilos bpmn-js)
```

**Archivos CORE** (mínimos necesarios):
- `BpmnModeler.svelte` o `BpmnViewer.svelte`
- `bpmn-builder.ts`
- `bpmn.types.ts`
- `bpmn.css`

### 3. Configuración de Vite

**vite.config.ts**:
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    tailwindcss()
  ],
  optimizeDeps: {
    // Pre-bundle bpmn-js para mejor performance
    include: ['bpmn-js', 'bpmn-moddle', 'diagram-js']
  }
});
```

### 4. Importar Estilos BPMN

**src/lib/styles/bpmn.css**:
```css
/* Importa los estilos de bpmn-js */
@import 'bpmn-js/dist/assets/bpmn-js.css';
@import 'bpmn-js/dist/assets/diagram-js.css';
@import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
```

**En tu layout o página** (`+layout.svelte` o `+page.svelte`):
```svelte
<script>
  import '$lib/styles/bpmn.css';
</script>
```

### 5. Ejemplo Mínimo de Uso

**src/routes/bpmn-demo/+page.svelte**:
```svelte
<script lang="ts">
  import BpmnModeler from '$lib/components/BpmnModeler.svelte';
  import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';
  import '$lib/styles/bpmn.css';

  const myFlow: BPMNFlowDefinition = {
    id: 'Process_1',
    name: 'Mi Primer Flujo',
    nodes: [
      {
        id: 'StartEvent_1',
        type: 'startEvent',
        label: 'Inicio',
        position: { x: 100, y: 100 }
      },
      {
        id: 'Task_1',
        type: 'userTask',
        label: 'Hacer Algo',
        position: { x: 300, y: 80 }
      },
      {
        id: 'EndEvent_1',
        type: 'endEvent',
        label: 'Fin',
        position: { x: 500, y: 100 }
      }
    ],
    connections: [
      { id: 'Flow_1', from: 'StartEvent_1', to: 'Task_1' },
      { id: 'Flow_2', from: 'Task_1', to: 'EndEvent_1' }
    ]
  };

  function handleChange(xml: string) {
    console.log('Diagram changed:', xml);
  }
</script>

<div class="container">
  <h1>Mi Diagrama BPMN</h1>
  <BpmnModeler
    flowDefinition={myFlow}
    editable={true}
    onChange={handleChange}
    class="h-[600px] border border-gray-300 rounded"
  />
</div>

<style>
  .container {
    padding: 2rem;
  }
</style>
```

---

## Integración en Proyecto Existente

### Opción 1: Solo Visor (Read-Only)

Si solo necesitas **visualizar** diagramas BPMN sin edición:

**Archivos necesarios**:
- `BpmnViewer.svelte`
- `bpmn-builder.ts`
- `bpmn.types.ts`
- `bpmn.css`

**Uso**:
```svelte
<script lang="ts">
  import BpmnViewer from '$lib/components/BpmnViewer.svelte';

  // Puedes pasarle XML directo o una definición
  const bpmnXml = `<?xml version="1.0" encoding="UTF-8"?>...`;
</script>

<BpmnViewer xml={bpmnXml} class="h-96" />
```

### Opción 2: Editor + Tabla

Si quieres el **constructor completo** con tabla:

**Archivos necesarios**:
- Todo de `components/`
- Todo de `services/`
- Todo de `types/`
- `bpmn.css`

**Página ejemplo** (`src/routes/constructor/+page.svelte`):

Ver el archivo completo en [src/routes/bpmn/constructor/+page.svelte](../src/routes/bpmn/constructor/+page.svelte)

---

## Integración con Otros Frameworks

### React

**1. Instalar dependencias**:
```bash
npm install bpmn-js bpmn-moddle diagram-js
```

**2. Componente wrapper React**:

```tsx
// components/BpmnViewer.tsx
import React, { useEffect, useRef } from 'react';
import BpmnJS from 'bpmn-js/lib/Viewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

interface Props {
  xml?: string;
  onLoad?: () => void;
}

export const BpmnViewer: React.FC<Props> = ({ xml, onLoad }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnJS | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Crear viewer
    const viewer = new BpmnJS({
      container: containerRef.current
    });
    viewerRef.current = viewer;

    // Cleanup
    return () => {
      viewer.destroy();
    };
  }, []);

  useEffect(() => {
    if (!xml || !viewerRef.current) return;

    viewerRef.current.importXML(xml).then(() => {
      const canvas = viewerRef.current!.get('canvas');
      canvas.zoom('fit-viewport');
      onLoad?.();
    });
  }, [xml, onLoad]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};
```

**3. Uso**:
```tsx
import { BpmnViewer } from './components/BpmnViewer';

function App() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>...`;

  return (
    <div style={{ height: '600px' }}>
      <BpmnViewer xml={xml} onLoad={() => console.log('Loaded!')} />
    </div>
  );
}
```

### Vue 3

**Componente wrapper Vue**:

```vue
<!-- components/BpmnViewer.vue -->
<template>
  <div ref="containerRef" class="bpmn-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import BpmnJS from 'bpmn-js/lib/Viewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

interface Props {
  xml?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  load: [];
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let viewer: BpmnJS | null = null;

onMounted(() => {
  if (!containerRef.value) return;

  viewer = new BpmnJS({
    container: containerRef.value
  });
});

watch(() => props.xml, async (newXml) => {
  if (!newXml || !viewer) return;

  await viewer.importXML(newXml);
  const canvas = viewer.get('canvas');
  canvas.zoom('fit-viewport');
  emit('load');
});

onBeforeUnmount(() => {
  viewer?.destroy();
});
</script>

<style scoped>
.bpmn-container {
  width: 100%;
  height: 100%;
}
</style>
```

**Uso**:
```vue
<template>
  <BpmnViewer :xml="diagramXml" @load="handleLoad" />
</template>

<script setup>
import BpmnViewer from './components/BpmnViewer.vue';

const diagramXml = ref('<?xml version="1.0"...');

const handleLoad = () => {
  console.log('Diagram loaded!');
};
</script>
```

---

## Backend Integration

### Guardando Diagramas en API

**Frontend (SvelteKit)**:

```typescript
// src/lib/api/bpmn-api.ts
export async function saveDiagram(flowId: string, xml: string) {
  const response = await fetch(`/api/diagrams/${flowId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ xml })
  });

  if (!response.ok) throw new Error('Failed to save');
  return response.json();
}

export async function loadDiagram(flowId: string): Promise<string> {
  const response = await fetch(`/api/diagrams/${flowId}`);
  if (!response.ok) throw new Error('Failed to load');

  const data = await response.json();
  return data.xml;
}
```

**Backend (SvelteKit API route)**:

```typescript
// src/routes/api/diagrams/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/database';

export const POST: RequestHandler = async ({ params, request }) => {
  const { xml } = await request.json();

  await db.diagrams.upsert({
    where: { id: params.id },
    create: { id: params.id, xml },
    update: { xml, updatedAt: new Date() }
  });

  return json({ success: true });
};

export const GET: RequestHandler = async ({ params }) => {
  const diagram = await db.diagrams.findUnique({
    where: { id: params.id }
  });

  if (!diagram) {
    return json({ error: 'Not found' }, { status: 404 });
  }

  return json({ xml: diagram.xml });
};
```

**Uso en componente**:

```svelte
<script lang="ts">
  import BpmnModeler from '$lib/components/BpmnModeler.svelte';
  import { saveDiagram, loadDiagram } from '$lib/api/bpmn-api';

  let xml = $state<string | null>(null);
  const flowId = 'flow-123';

  // Cargar al montar
  onMount(async () => {
    xml = await loadDiagram(flowId);
  });

  // Guardar automáticamente al cambiar
  async function handleChange(newXml: string) {
    xml = newXml;
    await saveDiagram(flowId, newXml);
  }
</script>

<BpmnModeler {xml} onChange={handleChange} />
```

### Exportar a PDF (Server-Side)

**Backend (Node.js)**:

```typescript
// src/routes/api/diagrams/[id]/pdf/+server.ts
import { json } from '@sveltejs/kit';
import puppeteer from 'puppeteer';

export const GET: RequestHandler = async ({ params }) => {
  const xml = await db.diagrams.findUnique({
    where: { id: params.id }
  });

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Genera HTML con el diagrama
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/bpmn-js@18/dist/assets/diagram-js.css" />
        <link rel="stylesheet" href="https://unpkg.com/bpmn-js@18/dist/assets/bpmn-js.css" />
      </head>
      <body>
        <div id="canvas" style="width: 800px; height: 600px;"></div>
        <script src="https://unpkg.com/bpmn-js@18/dist/bpmn-viewer.development.js"></script>
        <script>
          const viewer = new BpmnJS({ container: '#canvas' });
          viewer.importXML(\`${xml.xml}\`).then(() => {
            viewer.get('canvas').zoom('fit-viewport');
          });
        </script>
      </body>
    </html>
  `);

  await page.waitForTimeout(1000);
  const pdf = await page.pdf({ format: 'A4' });

  await browser.close();

  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="diagram-${params.id}.pdf"`
    }
  });
};
```

---

## Casos de Uso Comunes

### Caso 1: Workflow Approval System

**Objetivo**: Sistema de aprobación de documentos con diagrama BPMN

```typescript
// Definir flujo de aprobación
const approvalFlow: BPMNFlowDefinition = {
  id: 'ApprovalWorkflow',
  name: 'Document Approval',
  nodes: [
    { id: 'start', type: 'startEvent', label: 'Request' },
    { id: 'review', type: 'userTask', label: 'Review', responsable: 'Reviewer' },
    { id: 'decision', type: 'exclusiveGateway', label: 'Approved?' },
    { id: 'approve', type: 'serviceTask', label: 'Approve', responsable: 'Manager' },
    { id: 'reject', type: 'serviceTask', label: 'Reject', responsable: 'Manager' },
    { id: 'end', type: 'endEvent', label: 'Complete' }
  ],
  connections: [
    { id: 'f1', from: 'start', to: 'review' },
    { id: 'f2', from: 'review', to: 'decision' },
    { id: 'f3', from: 'decision', to: 'approve', label: 'Yes', condition: '${approved}' },
    { id: 'f4', from: 'decision', to: 'reject', label: 'No', condition: '${!approved}' },
    { id: 'f5', from: 'approve', to: 'end' },
    { id: 'f6', from: 'reject', to: 'end' }
  ]
};
```

### Caso 2: Onboarding Process Visualizer

**Objetivo**: Mostrar proceso de onboarding de empleados

```svelte
<script lang="ts">
  import BpmnViewer from '$lib/components/BpmnViewer.svelte';
  import { onMount } from 'svelte';

  let xml = $state<string | null>(null);

  onMount(async () => {
    // Cargar desde API
    const response = await fetch('/api/processes/onboarding');
    const data = await response.json();
    xml = data.bpmnXml;
  });
</script>

<div class="process-viewer">
  <h2>Employee Onboarding Process</h2>
  {#if xml}
    <BpmnViewer {xml} class="h-96 border rounded" />
  {:else}
    <p>Loading...</p>
  {/if}
</div>
```

### Caso 3: Dynamic Process Builder

**Objetivo**: Constructor visual de procesos para admin

```svelte
<script lang="ts">
  import FlowTable from '$lib/components/FlowTable.svelte';
  import BpmnModeler from '$lib/components/BpmnModeler.svelte';
  import { bpmnBuilder } from '$lib/services/bpmn-builder';

  let rows = $state<TableRow[]>([]);
  let xml = $state<string | null>(null);

  async function updateDiagram() {
    const flowDef = rowsToFlowDefinition(rows);
    xml = await bpmnBuilder.buildXMLWithAutoLayout(flowDef);
  }

  async function saveProcess() {
    await fetch('/api/processes', {
      method: 'POST',
      body: JSON.stringify({ rows, xml })
    });
  }
</script>

<div class="split-view">
  <div class="left">
    <FlowTable {rows} onChange={updateDiagram} />
  </div>
  <div class="right">
    <BpmnModeler {xml} editable={false} />
  </div>
</div>

<button onclick={saveProcess}>Save Process</button>
```

---

**Próximos pasos**: Ver [FEATURES.md](./FEATURES.md) para documentación de características avanzadas.

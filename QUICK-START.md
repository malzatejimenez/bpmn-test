# ⚡ Quick Start - BPMN en 5 Minutos

Guía rápida para crear tu primer diagrama BPMN.

## 🎯 Opción 1: Solo Visualización (2 minutos)

### 1. Instalar dependencias

```bash
pnpm add bpmn-js bpmn-moddle diagram-js
```

### 2. Copiar archivos necesarios

Copia estos archivos a tu proyecto:
- `src/lib/components/BpmnViewer.svelte`
- `src/lib/services/bpmn-builder.ts`
- `src/lib/types/bpmn.types.ts`
- `src/lib/styles/bpmn.css`

### 3. Crear tu primer diagrama

**src/routes/mi-diagrama/+page.svelte**:
```svelte
<script lang="ts">
  import BpmnViewer from '$lib/components/BpmnViewer.svelte';
  import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';
  import '$lib/styles/bpmn.css';

  const flujo: BPMNFlowDefinition = {
    id: 'Process_1',
    name: 'Mi Proceso',
    nodes: [
      {
        id: 'start',
        type: 'startEvent',
        label: 'Inicio',
        position: { x: 100, y: 100 }
      },
      {
        id: 'task1',
        type: 'userTask',
        label: 'Hacer algo',
        position: { x: 300, y: 80 }
      },
      {
        id: 'end',
        type: 'endEvent',
        label: 'Fin',
        position: { x: 500, y: 100 }
      }
    ],
    connections: [
      { id: 'flow1', from: 'start', to: 'task1' },
      { id: 'flow2', from: 'task1', to: 'end' }
    ]
  };
</script>

<h1>Mi Primer Diagrama BPMN</h1>
<BpmnViewer flowDefinition={flujo} class="h-[500px] border rounded" />
```

¡Listo! 🎉

---

## 🔧 Opción 2: Editor Completo (5 minutos)

### 1. Instalar dependencias

```bash
pnpm add bpmn-js bpmn-moddle diagram-js bpmn-auto-layout
```

### 2. Copiar archivos completos

Copia toda la carpeta `src/lib/` de este proyecto a tu proyecto.

### 3. Usar el constructor con tabla

**src/routes/constructor/+page.svelte**:
```svelte
<script lang="ts">
  import FlowTable from '$lib/components/FlowTable.svelte';
  import BpmnModeler from '$lib/components/BpmnModeler.svelte';
  import { bpmnBuilder } from '$lib/services/bpmn-builder';
  import type { TableRow } from '$lib/types/flow-table.types';
  import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';
  import '$lib/styles/bpmn.css';

  let rows = $state<TableRow[]>([
    {
      rowNumber: 1,
      id: 'start',
      type: 'startEvent',
      label: 'Inicio',
      connectsTo: []
    }
  ]);

  let xml = $state<string | null>(null);

  async function handleTableChange(newRows: TableRow[]) {
    rows = newRows;
    await updateDiagram();
  }

  async function updateDiagram() {
    const flowDef: BPMNFlowDefinition = {
      id: 'Process_1',
      name: 'Mi Flujo',
      nodes: rows.map(r => ({
        id: r.id,
        type: r.type,
        label: r.label,
        responsable: r.responsable
      })),
      connections: rows.flatMap(r =>
        r.connectsTo.map((c, i) => ({
          id: `flow_${r.id}_${c.targetId}_${i}`,
          from: r.id,
          to: c.targetId,
          label: c.label
        }))
      )
    };

    const layouted = bpmnBuilder.autoLayout(flowDef);
    xml = await bpmnBuilder.buildXML(layouted);
  }
</script>

<div class="grid grid-cols-2 gap-4 p-4">
  <div>
    <h2>Tabla de Actividades</h2>
    <FlowTable {rows} onChange={handleTableChange} />
  </div>
  <div>
    <h2>Diagrama BPMN</h2>
    <BpmnModeler {xml} class="h-[600px] border rounded" />
  </div>
</div>
```

¡Listo! 🎉

---

## 📝 Ejemplo Copy-Paste

Para probar rápidamente, usa este flujo de ejemplo completo:

```typescript
const flujoAprobacion: BPMNFlowDefinition = {
  id: 'Approval_Process',
  name: 'Proceso de Aprobación',
  nodes: [
    {
      id: 'start',
      type: 'startEvent',
      label: 'Solicitud',
      position: { x: 100, y: 150 }
    },
    {
      id: 'review',
      type: 'userTask',
      label: 'Revisar',
      responsable: 'Analista',
      position: { x: 250, y: 130 }
    },
    {
      id: 'decision',
      type: 'exclusiveGateway',
      label: '¿Aprobado?',
      position: { x: 425, y: 125 }
    },
    {
      id: 'approve',
      type: 'serviceTask',
      label: 'Aprobar',
      responsable: 'Manager',
      position: { x: 550, y: 80 }
    },
    {
      id: 'reject',
      type: 'serviceTask',
      label: 'Rechazar',
      responsable: 'Manager',
      position: { x: 550, y: 200 }
    },
    {
      id: 'end_approved',
      type: 'endEvent',
      label: 'Aprobado',
      position: { x: 725, y: 95 }
    },
    {
      id: 'end_rejected',
      type: 'endEvent',
      label: 'Rechazado',
      position: { x: 725, y: 215 }
    }
  ],
  connections: [
    { id: 'f1', from: 'start', to: 'review' },
    { id: 'f2', from: 'review', to: 'decision' },
    {
      id: 'f3',
      from: 'decision',
      to: 'approve',
      label: 'Sí',
      condition: '${approved == true}'
    },
    {
      id: 'f4',
      from: 'decision',
      to: 'reject',
      label: 'No',
      condition: '${approved == false}'
    },
    { id: 'f5', from: 'approve', to: 'end_approved' },
    { id: 'f6', from: 'reject', to: 'end_rejected' }
  ]
};
```

---

## 🚀 Próximos Pasos

- Ver [docs/INTEGRATION-GUIDE.md](docs/INTEGRATION-GUIDE.md) para integración avanzada
- Ver [docs/API-REFERENCE.md](docs/API-REFERENCE.md) para referencia completa de la API
- Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para entender la arquitectura

---

## 💡 Tips Rápidos

### Exportar a XML

```typescript
import { bpmnBuilder } from '$lib/services/bpmn-builder';

const xml = await bpmnBuilder.buildXML(flujo);
console.log(xml); // XML BPMN 2.0 válido
```

### Exportar a SVG

```svelte
<script>
  let viewer: BpmnViewer;

  async function downloadSVG() {
    const svg = await viewer.exportSVG();
    if (svg) {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagrama.svg';
      a.click();
    }
  }
</script>

<BpmnViewer bind:this={viewer} flowDefinition={flujo} />
<button onclick={downloadSVG}>Descargar SVG</button>
```

### Auto-layout

```typescript
const flowSinPosiciones = { /* ... */ };
const flowConPosiciones = bpmnBuilder.autoLayout(flowSinPosiciones);
```

---

## ❓ ¿Problemas?

- El diagrama no se ve → Verificar que importaste `bpmn.css`
- Errores de TypeScript → Copiar `bpmn-js.d.ts` a tu proyecto
- Layout raro → Usar `autoLayout()` para posicionar automáticamente

Ver [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) para más ayuda.

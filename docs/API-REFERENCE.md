# API Reference

Referencia completa de tipos, servicios y componentes del sistema BPMN.

## 📋 Tabla de Contenidos

- [Tipos TypeScript](#tipos-typescript)
- [Servicios](#servicios)
- [Componentes Svelte](#componentes-svelte)

---

## Tipos TypeScript

### BPMN Types (`src/lib/types/bpmn.types.ts`)

#### `BPMNNodeType`

```typescript
type BPMNNodeType =
  // Events
  | 'startEvent'
  | 'endEvent'
  // Tasks
  | 'task'
  | 'userTask'
  | 'serviceTask'
  | 'scriptTask'
  | 'sendTask'
  | 'receiveTask'
  | 'manualTask'
  | 'businessRuleTask'
  // Gateways
  | 'exclusiveGateway'
  | 'parallelGateway'
  | 'inclusiveGateway'
  | 'eventBasedGateway'
  // Other
  | 'subProcess'
  | 'callActivity';
```

#### `BPMNNode`

```typescript
interface BPMNNode {
  id: string;                    // ID único (ej: "Task_1", "Gateway_1")
  type: BPMNNodeType;           // Tipo de elemento BPMN
  label: string;                // Nombre descriptivo
  responsable?: string;         // Responsable/rol (determina columna en swimlane)
  position?: BPMNPosition;      // Posición (x, y) en el diagrama
  dimensions?: BPMNDimensions;  // Tamaño personalizado
  properties?: Record<string, unknown>;  // Propiedades custom
}
```

**Ejemplo**:
```typescript
const node: BPMNNode = {
  id: 'Task_ApproveRequest',
  type: 'userTask',
  label: 'Aprobar Solicitud',
  responsable: 'Manager',
  position: { x: 300, y: 150 },
  properties: {
    assignee: 'manager@company.com',
    priority: 'high'
  }
};
```

#### `BPMNConnection`

```typescript
interface BPMNConnection {
  id: string;         // ID único del flujo (ej: "Flow_1")
  from: string;       // ID del nodo origen
  to: string;         // ID del nodo destino
  label?: string;     // Etiqueta (ej: "Aprobado", "Rechazado")
  condition?: string; // Condición de flujo (ej: "${approved == true}")
  properties?: Record<string, unknown>;
}
```

**Ejemplo**:
```typescript
const connection: BPMNConnection = {
  id: 'Flow_Approved',
  from: 'Gateway_Decision',
  to: 'Task_Approve',
  label: 'Sí',
  condition: '${approved == true}'
};
```

#### `BPMNFlowDefinition`

```typescript
interface BPMNFlowDefinition {
  id: string;                    // ID del proceso
  name: string;                  // Nombre del proceso
  nodes: BPMNNode[];            // Lista de nodos
  connections: BPMNConnection[]; // Lista de conexiones
  metadata?: {
    version?: string;
    author?: string;
    created?: string;
    modified?: string;
    description?: string;
  };
}
```

**Ejemplo completo**:
```typescript
const flowDef: BPMNFlowDefinition = {
  id: 'Process_Approval',
  name: 'Proceso de Aprobación',
  nodes: [
    {
      id: 'Start_1',
      type: 'startEvent',
      label: 'Inicio'
    },
    {
      id: 'Task_Review',
      type: 'userTask',
      label: 'Revisar Documento',
      responsable: 'Analyst'
    },
    {
      id: 'Gateway_1',
      type: 'exclusiveGateway',
      label: '¿Aprobado?'
    },
    {
      id: 'End_1',
      type: 'endEvent',
      label: 'Fin'
    }
  ],
  connections: [
    { id: 'Flow_1', from: 'Start_1', to: 'Task_Review' },
    { id: 'Flow_2', from: 'Task_Review', to: 'Gateway_1' },
    { id: 'Flow_3', from: 'Gateway_1', to: 'End_1', label: 'Sí' }
  ],
  metadata: {
    version: '1.0',
    author: 'Sistema',
    created: '2025-01-26'
  }
};
```

#### `BPMN_DEFAULT_DIMENSIONS`

Constante con dimensiones por defecto para cada tipo de nodo:

```typescript
const BPMN_DEFAULT_DIMENSIONS: Record<string, BPMNDimensions> = {
  startEvent: { width: 36, height: 36 },
  endEvent: { width: 36, height: 36 },
  task: { width: 100, height: 80 },
  userTask: { width: 100, height: 80 },
  // ... (ver archivo completo)
  exclusiveGateway: { width: 50, height: 50 },
  parallelGateway: { width: 50, height: 50 },
  subProcess: { width: 350, height: 200 }
};
```

### Flow Table Types (`src/lib/types/flow-table.types.ts`)

#### `TableRow`

```typescript
interface TableRow {
  rowNumber: number;              // Número de fila (auto-generado)
  id: string;                     // ID único del nodo BPMN
  type: BPMNNodeType;            // Tipo de nodo
  label: string;                  // Nombre descriptivo
  responsable?: string;           // Responsable (determina columna)
  connectsTo: TableConnection[];  // Conexiones a otros nodos
}
```

**Ejemplo**:
```typescript
const row: TableRow = {
  rowNumber: 1,
  id: 'Task_1',
  type: 'userTask',
  label: 'Revisar Documento',
  responsable: 'Analyst',
  connectsTo: [
    { targetId: 'Gateway_1', label: 'Completado' }
  ]
};
```

#### `TableConnection`

```typescript
interface TableConnection {
  targetId: string;    // ID del nodo destino
  label?: string;      // Etiqueta del flujo
  condition?: string;  // Condición (para gateways)
}
```

#### `NODE_TYPE_ICONS`

Iconos emoji para cada tipo de nodo:

```typescript
const NODE_TYPE_ICONS: Record<BPMNNodeType, string> = {
  startEvent: '⚪',
  endEvent: '⚫',
  task: '📋',
  userTask: '👤',
  serviceTask: '⚙️',
  exclusiveGateway: '◇',
  // ...
};
```

---

## Servicios

### BpmnBuilder

**Ubicación**: `src/lib/services/bpmn-builder.ts`

**Instancia singleton**:
```typescript
import { bpmnBuilder } from '$lib/services/bpmn-builder';
```

#### Métodos

##### `buildXML(flowDefinition: BPMNFlowDefinition): Promise<string>`

Genera XML BPMN 2.0 válido desde una definición de flujo.

**Parámetros**:
- `flowDefinition`: Definición completa del flujo

**Retorna**: Promise con XML en formato string

**Ejemplo**:
```typescript
const xml = await bpmnBuilder.buildXML(myFlowDef);
console.log(xml);
// <?xml version="1.0" encoding="UTF-8"?>
// <bpmn:definitions ...>
```

##### `autoLayout(flowDefinition: BPMNFlowDefinition): BPMNFlowDefinition`

Aplica layout automático BFS (breadth-first search) agrupando por responsable.

**Algoritmo**:
1. Agrupa nodos por responsable (columnas verticales)
2. Asigna posición X según responsable
3. Posiciona nodos en orden BFS (top-to-bottom)
4. Espaciado vertical: 150px
5. Ancho de columna: 300px

**Ejemplo**:
```typescript
const flowWithPositions = bpmnBuilder.autoLayout(flowDef);
// Ahora cada node tiene position: { x, y }
```

##### `applyAdvancedLayout(xml: string): Promise<string>`

Aplica layout avanzado usando librería `bpmn-auto-layout`.

**Ejemplo**:
```typescript
const layoutedXml = await bpmnBuilder.applyAdvancedLayout(rawXml);
```

##### `buildXMLWithAutoLayout(flowDefinition: BPMNFlowDefinition): Promise<string>`

Atajo que combina `buildXML` + `applyAdvancedLayout`.

### BpmnIncrementalUpdater

**Ubicación**: `src/lib/services/bpmn-incremental-updater.ts`

**Instancia singleton**:
```typescript
import { bpmnIncrementalUpdater } from '$lib/services/bpmn-incremental-updater';
```

#### Tipos

```typescript
type ChangeType =
  | 'node_added'
  | 'node_removed'
  | 'node_updated'
  | 'connection_added'
  | 'connection_removed';

interface Change {
  type: ChangeType;
  nodeId?: string;
  row?: TableRow;
  oldRow?: TableRow;
  connectionFrom?: string;
  connectionTo?: string;
}
```

#### Métodos

##### `detectChanges(oldRows: TableRow[], newRows: TableRow[]): Change[]`

Detecta diferencias entre dos estados de la tabla.

**Retorna**: Array de cambios detectados

**Ejemplo**:
```typescript
const changes = bpmnIncrementalUpdater.detectChanges(previousRows, currentRows);
// [
//   { type: 'node_updated', nodeId: 'Task_1', row: {...}, oldRow: {...} },
//   { type: 'connection_added', connectionFrom: 'Task_1', connectionTo: 'Task_2' }
// ]
```

##### `applyChanges(modeler: any, changes: Change[]): Promise<boolean>`

Aplica cambios incrementalmente al diagrama.

**Retorna**: `true` si se aplicaron todos, `false` si requiere regeneración completa

**Ejemplo**:
```typescript
const success = await bpmnIncrementalUpdater.applyChanges(modelerInstance, changes);
if (!success) {
  // Regenerar diagrama completo
  await updateDiagram();
}
```

---

## Componentes Svelte

### BpmnModeler

**Ubicación**: `src/lib/components/BpmnModeler.svelte`

Wrapper completo de bpmn-js con modo edición/lectura.

#### Props

```typescript
interface Props {
  flowDefinition?: BPMNFlowDefinition;  // Definición de flujo
  xml?: string;                         // XML BPMN directo (prioritario)
  class?: string;                       // CSS classes
  editable?: boolean;                   // Habilitar edición (default: true)
  onChange?: (xml: string) => void;     // Callback al cambiar diagrama
  onViewportChange?: (viewbox: any) => void;  // Callback al mover viewport
  onModelerReady?: (modelerInstance: any) => void;  // Callback cuando está listo
  onElementChanged?: (elementId: string, properties: any) => void;  // Callback al cambiar elemento
  onElementMoved?: (
    elementId: string,
    newPosition: { x: number; y: number },
    oldPosition: { x: number; y: number }
  ) => void;  // Callback al mover elemento
}
```

#### Métodos Expuestos

```typescript
// Cargar nuevo XML
await modeler.loadDiagramXML(xml: string): Promise<void>

// Exportar como XML
const xml = await modeler.exportXML(): Promise<string | null>

// Exportar como SVG
const svg = await modeler.exportSVG(): Promise<string | null>

// Ajustar zoom al contenido
modeler.zoomToFit(): void

// Establecer nivel de zoom
modeler.setZoom(level: number): void
```

#### Ejemplo de Uso

```svelte
<script lang="ts">
  import BpmnModeler from '$lib/components/BpmnModeler.svelte';
  import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';

  let modelerRef: BpmnModeler;
  let isEditable = $state(true);
  let currentXml = $state<string | null>(null);

  const myFlow: BPMNFlowDefinition = {
    id: 'Process_1',
    name: 'Mi Flujo',
    nodes: [/* ... */],
    connections: [/* ... */]
  };

  function handleChange(xml: string) {
    console.log('Diagrama modificado');
    currentXml = xml;
  }

  function handleElementMoved(
    elementId: string,
    newPos: { x: number; y: number },
    oldPos: { x: number; y: number }
  ) {
    console.log(`${elementId} moved from (${oldPos.x},${oldPos.y}) to (${newPos.x},${newPos.y})`);
  }

  async function exportDiagram() {
    const xml = await modelerRef.exportXML();
    if (xml) {
      // Descargar, etc.
    }
  }
</script>

<BpmnModeler
  bind:this={modelerRef}
  flowDefinition={myFlow}
  {editable}
  {onChange}
  onElementMoved={handleElementMoved}
/>

<button onclick={() => isEditable = !isEditable}>
  Toggle Edit Mode
</button>
<button onclick={exportDiagram}>Export XML</button>
```

### FlowTable

**Ubicación**: `src/lib/components/FlowTable.svelte`

Tabla editable para definir actividades y conexiones.

#### Props

```typescript
interface Props {
  rows: TableRow[];
  onChange: (rows: TableRow[]) => void;
}
```

#### Ejemplo de Uso

```svelte
<script lang="ts">
  import FlowTable from '$lib/components/FlowTable.svelte';
  import type { TableRow } from '$lib/types/flow-table.types';

  let rows = $state<TableRow[]>([
    {
      rowNumber: 1,
      id: 'start',
      type: 'startEvent',
      label: 'Inicio',
      connectsTo: []
    }
  ]);

  function handleTableChange(newRows: TableRow[]) {
    rows = newRows;
    // Actualizar diagrama, persistir, etc.
  }
</script>

<FlowTable {rows} onChange={handleTableChange} />
```

### ConfirmDialog

**Ubicación**: `src/lib/components/ConfirmDialog.svelte`

Diálogo de confirmación reutilizable con accesibilidad completa.

#### Props

```typescript
interface Props {
  open: boolean;        // Bindable: controla visibilidad
  title: string;
  description: string;
  confirmText?: string;  // Default: "Confirmar"
  cancelText?: string;   // Default: "Cancelar"
  onConfirm: () => void;
  onCancel: () => void;
}
```

#### Ejemplo de Uso

```svelte
<script lang="ts">
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

  let showDialog = $state(false);

  function handleDelete() {
    showDialog = true;
  }

  function confirmDelete() {
    // Ejecutar eliminación
    console.log('Eliminado');
  }

  function cancelDelete() {
    console.log('Cancelado');
  }
</script>

<button onclick={handleDelete}>Eliminar</button>

<ConfirmDialog
  bind:open={showDialog}
  title="Confirmar Eliminación"
  description="¿Estás seguro de eliminar este elemento?"
  confirmText="Sí, eliminar"
  cancelText="Cancelar"
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
/>
```

**Características**:
- ✅ Cierre con ESC
- ✅ Cierre al click fuera
- ✅ ARIA roles y labels
- ✅ Tabindex para accesibilidad
- ✅ Backdrop con blur

### SwimlaneHeaders

**Ubicación**: `src/lib/components/SwimlaneHeaders.svelte`

Overlay de columnas de responsables sobre el diagrama.

#### Props

```typescript
interface Swimlane {
  responsable: string;
  xPosition: number;
  width: number;
}

interface Props {
  swimlanes: Swimlane[];
  viewportX?: number;  // Offset horizontal del viewport (para scroll sync)
}
```

#### Ejemplo de Uso

```svelte
<script lang="ts">
  import SwimlaneHeaders from '$lib/components/SwimlaneHeaders.svelte';

  let viewportX = $state(0);

  let swimlanes = $derived([
    { responsable: 'Analyst', xPosition: 100, width: 300 },
    { responsable: 'Manager', xPosition: 400, width: 300 }
  ]);

  function handleViewportChange(viewbox: any) {
    viewportX = -viewbox.x;  // Invertir para sync correcto
  }
</script>

<div class="diagram-container">
  <SwimlaneHeaders {swimlanes} {viewportX} />
  <BpmnModeler onViewportChange={handleViewportChange} />
</div>
```

### Otros Componentes

#### NodeTypeSelect

Selector de tipos BPMN con iconos y categorías.

```svelte
<NodeTypeSelect
  value={row.type}
  onchange={(newType) => updateRow(row.id, 'type', newType)}
/>
```

#### ResponsableAutocomplete

Input con autocompletado para responsables.

```svelte
<ResponsableAutocomplete
  value={row.responsable}
  suggestions={['Manager', 'Analyst', 'Developer']}
  onchange={(newResp) => updateRow(row.id, 'responsable', newResp)}
/>
```

#### ConnectionsCell

Editor inline de conexiones con selector de nodos.

```svelte
<ConnectionsCell
  connections={row.connectsTo}
  availableNodeIds={allNodes}
  currentNodeId={row.id}
  onChange={(newConnections) => updateRow(row.id, 'connectsTo', newConnections)}
/>
```

---

## Constantes Útiles

### Dimensiones de Swimlanes

```typescript
const SWIMLANE_WIDTH = 300;  // Ancho de cada columna
const SWIMLANE_START_X = 100;  // Offset inicial X
const VERTICAL_SPACING = 150;  // Espaciado entre nodos verticalmente
```

### localStorage Keys

```typescript
const STORAGE_KEYS = {
  ROWS: 'bpmn-constructor-rows',
  XML: 'bpmn-constructor-xml',
  VIEW_MODE: 'bpmn-view-mode',
  EDIT_MODE: 'bpmn-edit-mode'
};
```

---

**Próximos pasos**: Ver [COMPONENTS.md](./COMPONENTS.md) para ejemplos más detallados de cada componente.

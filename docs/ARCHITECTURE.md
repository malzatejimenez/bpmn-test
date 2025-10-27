# Arquitectura del Sistema BPMN

## 📋 Tabla de Contenidos

- [Visión General](#visión-general)
- [Estructura del Sistema](#estructura-del-sistema)
- [Flujo de Datos](#flujo-de-datos)
- [Componentes Principales](#componentes-principales)
- [Servicios](#servicios)
- [Decisiones de Diseño](#decisiones-de-diseño)
- [Patrones Utilizados](#patrones-utilizados)

## Visión General

Este sistema es un **graficador BPMN 2.0 interactivo** construido con **SvelteKit 5** que permite crear, visualizar y editar diagramas BPMN mediante una tabla editable. La arquitectura se basa en sincronización bidireccional entre una tabla de datos y el diagrama visual.

### Características Clave

- ✅ **Sincronización bidireccional** tabla ↔ diagrama
- ✅ **Actualizaciones incrementales** (evita regenerar todo el diagrama)
- ✅ **Waypoint routing inteligente** para conexiones limpias
- ✅ **Swimlanes por responsable** (columnas verticales)
- ✅ **Drag-to-change-column** con confirmación de usuario
- ✅ **Persistencia local** con localStorage
- ✅ **Modo edición/lectura** intercambiable

## Estructura del Sistema

```
src/
├── lib/
│   ├── components/          # Componentes Svelte reutilizables
│   │   ├── BpmnModeler.svelte         # Wrapper de bpmn-js con eventos
│   │   ├── BpmnViewer.svelte          # Visor read-only
│   │   ├── FlowTable.svelte           # Tabla editable principal
│   │   ├── ConnectionsCell.svelte     # Editor de conexiones
│   │   ├── SwimlaneHeaders.svelte     # Overlay de columnas
│   │   ├── ConfirmDialog.svelte       # Diálogo de confirmación
│   │   ├── NodeTypeSelect.svelte      # Selector de tipos BPMN
│   │   ├── ResponsableAutocomplete.svelte  # Autocomplete
│   │   └── ViewSwitcher.svelte        # Selector de vista
│   │
│   ├── services/            # Lógica de negocio
│   │   ├── bpmn-builder.ts            # Generador de XML BPMN
│   │   └── bpmn-incremental-updater.ts  # Actualizaciones incrementales
│   │
│   ├── types/               # Definiciones TypeScript
│   │   ├── bpmn.types.ts              # Tipos BPMN
│   │   ├── flow-table.types.ts        # Tipos de tabla
│   │   └── bpmn-js.d.ts               # Declaraciones bpmn-js
│   │
│   ├── data/                # Datos de ejemplo
│   │   └── example-flows.ts
│   │
│   └── styles/              # Estilos globales
│       └── bpmn.css
│
└── routes/
    ├── bpmn/
    │   ├── constructor/+page.svelte   # Constructor tabla-diagrama
    │   ├── crear/+page.svelte         # Creador código-diagrama
    │   └── +page.svelte               # Demo viewer
    └── +page.svelte                   # Página inicio
```

## Flujo de Datos

### 1. Flujo Principal: Tabla → Diagrama

```
┌─────────────┐
│ FlowTable   │  Usuario edita la tabla
│ (Svelte)    │
└──────┬──────┘
       │ onChange(rows: TableRow[])
       ▼
┌─────────────────────┐
│ constructor         │  Detecta cambios
│ +page.svelte        │
└──────┬──────────────┘
       │
       ├─── Cambio incremental posible?
       │    │
       │    ├─ SÍ  → BpmnIncrementalUpdater
       │    │        │
       │    │        ├─ detectChanges(old, new)
       │    │        ├─ applyChanges(modeler, changes)
       │    │        └─ Actualiza solo lo necesario
       │    │
       │    └─ NO   → Regeneración completa
       │             │
       ▼             ▼
┌──────────────────────┐
│ BpmnBuilder          │  Convierte a BPMN XML
│ .rowsToFlowDef()     │
│ .autoLayout()        │
│ .buildXML()          │
└──────┬───────────────┘
       │ XML String
       ▼
┌──────────────────┐
│ BpmnModeler      │  Renderiza diagrama
│ (bpmn-js)        │
└──────────────────┘
```

### 2. Flujo Inverso: Diagrama → Tabla

```
┌──────────────────┐
│ BpmnModeler      │  Usuario arrastra elemento
│ (bpmn-js)        │
└──────┬───────────┘
       │ shape.move.end event
       ▼
┌──────────────────────┐
│ onElementMoved       │  Detecta cambio de columna
│ callback             │
└──────┬───────────────┘
       │ Cambió de responsable?
       │
       ├─ SÍ  → Muestra ConfirmDialog
       │        │
       │        ├─ Usuario acepta
       │        │  └─> Actualiza rows[].responsable
       │        │
       │        └─ Usuario cancela
       │           └─> Revierte posición (modeling.moveElements)
       │
       └─ NO   → No hace nada
```

### 3. Flujo de Persistencia

```
┌──────────────┐
│ Constructor  │
│ +page.svelte │
└──────┬───────┘
       │
       ├─── onMount()
       │    └─> localStorage.getItem('bpmn-constructor-rows')
       │        localStorage.getItem('bpmn-constructor-xml')
       │
       └─── onChange / handleDiagramChange()
            └─> localStorage.setItem('bpmn-constructor-rows', JSON.stringify(rows))
                localStorage.setItem('bpmn-constructor-xml', xml)
```

## Componentes Principales

### BpmnModeler.svelte

**Responsabilidad**: Wrapper de bpmn-js que expone eventos de alto nivel

**Props**:
- `flowDefinition`: Definición del flujo (genera XML automáticamente)
- `xml`: XML BPMN directo (tiene prioridad sobre flowDefinition)
- `editable`: Habilita/deshabilita edición
- `onChange`: Callback cuando cambia el diagrama
- `onViewportChange`: Callback cuando se mueve el viewport (para swimlanes)
- `onModelerReady`: Callback cuando el modeler está listo
- `onElementChanged`: Callback cuando cambia propiedades de un elemento
- `onElementMoved`: Callback cuando se mueve un elemento (con posición anterior y nueva)

**Eventos internos**:
- `shape.move.start`: Captura posición inicial
- `shape.move.end`: Detecta movimiento final
- `element.changed`: Detecta cambios de propiedades
- `commandStack.changed`: Detecta cualquier cambio

**Estado interno**:
- `isRelayouting`: Flag para evitar loops durante relayout
- `originalPositions`: Map que guarda posiciones antes del drag

### FlowTable.svelte

**Responsabilidad**: Tabla editable para definir actividades y conexiones

**Features**:
- Validación de IDs únicos
- Autocompletado de responsables
- Editor de conexiones inline
- Selector de tipos BPMN con iconos
- Generación automática de IDs

**Datos**:
```typescript
interface TableRow {
  rowNumber: number;     // Número de fila
  id: string;            // ID único del nodo
  type: BPMNNodeType;    // Tipo (task, gateway, etc.)
  label: string;         // Nombre descriptivo
  responsable?: string;  // Responsable (determina columna)
  connectsTo: TableConnection[];  // Conexiones a otros nodos
}
```

### SwimlaneHeaders.svelte

**Responsabilidad**: Overlay visual de columnas de responsables

**Características**:
- Posicionamiento absoluto sobre el diagrama
- Sincronizado con viewport X (scroll horizontal)
- Headers sticky que siempre se ven
- Bordes verticales entre columnas

**Cálculo de posiciones**:
```typescript
const swimlaneWidth = 300;  // Ancho fijo de cada columna
const startX = 100;         // Offset inicial

// Para cada responsable único:
swimlane.xPosition = startX + (index * swimlaneWidth);
swimlane.width = swimlaneWidth;
```

## Servicios

### BpmnBuilder

**Propósito**: Convertir definiciones de flujo TypeScript a BPMN 2.0 XML válido

**Métodos principales**:

```typescript
class BpmnBuilder {
  // Genera XML BPMN desde definición
  async buildXML(flowDefinition: BPMNFlowDefinition): Promise<string>

  // Aplica auto-layout usando bpmn-auto-layout
  async applyAdvancedLayout(xml: string): Promise<string>

  // Auto-layout manual (BFS) agrupando por responsable
  autoLayout(flowDefinition: BPMNFlowDefinition): BPMNFlowDefinition

  // Genera waypoints inteligentes para conexiones
  private generateWaypoints(source, target, allNodes): Point[]

  // Encuentra elementos entre source y target verticalmente
  private findElementsBetween(source, target, allNodes): BPMNNode[]
}
```

**Algoritmo de Waypoint Routing**:

1. **CASO 1 - Vertical sin obstáculos**: Línea recta vertical
   ```
   [Source]
      │
      │
   [Target]
   ```

2. **CASO 2 - Vertical con obstáculos**: Ruta en U alrededor
   ```
   [Source]
      │
      └─────┐
            │
      ┌─────┘
      │
   [Target]
   ```

3. **CASO 3 - Horizontal/Diagonal**: Ruta en escalera
   ```
   [Source] ──┐
              │
              └── [Target]
   ```

### BpmnIncrementalUpdater

**Propósito**: Aplicar cambios incrementales al diagrama sin regenerarlo completamente

**Ventajas**:
- ✅ Preserva posiciones manuales de elementos
- ✅ Más rápido (no recalcula layout)
- ✅ Mejor UX (sin parpadeos)

**Tipos de cambios soportados**:

| Tipo | Descripción | Acción |
|------|-------------|--------|
| `node_updated` | Cambio de label o responsable | `modeling.updateProperties()` |
| `connection_added` | Nueva conexión | `modeling.connect()` |
| `connection_removed` | Eliminar conexión | `modeling.removeConnection()` |
| `node_removed` | Eliminar nodo | `modeling.removeElements()` |
| `node_added` | Nuevo nodo | ❌ Requiere regeneración completa |

**Flujo de detección**:

```typescript
detectChanges(oldRows, newRows) {
  // 1. Crear maps para lookup rápido
  const oldMap = new Map(oldRows.map(r => [r.id, r]));
  const newMap = new Map(newRows.map(r => [r.id, r]));

  // 2. Detectar añadidos y actualizados
  for (const newRow of newRows) {
    if (!oldMap.has(newRow.id)) {
      // Nuevo nodo
    } else if (hasNodeChanged(oldRow, newRow)) {
      // Nodo actualizado
    }
  }

  // 3. Detectar eliminados
  for (const oldRow of oldRows) {
    if (!newMap.has(oldRow.id)) {
      // Nodo eliminado
    }
  }
}
```

## Decisiones de Diseño

### 1. ¿Por qué Svelte 5?

- **Runes ($state, $derived)**: Reactividad simple y predecible
- **Sin Virtual DOM**: Rendimiento superior
- **Compilador**: Bundle size mínimo
- **TypeScript nativo**: Excelente DX

### 2. ¿Por qué bpmn-js en lugar de custom rendering?

- ✅ Estándar de facto para BPMN
- ✅ Exporta XML válido
- ✅ Edición profesional out-of-the-box
- ✅ Comunidad activa
- ✅ Gratis y open source

### 3. ¿Por qué tabla → diagrama y no al revés?

**Problema**: BPMN es visual pero difícil de editar para usuarios no técnicos

**Solución**: Tabla como "source of truth"
- Más fácil de editar
- Más fácil de versionar (Git)
- Más fácil de validar
- Exportable a Excel/CSV

### 4. ¿Por qué actualización incremental?

**Sin incremental**: Cada cambio regenera todo
```
Usuario escribe "a"
→ Regenera diagram completo (200ms)
Usuario escribe "c"
→ Regenera diagram completo (200ms)
Usuario escribe "t"
→ Regenera diagram completo (200ms)
```

**Con incremental**: Solo actualiza lo necesario
```
Usuario escribe "act"
→ Detecta: solo cambió label
→ Actualiza label (5ms)
→ Preserva posiciones manuales ✅
```

### 5. ¿Por qué localStorage y no base de datos?

**Contexto**: Proyecto de pruebas/prototipo

**Ventajas localStorage**:
- Sin backend necesario
- Persistencia instantánea
- Perfecto para MVP
- Fácil de migrar a API después

**Para producción**: Ver [MIGRATION.md](./MIGRATION.md)

## Patrones Utilizados

### 1. **Unidirectional Data Flow** (inspirado en Flux)

```
Table State → Modeler Props → bpmn-js → Visual Diagram
     ↑                                         │
     └────── onChange callback ────────────────┘
```

### 2. **Command Pattern** (bpmn-js)

```typescript
modeling.updateProperties(element, { name: 'New Name' });
// Internamente crea comando reversible (undo/redo)
```

### 3. **Observer Pattern**

```typescript
modeler.on('element.changed', (event) => {
  // Reacciona a cambios en el diagrama
});
```

### 4. **Strategy Pattern** (waypoint routing)

```typescript
if (isVertical && hasObstacles) {
  // Estrategia: Ruta en U
} else if (isVertical) {
  // Estrategia: Línea recta
} else {
  // Estrategia: Escalera
}
```

### 5. **Singleton Pattern**

```typescript
export const bpmnBuilder = new BpmnBuilder();
export const bpmnIncrementalUpdater = new BpmnIncrementalUpdater();
```

### 6. **Factory Pattern**

```typescript
// BpmnBuilder crea elementos BPMN basados en tipo
createFlowElement(node: BPMNNode) {
  const typeMapping = {
    'task': 'bpmn:Task',
    'userTask': 'bpmn:UserTask',
    // ...
  };
  return this.moddle.create(typeMapping[node.type], {...});
}
```

### 7. **Adapter Pattern**

```typescript
// BpmnModeler adapta bpmn-js para Svelte
// Convierte eventos de bpmn-js a callbacks de Svelte
modeler.on('shape.move.end', (event) => {
  if (onElementMoved) {
    onElementMoved(elementId, newPos, oldPos);
  }
});
```

## Ciclo de Vida Completo

### Caso de uso: "Usuario agrega una actividad"

```
1. Usuario click en "Agregar Actividad"
   └─> FlowTable.addRow()
       └─> onChange([...rows, newRow])

2. Constructor detecta cambio
   └─> handleTableChange(newRows)
       └─> detectChanges(previousRows, newRows)
           └─> Resultado: [{ type: 'node_added', ... }]

3. Requiere regeneración completa (node_added no es incremental)
   └─> updateDiagram()
       └─> rowsToFlowDefinition(rows)
           └─> bpmnBuilder.autoLayout(flowDef)
               └─> bpmnBuilder.buildXML(flowDef)

4. XML generado se pasa a BpmnModeler
   └─> modeler.importXML(xml)
       └─> Renderiza nuevo diagrama

5. Persistencia
   └─> localStorage.setItem('bpmn-constructor-rows', JSON.stringify(rows))
```

### Caso de uso: "Usuario arrastra actividad a otra columna"

```
1. Usuario arrastra elemento en diagrama
   └─> bpmn-js dispara 'shape.move.end'

2. BpmnModeler captura evento
   └─> onElementMoved(elementId, newPos, oldPos)

3. Constructor calcula nueva columna
   └─> determineResponsableFromPosition(newPos.x)
       └─> Resultado: "Responsable B" (antes era "Responsable A")

4. Muestra confirmación
   └─> ConfirmDialog.show()
       └─> "¿Cambiar responsable de A a B?"

5. Usuario acepta
   └─> applyResponsableChange()
       └─> rows[index].responsable = "Responsable B"
       └─> Persiste en localStorage

6. Usuario cancela
   └─> cancelResponsableChange()
       └─> modeling.moveElements([element], delta)
       └─> Revierte a posición original
```

## Performance

### Optimizaciones Implementadas

1. **Debouncing**: No aplica cambios en cada keystroke
2. **Incremental updates**: Evita regenerar todo el diagrama
3. **Lazy loading**: bpmn-js se carga solo cuando se necesita (browser check)
4. **$derived**: Cálculos reactivos solo cuando cambian dependencias
5. **JSON.parse/stringify**: Deep clone eficiente para previousRows

### Métricas Aproximadas

| Operación | Sin incremental | Con incremental |
|-----------|----------------|-----------------|
| Cambiar label | ~200ms | ~5ms |
| Añadir conexión | ~200ms | ~10ms |
| Eliminar conexión | ~200ms | ~8ms |
| Añadir nodo | ~200ms | ~200ms (requiere layout) |

---

**Próximos pasos**: Ver [API-REFERENCE.md](./API-REFERENCE.md) para detalles de cada componente y servicio.

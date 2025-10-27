# 📘 Guía Completa: Cómo Construir Flujos BPMN

## 🎯 Conceptos Básicos

Un flujo BPMN se compone de:

1. **Nodos** (elementos del diagrama): eventos, tareas, compuertas
2. **Conexiones** (flechas): cómo se conectan los nodos
3. **Posiciones** (opcional): dónde se ubica cada elemento

## 🏗️ Estructura de un Flujo

```typescript
const miflujo = {
	id: 'Process_MiFlujo', // ID único del proceso
	name: 'Mi Primer Flujo', // Nombre que se muestra
	nodes: [
		// Array de nodos/elementos
		// ... nodos aquí
	],
	connections: [
		// Array de conexiones
		// ... conexiones aquí
	]
};
```

## 📦 Tipos de Nodos Disponibles

### 1️⃣ **Eventos**

```typescript
// Evento de Inicio
{
  id: 'start',
  type: 'startEvent',
  label: 'Inicio',
  position: { x: 100, y: 200 }
}

// Evento de Fin
{
  id: 'end',
  type: 'endEvent',
  label: 'Fin',
  position: { x: 500, y: 200 }
}
```

### 2️⃣ **Tareas**

```typescript
// Tarea genérica
{
  id: 'task1',
  type: 'task',
  label: 'Hacer algo',
  position: { x: 250, y: 180 }
}

// Tarea de usuario (requiere intervención humana)
{
  id: 'task2',
  type: 'userTask',
  label: 'Revisar documento',
  position: { x: 400, y: 180 }
}

// Tarea de servicio (automática)
{
  id: 'task3',
  type: 'serviceTask',
  label: 'Enviar email',
  position: { x: 550, y: 180 }
}
```

### 3️⃣ **Compuertas (Gateways)**

```typescript
// Compuerta Exclusiva (toma una sola ruta)
{
  id: 'decision',
  type: 'exclusiveGateway',
  label: '¿Aprobado?',
  position: { x: 450, y: 180 }
}

// Compuerta Paralela (toma todas las rutas simultáneamente)
{
  id: 'fork',
  type: 'parallelGateway',
  label: 'Dividir',
  position: { x: 350, y: 180 }
}
```

## 🔗 Conexiones

Las conexiones unen los nodos:

```typescript
{
  id: 'flow1',           // ID único de la conexión
  from: 'start',         // ID del nodo origen
  to: 'task1',           // ID del nodo destino
  label: 'Comenzar'      // Etiqueta (opcional)
}

// Conexión con condición (para compuertas)
{
  id: 'flow2',
  from: 'decision',
  to: 'taskAprobado',
  label: 'Sí',
  condition: '${aprobado == true}'
}
```

## 📍 Sistema de Posiciones

Las posiciones son coordenadas X, Y en píxeles:

```
(0,0) ────────────────────> X
  │
  │    (100,100)  (300,100)  (500,100)
  │       ●          ●          ●
  │
  │    (100,200)  (300,200)  (500,200)
  │       ●          ●          ●
  ▼
  Y
```

**Consejos:**

- Separa nodos horizontalmente ~150-200px
- Separa rutas verticalmente ~100px
- Usa números redondos (100, 200, 300...)

## 🚀 Ejemplo Completo: Flujo de Solicitud de Vacaciones

```typescript
import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';

export const vacacionesFlow: BPMNFlowDefinition = {
	id: 'Process_Vacaciones',
	name: 'Solicitud de Vacaciones',

	nodes: [
		// 1. Inicio
		{
			id: 'start',
			type: 'startEvent',
			label: 'Solicitud Iniciada',
			position: { x: 100, y: 200 }
		},

		// 2. Empleado llena formulario
		{
			id: 'llenarFormulario',
			type: 'userTask',
			label: 'Llenar Formulario',
			position: { x: 250, y: 180 }
		},

		// 3. Sistema valida fechas
		{
			id: 'validarFechas',
			type: 'serviceTask',
			label: 'Validar Disponibilidad',
			position: { x: 450, y: 180 }
		},

		// 4. Decisión: ¿Fechas válidas?
		{
			id: 'fechasValidas',
			type: 'exclusiveGateway',
			label: '¿Válido?',
			position: { x: 650, y: 175 }
		},

		// 5a. Ruta SI: Supervisor revisa
		{
			id: 'revisorSupervisor',
			type: 'userTask',
			label: 'Revisar Solicitud',
			position: { x: 800, y: 100 }
		},

		// 5b. Ruta NO: Notificar rechazo
		{
			id: 'notificarRechazo',
			type: 'sendTask',
			label: 'Enviar Rechazo',
			position: { x: 800, y: 280 }
		},

		// 6. Decisión del supervisor
		{
			id: 'supervisorAprueba',
			type: 'exclusiveGateway',
			label: '¿Aprueba?',
			position: { x: 1000, y: 95 }
		},

		// 7a. Aprobado
		{
			id: 'registrarVacaciones',
			type: 'serviceTask',
			label: 'Registrar en Sistema',
			position: { x: 1150, y: 50 }
		},

		// 7b. Rechazado por supervisor
		{
			id: 'notificarRechazoSupervisor',
			type: 'sendTask',
			label: 'Notificar Rechazo',
			position: { x: 1150, y: 180 }
		},

		// Fin exitoso
		{
			id: 'endAprobado',
			type: 'endEvent',
			label: 'Aprobado',
			position: { x: 1350, y: 68 }
		},

		// Fin rechazado
		{
			id: 'endRechazado',
			type: 'endEvent',
			label: 'Rechazado',
			position: { x: 1000, y: 298 }
		}
	],

	connections: [
		{ id: 'f1', from: 'start', to: 'llenarFormulario' },
		{ id: 'f2', from: 'llenarFormulario', to: 'validarFechas' },
		{ id: 'f3', from: 'validarFechas', to: 'fechasValidas' },

		// Ruta fechas válidas
		{
			id: 'f4',
			from: 'fechasValidas',
			to: 'revisorSupervisor',
			label: 'Válido',
			condition: '${fechasDisponibles == true}'
		},

		// Ruta fechas inválidas
		{
			id: 'f5',
			from: 'fechasValidas',
			to: 'notificarRechazo',
			label: 'No válido',
			condition: '${fechasDisponibles == false}'
		},

		{ id: 'f6', from: 'revisorSupervisor', to: 'supervisorAprueba' },

		// Supervisor aprueba
		{
			id: 'f7',
			from: 'supervisorAprueba',
			to: 'registrarVacaciones',
			label: 'Aprobar',
			condition: '${supervisorAprueba == true}'
		},

		// Supervisor rechaza
		{
			id: 'f8',
			from: 'supervisorAprueba',
			to: 'notificarRechazoSupervisor',
			label: 'Rechazar',
			condition: '${supervisorAprueba == false}'
		},

		{ id: 'f9', from: 'registrarVacaciones', to: 'endAprobado' },
		{ id: 'f10', from: 'notificarRechazo', to: 'endRechazado' },
		{ id: 'f11', from: 'notificarRechazoSupervisor', to: 'endRechazado' }
	],

	metadata: {
		version: '1.0',
		description: 'Proceso completo de solicitud y aprobación de vacaciones'
	}
};
```

## 🔧 Cómo Usar el Auto-Layout

Si no quieres calcular posiciones manualmente:

```typescript
import { bpmnBuilder } from '$lib/services/bpmn-builder';

// Define solo los nodos SIN posiciones
const miFlujoBruto = {
	id: 'Process_Simple',
	name: 'Flujo Simple',
	nodes: [
		{ id: 'start', type: 'startEvent', label: 'Inicio' },
		{ id: 'task', type: 'task', label: 'Tarea' },
		{ id: 'end', type: 'endEvent', label: 'Fin' }
	],
	connections: [
		{ id: 'f1', from: 'start', to: 'task' },
		{ id: 'f2', from: 'task', to: 'end' }
	]
};

// Aplica auto-layout
const flujoConPosiciones = bpmnBuilder.autoLayout(miFlujoBruto);
```

## 🎨 Cómo Agregar Tu Flujo a la Demo

### Paso 1: Crear el archivo del flujo

Crea un archivo en `src/lib/data/mi-flujo.ts`:

```typescript
import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';

export const miNuevoFlujo: BPMNFlowDefinition = {
	id: 'Process_MiNuevoFlujo',
	name: 'Mi Nuevo Flujo',
	nodes: [
		// ... tus nodos
	],
	connections: [
		// ... tus conexiones
	]
};
```

### Paso 2: Agregarlo a example-flows.ts

Edita `src/lib/data/example-flows.ts`:

```typescript
import { miNuevoFlujo } from './mi-flujo';

export const exampleFlows = {
	simpleApproval: simpleApprovalFlow,
	parallelProcessing: parallelProcessingFlow,
	orderFulfillment: orderFulfillmentFlow,
	miNuevo: miNuevoFlujo // ← Agregar aquí
};
```

### Paso 3: Actualizar las traducciones

Edita `messages/en.json`:

```json
{
	"bpmn_flows_miNuevo_name": "My New Flow",
	"bpmn_flows_miNuevo_description": "Description of my flow"
}
```

Edita `messages/es.json`:

```json
{
	"bpmn_flows_miNuevo_name": "Mi Nuevo Flujo",
	"bpmn_flows_miNuevo_description": "Descripción de mi flujo"
}
```

### Paso 4: Agregar el botón en la UI

Edita `src/routes/bpmn/+page.svelte`, agrega un nuevo botón:

```svelte
<button
	class="flow-button"
	class:active={selectedFlow === 'miNuevo'}
	onclick={() => selectFlow('miNuevo')}
>
	<span class="flow-label">{m.bpmn_flows_miNuevo_name()}</span>
	<span class="flow-description">{m.bpmn_flows_miNuevo_description()}</span>
</button>
```

## 🧪 Probarlo en Código

Puedes probar tu flujo en cualquier componente Svelte:

```svelte
<script>
	import BpmnViewer from '$lib/components/BpmnViewer.svelte';
	import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';

	const miFlujo: BPMNFlowDefinition = {
		id: 'Process_Test',
		name: 'Test',
		nodes: [
			{ id: 'start', type: 'startEvent', label: 'Inicio', position: { x: 100, y: 200 } },
			{ id: 'end', type: 'endEvent', label: 'Fin', position: { x: 300, y: 200 } }
		],
		connections: [{ id: 'f1', from: 'start', to: 'end' }]
	};
</script>

<BpmnViewer flowDefinition={miFlujo} />
```

## 📚 Referencia Rápida de Tipos de Nodos

| Tipo               | Descripción        | Uso                 |
| ------------------ | ------------------ | ------------------- |
| `startEvent`       | Inicio del proceso | Donde comienza todo |
| `endEvent`         | Fin del proceso    | Donde termina       |
| `task`             | Tarea genérica     | Cualquier acción    |
| `userTask`         | Tarea manual       | Requiere persona    |
| `serviceTask`      | Tarea automática   | Sistema/API         |
| `scriptTask`       | Ejecutar código    | Script automático   |
| `sendTask`         | Enviar mensaje     | Email, notificación |
| `receiveTask`      | Recibir mensaje    | Esperar respuesta   |
| `exclusiveGateway` | Decisión (XOR)     | Una sola ruta       |
| `parallelGateway`  | Paralelo (AND)     | Todas las rutas     |
| `inclusiveGateway` | Inclusivo (OR)     | Una o más rutas     |

## 💡 Consejos Pro

1. **IDs únicos**: Usa prefijos como `task_`, `gateway_`, `flow_`
2. **Nombres descriptivos**: Que expliquen qué hace cada elemento
3. **Espaciado consistente**: Mantén distancias uniformes
4. **Prueba incremental**: Agrega nodos de a poco y prueba
5. **Usa auto-layout primero**: Luego ajusta manualmente si necesitas

## 🐛 Debugging

Si algo no funciona:

```typescript
import { bpmnBuilder } from '$lib/services/bpmn-builder';

// Genera el XML y revísalo
const xml = await bpmnBuilder.buildXML(miFlujo);
console.log(xml);

// Verifica que todos los IDs en connections existan en nodes
```

## 📞 ¿Necesitas Ayuda?

Revisa los flujos de ejemplo en `src/lib/data/example-flows.ts` para ver patrones reales.

# BPMN Visualizer - Documentation

## Overview

This project includes a complete BPMN 2.0 visualizer built with SvelteKit 5. The visualizer allows you to create, view, and manage BPMN diagrams programmatically through TypeScript data structures.

## Features

✅ **Programmatic Flow Definition** - Define BPMN flows using TypeScript interfaces
✅ **BPMN 2.0 Compliant** - Generates valid BPMN 2.0 XML
✅ **Interactive Viewer & Editor** - Built on bpmn-js for professional rendering
✅ **Drag & Drop Editing** - Full modeler capabilities with visual editing
✅ **Edit/Read-Only Toggle** - Switch between viewing and editing modes
✅ **Manhattan Routing** - Automatic orthogonal connection layout
✅ **Internationalization** - Full i18n support (English/Spanish) via Paraglide.js
✅ **Export Capabilities** - Export diagrams as XML or SVG
✅ **Multiple Node Types** - Support for 16+ BPMN element types
✅ **Fully Typed** - Complete TypeScript support

## Architecture

### Core Components

1. **Type Definitions** ([src/lib/types/bpmn.types.ts](src/lib/types/bpmn.types.ts))
   - `BPMNFlowDefinition` - Complete flow structure
   - `BPMNNode` - Individual diagram nodes
   - `BPMNConnection` - Sequence flows between nodes
   - Supports 16+ BPMN element types

2. **BPMN Builder Service** ([src/lib/services/bpmn-builder.ts](src/lib/services/bpmn-builder.ts))
   - Converts flow definitions to BPMN 2.0 XML
   - Uses bpmn-moddle for XML generation
   - Auto-layout algorithm for positioning
   - Diagram visualization data (DI) generation

3. **BpmnViewer Component** ([src/lib/components/BpmnViewer.svelte](src/lib/components/BpmnViewer.svelte))
   - Svelte 5 component for read-only visualization
   - Accepts flow definitions or raw XML
   - Export methods (XML, SVG)
   - Zoom controls
   - Reactive to prop changes

4. **BpmnModeler Component** ([src/lib/components/BpmnModeler.svelte](src/lib/components/BpmnModeler.svelte))
   - Full editing capabilities with drag & drop
   - Toggle between editable and readonly modes
   - Change detection with `onChange` callback
   - Palette and context pad for element creation
   - Visual indicators for edit mode
   - Same export and zoom capabilities as Viewer

5. **Demo Page** ([src/routes/bpmn/+page.svelte](src/routes/bpmn/+page.svelte))
   - Interactive showcase with 3 example flows
   - Multilingual UI
   - Export functionality
   - Responsive design

6. **Flow Builder Page** ([src/routes/bpmn/crear/+page.svelte](src/routes/bpmn/crear/+page.svelte))
   - Interactive flow builder with code editor
   - Live preview with BpmnModeler
   - Edit/readonly mode toggle
   - Example flow templates
   - Real-time diagram updates

### Example Flows

Three pre-built flow examples are available in [src/lib/data/example-flows.ts](src/lib/data/example-flows.ts):

1. **Simple Approval** - Basic approval workflow with decision gateway
2. **Parallel Processing** - Fork-join pattern with parallel tasks
3. **Order Fulfillment** - Complex workflow with validation and inventory checks

## Usage

### Viewing the Demo

1. Start the development server:

   ```bash
   pnpm run dev
   ```

2. Navigate to: [http://localhost:5173/bpmn](http://localhost:5173/bpmn)

3. Toggle between English/Spanish by visiting `/es/bpmn` or `/en/bpmn`

### Creating a BPMN Flow

```typescript
import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';
import { bpmnBuilder } from '$lib/services/bpmn-builder';

// Define your flow
const myFlow: BPMNFlowDefinition = {
	id: 'Process_MyFlow',
	name: 'My Custom Flow',
	nodes: [
		{
			id: 'StartEvent_1',
			type: 'startEvent',
			label: 'Start',
			position: { x: 100, y: 200 }
		},
		{
			id: 'Task_1',
			type: 'userTask',
			label: 'Do Something',
			position: { x: 300, y: 180 }
		},
		{
			id: 'EndEvent_1',
			type: 'endEvent',
			label: 'End',
			position: { x: 500, y: 200 }
		}
	],
	connections: [
		{
			id: 'Flow_1',
			from: 'StartEvent_1',
			to: 'Task_1'
		},
		{
			id: 'Flow_2',
			from: 'Task_1',
			to: 'EndEvent_1'
		}
	]
};

// Generate XML
const xml = await bpmnBuilder.buildXML(myFlow);
```

### Using the BpmnViewer Component (Read-Only)

```svelte
<script lang="ts">
	import BpmnViewer from '$lib/components/BpmnViewer.svelte';
	import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';

	let myFlow: BPMNFlowDefinition = {
		/* ... */
	};
	let viewer: BpmnViewer;

	async function exportDiagram() {
		const xml = await viewer.exportXML();
		console.log(xml);
	}
</script>

<BpmnViewer bind:this={viewer} flowDefinition={myFlow} />

<button on:click={exportDiagram}>Export</button>
```

### Using the BpmnModeler Component (Editable)

```svelte
<script lang="ts">
	import BpmnModeler from '$lib/components/BpmnModeler.svelte';
	import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';

	let myFlow: BPMNFlowDefinition = {
		/* ... */
	};
	let modeler: BpmnModeler;
	let isEditable = $state(true);

	function handleChange(xml: string) {
		console.log('Diagram modified:', xml);
	}
</script>

<BpmnModeler
	bind:this={modeler}
	flowDefinition={myFlow}
	editable={isEditable}
	onChange={handleChange}
/>

<button onclick={() => (isEditable = !isEditable)}> Toggle Edit Mode </button>
```

### Auto-layout

**Basic Auto-layout (BFS-based)**

```typescript
const layoutedFlow = bpmnBuilder.autoLayout(myFlow);
```

Uses breadth-first search to position nodes in a left-to-right flow. This is useful when defining flows programmatically to provide reasonable default positions.

**Manhattan Routing**
The BpmnModeler component automatically uses Manhattan routing (orthogonal connections) provided by diagram-js. This creates clean horizontal/vertical connection paths that minimize overlaps without any additional configuration.

## Supported BPMN Elements

### Events

- `startEvent` - Start event
- `endEvent` - End event

### Tasks

- `task` - Generic task
- `userTask` - User task
- `serviceTask` - Service task
- `scriptTask` - Script task
- `sendTask` - Send task
- `receiveTask` - Receive task
- `manualTask` - Manual task
- `businessRuleTask` - Business rule task

### Gateways

- `exclusiveGateway` - Exclusive (XOR) gateway
- `parallelGateway` - Parallel (AND) gateway
- `inclusiveGateway` - Inclusive (OR) gateway
- `eventBasedGateway` - Event-based gateway

### Other

- `subProcess` - Sub-process
- `callActivity` - Call activity

## API Reference

### BpmnBuilder

```typescript
class BpmnBuilder {
	// Convert flow definition to BPMN XML
	async buildXML(flowDefinition: BPMNFlowDefinition): Promise<string>;

	// Auto-position nodes in the flow (basic BFS algorithm)
	autoLayout(flowDefinition: BPMNFlowDefinition): BPMNFlowDefinition;
}
```

### BpmnViewer (Svelte Component)

**Props:**

- `flowDefinition?: BPMNFlowDefinition` - Flow to display
- `xml?: string` - Raw BPMN XML to display
- `class?: string` - CSS class

**Methods:**

- `exportXML(): Promise<string | null>` - Export as BPMN XML
- `exportSVG(): Promise<string | null>` - Export as SVG
- `zoomToFit(): void` - Fit diagram to viewport
- `setZoom(level: number): void` - Set zoom level

### BpmnModeler (Svelte Component)

**Props:**

- `flowDefinition?: BPMNFlowDefinition` - Flow to display/edit
- `xml?: string` - Raw BPMN XML to display/edit
- `class?: string` - CSS class
- `editable?: boolean` - Enable editing mode (default: `true`)
- `onChange?: (xml: string) => void` - Callback when diagram changes

**Methods:**

- `loadDiagramXML(xml: string): Promise<void>` - Load new XML into modeler
- `exportXML(): Promise<string | null>` - Export as BPMN XML
- `exportSVG(): Promise<string | null>` - Export as SVG
- `zoomToFit(): void` - Fit diagram to viewport
- `setZoom(level: number): void` - Set zoom level

**Features:**

- Drag & drop elements from palette
- Move, resize, and reconnect elements
- Context pad for quick actions
- Manhattan routing for connections
- Undo/redo support (Ctrl+Z / Ctrl+Y)
- Auto-snapping to grid
- Bendpoint manipulation

## Testing

Run the test suite:

```bash
# All tests
pnpm test

# Unit tests only
pnpm run test:unit -- --run

# E2E tests
pnpm run test:e2e
```

Tests are located in [src/lib/services/bpmn-builder.test.ts](src/lib/services/bpmn-builder.test.ts)

## Internationalization

The BPMN visualizer is fully internationalized using Paraglide.js. All UI strings are defined in:

- [messages/en.json](messages/en.json) - English translations
- [messages/es.json](messages/es.json) - Spanish translations

Add new messages by editing these files. Paraglide will auto-generate the message functions.

## File Structure

```
src/
├── lib/
│   ├── components/
│   │   └── BpmnViewer.svelte          # Main viewer component
│   ├── data/
│   │   └── example-flows.ts           # Example flow definitions
│   ├── services/
│   │   ├── bpmn-builder.ts            # XML builder service
│   │   └── bpmn-builder.test.ts       # Unit tests
│   ├── styles/
│   │   └── bpmn.css                   # BPMN.js styles import
│   └── types/
│       ├── bpmn.types.ts              # TypeScript definitions
│       └── bpmn-js.d.ts               # bpmn-js type declarations
└── routes/
    └── bpmn/
        └── +page.svelte               # Demo page
```

## Advanced Usage

### Custom Node Properties

Add custom properties to nodes:

```typescript
{
  id: 'Task_1',
  type: 'serviceTask',
  label: 'Call API',
  properties: {
    implementation: 'api-client',
    endpoint: '/api/users',
    method: 'POST'
  }
}
```

### Conditional Flows

Add conditions to sequence flows:

```typescript
{
  id: 'Flow_Approved',
  from: 'Gateway_1',
  to: 'Task_Approve',
  label: 'Approved',
  condition: '${approved == true}'
}
```

### Custom Dimensions

Override default node sizes:

```typescript
{
  id: 'Task_1',
  type: 'task',
  label: 'Large Task',
  dimensions: { width: 200, height: 120 }
}
```

## Dependencies

- **bpmn-js** (18.8.0) - BPMN rendering toolkit
- **bpmn-moddle** (9.0.4) - BPMN 2.0 meta-model
- **diagram-js** (15.4.0) - Diagram rendering engine

## License

See the main project [LICENSE](LICENSE) file.

## Contributing

When adding new BPMN element types:

1. Add the type to `BPMNNodeType` in [bpmn.types.ts](src/lib/types/bpmn.types.ts)
2. Add default dimensions to `BPMN_DEFAULT_DIMENSIONS`
3. Update the type mapping in `BpmnBuilder.createFlowElement()`
4. Add test cases in [bpmn-builder.test.ts](src/lib/services/bpmn-builder.test.ts)

## Resources

- [BPMN 2.0 Specification](https://www.omg.org/spec/BPMN/2.0/)
- [bpmn-js Documentation](https://bpmn.io/toolkit/bpmn-js/)
- [BPMN.io Examples](https://github.com/bpmn-io/bpmn-js-examples)
- [SvelteKit Docs](https://svelte.dev/docs/kit)

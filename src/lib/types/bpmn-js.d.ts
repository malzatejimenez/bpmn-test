/**
 * Type definitions for bpmn-js and related libraries
 */

declare module 'bpmn-js/lib/Viewer' {
	export default class Viewer {
		constructor(options?: ViewerOptions);
		importXML(xml: string): Promise<ImportXMLResult>;
		saveXML(options?: SaveXMLOptions): Promise<SaveXMLResult>;
		saveSVG(options?: SaveSVGOptions): Promise<SaveSVGResult>;
		get<T = any>(serviceName: string): T;
		attachTo(parentNode: HTMLElement | string): void;
		detach(): void;
		destroy(): void;
		on(event: string, callback: (...args: any[]) => void): void;
		off(event: string, callback: (...args: any[]) => void): void;
	}

	export interface ViewerOptions {
		container?: HTMLElement | string;
		width?: number | string;
		height?: number | string;
		moddleExtensions?: Record<string, any>;
		additionalModules?: any[];
	}

	export interface ImportXMLResult {
		warnings: string[];
	}

	export interface SaveXMLOptions {
		format?: boolean;
		preamble?: boolean;
	}

	export interface SaveXMLResult {
		xml: string;
	}

	export interface SaveSVGOptions {
		format?: boolean;
	}

	export interface SaveSVGResult {
		svg: string;
	}
}

declare module 'bpmn-js/lib/Modeler' {
	import Viewer from 'bpmn-js/lib/Viewer';

	export default class Modeler extends Viewer {
		createDiagram(): Promise<CreateDiagramResult>;
	}

	export interface CreateDiagramResult {
		warnings: string[];
	}
}

declare module 'bpmn-moddle' {
	export default class BpmnModdle {
		constructor(packages?: any);
		create(type: string, attrs?: any): ModdleElement;
		fromXML(xmlStr: string, typeName?: string): Promise<FromXMLResult>;
		toXML(element: ModdleElement, options?: ToXMLOptions): Promise<ToXMLResult>;
	}

	export interface ModdleElement {
		$type: string;
		[key: string]: any;
	}

	export interface FromXMLResult {
		rootElement: ModdleElement;
		references: any[];
		warnings: string[];
		elementsById: Record<string, ModdleElement>;
	}

	export interface ToXMLOptions {
		format?: boolean;
		preamble?: boolean;
	}

	export interface ToXMLResult {
		xml: string;
	}
}

declare module 'diagram-js/lib/core/Canvas' {
	export default class Canvas {
		addShape(shape: any, parent?: any, index?: number): any;
		addConnection(connection: any, parent?: any, index?: number): any;
		removeShape(shape: any): void;
		removeConnection(connection: any): void;
		getRootElement(): any;
		getContainer(): HTMLElement;
		zoom(newScale: number | 'fit-viewport', center?: { x: number; y: number }): number;
	}
}

declare module 'bpmn-js' {
	import Viewer from 'bpmn-js/lib/Viewer';
	export default Viewer;
}

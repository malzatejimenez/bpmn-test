import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';

/**
 * Simple approval process example
 */
export const simpleApprovalFlow: BPMNFlowDefinition = {
	id: 'Process_SimpleApproval',
	name: 'Simple Approval Process',
	nodes: [
		{
			id: 'StartEvent_1',
			type: 'startEvent',
			label: 'Start',
			position: { x: 100, y: 200 }
		},
		{
			id: 'Task_SubmitRequest',
			type: 'userTask',
			label: 'Submit Request',
			position: { x: 250, y: 180 }
		},
		{
			id: 'Task_ReviewRequest',
			type: 'userTask',
			label: 'Review Request',
			position: { x: 450, y: 180 }
		},
		{
			id: 'Gateway_Decision',
			type: 'exclusiveGateway',
			label: 'Approved?',
			position: { x: 650, y: 180 }
		},
		{
			id: 'Task_ProcessApproval',
			type: 'serviceTask',
			label: 'Process Approval',
			position: { x: 800, y: 100 }
		},
		{
			id: 'Task_SendRejection',
			type: 'sendTask',
			label: 'Send Rejection',
			position: { x: 800, y: 280 }
		},
		{
			id: 'EndEvent_Approved',
			type: 'endEvent',
			label: 'Approved',
			position: { x: 1000, y: 118 }
		},
		{
			id: 'EndEvent_Rejected',
			type: 'endEvent',
			label: 'Rejected',
			position: { x: 1000, y: 298 }
		}
	],
	connections: [
		{
			id: 'Flow_1',
			from: 'StartEvent_1',
			to: 'Task_SubmitRequest'
		},
		{
			id: 'Flow_2',
			from: 'Task_SubmitRequest',
			to: 'Task_ReviewRequest'
		},
		{
			id: 'Flow_3',
			from: 'Task_ReviewRequest',
			to: 'Gateway_Decision'
		},
		{
			id: 'Flow_4',
			from: 'Gateway_Decision',
			to: 'Task_ProcessApproval',
			label: 'Yes',
			condition: '${approved == true}'
		},
		{
			id: 'Flow_5',
			from: 'Gateway_Decision',
			to: 'Task_SendRejection',
			label: 'No',
			condition: '${approved == false}'
		},
		{
			id: 'Flow_6',
			from: 'Task_ProcessApproval',
			to: 'EndEvent_Approved'
		},
		{
			id: 'Flow_7',
			from: 'Task_SendRejection',
			to: 'EndEvent_Rejected'
		}
	],
	metadata: {
		version: '1.0',
		description: 'A simple approval workflow with decision gateway'
	}
};

/**
 * Parallel processing example
 */
export const parallelProcessingFlow: BPMNFlowDefinition = {
	id: 'Process_ParallelProcessing',
	name: 'Parallel Processing',
	nodes: [
		{
			id: 'StartEvent_1',
			type: 'startEvent',
			label: 'Start',
			position: { x: 100, y: 200 }
		},
		{
			id: 'Task_PrepareData',
			type: 'task',
			label: 'Prepare Data',
			position: { x: 250, y: 180 }
		},
		{
			id: 'Gateway_Split',
			type: 'parallelGateway',
			label: 'Split',
			position: { x: 450, y: 180 }
		},
		{
			id: 'Task_ProcessA',
			type: 'serviceTask',
			label: 'Process A',
			position: { x: 600, y: 80 }
		},
		{
			id: 'Task_ProcessB',
			type: 'serviceTask',
			label: 'Process B',
			position: { x: 600, y: 180 }
		},
		{
			id: 'Task_ProcessC',
			type: 'serviceTask',
			label: 'Process C',
			position: { x: 600, y: 280 }
		},
		{
			id: 'Gateway_Join',
			type: 'parallelGateway',
			label: 'Join',
			position: { x: 800, y: 180 }
		},
		{
			id: 'Task_Finalize',
			type: 'task',
			label: 'Finalize',
			position: { x: 950, y: 180 }
		},
		{
			id: 'EndEvent_1',
			type: 'endEvent',
			label: 'End',
			position: { x: 1150, y: 198 }
		}
	],
	connections: [
		{
			id: 'Flow_1',
			from: 'StartEvent_1',
			to: 'Task_PrepareData'
		},
		{
			id: 'Flow_2',
			from: 'Task_PrepareData',
			to: 'Gateway_Split'
		},
		{
			id: 'Flow_3',
			from: 'Gateway_Split',
			to: 'Task_ProcessA'
		},
		{
			id: 'Flow_4',
			from: 'Gateway_Split',
			to: 'Task_ProcessB'
		},
		{
			id: 'Flow_5',
			from: 'Gateway_Split',
			to: 'Task_ProcessC'
		},
		{
			id: 'Flow_6',
			from: 'Task_ProcessA',
			to: 'Gateway_Join'
		},
		{
			id: 'Flow_7',
			from: 'Task_ProcessB',
			to: 'Gateway_Join'
		},
		{
			id: 'Flow_8',
			from: 'Task_ProcessC',
			to: 'Gateway_Join'
		},
		{
			id: 'Flow_9',
			from: 'Gateway_Join',
			to: 'Task_Finalize'
		},
		{
			id: 'Flow_10',
			from: 'Task_Finalize',
			to: 'EndEvent_1'
		}
	],
	metadata: {
		version: '1.0',
		description: 'Parallel processing workflow with fork-join pattern'
	}
};

/**
 * Order fulfillment example
 */
export const orderFulfillmentFlow: BPMNFlowDefinition = {
	id: 'Process_OrderFulfillment',
	name: 'Order Fulfillment',
	nodes: [
		{
			id: 'StartEvent_1',
			type: 'startEvent',
			label: 'Order Received',
			position: { x: 100, y: 200 }
		},
		{
			id: 'Task_ValidateOrder',
			type: 'businessRuleTask',
			label: 'Validate Order',
			position: { x: 250, y: 180 }
		},
		{
			id: 'Gateway_Valid',
			type: 'exclusiveGateway',
			label: 'Valid?',
			position: { x: 450, y: 180 }
		},
		{
			id: 'Task_CheckInventory',
			type: 'serviceTask',
			label: 'Check Inventory',
			position: { x: 600, y: 180 }
		},
		{
			id: 'Gateway_InStock',
			type: 'exclusiveGateway',
			label: 'In Stock?',
			position: { x: 800, y: 180 }
		},
		{
			id: 'Task_PrepareShipment',
			type: 'task',
			label: 'Prepare Shipment',
			position: { x: 950, y: 100 }
		},
		{
			id: 'Task_NotifyCustomer',
			type: 'sendTask',
			label: 'Notify Customer',
			position: { x: 950, y: 280 }
		},
		{
			id: 'Task_SendErrorNotice',
			type: 'sendTask',
			label: 'Send Error Notice',
			position: { x: 450, y: 320 }
		},
		{
			id: 'EndEvent_Shipped',
			type: 'endEvent',
			label: 'Shipped',
			position: { x: 1150, y: 118 }
		},
		{
			id: 'EndEvent_Cancelled',
			type: 'endEvent',
			label: 'Cancelled',
			position: { x: 650, y: 338 }
		}
	],
	connections: [
		{
			id: 'Flow_1',
			from: 'StartEvent_1',
			to: 'Task_ValidateOrder'
		},
		{
			id: 'Flow_2',
			from: 'Task_ValidateOrder',
			to: 'Gateway_Valid'
		},
		{
			id: 'Flow_3',
			from: 'Gateway_Valid',
			to: 'Task_CheckInventory',
			label: 'Valid',
			condition: '${valid == true}'
		},
		{
			id: 'Flow_4',
			from: 'Gateway_Valid',
			to: 'Task_SendErrorNotice',
			label: 'Invalid',
			condition: '${valid == false}'
		},
		{
			id: 'Flow_5',
			from: 'Task_CheckInventory',
			to: 'Gateway_InStock'
		},
		{
			id: 'Flow_6',
			from: 'Gateway_InStock',
			to: 'Task_PrepareShipment',
			label: 'Yes',
			condition: '${inStock == true}'
		},
		{
			id: 'Flow_7',
			from: 'Gateway_InStock',
			to: 'Task_NotifyCustomer',
			label: 'No',
			condition: '${inStock == false}'
		},
		{
			id: 'Flow_8',
			from: 'Task_PrepareShipment',
			to: 'EndEvent_Shipped'
		},
		{
			id: 'Flow_9',
			from: 'Task_NotifyCustomer',
			to: 'EndEvent_Cancelled'
		},
		{
			id: 'Flow_10',
			from: 'Task_SendErrorNotice',
			to: 'EndEvent_Cancelled'
		}
	],
	metadata: {
		version: '1.0',
		description: 'Order fulfillment workflow with validation and inventory checks'
	}
};

/**
 * All example flows
 */
export const exampleFlows = {
	simpleApproval: simpleApprovalFlow,
	parallelProcessing: parallelProcessingFlow,
	orderFulfillment: orderFulfillmentFlow
};

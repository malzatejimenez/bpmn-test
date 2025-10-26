import { describe, it, expect } from 'vitest';
import { BpmnBuilder } from './bpmn-builder';
import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';

describe('BpmnBuilder', () => {
	const builder = new BpmnBuilder();

	describe('buildXML', () => {
		it('should create valid BPMN XML from a simple flow definition', async () => {
			const flowDefinition: BPMNFlowDefinition = {
				id: 'Process_Test',
				name: 'Test Process',
				nodes: [
					{
						id: 'StartEvent_1',
						type: 'startEvent',
						label: 'Start',
						position: { x: 100, y: 100 }
					},
					{
						id: 'Task_1',
						type: 'task',
						label: 'Do Something',
						position: { x: 250, y: 80 }
					},
					{
						id: 'EndEvent_1',
						type: 'endEvent',
						label: 'End',
						position: { x: 450, y: 100 }
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

			const xml = await builder.buildXML(flowDefinition);

			expect(xml).toBeTruthy();
			expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
			expect(xml).toContain('bpmn:definitions');
			expect(xml).toContain('Process_Test');
			expect(xml).toContain('Test Process');
			expect(xml).toContain('StartEvent_1');
			expect(xml).toContain('Task_1');
			expect(xml).toContain('EndEvent_1');
			expect(xml).toContain('Flow_1');
			expect(xml).toContain('Flow_2');
		});

		it('should handle exclusive gateways', async () => {
			const flowDefinition: BPMNFlowDefinition = {
				id: 'Process_Gateway',
				name: 'Gateway Process',
				nodes: [
					{
						id: 'StartEvent_1',
						type: 'startEvent',
						label: 'Start',
						position: { x: 100, y: 100 }
					},
					{
						id: 'Gateway_1',
						type: 'exclusiveGateway',
						label: 'Decision',
						position: { x: 250, y: 80 }
					},
					{
						id: 'Task_A',
						type: 'task',
						label: 'Task A',
						position: { x: 400, y: 50 }
					},
					{
						id: 'Task_B',
						type: 'task',
						label: 'Task B',
						position: { x: 400, y: 150 }
					}
				],
				connections: [
					{
						id: 'Flow_1',
						from: 'StartEvent_1',
						to: 'Gateway_1'
					},
					{
						id: 'Flow_2',
						from: 'Gateway_1',
						to: 'Task_A',
						label: 'Yes',
						condition: '${approved == true}'
					},
					{
						id: 'Flow_3',
						from: 'Gateway_1',
						to: 'Task_B',
						label: 'No',
						condition: '${approved == false}'
					}
				]
			};

			const xml = await builder.buildXML(flowDefinition);

			expect(xml).toContain('bpmn:exclusiveGateway');
			expect(xml).toContain('Gateway_1');
			expect(xml).toContain('${approved == true}');
			expect(xml).toContain('${approved == false}');
		});

		it('should handle parallel gateways', async () => {
			const flowDefinition: BPMNFlowDefinition = {
				id: 'Process_Parallel',
				name: 'Parallel Process',
				nodes: [
					{
						id: 'StartEvent_1',
						type: 'startEvent',
						label: 'Start',
						position: { x: 100, y: 100 }
					},
					{
						id: 'Gateway_Fork',
						type: 'parallelGateway',
						label: 'Fork',
						position: { x: 250, y: 80 }
					},
					{
						id: 'Task_A',
						type: 'task',
						label: 'Task A',
						position: { x: 400, y: 50 }
					},
					{
						id: 'Task_B',
						type: 'task',
						label: 'Task B',
						position: { x: 400, y: 150 }
					},
					{
						id: 'Gateway_Join',
						type: 'parallelGateway',
						label: 'Join',
						position: { x: 600, y: 80 }
					}
				],
				connections: [
					{
						id: 'Flow_1',
						from: 'StartEvent_1',
						to: 'Gateway_Fork'
					},
					{
						id: 'Flow_2',
						from: 'Gateway_Fork',
						to: 'Task_A'
					},
					{
						id: 'Flow_3',
						from: 'Gateway_Fork',
						to: 'Task_B'
					},
					{
						id: 'Flow_4',
						from: 'Task_A',
						to: 'Gateway_Join'
					},
					{
						id: 'Flow_5',
						from: 'Task_B',
						to: 'Gateway_Join'
					}
				]
			};

			const xml = await builder.buildXML(flowDefinition);

			expect(xml).toContain('bpmn:parallelGateway');
			expect(xml).toContain('Gateway_Fork');
			expect(xml).toContain('Gateway_Join');
		});

		it('should handle different task types', async () => {
			const flowDefinition: BPMNFlowDefinition = {
				id: 'Process_Tasks',
				name: 'Task Types Process',
				nodes: [
					{
						id: 'UserTask_1',
						type: 'userTask',
						label: 'User Task',
						position: { x: 100, y: 100 }
					},
					{
						id: 'ServiceTask_1',
						type: 'serviceTask',
						label: 'Service Task',
						position: { x: 250, y: 100 }
					},
					{
						id: 'ScriptTask_1',
						type: 'scriptTask',
						label: 'Script Task',
						position: { x: 400, y: 100 }
					}
				],
				connections: [
					{
						id: 'Flow_1',
						from: 'UserTask_1',
						to: 'ServiceTask_1'
					},
					{
						id: 'Flow_2',
						from: 'ServiceTask_1',
						to: 'ScriptTask_1'
					}
				]
			};

			const xml = await builder.buildXML(flowDefinition);

			expect(xml).toContain('bpmn:userTask');
			expect(xml).toContain('bpmn:serviceTask');
			expect(xml).toContain('bpmn:scriptTask');
		});
	});

	describe('autoLayout', () => {
		it('should position nodes automatically', () => {
			const flowDefinition: BPMNFlowDefinition = {
				id: 'Process_AutoLayout',
				name: 'Auto Layout Process',
				nodes: [
					{
						id: 'StartEvent_1',
						type: 'startEvent',
						label: 'Start'
					},
					{
						id: 'Task_1',
						type: 'task',
						label: 'Task 1'
					},
					{
						id: 'Task_2',
						type: 'task',
						label: 'Task 2'
					},
					{
						id: 'EndEvent_1',
						type: 'endEvent',
						label: 'End'
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
						to: 'Task_2'
					},
					{
						id: 'Flow_3',
						from: 'Task_2',
						to: 'EndEvent_1'
					}
				]
			};

			const layouted = builder.autoLayout(flowDefinition);

			// Check that all nodes have positions
			layouted.nodes.forEach((node) => {
				expect(node.position).toBeDefined();
				expect(node.position?.x).toBeGreaterThanOrEqual(0);
				expect(node.position?.y).toBeGreaterThanOrEqual(0);
			});

			// Check that start event is positioned first
			const startNode = layouted.nodes.find((n) => n.id === 'StartEvent_1');
			expect(startNode?.position?.x).toBe(100);
		});
	});
});

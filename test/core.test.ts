// core.test.ts
import { DummyIntentMap, WorkflowFunctionManifold, WorkflowOperator, ManifoldRegion, NestedManifoldRegion } from '../src';
import {test, beforeEach, describe, expect, jest} from "bun:test";
describe('WorkflowFunctionManifold Core Test Suite', () => {
    let intentService: DummyIntentMap;
    let manifold: WorkflowFunctionManifold;

    beforeEach(() => {
        intentService = new DummyIntentMap();
        manifold = new WorkflowFunctionManifold(intentService);
    });

    test('Should add a region and set it as the current region if none exist', () => {
        const operator = new WorkflowOperator('testOperation', async state => ({ ...state, test: true }));
        const region = new ManifoldRegion('testRegion', [operator]);
        manifold.addRegion(region);

        expect(manifold.currentRegion).toBe(region);
    });

    test('Should navigate correctly to an adjacent region', async () => {
        const operatorA = new WorkflowOperator('operationA', async state => ({ ...state, a: true }));
        const operatorB = new WorkflowOperator('operationB', async state => ({ ...state, b: true }));

        const regionA = new ManifoldRegion('regionA', [operatorA]);
        const regionB = new ManifoldRegion('processingRegion', [operatorB]);

        regionA.connectTo(regionB);
        manifold.addRegion(regionA);
        manifold.addRegion(regionB);

        const navigated = await manifold.navigate('process the data');
        expect(navigated).toBe(true);
        expect(manifold.currentRegion).toBe(regionB);
    });

    test('Should execute the correct workflow operator', async () => {
        const operator = new WorkflowOperator('testOperation', async state => ({ ...state, executed: true }));
        const region = new ManifoldRegion('testRegion', [operator]);

        manifold.addRegion(region);

        // Make sure the operator name matches the intent action from DummyIntentMap
        const executed = await manifold.executeWorkflow('test the operation');

        expect(executed).toBe(true);
        expect(manifold.state).toHaveProperty('executed', true);
    });

    test('Should fail to navigate when no matching region found', async () => {
        const operator = new WorkflowOperator('operation', async state => ({ ...state, modified: true }));
        const region = new ManifoldRegion('sampleRegion', [operator]);
        manifold.addRegion(region);

        const navigated = await manifold.navigate('unknown operation');
        expect(navigated).toBe(false);
        expect(manifold.currentRegion).toBe(region);
    });

    test('Should handle nested manifold execution correctly', async () => {
        const nestedIntentService = new DummyIntentMap();
        const nestedManifold = new WorkflowFunctionManifold(nestedIntentService);

        // Create validation operator with matching name
        const validateOp = new WorkflowOperator('validation', async state => ({ ...state, validated: true }));
        const validateRegion = new ManifoldRegion('validation', [validateOp]);

        nestedManifold.addRegion(validateRegion);

        const nestedRegion = new NestedManifoldRegion('validation', nestedManifold);
        manifold.addRegion(nestedRegion);

        await manifold.navigate('validate the input');
        const executed = await manifold.executeWorkflow('validate the input');

        expect(executed).toBe(true);
        expect(manifold.state).toHaveProperty('validated', true);
    });

    test('Should correctly propagate state changes through workflow regions', async () => {
        const operator1 = new WorkflowOperator('operator1', async state => ({ ...state, step1: true }));
        const operator2 = new WorkflowOperator('operator2', async state => ({ ...state, step2: true }));

        const region1 = new ManifoldRegion('operator1', [operator1]); // Match region names to operator names
        const region2 = new ManifoldRegion('operator2', [operator2]);

        region1.connectTo(region2);
        manifold.addRegion(region1);
        manifold.addRegion(region2);

        await manifold.navigate('operator1');
        await manifold.executeWorkflow('operator1');
        await manifold.navigate('operator2');
        await manifold.executeWorkflow('operator2');

        expect(manifold.state).toHaveProperty('step1', true);
        expect(manifold.state).toHaveProperty('step2', true);
    });

    test('Should log warnings for unmatched prompts during navigation', async () => {
        console.warn = jest.fn();
        const navigated = await manifold.navigate('non-existent operation');
        expect(console.warn).toHaveBeenCalled();
        expect(navigated).toBe(false);
    });
});

#!/usr/bin/env node

import {
    DummyIntentMap,
    ManifoldRegion,
    WorkflowFunctionManifold,
    WorkflowOperator,
    NestedManifoldRegion
} from './index';
import { WorkflowState } from './types';

async function demonstrateNestedManifold(): Promise<void> {
    const nestedIntentService = new DummyIntentMap();
    const nestedManifold = new WorkflowFunctionManifold(nestedIntentService);

    const validateOp = new WorkflowOperator('validation', async (state: WorkflowState) => {
        return { ...state, validated: true };
    });

    const cleanOp = new WorkflowOperator('cleaning', async (state: WorkflowState) => {
        return { ...state, cleaned: true };
    });

    const validateRegion = new ManifoldRegion('validation', [validateOp]);
    const cleanRegion = new ManifoldRegion('cleaning', [cleanOp]);
    validateRegion.connectTo(cleanRegion);
    nestedManifold.addRegion(validateRegion);
    nestedManifold.addRegion(cleanRegion);

    const mainIntentService = new DummyIntentMap();
    const mainManifold = new WorkflowFunctionManifold(mainIntentService);

    const analysisOp = new WorkflowOperator('analysis', async (state: WorkflowState) => {
        return { ...state, analyzed: true };
    });

    const transformOp = new WorkflowOperator('transformation', async (state: WorkflowState) => {
        return { ...state, transformed: true };
    });

    const nestedPreprocessRegion = new NestedManifoldRegion('preprocessing', nestedManifold);
    const analysisRegion = new ManifoldRegion('analysis', [analysisOp]);
    const transformRegion = new ManifoldRegion('transformation', [transformOp]);

    nestedPreprocessRegion.connectTo(analysisRegion);
    analysisRegion.connectTo(transformRegion);

    mainManifold.addRegion(nestedPreprocessRegion);
    mainManifold.addRegion(analysisRegion);
    mainManifold.addRegion(transformRegion);

    const prompts = [
        { text: 'validate the input', description: 'Nested: Data Validation' },
        { text: 'clean the data', description: 'Nested: Data Cleaning' },
        { text: 'analyze the results', description: 'Main: Data Analysis' },
        { text: 'transform the output', description: 'Main: Data Transformation' },
    ];
    const errorSink = [];
    for (const { text } of prompts) {
        try {
            await mainManifold.navigate(text);
            await mainManifold.executeWorkflow(text);
        } catch (error) {
            errorSink.push(error);
            // Handle errors silently in demo
        }
    }
}

demonstrateNestedManifold().catch(() => {
    process.exit(1);
});
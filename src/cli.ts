#!/usr/bin/env node

import {
    DummyIntentMap,
    ManifoldRegion,
    WorkflowFunctionManifold,
    WorkflowOperator,
    NestedManifoldRegion
} from './index';
import { WorkflowState } from './types';
import log from './logger';

async function demonstrateNestedManifold(): Promise<void> {
    log.info("Starting demonstration of nested manifold.");

    const nestedIntentService = new DummyIntentMap();
    const nestedManifold = new WorkflowFunctionManifold(nestedIntentService);

    const validateOp = new WorkflowOperator('validation', async (state: WorkflowState) => {
        log.debug("Validating state.");
        // Simulate asynchronous work
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { ...state, validated: true };
    });

    const cleanOp = new WorkflowOperator('cleaning', async (state: WorkflowState) => {
        log.debug("Cleaning state.");
        // Simulate asynchronous work
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
        log.debug("Analyzing state.");
        // Simulate asynchronous work
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { ...state, analyzed: true };
    });

    const transformOp = new WorkflowOperator('transformation', async (state: WorkflowState) => {
        log.debug("Transforming state.");
        // Simulate asynchronous work
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
            log.info(`Navigating with prompt: ${text}`);
            await mainManifold.navigate(text);

            log.info(`Executing workflow with prompt: ${text}`);
            await mainManifold.executeWorkflow(text);
        } catch (error) {
            log.error(`Error during workflow execution: ${error}`);
            errorSink.push(error);
        }
    }

    log.info("Nested manifold demonstration completed.");
}

demonstrateNestedManifold().catch((error) => {
    log.error(`Unhandled error: ${error}`);
    process.exit(1);
});

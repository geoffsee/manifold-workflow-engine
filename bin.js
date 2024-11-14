#!/usr/bin/env node

import {
  DummyIntentService,
  ManifoldRegion,
  WorkflowFunctionManifold,
  WorkflowOperator,
  NestedManifoldRegion,
} from './lib.js';

async function demonstrateNestedManifold() {
  const nestedIntentService = new DummyIntentService();
  const nestedManifold = new WorkflowFunctionManifold(nestedIntentService);

  const validateOp = new WorkflowOperator('validation', async state => {
    return { ...state, validated: true };
  });
  const cleanOp = new WorkflowOperator('cleaning', async state => {
    return { ...state, cleaned: true };
  });

  const validateRegion = new ManifoldRegion('validation', [validateOp]);
  const cleanRegion = new ManifoldRegion('cleaning', [cleanOp]);

  validateRegion.connectTo(cleanRegion);
  nestedManifold.addRegion(validateRegion);
  nestedManifold.addRegion(cleanRegion);

  const mainIntentService = new DummyIntentService();
  const mainManifold = new WorkflowFunctionManifold(mainIntentService);

  const analysisOp = new WorkflowOperator('analysis', async state => {
    return { ...state, analyzed: true };
  });
  const transformOp = new WorkflowOperator('transformation', async state => {
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

  for (const { text, description } of prompts) {
    try {
      const navigated = await mainManifold.navigate(text);
      if (navigated) {
        console.log(`📍 Step: ${description}`);
      }
      const executed = await mainManifold.executeWorkflow(text);
      if (executed) {
        console.log(`✅ Execution complete`);
      } else {
        console.log(`⚠️  Execution failed`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

demonstrateNestedManifold().catch(error => {
  console.error(`❌ Critical Error: ${error.message}`);
  process.exit(1);
});
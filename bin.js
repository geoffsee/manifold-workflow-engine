#!/usr/bin/env node

import {
  DummyLlmService,
  ManifoldRegion,
  WorkflowFunctionManifold,
  WorkflowOperator,
  NestedManifoldRegion,
} from './lib.js';

async function demonstrateNestedManifold() {
  console.log('\n🚀 Starting Nested Manifold Demonstration\n');

  console.log('📦 Creating Secondary Manifold...');
  const nestedLlm = new DummyLlmService();
  const nestedManifold = new WorkflowFunctionManifold(nestedLlm);

  const validateOp = new WorkflowOperator('validation', async state => {
    console.log('  ✓ Validating data structure');
    return { ...state, validated: true };
  });

  const cleanOp = new WorkflowOperator('cleaning', async state => {
    console.log('  ✓ Cleaning data');
    return { ...state, cleaned: true };
  });

  const validateRegion = new ManifoldRegion('validation', [validateOp]);
  const cleanRegion = new ManifoldRegion('cleaning', [cleanOp]);

  // Set up nested manifold regions
  validateRegion.connectTo(cleanRegion);
  nestedManifold.addRegion(validateRegion);
  nestedManifold.addRegion(cleanRegion);

  console.log('📦 Creating Primary Manifold...');
  const mainLlm = new DummyLlmService();
  const mainManifold = new WorkflowFunctionManifold(mainLlm);

  const analysisOp = new WorkflowOperator('analysis', async state => {
    console.log('  ✓ Performing data analysis');
    return { ...state, analyzed: true };
  });

  const transformOp = new WorkflowOperator('transformation', async state => {
    console.log('  ✓ Transforming results');
    return { ...state, transformed: true };
  });

  // Set up main manifold regions
  const nestedPreprocessRegion = new NestedManifoldRegion('preprocessing', nestedManifold);
  const analysisRegion = new ManifoldRegion('analysis', [analysisOp]);
  const transformRegion = new ManifoldRegion('transformation', [transformOp]);

  nestedPreprocessRegion.connectTo(analysisRegion);
  analysisRegion.connectTo(transformRegion);

  mainManifold.addRegion(nestedPreprocessRegion);
  mainManifold.addRegion(analysisRegion);
  mainManifold.addRegion(transformRegion);

  console.log('\n🔄 Executing Workflow...\n');

  const prompts = [
    { text: 'validate the input', description: 'Nested: Data Validation' },
    { text: 'clean the data', description: 'Nested: Data Cleaning' },
    { text: 'analyze the results', description: 'Main: Data Analysis' },
    { text: 'transform the output', description: 'Main: Data Transformation' },
  ];

  for (const { text, description } of prompts) {
    console.log(`📍 Step: ${description}\n   Prompt: "${text}"`);

    try {
      // First try to navigate
      const navigated = await mainManifold.navigate(text);
      if (navigated) {
        console.log('   ↪ Navigation successful');
      }

      // Then execute the workflow
      const executed = await mainManifold.executeWorkflow(text);
      if (executed) {
        console.log('   ✅ Execution complete\n');
      } else {
        console.log('   ❌ Execution failed - No matching operator found\n');
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('🎉 Workflow Demonstration Complete!\n');
}

demonstrateNestedManifold().catch(error => {
  console.error('❌ Fatal Error:', error);
  process.exit(1);
});
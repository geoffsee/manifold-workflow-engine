# workflow-function-manifold

> A TypeScript/JavaScript library for building dynamic, LLM-driven workflows using a region-based execution model.

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

## Overview

`workflow-function-manifold` is a powerful library for creating dynamic, LLM-driven workflows that leverage a region-based execution model. It enables seamless navigation between different execution regions based on natural language prompts and maintains consistent workflow state throughout the execution process.

### Key Features

- **LLM-Driven Navigation**: Navigate between workflow regions using natural language prompts
- **Region-Based Architecture**: Organize workflow logic into discrete, connected regions
- **State Management**: Maintain and propagate state across workflow operations
- **Nested Workflows**: Support for hierarchical workflow structures
- **Intent Matching**: Built-in intent recognition system with confidence scoring
- **TypeScript/Javascript Support**

### _Try it_
```bash
npx workflow-function-manifold
```

## Installation

```bash
npm install workflow-function-manifold
```

Or using Bun:

```bash
bun add workflow-function-manifold
```

## Quick Start

```typescript
import {
  WorkflowFunctionManifold,
  ManifoldRegion,
  WorkflowOperator,
  DummyIntentMap,
} from 'workflow-function-manifold';

// Create a new manifold instance
const intentService = new DummyIntentMap();
const manifold = new WorkflowFunctionManifold(intentService);

// Define operators
const analysisOperator = new WorkflowOperator('analysis', async state => ({
  ...state,
  analyzed: true,
}));

// Create regions
const analysisRegion = new ManifoldRegion('analysis', [analysisOperator]);
manifold.addRegion(analysisRegion);

// Execute workflow
await manifold.navigate('analyze the data');
await manifold.executeWorkflow('analyze the data');
```

## Core Components

### WorkflowFunctionManifold

The main orchestrator that manages workflow execution and region navigation.

```typescript
const manifold = new WorkflowFunctionManifold(intentService);
manifold.addRegion(region);
await manifold.navigate(prompt);
await manifold.executeWorkflow(prompt);
```

### ManifoldRegion

Represents a discrete workflow area containing operators and connections to other regions.

```typescript
const region = new ManifoldRegion('regionName', [operator1, operator2]);
region.connectTo(otherRegion);
region.addOperator(newOperator);
```

### WorkflowOperator

Defines executable operations within regions.

```typescript
const operator = new WorkflowOperator('operatorName', async state => {
  return { ...state, processed: true };
});
```

### NestedManifoldRegion

Enables hierarchical workflow structures by embedding one manifold within another.

```typescript
const nestedManifold = new WorkflowFunctionManifold(intentService);
const nestedRegion = new NestedManifoldRegion('preprocessing', nestedManifold);
```

## Complete Example

Here's a comprehensive example demonstrating nested workflows:

```typescript
import {
  WorkflowFunctionManifold,
  ManifoldRegion,
  WorkflowOperator,
  NestedManifoldRegion,
  DummyIntentMap,
} from 'workflow-function-manifold';

async function createWorkflow() {
  // Create nested workflow for preprocessing
  const nestedIntentService = new DummyIntentMap();
  const nestedManifold = new WorkflowFunctionManifold(nestedIntentService);
  
  const validateOp = new WorkflowOperator('validation', async state => ({
    ...state,
    validated: true,
  }));
  
  const cleanOp = new WorkflowOperator('cleaning', async state => ({
    ...state,
    cleaned: true,
  }));
  
  const validateRegion = new ManifoldRegion('validation', [validateOp]);
  const cleanRegion = new ManifoldRegion('cleaning', [cleanOp]);
  
  validateRegion.connectTo(cleanRegion);
  nestedManifold.addRegion(validateRegion);
  nestedManifold.addRegion(cleanRegion);

  // Create main workflow
  const mainIntentService = new DummyIntentMap();
  const mainManifold = new WorkflowFunctionManifold(mainIntentService);
  
  const nestedPreprocessRegion = new NestedManifoldRegion('preprocessing', nestedManifold);
  const analysisRegion = new ManifoldRegion('analysis', [
    new WorkflowOperator('analysis', async state => ({
      ...state,
      analyzed: true,
    })),
  ]);
  
  nestedPreprocessRegion.connectTo(analysisRegion);
  mainManifold.addRegion(nestedPreprocessRegion);
  mainManifold.addRegion(analysisRegion);
  
  return mainManifold;
}

// Execute workflow
const manifold = await createWorkflow();
const prompts = [
  'validate the input',
  'clean the data',
  'analyze the results',
];

for (const prompt of prompts) {
  await manifold.navigate(prompt);
  await manifold.executeWorkflow(prompt);
}
```

## State Management

The library maintains workflow state across operations and regions. Each operator can access and modify the state:

```typescript
const operator = new WorkflowOperator('example', async state => {
  // Access existing state
  const currentValue = state.someValue;
  
  // Return modified state
  return {
    ...state,
    newValue: 'updated',
    processed: true,
  };
});
```

## Error Handling

The library includes built-in error handling for:

- Invalid navigation attempts
- Unmatched intents
- Operation execution failures
- State management errors

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

MIT © 2024 Geoff Seemueller

## Development

```bash
# Install dependencies
bun install

# Run development mode
bun dev

# Build for production
bun run build

# Fix formatting and lint issues
bun run fix
```
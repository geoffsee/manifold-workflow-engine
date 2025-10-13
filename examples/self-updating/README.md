# Self-Updating Workflow Example

An **Adaptive Data Processing Pipeline** that demonstrates how workflows can evolve and adapt based on runtime conditions.

## Overview

This example showcases a workflow that:

- **Monitors data quality metrics** over multiple processing cycles
- **Adjusts processing thresholds** dynamically based on historical patterns
- **Enables/disables advanced features** (advanced processing, data enhancement, strict mode) based on data complexity
- **Persists learned configurations** using the provided `storageInstance.ts`
- **Evolves its processing strategy** to optimize for quality vs. performance

## Use Case

Imagine a data pipeline that processes incoming records. Over time, it learns from the data patterns it encounters:

- If it sees a lot of low-quality data, it enables **advanced processing** to improve results
- If quality is consistently high, it enables **strict mode** with higher thresholds
- If quality is moderate, it enables **data enhancement** features
- Quality thresholds adjust up or down based on historical averages

The workflow remembers these preferences across runs using persistent storage!

## Key Features Demonstrated

### 1. **Self-Updating Configuration**
```typescript
class AdaptiveStrategy {
  static shouldAdaptConfiguration(config, metrics): boolean
  static adaptConfiguration(config, metrics): WorkflowConfig
}
```
Analyzes runtime metrics and determines when/how to update the workflow configuration.

### 2. **Persistent State Management**
```typescript
class ConfigurationManager {
  async loadConfig(): Promise<WorkflowConfig>
  async saveConfig(config: WorkflowConfig): Promise<void>
  async loadMetrics(): Promise<QualityMetrics | null>
  async saveMetrics(metrics: QualityMetrics): Promise<void>
}
```
Uses `storageInstance` to persist configuration, metrics, and historical trends.

### 3. **Dynamic Workflow Routing**
The workflow conditionally enables/disables processing steps based on configuration:
- Basic validation → Advanced processing (if enabled) → Enhancement (if enabled)

### 4. **Historical Trend Tracking**
Maintains a history of quality metrics to show how the workflow evolves over time.

## Installation

```bash
cd examples/self-updating
bun install
```

## Usage

Run the example:

```bash
bun run index.ts
```

The workflow will run **continuously**, adapting in real-time! You'll see:

1. Data ingestion with varying quality scores
2. Validation using current thresholds
3. Processing (standard or advanced mode)
4. Enhancement (if enabled)
5. Analysis and adaptation decisions
6. Configuration updates when patterns emerge

The workflow runs indefinitely, showing:
- Current configuration after each cycle
- Detailed statistics every 10 cycles
- Quality trends over time
- Real-time adaptation based on data patterns

**Stop anytime with Ctrl+C** to see final statistics!

### Continuous Learning

The workflow persists its state to storage, so:

```bash
bun run index.ts  # First run - starts with defaults
# ... let it run for a while ...
# Press Ctrl+C to stop
bun run index.ts  # Second run - continues from previous state!
```

Each run loads the previous configuration and continues evolving from where it left off!

## Storage Keys

The example persists data using these storage keys:

- **`workflow:config`** - Current workflow configuration
- **`workflow:metrics`** - Cumulative quality metrics
- **`workflow:history`** - Historical trend data (last 100 measurements)

## Example Output

```
🚀 Adaptive Data Processing Pipeline

═══════════════════════════════════════════════════════════
Running continuous adaptation cycle...
Press Ctrl+C to stop and see final statistics
═══════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════
CYCLE 1
═══════════════════════════════════════════════════════════

📥 INGESTING DATA
  Generated 5 records
  Quality range: 0.12 - 0.89

✅ VALIDATING DATA
  Current threshold: 0.50
  Strict mode: OFF
  Valid: 3/5

⚙️  PROCESSING DATA
  📊 Using standard processing
  Processed 3 records

⏭️  SKIPPING ENHANCEMENT (disabled)

📊 ANALYZING RESULTS
  Average Quality: 0.67
  High Quality: 2/3
  Low Quality: 0/3
  Total Processed (all time): 3

⏭️  SKIPPING ADAPTATION (not needed)

📋 Current Configuration (v1):
  Quality Threshold: 0.50
  Advanced Processing: OFF
  Data Enhancement: OFF
  Strict Mode: OFF

⏳ Waiting before next cycle...
```

After accumulating data, you'll see configuration adaptations:

```
🔄 ADAPTING CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Metrics:
  Average Quality: 0.55
  High Quality Ratio: 45.5%
  Low Quality Ratio: 18.2%
  Total Processed: 33

  🔧 Enabling data enhancement

📦 Configuration version: 2 → 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Every 10 cycles, you'll see a periodic statistics report:

```
────────────────────────────────────────────────────────────
📈 PERIODIC STATISTICS REPORT
────────────────────────────────────────────────────────────
  Total Records Processed: 150
  Average Quality Score: 0.62
  High Quality: 72 (48.0%)
  Low Quality: 25 (16.7%)
  Quality Trend: ↗️  Improving (+0.08)
────────────────────────────────────────────────────────────
```

## Architecture

### Workflow Pipeline

```
[Ingest] → [Validate] → [Process] → [Enhance] → [Analyze] → [Adapt]
                                          ↓
                                [storageInstance]
                                    (persists)
```

### Data Flow

1. **Ingest**: Generate synthetic data with varying quality scores
2. **Validate**: Filter records based on dynamic quality threshold
3. **Process**: Apply standard or advanced processing
4. **Enhance**: Conditionally enrich data (if enabled)
5. **Analyze**: Calculate metrics and determine if adaptation is needed
6. **Adapt**: Update configuration and persist to storage

### Adaptation Rules

The `AdaptiveStrategy` class implements these rules:

| Condition | Action |
|-----------|--------|
| Low quality ratio > 30% | Enable advanced processing |
| Average quality > 0.8 | Enable strict mode |
| Average quality < 0.5 | Disable strict mode |
| Average quality > 0.75 | Raise quality threshold |
| Average quality < 0.4 | Lower quality threshold |
| Moderate quality (0.4-0.7) | Enable data enhancement |

## Real-World Applications

This pattern is useful for:

- **Data pipelines** that need to adapt to changing data quality
- **API rate limiters** that adjust based on error rates
- **Caching strategies** that evolve based on hit rates
- **Load balancers** that learn optimal routing patterns
- **Feature flags** that enable/disable based on performance metrics
- **A/B testing frameworks** that automatically optimize variants

## Advanced: Clear Storage

To reset the workflow to its initial state:

```bash
bun run -e 'import storage from "./storageInstance"; await storage.removeItem("workflow:config"); await storage.removeItem("workflow:metrics"); await storage.removeItem("workflow:history"); console.log("Storage cleared!");'
```

## Learn More

- See `index.ts:69-132` for `ConfigurationManager` implementation
- See `index.ts:138-227` for `AdaptiveStrategy` logic
- See `index.ts:271-426` for workflow operator definitions
- Check out the `storageInstance.ts` configuration

---

Built with [manifold-workflow-engine](../../README.md)

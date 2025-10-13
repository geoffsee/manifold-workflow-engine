#!/usr/bin/env node

/**
 * Adaptive Data Processing Pipeline
 *
 * This example demonstrates a self-updating workflow that:
 * - Monitors data quality metrics over time
 * - Adjusts processing thresholds based on historical patterns
 * - Enables/disables advanced processing based on data complexity
 * - Persists learned configurations using storage
 * - Dynamically evolves its processing strategy
 *
 * Use case: A data pipeline that learns from incoming data and adapts
 * its processing strategy to optimize for quality vs. performance.
 */

import {
  WorkflowFunctionManifold,
  ManifoldRegion,
  WorkflowOperator,
} from 'manifold-workflow-engine';
import storage from './storageInstance';
import { StaticIntentMap } from './static-intent-map';

// ========================================
// TYPE DEFINITIONS
// ========================================

interface DataRecord {
  id: string;
  timestamp: number;
  data: Record<string, any>;
  qualityScore?: number;
  processed?: boolean;
  enhanced?: boolean;
}

interface QualityMetrics {
  averageScore: number;
  totalProcessed: number;
  highQualityCount: number;
  lowQualityCount: number;
  lastUpdated: number;
}

interface WorkflowConfig {
  qualityThreshold: number;
  enableAdvancedProcessing: boolean;
  enableDataEnhancement: boolean;
  strictMode: boolean;
  version: number;
}

interface WorkflowState {
  records?: DataRecord[];
  validRecords?: DataRecord[];
  processedRecords?: DataRecord[];
  enhancedRecords?: DataRecord[];
  metrics?: QualityMetrics;
  config?: WorkflowConfig;
  shouldAdapt?: boolean;
  [key: string]: unknown;
}

// ========================================
// CONFIGURATION MANAGER
// ========================================

class ConfigurationManager {
  private static readonly CONFIG_KEY = 'workflow:config';
  private static readonly METRICS_KEY = 'workflow:metrics';
  private static readonly HISTORY_KEY = 'workflow:history';

  private static readonly DEFAULT_CONFIG: WorkflowConfig = {
    qualityThreshold: 0.5,
    enableAdvancedProcessing: false,
    enableDataEnhancement: false,
    strictMode: false,
    version: 1,
  };

  async loadConfig(): Promise<WorkflowConfig> {
    const stored = await storage.getItem(ConfigurationManager.CONFIG_KEY);
    if (stored) {
      console.log('📂 Loaded existing configuration (version', (stored as WorkflowConfig).version, ')');
      return stored as WorkflowConfig;
    }
    console.log('🆕 Using default configuration');
    return { ...ConfigurationManager.DEFAULT_CONFIG };
  }

  async saveConfig(config: WorkflowConfig): Promise<void> {
    await storage.setItem(ConfigurationManager.CONFIG_KEY, config);
    console.log('💾 Configuration saved (version', config.version, ')');
  }

  async loadMetrics(): Promise<QualityMetrics | null> {
    const stored = await storage.getItem(ConfigurationManager.METRICS_KEY);
    return stored ? (stored as QualityMetrics) : null;
  }

  async saveMetrics(metrics: QualityMetrics): Promise<void> {
    await storage.setItem(ConfigurationManager.METRICS_KEY, metrics);

    // Also append to history
    const history = await this.getHistory();
    history.push({
      timestamp: metrics.lastUpdated,
      averageScore: metrics.averageScore,
      totalProcessed: metrics.totalProcessed,
    });

    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift();
    }

    await storage.setItem(ConfigurationManager.HISTORY_KEY, history);
  }

  async getHistory(): Promise<Array<{ timestamp: number; averageScore: number; totalProcessed: number }>> {
    const stored = await storage.getItem(ConfigurationManager.HISTORY_KEY);
    return stored ? (stored as Array<any>) : [];
  }

  async clearAll(): Promise<void> {
    await storage.removeItem(ConfigurationManager.CONFIG_KEY);
    await storage.removeItem(ConfigurationManager.METRICS_KEY);
    await storage.removeItem(ConfigurationManager.HISTORY_KEY);
    console.log('🗑️  All stored data cleared');
  }
}

// ========================================
// ADAPTIVE STRATEGY ENGINE
// ========================================

class AdaptiveStrategy {
  /**
   * Analyze metrics and determine if configuration should be updated
   */
  static shouldAdaptConfiguration(
    currentConfig: WorkflowConfig,
    metrics: QualityMetrics
  ): boolean {
    // Adapt if we have enough data and patterns are emerging
    if (metrics.totalProcessed < 10) {
      return false; // Not enough data yet
    }

    const highQualityRatio = metrics.highQualityCount / metrics.totalProcessed;
    const lowQualityRatio = metrics.lowQualityCount / metrics.totalProcessed;

    // Enable advanced processing if we see a lot of low quality data
    if (lowQualityRatio > 0.3 && !currentConfig.enableAdvancedProcessing) {
      return true;
    }

    // Enable strict mode if average quality is consistently high
    if (metrics.averageScore > 0.8 && !currentConfig.strictMode) {
      return true;
    }

    // Disable strict mode if quality drops
    if (metrics.averageScore < 0.5 && currentConfig.strictMode) {
      return true;
    }

    return false;
  }

  /**
   * Generate an updated configuration based on metrics
   */
  static adaptConfiguration(
    currentConfig: WorkflowConfig,
    metrics: QualityMetrics
  ): WorkflowConfig {
    const newConfig = { ...currentConfig };
    const highQualityRatio = metrics.highQualityCount / metrics.totalProcessed;
    const lowQualityRatio = metrics.lowQualityCount / metrics.totalProcessed;

    console.log('\n🔄 ADAPTING CONFIGURATION');
    console.log('━'.repeat(60));
    console.log(`Current Metrics:`);
    console.log(`  Average Quality: ${metrics.averageScore.toFixed(2)}`);
    console.log(`  High Quality Ratio: ${(highQualityRatio * 100).toFixed(1)}%`);
    console.log(`  Low Quality Ratio: ${(lowQualityRatio * 100).toFixed(1)}%`);
    console.log(`  Total Processed: ${metrics.totalProcessed}`);

    // Adjust quality threshold based on average
    if (metrics.averageScore > 0.75) {
      newConfig.qualityThreshold = Math.min(0.7, currentConfig.qualityThreshold + 0.1);
      console.log(`  ↗️  Raising quality threshold to ${newConfig.qualityThreshold.toFixed(2)}`);
    } else if (metrics.averageScore < 0.4) {
      newConfig.qualityThreshold = Math.max(0.3, currentConfig.qualityThreshold - 0.1);
      console.log(`  ↘️  Lowering quality threshold to ${newConfig.qualityThreshold.toFixed(2)}`);
    }

    // Enable advanced processing for low quality data
    if (lowQualityRatio > 0.3 && !newConfig.enableAdvancedProcessing) {
      newConfig.enableAdvancedProcessing = true;
      console.log(`  ✨ Enabling advanced processing`);
    }

    // Enable data enhancement for moderate quality data
    if (metrics.averageScore > 0.4 && metrics.averageScore < 0.7) {
      newConfig.enableDataEnhancement = true;
      console.log(`  🔧 Enabling data enhancement`);
    }

    // Enable strict mode for consistently high quality
    if (metrics.averageScore > 0.8 && highQualityRatio > 0.7) {
      newConfig.strictMode = true;
      console.log(`  🎯 Enabling strict mode`);
    } else if (metrics.averageScore < 0.5 && newConfig.strictMode) {
      newConfig.strictMode = false;
      console.log(`  🔓 Disabling strict mode`);
    }

    newConfig.version += 1;
    console.log(`\n📦 Configuration version: ${currentConfig.version} → ${newConfig.version}`);
    console.log('━'.repeat(60));

    return newConfig;
  }
}

// ========================================
// DATA GENERATOR (for demo purposes)
// ========================================

class DataGenerator {
  private idCounter = 0;

  /**
   * Generate synthetic data records with varying quality
   */
  generateBatch(count: number): DataRecord[] {
    const records: DataRecord[] = [];

    for (let i = 0; i < count; i++) {
      const qualityScore = Math.random();
      const record: DataRecord = {
        id: `record-${++this.idCounter}`,
        timestamp: Date.now(),
        data: {
          value: Math.random() * 100,
          category: this.randomCategory(),
          status: qualityScore > 0.7 ? 'complete' : qualityScore > 0.3 ? 'partial' : 'incomplete',
          metadata: qualityScore > 0.5 ? { source: 'api', verified: true } : { source: 'manual' },
        },
        qualityScore,
      };
      records.push(record);
    }

    return records;
  }

  private randomCategory(): string {
    const categories = ['analytics', 'transactions', 'user-data', 'system-logs', 'metrics'];
    return categories[Math.floor(Math.random() * categories.length)];
  }
}

// ========================================
// WORKFLOW OPERATORS
// ========================================

function createIngestOperator(generator: DataGenerator): WorkflowOperator {
  return new WorkflowOperator('ingest', async (state: WorkflowState) => {
    console.log('\n📥 INGESTING DATA');
    const records = generator.generateBatch(5);
    console.log(`  Generated ${records.length} records`);
    console.log(`  Quality range: ${Math.min(...records.map(r => r.qualityScore!)).toFixed(2)} - ${Math.max(...records.map(r => r.qualityScore!)).toFixed(2)}`);
    return { ...state, records };
  });
}

function createValidateOperator(configManager: ConfigurationManager): WorkflowOperator {
  return new WorkflowOperator('validate', async (state: WorkflowState) => {
    console.log('\n✅ VALIDATING DATA');

    const config = await configManager.loadConfig();
    const records = state.records || [];

    console.log(`  Current threshold: ${config.qualityThreshold.toFixed(2)}`);
    console.log(`  Strict mode: ${config.strictMode ? 'ON' : 'OFF'}`);

    const validRecords = records.filter(r => {
      const threshold = config.strictMode ? config.qualityThreshold + 0.1 : config.qualityThreshold;
      return r.qualityScore! >= threshold;
    });

    console.log(`  Valid: ${validRecords.length}/${records.length}`);

    return { ...state, validRecords, config };
  });
}

function createProcessOperator(): WorkflowOperator {
  return new WorkflowOperator('process', async (state: WorkflowState) => {
    console.log('\n⚙️  PROCESSING DATA');

    const records = state.validRecords || [];
    const config = state.config!;

    const processedRecords = records.map(r => ({
      ...r,
      processed: true,
      data: {
        ...r.data,
        processedAt: Date.now(),
        processingMode: config.enableAdvancedProcessing ? 'advanced' : 'standard',
      },
    }));

    if (config.enableAdvancedProcessing) {
      console.log(`  ✨ Using advanced processing`);
      // Simulate advanced processing improving quality
      processedRecords.forEach(r => {
        r.qualityScore = Math.min(1.0, r.qualityScore! + 0.1);
      });
    } else {
      console.log(`  📊 Using standard processing`);
    }

    console.log(`  Processed ${processedRecords.length} records`);

    return { ...state, processedRecords };
  });
}

function createEnhanceOperator(): WorkflowOperator {
  return new WorkflowOperator('enhance', async (state: WorkflowState) => {
    const config = state.config!;

    if (!config.enableDataEnhancement) {
      console.log('\n⏭️  SKIPPING ENHANCEMENT (disabled)');
      return { ...state, enhancedRecords: state.processedRecords };
    }

    console.log('\n🔧 ENHANCING DATA');

    const records = state.processedRecords || [];
    const enhancedRecords = records.map(r => ({
      ...r,
      enhanced: true,
      data: {
        ...r.data,
        enhancedAt: Date.now(),
        enrichment: {
          normalized: true,
          indexed: true,
          validated: true,
        },
      },
      qualityScore: Math.min(1.0, r.qualityScore! + 0.05),
    }));

    console.log(`  Enhanced ${enhancedRecords.length} records`);

    return { ...state, enhancedRecords };
  });
}

function createAnalyzeOperator(configManager: ConfigurationManager): WorkflowOperator {
  return new WorkflowOperator('analyze', async (state: WorkflowState) => {
    console.log('\n📊 ANALYZING RESULTS');

    const records = state.enhancedRecords || [];
    const config = state.config!;

    // Calculate metrics
    const qualityScores = records.map(r => r.qualityScore!);
    const averageScore = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    const highQualityCount = records.filter(r => r.qualityScore! > 0.7).length;
    const lowQualityCount = records.filter(r => r.qualityScore! < 0.4).length;

    // Load previous metrics
    const previousMetrics = await configManager.loadMetrics();
    const totalProcessed = (previousMetrics?.totalProcessed || 0) + records.length;

    const metrics: QualityMetrics = {
      averageScore,
      totalProcessed,
      highQualityCount: (previousMetrics?.highQualityCount || 0) + highQualityCount,
      lowQualityCount: (previousMetrics?.lowQualityCount || 0) + lowQualityCount,
      lastUpdated: Date.now(),
    };

    // Save metrics
    await configManager.saveMetrics(metrics);

    console.log(`  Average Quality: ${averageScore.toFixed(2)}`);
    console.log(`  High Quality: ${highQualityCount}/${records.length}`);
    console.log(`  Low Quality: ${lowQualityCount}/${records.length}`);
    console.log(`  Total Processed (all time): ${totalProcessed}`);

    // Determine if we should adapt
    const shouldAdapt = AdaptiveStrategy.shouldAdaptConfiguration(config, metrics);

    return { ...state, metrics, shouldAdapt };
  });
}

function createAdaptOperator(configManager: ConfigurationManager): WorkflowOperator {
  return new WorkflowOperator('adapt', async (state: WorkflowState) => {
    if (!state.shouldAdapt) {
      console.log('\n⏭️  SKIPPING ADAPTATION (not needed)');
      return state;
    }

    const currentConfig = state.config!;
    const metrics = state.metrics!;

    // Generate new configuration
    const newConfig = AdaptiveStrategy.adaptConfiguration(currentConfig, metrics);

    // Save new configuration
    await configManager.saveConfig(newConfig);

    return { ...state, config: newConfig };
  });
}

// ========================================
// MAIN EXECUTION
// ========================================

async function main() {
  console.log('🚀 Adaptive Data Processing Pipeline\n');
  console.log('This example demonstrates:');
  console.log('- Self-updating workflow configuration');
  console.log('- Persistent state management with storage');
  console.log('- Dynamic processing strategy adaptation');
  console.log('- Quality-based workflow evolution\n');

  // Initialize services
  const configManager = new ConfigurationManager();
  const generator = new DataGenerator();

  // Create intent map
  const intentMap = new StaticIntentMap({
    'ingest': 'ingest',
    'validate': 'validate',
    'process': 'process',
    'enhance': 'enhance',
    'analyze': 'analyze',
    'adapt': 'adapt',
  });

  const manifold = new WorkflowFunctionManifold(intentMap);

  // Create operators
  const ingestOp = createIngestOperator(generator);
  const validateOp = createValidateOperator(configManager);
  const processOp = createProcessOperator();
  const enhanceOp = createEnhanceOperator();
  const analyzeOp = createAnalyzeOperator(configManager);
  const adaptOp = createAdaptOperator(configManager);

  // Create regions
  const ingestRegion = new ManifoldRegion('ingest', [ingestOp]);
  const validateRegion = new ManifoldRegion('validate', [validateOp]);
  const processRegion = new ManifoldRegion('process', [processOp]);
  const enhanceRegion = new ManifoldRegion('enhance', [enhanceOp]);
  const analyzeRegion = new ManifoldRegion('analyze', [analyzeOp]);
  const adaptRegion = new ManifoldRegion('adapt', [adaptOp]);

  // Connect regions
  ingestRegion.connectTo(validateRegion);
  validateRegion.connectTo(processRegion);
  processRegion.connectTo(enhanceRegion);
  enhanceRegion.connectTo(analyzeRegion);
  analyzeRegion.connectTo(adaptRegion);

  // Add regions to manifold
  manifold.addRegion(ingestRegion);
  manifold.addRegion(validateRegion);
  manifold.addRegion(processRegion);
  manifold.addRegion(enhanceRegion);
  manifold.addRegion(analyzeRegion);
  manifold.addRegion(adaptRegion);

  // Setup graceful shutdown
  let isRunning = true;
  process.on('SIGINT', () => {
    console.log('\n\n⏸️  Gracefully shutting down...\n');
    isRunning = false;
  });

  console.log('═'.repeat(60));
  console.log('Running continuous adaptation cycle...');
  console.log('Press Ctrl+C to stop and see final statistics');
  console.log('═'.repeat(60));

  const workflow = [
    { prompt: 'ingest', description: 'Data Ingestion' },
    { prompt: 'validate', description: 'Data Validation' },
    { prompt: 'process', description: 'Data Processing' },
    { prompt: 'enhance', description: 'Data Enhancement' },
    { prompt: 'analyze', description: 'Results Analysis' },
    { prompt: 'adapt', description: 'Configuration Adaptation' },
  ];

  let cycle = 0;
  const STATS_INTERVAL = 10; // Show detailed stats every N cycles

  while (isRunning) {
    cycle++;
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`CYCLE ${cycle}`);
    console.log('═'.repeat(60));

    // Execute workflow steps
    for (const { prompt } of workflow) {
      if (!isRunning) break;
      await manifold.navigate(prompt);
      await manifold.executeWorkflow(prompt);
    }

    if (!isRunning) break;

    // Show current configuration after each cycle
    const currentConfig = (manifold.state as WorkflowState).config!;
    console.log(`\n📋 Current Configuration (v${currentConfig.version}):`);
    console.log(`  Quality Threshold: ${currentConfig.qualityThreshold.toFixed(2)}`);
    console.log(`  Advanced Processing: ${currentConfig.enableAdvancedProcessing ? 'ON' : 'OFF'}`);
    console.log(`  Data Enhancement: ${currentConfig.enableDataEnhancement ? 'ON' : 'OFF'}`);
    console.log(`  Strict Mode: ${currentConfig.strictMode ? 'ON' : 'OFF'}`);

    // Show detailed statistics periodically
    if (cycle % STATS_INTERVAL === 0) {
      const metrics = await configManager.loadMetrics();
      const history = await configManager.getHistory();

      console.log(`\n${'─'.repeat(60)}`);
      console.log('📈 PERIODIC STATISTICS REPORT');
      console.log('─'.repeat(60));

      if (metrics) {
        console.log(`  Total Records Processed: ${metrics.totalProcessed}`);
        console.log(`  Average Quality Score: ${metrics.averageScore.toFixed(2)}`);
        console.log(`  High Quality: ${metrics.highQualityCount} (${(metrics.highQualityCount / metrics.totalProcessed * 100).toFixed(1)}%)`);
        console.log(`  Low Quality: ${metrics.lowQualityCount} (${(metrics.lowQualityCount / metrics.totalProcessed * 100).toFixed(1)}%)`);

        if (history.length > 1) {
          const recent = history.slice(-5);
          const trend = recent[recent.length - 1].averageScore - recent[0].averageScore;
          const trendSymbol = trend > 0.05 ? '↗️  Improving' : trend < -0.05 ? '↘️  Declining' : '→ Stable';
          console.log(`  Quality Trend: ${trendSymbol} (${trend > 0 ? '+' : ''}${trend.toFixed(2)})`);
        }
      }
      console.log('─'.repeat(60));
    }

    // Wait before next cycle
    console.log(`\n⏳ Waiting before next cycle...\n`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Display final statistics
  console.log(`\n${'═'.repeat(60)}`);
  console.log('FINAL STATISTICS');
  console.log('═'.repeat(60));

  const finalMetrics = await configManager.loadMetrics();
  const finalConfig = await configManager.loadConfig();
  const history = await configManager.getHistory();

  if (finalMetrics) {
    console.log('\n📊 Overall Performance:');
    console.log(`  Total Cycles Run: ${cycle}`);
    console.log(`  Total Records Processed: ${finalMetrics.totalProcessed}`);
    console.log(`  Average Quality Score: ${finalMetrics.averageScore.toFixed(2)}`);
    console.log(`  High Quality Records: ${finalMetrics.highQualityCount} (${(finalMetrics.highQualityCount / finalMetrics.totalProcessed * 100).toFixed(1)}%)`);
    console.log(`  Low Quality Records: ${finalMetrics.lowQualityCount} (${(finalMetrics.lowQualityCount / finalMetrics.totalProcessed * 100).toFixed(1)}%)`);
  }

  console.log(`\n⚙️  Final Configuration (v${finalConfig.version}):`);
  console.log(`  Quality Threshold: ${finalConfig.qualityThreshold.toFixed(2)}`);
  console.log(`  Advanced Processing: ${finalConfig.enableAdvancedProcessing ? 'ENABLED' : 'DISABLED'}`);
  console.log(`  Data Enhancement: ${finalConfig.enableDataEnhancement ? 'ENABLED' : 'DISABLED'}`);
  console.log(`  Strict Mode: ${finalConfig.strictMode ? 'ENABLED' : 'DISABLED'}`);

  if (history.length > 0) {
    console.log(`\n📈 Quality Trend History (last ${Math.min(10, history.length)} measurements):`);
    history.slice(-10).forEach((entry) => {
      const date = new Date(entry.timestamp).toLocaleTimeString();
      console.log(`  ${date}: ${entry.averageScore.toFixed(2)} (${entry.totalProcessed} total processed)`);
    });
  }

  console.log('\n✅ Workflow completed successfully!\n');
  console.log('💡 Key Features Demonstrated:');
  console.log('   ✓ Self-updating configuration based on runtime metrics');
  console.log('   ✓ Persistent state storage and retrieval');
  console.log('   ✓ Dynamic workflow adaptation');
  console.log('   ✓ Quality-driven processing strategy evolution');
  console.log('   ✓ Historical trend tracking');
  console.log('   ✓ Continuous operation with graceful shutdown\n');

  console.log('💾 Stored Data:');
  console.log('   - Configuration: workflow:config');
  console.log('   - Metrics: workflow:metrics');
  console.log('   - History: workflow:history\n');

  console.log('🔄 Run again to continue from where you left off!\n');
}

// Run the example
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

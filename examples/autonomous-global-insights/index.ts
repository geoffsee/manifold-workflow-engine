#!/usr/bin/env node

/**
 * Autonomous Global Insights System
 *
 * A continuously running system that:
 * - Learns about the world through GDELT data
 * - Discovers emerging topics and trends
 * - Generates valuable insights through cross-analysis
 * - Adapts its exploration strategy based on findings
 * - Provides real-time insight viewing via HTTP server
 */

import {
  WorkflowFunctionManifold,
  ManifoldRegion,
  WorkflowOperator,
} from 'manifold-workflow-engine';
import storage from './storageInstance';
import { StaticIntentMap } from './static-intent-map';
import { GdeltClient, createQuery } from './gdelt-client';

// ============================================================================
// Type Definitions
// ============================================================================

interface Topic {
  id: string;
  query: string;
  category: string;
  firstSeen: number;
  lastUpdated: number;
  articleCount: number;
  averageTone: number;
  geographicReach: number;
  insightPotential: number;
}

interface Insight {
  id: string;
  timestamp: number;
  type: 'trend' | 'correlation' | 'anomaly' | 'geographic' | 'sentiment';
  title: string;
  description: string;
  topics: string[];
  significance: number;
  data: Record<string, any>;
}

interface ExplorationStrategy {
  focusAreas: string[];
  exploredTopics: Set<string>;
  successfulQueries: string[];
  timeWindow: string;
  depthLevel: number;
  version: number;
}

interface WorkflowState {
  topics?: Topic[];
  currentTopic?: Topic;
  articles?: any[];
  geoData?: any;
  tvData?: any;
  analysis?: {
    tone: number;
    volume: number;
    geographicSpread: number;
    temporalTrend: string;
  };
  insights?: Insight[];
  strategy?: ExplorationStrategy;
  cycle?: number;
  [key: string]: unknown;
}

// ============================================================================
// Storage Manager
// ============================================================================

class InsightStorage {
  private static readonly INSIGHTS_KEY = 'insights:all';
  private static readonly TOPICS_KEY = 'topics:discovered';
  private static readonly STRATEGY_KEY = 'strategy:current';

  async saveInsight(insight: Insight): Promise<void> {
    const insights = await this.getAllInsights();
    insights.push(insight);

    // Keep last 100 insights
    if (insights.length > 100) {
      insights.shift();
    }

    await storage.setItem(InsightStorage.INSIGHTS_KEY, insights);
  }

  async getAllInsights(): Promise<Insight[]> {
    const stored = await storage.getItem(InsightStorage.INSIGHTS_KEY);
    return stored ? (stored as Insight[]) : [];
  }

  async getRecentInsights(count: number = 10): Promise<Insight[]> {
    const all = await this.getAllInsights();
    return all.slice(-count).reverse();
  }

  async saveTopics(topics: Topic[]): Promise<void> {
    await storage.setItem(InsightStorage.TOPICS_KEY, topics);
  }

  async getTopics(): Promise<Topic[]> {
    const stored = await storage.getItem(InsightStorage.TOPICS_KEY);
    return stored ? (stored as Topic[]) : [];
  }

  async saveStrategy(strategy: ExplorationStrategy): Promise<void> {
    // Convert Set to Array for JSON serialization
    const serializable = {
      ...strategy,
      exploredTopics: Array.from(strategy.exploredTopics),
    };
    await storage.setItem(InsightStorage.STRATEGY_KEY, serializable);
  }

  async getStrategy(): Promise<ExplorationStrategy | null> {
    const stored: any = await storage.getItem(InsightStorage.STRATEGY_KEY);
    if (!stored) return null;

    // Convert Array back to Set
    return {
      ...stored,
      exploredTopics: new Set(stored.exploredTopics || []),
    };
  }
}

// ============================================================================
// Insight Generator
// ============================================================================

class InsightGenerator {
  private idCounter = 0;

  generateInsights(state: WorkflowState): Insight[] {
    const insights: Insight[] = [];
    const { currentTopic, analysis, articles, geoData } = state;

    if (!currentTopic || !analysis) return insights;

    // Trend insights
    if (articles && articles.length > 10) {
      insights.push({
        id: `insight-${++this.idCounter}-${Date.now()}`,
        timestamp: Date.now(),
        type: 'trend',
        title: `Emerging Trend: ${currentTopic.query}`,
        description: `High volume of coverage detected (${articles.length} articles). ${
          analysis.temporalTrend === 'increasing'
            ? 'Coverage is accelerating.'
            : 'Coverage remains steady.'
        }`,
        topics: [currentTopic.id],
        significance: this.calculateSignificance(articles.length, analysis.tone, analysis.geographicSpread),
        data: {
          articleCount: articles.length,
          tone: analysis.tone,
          trend: analysis.temporalTrend,
        },
      });
    }

    // Sentiment insights
    if (Math.abs(analysis.tone) > 5) {
      insights.push({
        id: `insight-${++this.idCounter}-${Date.now()}`,
        timestamp: Date.now(),
        type: 'sentiment',
        title: `${analysis.tone > 0 ? 'Positive' : 'Negative'} Sentiment on ${currentTopic.query}`,
        description: `Strong ${analysis.tone > 0 ? 'positive' : 'negative'} sentiment detected (tone: ${analysis.tone.toFixed(2)}). ${
          Math.abs(analysis.tone) > 10
            ? 'This is exceptionally strong emotional coverage.'
            : 'This indicates notable emotional framing.'
        }`,
        topics: [currentTopic.id],
        significance: Math.abs(analysis.tone) / 15,
        data: {
          tone: analysis.tone,
          polarity: analysis.tone > 0 ? 'positive' : 'negative',
        },
      });
    }

    // Geographic insights
    if (geoData && analysis.geographicSpread > 0.7) {
      insights.push({
        id: `insight-${++this.idCounter}-${Date.now()}`,
        timestamp: Date.now(),
        type: 'geographic',
        title: `Global Attention on ${currentTopic.query}`,
        description: `Topic has wide geographic reach across multiple regions. This suggests global significance or widespread impact.`,
        topics: [currentTopic.id],
        significance: analysis.geographicSpread,
        data: {
          geographicSpread: analysis.geographicSpread,
          regions: geoData.regions || [],
        },
      });
    }

    return insights;
  }

  private calculateSignificance(volume: number, tone: number, geoSpread: number): number {
    // Normalize volume (0-1 scale, assuming 50 articles is high)
    const volumeScore = Math.min(volume / 50, 1);

    // Tone significance (0-1 scale, extreme tones are significant)
    const toneScore = Math.abs(tone) / 15;

    // Geographic spread is already 0-1

    // Weighted average
    return (volumeScore * 0.4 + toneScore * 0.3 + geoSpread * 0.3);
  }
}

// ============================================================================
// Strategy Adapter
// ============================================================================

class StrategyAdapter {
  private readonly DEFAULT_STRATEGY: ExplorationStrategy = {
    focusAreas: ['technology', 'politics', 'climate', 'economy', 'health'],
    exploredTopics: new Set(),
    successfulQueries: [],
    timeWindow: '24h',
    depthLevel: 1,
    version: 1,
  };

  async loadStrategy(insightStorage: InsightStorage): Promise<ExplorationStrategy> {
    const stored = await insightStorage.getStrategy();
    if (stored) {
      return stored;
    }
    // Deep copy the default strategy with a new Set instance
    return {
      ...this.DEFAULT_STRATEGY,
      exploredTopics: new Set(this.DEFAULT_STRATEGY.exploredTopics),
    };
  }

  adaptStrategy(strategy: ExplorationStrategy, insights: Insight[], topics: Topic[]): ExplorationStrategy {
    const newStrategy = { ...strategy };

    // Identify which focus areas are yielding good insights
    const insightsByArea = this.groupInsightsByArea(insights, topics);
    const successfulAreas = Object.entries(insightsByArea)
      .filter(([_, count]) => count > 2)
      .map(([area, _]) => area);

    if (successfulAreas.length > 0) {
      // Expand focus to include successful areas
      newStrategy.focusAreas = [
        ...new Set([...successfulAreas, ...strategy.focusAreas.slice(0, 3)])
      ].slice(0, 7);
    }

    // Increase depth if we're finding good insights
    if (insights.length > 5 && strategy.depthLevel < 3) {
      newStrategy.depthLevel += 1;
      newStrategy.timeWindow = strategy.depthLevel === 2 ? '3d' : '7d';
    }

    // Track successful queries
    const topInsightTopics = insights
      .sort((a, b) => b.significance - a.significance)
      .slice(0, 3)
      .flatMap(i => i.topics);

    const successfulTopics = topics.filter(t => topInsightTopics.includes(t.id));
    newStrategy.successfulQueries = successfulTopics.map(t => t.query).slice(0, 10);

    newStrategy.version += 1;

    return newStrategy;
  }

  getNextQuery(strategy: ExplorationStrategy): string {
    // Use successful queries 50% of the time
    if (strategy.successfulQueries.length > 0 && Math.random() > 0.5) {
      return strategy.successfulQueries[Math.floor(Math.random() * strategy.successfulQueries.length)];
    }

    // Otherwise explore focus areas
    const area = strategy.focusAreas[Math.floor(Math.random() * strategy.focusAreas.length)];
    return area;
  }

  private groupInsightsByArea(insights: Insight[], topics: Topic[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const insight of insights) {
      for (const topicId of insight.topics) {
        const topic = topics.find(t => t.id === topicId);
        if (topic) {
          grouped[topic.category] = (grouped[topic.category] || 0) + 1;
        }
      }
    }

    return grouped;
  }
}

// ============================================================================
// HTTP Server for Viewing Insights
// ============================================================================

class InsightServer {
  private server: any;
  private insightStorage: InsightStorage;
  private port: number;
  private latestState: WorkflowState | null = null;

  constructor(insightStorage: InsightStorage, port: number = 3000) {
    this.insightStorage = insightStorage;
    this.port = port;
  }

  updateState(state: WorkflowState): void {
    this.latestState = state;
  }

  start(): void {
    const self = this;
    this.server = Bun.serve({
      port: this.port,
      async fetch(req: Request): Promise<Response> {
        const url = new URL(req.url);

        if (url.pathname === '/') {
          return new Response(await self.getHtmlPage(), {
            headers: { 'Content-Type': 'text/html' },
          });
        }

        if (url.pathname === '/api/insights') {
          const insights = await self.insightStorage.getAllInsights();
          return new Response(JSON.stringify(insights), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (url.pathname === '/api/topics') {
          const topics = await self.insightStorage.getTopics();
          return new Response(JSON.stringify(topics), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (url.pathname === '/api/status') {
          return new Response(JSON.stringify({
            cycle: self.latestState?.cycle || 0,
            topicsExplored: self.latestState?.topics?.length || 0,
            insightsGenerated: (await self.insightStorage.getAllInsights()).length,
            currentTopic: self.latestState?.currentTopic?.query || 'none',
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response('Not Found', { status: 404 });
      },
    });

    console.log(`\n🌐 Insight viewer running at http://localhost:${this.port}`);
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
    }
  }

  private async getHtmlPage(): Promise<string> {
    const insights = await this.insightStorage.getRecentInsights(20);
    const topics = await this.insightStorage.getTopics();

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Autonomous Global Insights</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0e27;
      color: #e0e6ed;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    header {
      text-align: center;
      padding: 2rem 0;
      border-bottom: 2px solid #1a2332;
      margin-bottom: 2rem;
    }
    h1 {
      font-size: 2.5rem;
      color: #4f9eff;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #8896ab;
      font-size: 1.1rem;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: #1a2332;
      padding: 1.5rem;
      border-radius: 8px;
      border-left: 4px solid #4f9eff;
    }
    .stat-label {
      color: #8896ab;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #4f9eff;
      margin-top: 0.5rem;
    }
    .section {
      margin-bottom: 3rem;
    }
    h2 {
      color: #4f9eff;
      margin-bottom: 1rem;
      font-size: 1.8rem;
    }
    .insight {
      background: #1a2332;
      padding: 1.5rem;
      margin-bottom: 1rem;
      border-radius: 8px;
      border-left: 4px solid ${this.getInsightColor('trend')};
    }
    .insight-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 0.75rem;
    }
    .insight-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: #e0e6ed;
    }
    .insight-type {
      background: #2d3748;
      color: #4f9eff;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .insight-description {
      color: #b8c5d6;
      margin-bottom: 0.75rem;
    }
    .insight-meta {
      display: flex;
      gap: 1.5rem;
      font-size: 0.9rem;
      color: #8896ab;
    }
    .significance-bar {
      height: 4px;
      background: #2d3748;
      border-radius: 2px;
      margin-top: 0.5rem;
      overflow: hidden;
    }
    .significance-fill {
      height: 100%;
      background: linear-gradient(90deg, #4f9eff, #2dd4bf);
      transition: width 0.3s ease;
    }
    .topic-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }
    .topic-card {
      background: #1a2332;
      padding: 1rem;
      border-radius: 8px;
      border-top: 3px solid #4f9eff;
    }
    .topic-query {
      font-weight: 600;
      color: #e0e6ed;
      margin-bottom: 0.5rem;
    }
    .topic-stats {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #8896ab;
    }
    .refresh-notice {
      text-align: center;
      color: #8896ab;
      margin-top: 2rem;
      padding: 1rem;
      background: #1a2332;
      border-radius: 8px;
    }
  </style>
  <script>
    // Auto-refresh every 10 seconds
    setTimeout(() => location.reload(), 10000);
  </script>
</head>
<body>
  <div class="container">
    <header>
      <h1>🌍 Autonomous Global Insights</h1>
      <p class="subtitle">AI-powered discovery and analysis of global events</p>
    </header>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Cycle</div>
        <div class="stat-value">${this.latestState?.cycle || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Topics Explored</div>
        <div class="stat-value">${topics.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Insights Generated</div>
        <div class="stat-value">${insights.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Current Topic</div>
        <div class="stat-value" style="font-size: 1rem; margin-top: 1rem;">${this.latestState?.currentTopic?.query || 'Initializing...'}</div>
      </div>
    </div>

    <div class="section">
      <h2>Recent Insights</h2>
      ${insights.length === 0 ? '<p style="color: #8896ab;">No insights yet. System is learning...</p>' : ''}
      ${insights.map(insight => `
        <div class="insight" style="border-left-color: ${this.getInsightColor(insight.type)}">
          <div class="insight-header">
            <div class="insight-title">${insight.title}</div>
            <div class="insight-type">${insight.type}</div>
          </div>
          <div class="insight-description">${insight.description}</div>
          <div class="insight-meta">
            <span>⏱️ ${new Date(insight.timestamp).toLocaleString()}</span>
            <span>📊 Significance: ${(insight.significance * 100).toFixed(0)}%</span>
          </div>
          <div class="significance-bar">
            <div class="significance-fill" style="width: ${insight.significance * 100}%"></div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>Discovered Topics</h2>
      <div class="topic-grid">
        ${topics.slice(-12).reverse().map(topic => `
          <div class="topic-card">
            <div class="topic-query">${topic.query}</div>
            <div class="topic-stats">
              <span>${topic.articleCount} articles</span>
              <span>${topic.category}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="refresh-notice">
      Page auto-refreshes every 10 seconds | Current time: ${new Date().toLocaleTimeString()}
    </div>
  </div>
</body>
</html>`;
  }

  private getInsightColor(type: string): string {
    const colors: Record<string, string> = {
      trend: '#4f9eff',
      correlation: '#2dd4bf',
      anomaly: '#f59e0b',
      geographic: '#10b981',
      sentiment: '#8b5cf6',
    };
    return colors[type] || '#4f9eff';
  }
}

// ============================================================================
// Workflow Operators
// ============================================================================

function createDiscoverOperator(
  gdelt: GdeltClient,
  strategyAdapter: StrategyAdapter,
  insightStorage: InsightStorage
): WorkflowOperator {
  return new WorkflowOperator('discover', async (state: WorkflowState) => {
    console.log('\n🔍 DISCOVERING NEW TOPICS');

    const strategy = await strategyAdapter.loadStrategy(insightStorage);
    const query = strategyAdapter.getNextQuery(strategy);

    console.log(`  Exploring: "${query}"`);
    console.log(`  Strategy version: ${strategy.version}`);
    console.log(`  Depth level: ${strategy.depthLevel}`);

    try {
      // Get articles about this topic
      const response = await gdelt.getArticles(query, {
        timeSpan: strategy.timeWindow,
        maxRecords: 20,
      });

      const articles = response.data.articles || [];
      console.log(`  Found ${articles.length} articles`);

      // Create topic
      const topic: Topic = {
        id: `topic-${Date.now()}`,
        query,
        category: strategy.focusAreas[0] || 'general',
        firstSeen: Date.now(),
        lastUpdated: Date.now(),
        articleCount: articles.length,
        averageTone: 0,
        geographicReach: 0,
        insightPotential: articles.length > 10 ? 0.8 : 0.4,
      };

      const existingTopics = await insightStorage.getTopics();
      existingTopics.push(topic);

      // Keep last 50 topics
      if (existingTopics.length > 50) {
        existingTopics.shift();
      }

      await insightStorage.saveTopics(existingTopics);

      return {
        ...state,
        currentTopic: topic,
        articles,
        topics: existingTopics,
        strategy,
      };
    } catch (error) {
      console.error(`  ❌ Error discovering topic:`, error);
      return state;
    }
  });
}

function createAnalyzeOperator(gdelt: GdeltClient): WorkflowOperator {
  return new WorkflowOperator('analyze', async (state: WorkflowState) => {
    console.log('\n📊 ANALYZING DATA');

    const { currentTopic, articles } = state;
    if (!currentTopic || !articles || articles.length === 0) {
      console.log('  ⏭️  No data to analyze');
      return state;
    }

    console.log(`  Topic: ${currentTopic.query}`);

    try {
      // Analyze tone
      const tones = articles
        .map((a: any) => a.tone || 0)
        .filter((t: number) => !isNaN(t));
      const averageTone = tones.length > 0
        ? tones.reduce((a: number, b: number) => a + b, 0) / tones.length
        : 0;

      // Calculate geographic spread from article source countries
      const countries = new Set(
        articles
          .map((a: any) => a.sourcecountry)
          .filter((c: string) => c && c.length > 0)
      );

      const geographicSpread = Math.min(countries.size / 10, 1); // Normalize to 0-1 (10+ countries = 1.0)

      const geoData = {
        countries: Array.from(countries),
        regions: Array.from(countries).slice(0, 10), // Top countries for display
      };

      // Determine trend
      const temporalTrend = articles.length > 15 ? 'increasing' : 'stable';

      const analysis = {
        tone: averageTone,
        volume: articles.length,
        geographicSpread,
        temporalTrend,
      };

      console.log(`  Average tone: ${averageTone.toFixed(2)}`);
      console.log(`  Volume: ${articles.length} articles`);
      console.log(`  Geographic spread: ${(geographicSpread * 100).toFixed(0)}% (${countries.size} countries)`);
      console.log(`  Trend: ${temporalTrend}`);

      // Update topic
      currentTopic.averageTone = averageTone;
      currentTopic.geographicReach = geographicSpread;

      return {
        ...state,
        analysis,
        geoData,
        currentTopic,
      };
    } catch (error) {
      console.error(`  ❌ Error analyzing:`, error);
      return state;
    }
  });
}

function createGenerateOperator(
  insightGenerator: InsightGenerator,
  insightStorage: InsightStorage
): WorkflowOperator {
  return new WorkflowOperator('generate', async (state: WorkflowState) => {
    console.log('\n💡 GENERATING INSIGHTS');

    const newInsights = insightGenerator.generateInsights(state);

    console.log(`  Generated ${newInsights.length} insights`);

    // Save insights
    for (const insight of newInsights) {
      await insightStorage.saveInsight(insight);
      console.log(`  ✨ ${insight.type}: ${insight.title}`);
      console.log(`     Significance: ${(insight.significance * 100).toFixed(0)}%`);
    }

    const allInsights = await insightStorage.getAllInsights();

    return {
      ...state,
      insights: newInsights,
      totalInsights: allInsights.length,
    };
  });
}

function createAdaptOperator(
  strategyAdapter: StrategyAdapter,
  insightStorage: InsightStorage
): WorkflowOperator {
  return new WorkflowOperator('adapt', async (state: WorkflowState) => {
    const cycle = state.cycle || 0;

    // Only adapt every 5 cycles
    if (cycle % 5 !== 0 || cycle === 0) {
      console.log('\n⏭️  SKIPPING ADAPTATION (not needed yet)');
      return state;
    }

    console.log('\n🔄 ADAPTING STRATEGY');

    const allInsights = await insightStorage.getAllInsights();
    const allTopics = await insightStorage.getTopics();
    const currentStrategy = state.strategy!;

    console.log(`  Analyzing ${allInsights.length} insights from ${allTopics.length} topics`);

    const newStrategy = strategyAdapter.adaptStrategy(
      currentStrategy,
      allInsights,
      allTopics
    );

    await insightStorage.saveStrategy(newStrategy);

    console.log(`  Strategy updated: v${currentStrategy.version} → v${newStrategy.version}`);
    console.log(`  Focus areas: ${newStrategy.focusAreas.join(', ')}`);
    console.log(`  Depth level: ${newStrategy.depthLevel}`);
    console.log(`  Time window: ${newStrategy.timeWindow}`);

    return {
      ...state,
      strategy: newStrategy,
    };
  });
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('🚀 Autonomous Global Insights System\n');
  console.log('This system demonstrates:');
  console.log('- Autonomous topic discovery using GDELT');
  console.log('- Multi-source data analysis (articles, geo, TV)');
  console.log('- Intelligent insight generation');
  console.log('- Self-adapting exploration strategy');
  console.log('- Real-time insight viewing via HTTP\n');

  // Initialize services
  const gdelt = new GdeltClient();
  const insightStorage = new InsightStorage();
  const insightGenerator = new InsightGenerator();
  const strategyAdapter = new StrategyAdapter();
  const insightServer = new InsightServer(insightStorage, 3000);

  // Start HTTP server
  insightServer.start();

  // Create intent map
  const intentMap = new StaticIntentMap({
    'discover': 'discover',
    'analyze': 'analyze',
    'generate': 'generate',
    'adapt': 'adapt',
  });

  const manifold = new WorkflowFunctionManifold(intentMap);

  // Create operators
  const discoverOp = createDiscoverOperator(gdelt, strategyAdapter, insightStorage);
  const analyzeOp = createAnalyzeOperator(gdelt);
  const generateOp = createGenerateOperator(insightGenerator, insightStorage);
  const adaptOp = createAdaptOperator(strategyAdapter, insightStorage);

  // Create regions
  const discoverRegion = new ManifoldRegion('discover', [discoverOp]);
  const analyzeRegion = new ManifoldRegion('analyze', [analyzeOp]);
  const generateRegion = new ManifoldRegion('generate', [generateOp]);
  const adaptRegion = new ManifoldRegion('adapt', [adaptOp]);

  // Connect regions
  discoverRegion.connectTo(analyzeRegion);
  analyzeRegion.connectTo(generateRegion);
  generateRegion.connectTo(adaptRegion);

  // Add regions to manifold
  manifold.addRegion(discoverRegion);
  manifold.addRegion(analyzeRegion);
  manifold.addRegion(generateRegion);
  manifold.addRegion(adaptRegion);

  // Setup graceful shutdown
  let isRunning = true;
  process.on('SIGINT', () => {
    console.log('\n\n⏸️  Gracefully shutting down...\n');
    isRunning = false;
    insightServer.stop();
  });

  console.log('═'.repeat(70));
  console.log('Running continuous insight discovery...');
  console.log('View insights at: http://localhost:3000');
  console.log('Press Ctrl+C to stop');
  console.log('═'.repeat(70));

  const workflow = [
    { prompt: 'discover', description: 'Topic Discovery' },
    { prompt: 'analyze', description: 'Data Analysis' },
    { prompt: 'generate', description: 'Insight Generation' },
    { prompt: 'adapt', description: 'Strategy Adaptation' },
  ];

  let cycle = 0;

  while (isRunning) {
    cycle++;
    manifold.state = { ...manifold.state, cycle };

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`CYCLE ${cycle}`);
    console.log('═'.repeat(70));

    // Execute workflow steps
    for (const { prompt } of workflow) {
      if (!isRunning) break;
      await manifold.navigate(prompt);
      await manifold.executeWorkflow(prompt);
    }

    if (!isRunning) break;

    // Update server state
    insightServer.updateState(manifold.state as WorkflowState);

    // Show progress
    const totalInsights = await insightStorage.getAllInsights();
    const totalTopics = await insightStorage.getTopics();

    console.log(`\n📈 Progress:`);
    console.log(`  Cycles completed: ${cycle}`);
    console.log(`  Topics explored: ${totalTopics.length}`);
    console.log(`  Insights generated: ${totalInsights.length}`);
    console.log(`  View at: http://localhost:3000`);

    // Wait before next cycle (15 minutes)
    console.log(`\n⏳ Waiting 15 minutes before next cycle...\n`);
    await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000));
  }

  // Display final statistics
  console.log(`\n${'═'.repeat(70)}`);
  console.log('FINAL STATISTICS');
  console.log('═'.repeat(70));

  const finalInsights = await insightStorage.getAllInsights();
  const finalTopics = await insightStorage.getTopics();
  const finalStrategy = await insightStorage.getStrategy();

  console.log(`\n📊 Overall Performance:`);
  console.log(`  Total Cycles: ${cycle}`);
  console.log(`  Topics Explored: ${finalTopics.length}`);
  console.log(`  Insights Generated: ${finalInsights.length}`);

  if (finalInsights.length > 0) {
    const avgSignificance = finalInsights.reduce((sum, i) => sum + i.significance, 0) / finalInsights.length;
    console.log(`  Average Insight Significance: ${(avgSignificance * 100).toFixed(0)}%`);

    const insightTypes = finalInsights.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\n📋 Insight Types:`);
    for (const [type, count] of Object.entries(insightTypes)) {
      console.log(`  ${type}: ${count}`);
    }
  }

  if (finalStrategy) {
    console.log(`\n⚙️  Final Strategy (v${finalStrategy.version}):`);
    console.log(`  Focus Areas: ${finalStrategy.focusAreas.join(', ')}`);
    console.log(`  Depth Level: ${finalStrategy.depthLevel}`);
    console.log(`  Time Window: ${finalStrategy.timeWindow}`);
    console.log(`  Successful Queries: ${finalStrategy.successfulQueries.length}`);
  }

  console.log('\n✅ System shutdown complete!\n');
  console.log('💡 Key Features Demonstrated:');
  console.log('   ✓ Autonomous topic discovery and exploration');
  console.log('   ✓ Multi-source GDELT data integration');
  console.log('   ✓ Intelligent insight generation');
  console.log('   ✓ Self-adapting exploration strategy');
  console.log('   ✓ Persistent state and learning');
  console.log('   ✓ Real-time HTTP insight viewer');
  console.log('   ✓ Continuous operation with graceful shutdown\n');

  console.log('🔄 Run again to continue learning from where you left off!\n');

  process.exit(0);
}

// Run the system
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

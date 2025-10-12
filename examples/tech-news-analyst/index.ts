#!/usr/bin/env node

/**
 * Tech News Research Assistant
 *
 * A world-class example demonstrating the manifold-workflow-engine with:
 * - Real-world data from Hacker News API
 * - OpenAI-powered intent matching and analysis
 * - Multi-stage processing pipeline
 * - State management across stages
 * - Practical output generation
 */

import {
  WorkflowFunctionManifold,
  ManifoldRegion,
  WorkflowOperator,
} from 'manifold-workflow-engine';
import OpenAI from 'openai';
import { OpenAIIntentMap } from './openai-intent-map';

interface Article {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
  text?: string;
}

interface WorkflowState {
  articles?: Article[];
  filteredArticles?: Article[];
  analyzedArticles?: Array<Article & {
    sentiment?: string;
    category?: string;
    summary?: string;
    keyInsights?: string[];
  }>;
  report?: string;
  [key: string]: unknown;
}

// Hacker News API client
class HackerNewsAPI {
  private baseUrl = 'https://hacker-news.firebaseio.com/v0';

  async getTopStories(limit: number = 10): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/topstories.json`);
    const storyIds = await response.json();
    return storyIds.slice(0, limit);
  }

  async getItem(id: number): Promise<Article> {
    const response = await fetch(`${this.baseUrl}/item/${id}.json`);
    return await response.json();
  }

  async getTopArticles(limit: number = 10): Promise<Article[]> {
    const storyIds = await this.getTopStories(limit);
    const articles = await Promise.all(storyIds.map(id => this.getItem(id)));
    return articles.filter(article => article && article.title);
  }
}

// Analysis service using OpenAI
class ArticleAnalyzer {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async analyzeBatch(articles: Article[]): Promise<Array<Article & {
    sentiment: string;
    category: string;
    summary: string;
    keyInsights: string[];
  }>> {
    const analyzed = [];

    console.log(`  Analyzing ${articles.length} articles...`);
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      try {
        process.stdout.write(`  Progress: ${i + 1}/${articles.length}\r`);
        const analysis = await this.analyzeArticle(article);
        analyzed.push({ ...article, ...analysis });
      } catch (error) {
        console.error(`\n  Error analyzing article ${article.id}:`, error);
        analyzed.push({
          ...article,
          sentiment: 'neutral',
          category: 'uncategorized',
          summary: article.title,
          keyInsights: [],
        });
      }
    }
    console.log(`  Progress: ${articles.length}/${articles.length} ✓`);

    return analyzed;
  }

  private async analyzeArticle(article: Article): Promise<{
    sentiment: string;
    category: string;
    summary: string;
    keyInsights: string[];
  }> {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a tech news analyst. Analyze the given article and provide:
1. Sentiment (positive, neutral, negative, or mixed)
2. Category (AI/ML, Web Development, DevOps, Security, Hardware, Startup, or Other)
3. A concise summary (1-2 sentences)
4. Key insights (2-3 bullet points)

Respond in JSON format with keys: sentiment, category, summary, keyInsights (array)`,
        },
        {
          role: 'user',
          content: `Title: ${article.title}\nScore: ${article.score}\nComments: ${article.descendants || 0}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      sentiment: result.sentiment || 'neutral',
      category: result.category || 'Other',
      summary: result.summary || article.title,
      keyInsights: result.keyInsights || [],
    };
  }

  async generateReport(analyzedArticles: Array<Article & {
    sentiment: string;
    category: string;
    summary: string;
    keyInsights: string[];
  }>): Promise<string> {
    const categories = analyzedArticles.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sentiments = analyzedArticles.reduce((acc, a) => {
      acc[a.sentiment] = (acc[a.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let report = '# Tech News Analysis Report\n\n';
    report += `**Date**: ${new Date().toLocaleDateString()}\n`;
    report += `**Articles Analyzed**: ${analyzedArticles.length}\n\n`;

    report += '## Category Distribution\n';
    for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
      report += `- ${cat}: ${count}\n`;
    }

    report += '\n## Sentiment Analysis\n';
    for (const [sent, count] of Object.entries(sentiments)) {
      report += `- ${sent}: ${count}\n`;
    }

    report += '\n## Top Articles\n\n';
    analyzedArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .forEach((a, i) => {
        report += `### ${i + 1}. ${a.title}\n`;
        report += `**Score**: ${a.score} | **Category**: ${a.category} | **Sentiment**: ${a.sentiment}\n\n`;
        report += `${a.summary}\n\n`;
        if (a.keyInsights && a.keyInsights.length > 0) {
          report += '**Key Insights**:\n';
          a.keyInsights.forEach(insight => {
            report += `- ${insight}\n`;
          });
          report += '\n';
        }
      });

    return report;
  }
}

async function main() {
  // Validate environment
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable not set');
    process.exit(1);
  }

  console.log('🚀 Tech News Research Assistant\n');
  console.log('This example demonstrates:');
  console.log('- Real-time data from Hacker News API');
  console.log('- OpenAI-powered workflow navigation and analysis');
  console.log('- Multi-stage processing pipeline');
  console.log('- AI-driven content analysis\n');

  // Initialize services
  const hnAPI = new HackerNewsAPI();
  const analyzer = new ArticleAnalyzer(apiKey);

  // Define all available actions for intent mapping
  const availableActions = [
    'fetch',
    'validate',
    'filter',
    'analyze',
    'report',
  ];

  // Create OpenAI-powered intent map
  const intentMap = new OpenAIIntentMap(apiKey, availableActions);
  const manifold = new WorkflowFunctionManifold(intentMap as any);

  // ========================================
  // DEFINE WORKFLOW OPERATORS
  // ========================================

  // 1. Fetch operator
  const fetchOp = new WorkflowOperator('fetch', async (state: WorkflowState) => {
    console.log('📡 Fetching top stories from Hacker News...');
    const articles = await hnAPI.getTopArticles(5);
    console.log(`✓ Fetched ${articles.length} articles\n`);
    return { ...state, articles };
  });

  // 2. Validation operator
  const validateOp = new WorkflowOperator('validate', async (state: WorkflowState) => {
    console.log('📋 Validating articles...');
    const articles = state.articles || [];
    const validArticles = articles.filter(a => a.title && a.score >= 0);
    console.log(`✓ Validated ${validArticles.length}/${articles.length} articles\n`);
    return { ...state, articles: validArticles };
  });

  // 3. Filtering operator
  const filterOp = new WorkflowOperator('filter', async (state: WorkflowState) => {
    console.log('🔍 Filtering for high-quality articles...');
    const articles = state.articles || [];
    const filtered = articles.filter(a => a.score > 30 || (a.descendants && a.descendants > 10));
    console.log(`✓ Filtered to ${filtered.length} high-quality articles\n`);
    return { ...state, filteredArticles: filtered };
  });

  // 4. Analysis operator
  const analyzeOp = new WorkflowOperator('analyze', async (state: WorkflowState) => {
    console.log('🤖 Analyzing articles with AI...');
    const articles = state.filteredArticles || [];
    const analyzed = await analyzer.analyzeBatch(articles);
    console.log(`✓ Analyzed ${analyzed.length} articles\n`);
    return { ...state, analyzedArticles: analyzed };
  });

  // 5. Report generation operator
  const reportOp = new WorkflowOperator('report', async (state: WorkflowState) => {
    console.log('📊 Generating analysis report...');
    const analyzed = state.analyzedArticles || [];
    const report = await analyzer.generateReport(analyzed);
    console.log('✓ Report generated\n');
    return { ...state, report };
  });

  // ========================================
  // CREATE WORKFLOW REGIONS
  // ========================================

  const fetchRegion = new ManifoldRegion('fetch', [fetchOp]);
  const validateRegion = new ManifoldRegion('validate', [validateOp]);
  const filterRegion = new ManifoldRegion('filter', [filterOp]);
  const analyzeRegion = new ManifoldRegion('analyze', [analyzeOp]);
  const reportRegion = new ManifoldRegion('report', [reportOp]);

  // Connect regions to create pipeline
  fetchRegion.connectTo(validateRegion);
  validateRegion.connectTo(filterRegion);
  filterRegion.connectTo(analyzeRegion);
  analyzeRegion.connectTo(reportRegion);

  // Add regions to manifold
  manifold.addRegion(fetchRegion);
  manifold.addRegion(validateRegion);
  manifold.addRegion(filterRegion);
  manifold.addRegion(analyzeRegion);
  manifold.addRegion(reportRegion);

  // ========================================
  // EXECUTE WORKFLOW
  // ========================================
  console.log('🔄 Starting workflow execution...\n');
  console.log('=' .repeat(80) + '\n');

  const workflow = [
    { prompt: 'fetch the latest tech news from Hacker News', description: 'Data Acquisition' },
    { prompt: 'validate all the data', description: 'Data Validation' },
    { prompt: 'filter for quality content', description: 'Quality Filtering' },
    { prompt: 'analyze with AI', description: 'AI Analysis' },
    { prompt: 'generate the final report', description: 'Report Generation' },
  ];

  for (const { prompt, description } of workflow) {
    console.log(`▶ ${description}`);
    console.log(`  Intent: "${prompt}"`);

    // Try to navigate to the appropriate region (may fail if already there)
    await manifold.navigate(prompt);

    // Execute the operator in the current region
    const executed = await manifold.executeWorkflow(prompt);
    if (!executed) {
      console.log('  ⚠ Execution failed\n');
      continue;
    }
  }

  // ========================================
  // SAVE ARTIFACTS
  // ========================================
  const finalState = manifold.state as WorkflowState;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const outputDir = './output';

  // Create output directory if it doesn't exist
  try {
    await Bun.write(`${outputDir}/.gitkeep`, '');
  } catch {
    // Directory already exists
  }

  // Save the markdown report
  if (finalState.report) {
    const reportPath = `${outputDir}/report-${timestamp}.md`;
    await Bun.write(reportPath, finalState.report);
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }

  // Save the analyzed data as JSON
  if (finalState.analyzedArticles) {
    const dataPath = `${outputDir}/data-${timestamp}.json`;
    await Bun.write(dataPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      statistics: {
        totalFetched: finalState.articles?.length || 0,
        highQuality: finalState.filteredArticles?.length || 0,
        analyzed: finalState.analyzedArticles.length,
      },
      articles: finalState.analyzedArticles,
    }, null, 2));
    console.log(`📊 Data saved to: ${dataPath}`);
  }

  // ========================================
  // DISPLAY RESULTS
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('RESULTS');
  console.log('='.repeat(80) + '\n');

  if (finalState.report) {
    console.log(finalState.report);
    console.log('='.repeat(80) + '\n');
  }

  if (finalState.analyzedArticles && finalState.analyzedArticles.length > 0) {
    console.log('📈 Summary Statistics:');
    console.log(`- Total articles fetched: ${finalState.articles?.length || 0}`);
    console.log(`- High-quality articles: ${finalState.filteredArticles?.length || 0}`);
    console.log(`- Articles analyzed: ${finalState.analyzedArticles.length}`);

    const categories = finalState.analyzedArticles.reduce((acc, a) => {
      acc[a.category || 'Other'] = (acc[a.category || 'Other'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🏷️  Top Categories:');
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count} articles`);
      });
  }

  console.log('\n✅ Workflow completed successfully!\n');
  console.log('💡 Key Features Demonstrated:');
  console.log('   ✓ OpenAI-powered intent matching for workflow navigation');
  console.log('   ✓ Real-world data integration (Hacker News API)');
  console.log('   ✓ Multi-stage processing pipeline with state management');
  console.log('   ✓ AI-driven content analysis and report generation');
  console.log('   ✓ Natural language workflow control');
  console.log('   ✓ Artifact generation (markdown reports + JSON data)\n');
}

// Run the example
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

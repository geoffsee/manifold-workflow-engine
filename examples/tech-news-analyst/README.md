# Tech News Research Assistant

A world-class example demonstrating the power of `manifold-workflow-engine` with real-world AI integration.

## Overview

This example showcases an AI-powered tech news research assistant that:

- **Fetches real-time data** from the Hacker News API
- **Uses OpenAI** for intelligent workflow navigation and content analysis
- **Multi-stage processing pipeline** with validation, filtering, and AI analysis
- **Generates practical artifacts** including markdown reports and JSON data exports
- **Shows state management** across multiple workflow stages
- **Timestamped output** for tracking analysis over time

## Features

### 1. OpenAI-Powered Intent Matching

Instead of simple keyword matching, this example uses GPT-4 to intelligently map natural language prompts to workflow actions:

```typescript
// Natural language prompts automatically map to the right workflow regions
"fetch the latest tech news" → fetch-data region
"make sure the data is valid" → validation region
"analyze the sentiment" → sentiment-analysis region
```

### 2. Real-World Data Integration

Fetches live data from Hacker News API:
- Top stories
- Article scores and comments
- Metadata for analysis

### 3. Nested Workflow Architecture

```
Main Workflow
├── Data Acquisition (fetch-data)
├── Preprocessing (nested)
│   ├── Validation
│   └── Filtering
├── Analysis (nested)
│   └── AI Analysis (sentiment, categorization, summarization)
├── Newsletter Generation
└── Report Generation
```

### 4. AI-Driven Analysis

Uses OpenAI to:
- Analyze sentiment (positive, neutral, negative, mixed)
- Categorize articles by topic
- Generate concise summaries
- Extract key insights
- Create formatted newsletters and reports

## Prerequisites

- Node.js >= 18
- An OpenAI API key

## Installation

```bash
# Navigate to the example directory
cd examples/tech-news-analyst

# Install dependencies
bun install
```

## Configuration

Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY='your-api-key-here'
```

Or create a `.env` file:

```
OPENAI_API_KEY=your-api-key-here
```

## Usage

Run the example:

```bash
bun start
```

Or run directly:

```bash
bun index.ts
```

### Expected Output

The workflow will:

1. **Fetch** the top 5 stories from Hacker News
2. **Validate** article data quality
3. **Filter** for high-quality articles (score > 30 or > 10 comments)
4. **Analyze** using AI:
   - Sentiment analysis
   - Category classification
   - Summary generation
   - Key insights extraction
5. **Generate** a comprehensive research report
6. **Save artifacts** to the `output/` directory:
   - `report-{timestamp}.md` - Formatted markdown report
   - `data-{timestamp}.json` - Complete analyzed data in JSON format

### Example Output

```
🚀 Tech News Research Assistant

This example demonstrates:
- Real-time data from Hacker News API
- OpenAI-powered workflow navigation
- Nested workflows for complex processing
- AI-driven content analysis

🔄 Starting workflow execution...

▶ Data Acquisition
  Prompt: "fetch the latest tech news"
📡 Fetching top stories from Hacker News...
✓ Fetched 15 articles

▶ Preprocessing: Validation
  Prompt: "validate the data quality"
📋 Validating articles...
✓ Validated 15/15 articles

▶ Preprocessing: Filtering
  Prompt: "filter for high-quality articles"
🔍 Filtering articles by quality...
✓ Filtered to 8 high-quality articles

▶ AI Analysis
  Prompt: "analyze sentiment and categorize"
🤖 Analyzing articles with AI...
✓ Analyzed 8 articles

▶ Report Generation
  Prompt: "create a research report"
📊 Generating analysis report...
✓ Report generated

================================================================================
RESULTS
================================================================================

# Tech News Analysis Report

**Date**: 10/12/2025
**Articles Analyzed**: 8

## Category Distribution
- AI/ML: 3
- Web Development: 2
- Security: 2
- Hardware: 1

## Sentiment Analysis
- positive: 5
- neutral: 2
- mixed: 1

## Top Articles
[Detailed article analysis with summaries and key insights...]

📄 Report saved to: ./output/report-2025-10-12T23-43-08.md
📊 Data saved to: ./output/data-2025-10-12T23-43-08.json

✅ Workflow completed successfully!
```

### Output Artifacts

Each run generates timestamped artifacts in the `output/` directory:

#### Markdown Report (`report-{timestamp}.md`)
- Professional formatted analysis report
- Category distribution and sentiment analysis
- Top articles with summaries and key insights
- Ready to share or publish

#### JSON Data (`data-{timestamp}.json`)
```json
{
  "timestamp": "2025-10-12T23:43:08.208Z",
  "statistics": {
    "totalFetched": 5,
    "highQuality": 5,
    "analyzed": 5
  },
  "articles": [
    {
      "title": "...",
      "score": 290,
      "sentiment": "neutral",
      "category": "Other",
      "summary": "...",
      "keyInsights": ["..."]
    }
  ]
}
```

## Architecture Deep Dive

### OpenAI Intent Map

The `OpenAIIntentMap` class replaces the dummy intent matcher with intelligent GPT-4 powered matching:

```typescript
const intentMap = new OpenAIIntentMap(apiKey, [
  'fetch-data',
  'validation',
  'filtering',
  'sentiment-analysis',
  'categorization',
  'summarization',
  'generate-newsletter',
  'generate-report',
]);

// Intelligently matches prompts to actions
const result = await intentMap.query('get me the latest news');
// → { action: 'fetch-data', confidence: 0.95 }
```

### Workflow Regions

#### 1. Data Acquisition Region
```typescript
const fetchDataOp = new WorkflowOperator('fetch-data', async (state) => {
  const articles = await hnAPI.getTopArticles(15);
  return { ...state, articles };
});
```

#### 2. Preprocessing Region (Nested)
```typescript
const preprocessManifold = new WorkflowFunctionManifold(preprocessIntentMap);
// Contains validation and filtering operators
const preprocessRegion = new NestedManifoldRegion('preprocessing', preprocessManifold);
```

#### 3. Analysis Region (Nested)
```typescript
const analysisManifold = new WorkflowFunctionManifold(analysisIntentMap);
// Contains AI-powered analysis operators
const analysisRegion = new NestedManifoldRegion('analysis', analysisManifold);
```

#### 4. Output Regions
```typescript
const newsletterOp = new WorkflowOperator('generate-newsletter', async (state) => {
  const newsletter = await analyzer.generateNewsletter(state.analyzedArticles);
  return { ...state, newsletter };
});

const reportOp = new WorkflowOperator('generate-report', async (state) => {
  const report = await analyzer.generateReport(state.analyzedArticles);
  return { ...state, report };
});
```

### State Management

State flows through the entire workflow, accumulating data at each stage:

```typescript
interface WorkflowState {
  articles?: Article[];              // Raw fetched articles
  filteredArticles?: Article[];      // Filtered high-quality articles
  analyzedArticles?: Array<...>;     // AI-analyzed articles
  report?: string;                   // Generated report
  newsletter?: string;               // Generated newsletter
}
```

## Customization

### Add Custom Analysis

```typescript
const customAnalysisOp = new WorkflowOperator('custom-analysis', async (state) => {
  // Your custom analysis logic
  const results = await myCustomAnalysis(state.filteredArticles);
  return { ...state, customResults: results };
});
```

### Use Different Data Sources

Replace the `HackerNewsAPI` with any other data source:

```typescript
class GitHubTrendingAPI {
  async getTrendingRepos(): Promise<Repository[]> {
    // Fetch from GitHub API
  }
}
```

### Modify Workflow Prompts

The workflow uses natural language prompts that are intelligently matched:

```typescript
const workflow = [
  { prompt: 'grab the latest articles' },      // Will match fetch-data
  { prompt: 'ensure quality' },                 // Will match validation
  { prompt: 'perform sentiment analysis' },     // Will match sentiment-analysis
];
```

## Key Concepts Demonstrated

1. **LLM-Driven Navigation**: Uses AI to match natural language to workflow actions
2. **Nested Workflows**: Complex processing pipelines with hierarchical structure
3. **State Propagation**: Data flows seamlessly through all stages
4. **Real-World Integration**: Practical example with actual APIs
5. **Error Handling**: Robust error handling throughout the pipeline
6. **Extensibility**: Easy to add new operators and analysis types

## Performance Considerations

- **Batch Processing**: Articles are analyzed in batches to optimize API usage
- **Caching**: Consider adding caching for repeated analyses
- **Rate Limiting**: Be mindful of API rate limits (both Hacker News and OpenAI)
- **Parallel Processing**: Could be enhanced with Promise.all for parallel operations

## Troubleshooting

### OpenAI API Errors

If you encounter OpenAI API errors:
- Verify your API key is set correctly
- Check your OpenAI account has credits
- Review rate limits for your API tier

### Hacker News API Rate Limiting

The Hacker News API is generally permissive, but:
- Limit concurrent requests
- Add delays between requests if needed
- Cache results for development

### Intent Matching Issues

If prompts aren't matching correctly:
- Add more specific action names to `availableActions`
- Use more descriptive prompts
- Check the confidence scores returned by the intent matcher

## Next Steps

Extend this example with:

1. **More Data Sources**: GitHub, Reddit, Twitter/X, RSS feeds
2. **Advanced Analysis**: Topic modeling, trend detection, entity extraction
3. **Persistence**: Save results to a database
4. **Scheduling**: Run periodically with cron jobs
5. **Web Interface**: Build a frontend to visualize results
6. **Email Integration**: Automatically send newsletters
7. **Custom Filters**: User-defined filtering criteria
8. **Multi-language Support**: Analyze content in multiple languages

## Related Examples

- [Basic Workflow](../basic-workflow) - Simple workflow without AI
- [Custom Intent Matching](../custom-intent) - Different intent matching strategies
- [Database Integration](../database-workflow) - Workflows with persistence

## License

This example is part of the manifold-workflow-engine project and follows the same AGPL-3.0-or-later license.

## Support

For questions or issues:
- Check the [main documentation](../../README.md)
- Open an issue on [GitHub](https://github.com/seemueller-io/manifold-workflow-engine/issues)
- Review the [OpenAI API documentation](https://platform.openai.com/docs)

---

**Happy Building!** 🚀

This example demonstrates the power of combining workflow engines with LLMs for intelligent, adaptive processing pipelines. Use it as a foundation to build your own AI-powered workflows!

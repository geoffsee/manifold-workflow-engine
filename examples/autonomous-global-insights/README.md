# Autonomous Global Insights

A continuously running AI system that autonomously discovers and analyzes global events, generating valuable insights through intelligent data exploration and cross-analysis.

## Overview

This example demonstrates an advanced autonomous workflow that:

1. **Learns About the World** - Discovers current events and trending topics using GDELT's comprehensive global news database
2. **Deep Analysis** - Analyzes discovered topics across multiple dimensions (sentiment, geography, temporal trends)
3. **Generates Insights** - Synthesizes findings into actionable insights with significance scoring
4. **Adapts Strategy** - Learns which exploration strategies yield the best insights and evolves accordingly
5. **Real-time Viewing** - Provides a live web interface to view insights as they're generated

## Key Features

### Autonomous Discovery
- Explores topics based on adaptive strategy
- Uses GDELT DOC, GEO, and TV APIs for comprehensive coverage
- Learns which topics and areas yield valuable insights

### Multi-dimensional Analysis
- **Sentiment Analysis**: Tracks tone and emotional framing
- **Geographic Reach**: Identifies global vs. regional stories
- **Temporal Trends**: Detects accelerating or declining coverage
- **Volume Analysis**: Measures attention and significance

### Intelligent Insight Generation
- Identifies emerging trends before they peak
- Detects sentiment anomalies and emotional coverage
- Highlights globally significant events
- Scores insights by novelty and significance

### Self-Adapting Strategy
- Learns from successful discoveries
- Expands focus to productive areas
- Adjusts search depth and time windows
- Persists learned strategies across sessions

### Real-time Web Interface
- Beautiful, modern UI for viewing insights
- Live statistics and progress tracking
- Auto-refreshing insight feed
- Topic exploration history

## Architecture

### Workflow Phases

```
┌─────────────┐
│  DISCOVER   │ ← Autonomous topic exploration
└──────┬──────┘
       │
┌──────▼──────┐
│   ANALYZE   │ ← Multi-source data analysis
└──────┬──────┘
       │
┌──────▼──────┐
│  GENERATE   │ ← Insight synthesis
└──────┬──────┘
       │
┌──────▼──────┐
│    ADAPT    │ ← Strategy evolution
└─────────────┘
```

### Components

**InsightStorage**
- Persists insights, topics, and strategy
- Manages historical data
- Enables learning across sessions

**InsightGenerator**
- Analyzes data for patterns
- Creates typed insights (trend, sentiment, geographic, etc.)
- Calculates significance scores

**StrategyAdapter**
- Evaluates insight success rates
- Adjusts focus areas and depth
- Maintains successful query patterns
- Evolves exploration strategy

**InsightServer**
- Bun-based HTTP server
- Real-time insight display
- RESTful API endpoints
- Auto-refreshing UI

**GdeltClient**
- Comprehensive GDELT API integration
- DOC API for articles and trends
- GEO API for geographic data
- TV API for broadcast coverage

## Installation

```bash
cd examples/autonomous-global-insights
bun install
```

## Usage

### Start the System

```bash
bun start
```

The system will:
1. Initialize with a default exploration strategy
2. Start the HTTP server on http://localhost:3000
3. Begin continuous discovery and insight generation
4. Display progress in the terminal

### View Insights

Open your browser to:
```
http://localhost:3000
```

You'll see:
- Real-time statistics (cycles, topics, insights)
- Recent insights with significance scores
- Discovered topics and their metrics
- Current exploration status

The page auto-refreshes every 10 seconds.

### Stop the System

Press `Ctrl+C` to gracefully shutdown. The system will:
- Save all discovered topics and insights
- Persist the learned strategy
- Display final statistics
- Shutdown the HTTP server

### Continue Learning

Run the system again to continue from where you left off. The system will:
- Load previous insights and topics
- Resume with the learned strategy
- Build on previous discoveries

## API Endpoints

The HTTP server exposes these endpoints:

- `GET /` - Main insight viewer UI
- `GET /api/insights` - JSON array of all insights
- `GET /api/topics` - JSON array of discovered topics
- `GET /api/status` - Current system status

Example:
```bash
curl http://localhost:3000/api/insights | jq '.'
```

## Configuration

### Default Strategy

The system starts with these focus areas:
- Technology
- Politics
- Climate
- Economy
- Health

As it learns, it adapts to include:
- Areas generating high-value insights
- Successful query patterns
- Optimal time windows and depth levels

### Customization

You can customize the initial strategy by modifying `StrategyAdapter.DEFAULT_STRATEGY` in `index.ts`:

```typescript
private readonly DEFAULT_STRATEGY: ExplorationStrategy = {
  focusAreas: ['your', 'custom', 'topics'],
  exploredTopics: new Set(),
  successfulQueries: [],
  timeWindow: '24h', // or '3d', '7d'
  depthLevel: 1,     // 1-3
  version: 1,
};
```

## Insight Types

The system generates five types of insights:

### 1. Trend Insights
- Detects high-volume coverage
- Identifies accelerating topics
- Highlights emerging stories

### 2. Sentiment Insights
- Identifies strong emotional coverage
- Tracks positive/negative framing
- Detects sentiment extremes

### 3. Geographic Insights
- Highlights globally significant events
- Measures international reach
- Identifies cross-border stories

### 4. Correlation Insights
- Finds relationships between topics
- Identifies connected events
- Discovers causal patterns

### 5. Anomaly Insights
- Detects unusual patterns
- Identifies unexpected developments
- Highlights significant changes

## Adaptation Logic

The system adapts every 5 cycles by:

1. **Analyzing Success**
   - Which topics yielded valuable insights?
   - Which focus areas are most productive?
   - What query patterns work best?

2. **Updating Strategy**
   - Expand focus to successful areas
   - Increase depth for rich topics
   - Track high-performing queries

3. **Evolving Over Time**
   - Version tracking for strategy evolution
   - Persistent learning across sessions
   - Continuous optimization

## Data Flow

```
GDELT APIs → Discovery → Topics
                ↓
        Articles + Geo + TV
                ↓
           Analysis
                ↓
    Insights (with significance)
                ↓
         Storage + Display
                ↓
        Strategy Adaptation
```

## Storage Structure

Data is persisted in `.storage/`:

- `insights:all` - All generated insights
- `topics:discovered` - All explored topics
- `strategy:current` - Current exploration strategy

## Example Output

### Terminal
```
═══════════════════════════════════════════════════════════════
CYCLE 12
═══════════════════════════════════════════════════════════════

🔍 DISCOVERING NEW TOPICS
  Exploring: "artificial intelligence"
  Strategy version: 3
  Depth level: 2
  Found 18 articles

📊 ANALYZING DATA
  Topic: artificial intelligence
  Average tone: 2.45
  Volume: 18 articles
  Geographic spread: 65%
  Trend: stable

💡 GENERATING INSIGHTS
  Generated 2 insights
  ✨ trend: Emerging Trend: artificial intelligence
     Significance: 72%
  ✨ geographic: Global Attention on artificial intelligence
     Significance: 65%

📈 Progress:
  Cycles completed: 12
  Topics explored: 23
  Insights generated: 34
  View at: http://localhost:3000
```

### Web Interface
Beautiful, modern dashboard showing:
- Live cycle count
- Topics explored
- Insights generated
- Current topic being analyzed
- Recent insights with significance bars
- Topic discovery history

## Advanced Features

### Significance Scoring
Each insight receives a 0-1 significance score based on:
- Coverage volume (40% weight)
- Sentiment strength (30% weight)
- Geographic reach (30% weight)

### Smart Exploration
The system balances:
- **Exploitation**: 50% of queries use proven successful patterns
- **Exploration**: 50% of queries try new focus areas

### Persistent Learning
All discoveries persist across runs:
- Topics and their metrics
- Generated insights
- Learned strategy
- Successful patterns

## Use Cases

### 1. Media Monitoring
Track emerging stories and sentiment shifts across global media

### 2. Trend Detection
Identify accelerating topics before they peak

### 3. Geographic Intelligence
Understand which stories have global vs. regional significance

### 4. Sentiment Analysis
Monitor emotional framing and opinion trends

### 5. Research Assistant
Continuous discovery of developments in focus areas

## Technical Highlights

### Manifold Workflow Engine
- Four-phase workflow with region connections
- State management across phases
- Intent-based navigation
- Graceful shutdown handling

### GDELT Integration
- DOC API for article discovery
- GEO API for geographic analysis
- TV API for broadcast coverage
- Comprehensive query building

### Storage & Persistence
- Local file-based storage
- JSON serialization
- Historical tracking
- Cross-session learning

### HTTP Server
- Bun-native server
- Real-time updates
- RESTful API
- Modern, responsive UI

## Performance

- **Cycle Time**: ~10-15 seconds per complete workflow cycle
- **API Calls**: 2-3 GDELT requests per cycle
- **Storage**: Minimal (JSON files, ~1MB per 1000 insights)
- **Memory**: Low footprint (~50MB typical)

## Troubleshooting

### No Insights Generated
- Check internet connection (GDELT requires external access)
- Verify GDELT APIs are accessible
- Wait a few cycles - some topics may not yield insights

### Server Won't Start
- Check port 3000 is available
- Try changing port in `InsightServer` constructor
- Verify Bun is installed correctly

### Strategy Not Adapting
- Adaptation occurs every 5 cycles
- Requires sufficient insights to learn from
- Check `.storage/strategy:current` for current version

## Future Enhancements

Potential additions:
- OpenAI integration for deeper analysis
- Topic correlation detection
- Insight quality scoring
- Email/webhook notifications
- Custom dashboard widgets
- Export to various formats
- Multi-language support
- Historical trend visualization

## Learn More

- [GDELT Project](https://www.gdeltproject.org/)
- [GDELT DOC API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)
- [Manifold Workflow Engine](../../README.md)
- [Bun HTTP Server](https://bun.sh/docs/api/http)

## License

Same as parent project.

# GDELT API Client

A comprehensive TypeScript client for the GDELT 2.0 APIs, supporting DOC, GEO, and TV endpoints.

## Overview

GDELT (Global Database of Events, Language, and Tone) is the largest open database of human society. This client provides a type-safe, easy-to-use interface for:

- **DOC API**: Full-text search across 65 languages (3-month rolling window)
- **GEO API**: Geographic mapping of keywords (7-day window)
- **TV API**: Television news search and analysis (since July 2, 2009)

## Features

- ✅ Full TypeScript support with comprehensive type definitions
- ✅ All DOC API modes (articles, timelines, tone analysis, etc.)
- ✅ GEO API for geographic analysis
- ✅ TV API for television news monitoring
- ✅ Query builder for complex searches
- ✅ Multiple output formats (JSON, CSV, HTML, RSS, JSONFeed)
- ✅ Error handling with detailed messages
- ✅ Date/time formatting utilities
- ✅ Zero dependencies (uses native fetch)

## Installation

The client is a single file with no external dependencies:

```typescript
import { createGdeltClient, createQuery } from './gdelt-client';
```

## Quick Start

```typescript
import { createGdeltClient } from './gdelt-client';

// Create a client
const client = createGdeltClient({
  defaultFormat: 'json',
  defaultMaxRecords: 10,
});

// Search for articles
const articles = await client.getArticles('climate change', {
  timeSpan: '24h',
  maxRecords: 5,
});

console.log(articles.data);
```

## API Methods

### DOC API

#### Article Search

```typescript
// Simple article search
const result = await client.getArticles('artificial intelligence', {
  timeSpan: '7d',
  maxRecords: 10,
});

// Advanced search with filters
const result = await client.searchDoc({
  query: 'renewable energy',
  mode: 'ArtList',
  timeSpan: '24h',
  sourceLang: 'english',
  domain: 'nytimes.com',
  tone: '>5',  // Positive articles only
});
```

#### Timeline Analysis

```typescript
// Volume timeline
const timeline = await client.getTimeline('pandemic', {
  timeSpan: '30d',
});

// Tone timeline
const toneTimeline = await client.getToneTimeline('stock market', {
  timeSpan: '7d',
});
```

#### Image Search

```typescript
// Image collage from articles
const images = await client.getImageCollage('space exploration', {
  timeSpan: '24h',
  imageTag: 'rocket',
});
```

### Query Builder

Build complex queries with the fluent API:

```typescript
import { createQuery } from './gdelt-client';

const query = createQuery()
  .phrase('electric vehicles')
  .or('Tesla', 'Ford', 'GM', 'Rivian')
  .exclude('accident')
  .domain('reuters.com')
  .tone('>3')
  .build();

const result = await client.getArticles(query, {
  timeSpan: '24h',
});
```

### GEO API

```typescript
// Geographic point data
const points = await client.getGeoPoints('earthquake', {
  timeSpan: '7d',
  sourceCountry: 'US',
});

// Geographic heatmap
const heatmap = await client.getGeoHeatmap('election', {
  timeSpan: '7d',
  format: 'html',  // Returns interactive HTML map
});
```

### TV API

```typescript
// Search TV clips
const clips = await client.getTvClips('congress', {
  timeSpan: '24h',
  network: 'CNN',
  market: 'National',
});

// TV station chart
const stations = await client.getTvStationChart('climate change', {
  timeSpan: '7d',
});
```

## Query Parameters

### Common Parameters

- `query` (required): Search query with support for operators
- `format`: Output format (`json`, `csv`, `html`, `rss`, `jsonfeed`)
- `maxRecords`: Maximum results (default: 250)
- `timeSpan`: Time range (e.g., `24h`, `7d`, `3M`)

### DOC API Parameters

- `mode`: Output mode (see Modes section)
- `startDateTime` / `endDateTime`: Precise date range (YYYYMMDDHHMMSS)
- `sourceLang`: Language filter (ISO 639 code)
- `sourceCountry`: Country filter (FIPS 2-letter code)
- `domain`: Domain filter (partial match)
- `domainExact`: Domain filter (exact match)
- `theme`: GDELT theme (e.g., `TERROR`, `ECON_STOCKMARKET`)
- `tone`: Tone filter (e.g., `>5`, `<-5`)
- `imageTag`: Image analysis tag
- `sort`: Sort order (`DateDesc`, `ToneAsc`, etc.)

### TV API Parameters

- `market`: Geographic market (e.g., `National`, `Boston`)
- `network`: Network filter (e.g., `CNN`, `FOXNEWS`, `BBCNEWS`)
- `show`: Show name filter
- `station`: Station call letters

## Output Modes

### DOC API Modes

- `ArtList`: Article list with URLs, dates, titles
- `ArtGallery`: Visual gallery with images
- `TimelineVol`: Coverage volume timeline
- `TimelineVolInfo`: Timeline with article counts
- `TimelineTone`: Average tone timeline
- `TimelineLang`: Timeline by language
- `TimelineSourceCountry`: Timeline by source country
- `ImageCollage`: Image collage
- `ImageCollageInfo`: Image collage with metadata

### GEO API Modes

- `PointData`: Raw geographic points
- `Heatmap`: Geographic heatmap
- `SourceCountry`: Map by source country

### TV API Modes

- `ClipGallery`: Gallery of video clips
- `TimelineVol`: Coverage volume timeline
- `TimelineVolHeatmap`: Hourly airtime trends
- `TimelineVolStream`: Streamgraph timeline
- `StationChart`: Chart by station
- `ShowChart`: Chart by show
- `TrendingTopics`: Most common topics
- `WordCloud`: Word cloud visualization

## Query Operators

### Boolean Operators

```typescript
// OR operator
'(climate OR weather OR temperature)'

// Exact phrase
'"climate change"'

// Exclusion
'-denial'
```

### Filter Operators

```typescript
// Language
'sourcelang:spanish'

// Country
'sourcecountry:US'

// Domain
'domain:nytimes.com'

// Theme
'theme:ECON_STOCKMARKET'

// Image tag
'imagetag:protest'

// Tone
'tone>5'  // Positive
'tone<-5' // Negative
```

## Utility Methods

### Date Formatting

```typescript
const date = new Date('2025-10-12T15:30:00Z');
const formatted = client.formatDateTime(date);
// Returns: "20251012153000"
```

### Timespan Creation

```typescript
client.createTimespan(3, 'd');   // "3d"
client.createTimespan(24, 'h');  // "24h"
client.createTimespan(7, 'w');   // "7w"
```

### URL Generation

```typescript
// Get the URL that would be used (for debugging)
const url = client.getDocUrl({
  query: 'test',
  mode: 'ArtList',
  timeSpan: '24h',
});
console.log(url);
```

## Error Handling

```typescript
try {
  const result = await client.getArticles('query', {
    timeSpan: '24h',
  });
} catch (error) {
  if ('statusCode' in error) {
    console.error(`API Error (${error.statusCode}):`, error.message);
  } else {
    console.error('Request failed:', error);
  }
}
```

## Output Formats

### JSON (Recommended)

```typescript
const result = await client.getArticles('query', {
  format: 'json',
});
// result.data is a parsed JavaScript object
```

### CSV

```typescript
const result = await client.getArticles('query', {
  format: 'csv',
});
// result.data is a CSV string
```

### HTML

```typescript
const result = await client.searchDoc({
  query: 'query',
  mode: 'ImageCollage',
  format: 'html',
});
// result.data is an HTML string with interactive visualization
```

## Response Format

All methods return a `GdeltResponse` object:

```typescript
interface GdeltResponse<T = any> {
  data: T;              // Parsed response data
  rawResponse: Response; // Original fetch Response
  format: OutputFormat;  // Format used
}
```

## Running Examples

### Demo Script

```bash
bun gdelt-demo.ts
```

Shows 9 practical examples covering:
- Basic article search
- Timeline analysis
- Tone analysis
- Advanced query building
- Domain filtering
- Multi-language search
- CSV export
- Date range queries
- Theme-based search

### Test Suite

```bash
bun gdelt-test.ts
```

Comprehensive test coverage including:
- All DOC API modes
- GEO API functionality
- TV API functionality
- Query builder
- Utility methods
- Error handling

## API Limits & Notes

- **DOC API**: 3-month rolling window, searches 65 languages
- **GEO API**: 7-day window
- **TV API**: Data since July 2, 2009
- **Rate Limits**: No explicit rate limits documented
- **Max Records**: Up to 250 results per request
- **Default Timespan**: 24 hours if not specified

## Common Themes

GDELT provides pre-classified themes for filtering:

- `TERROR` - Terrorism-related
- `ECON_STOCKMARKET` - Stock market
- `ENV_CLIMATE` - Climate/environment
- `HEALTH` - Health-related
- `SCIENCE` - Science & technology
- Many more available in GDELT documentation

## Advanced Usage

### Custom Date Ranges

```typescript
const endDate = new Date();
const startDate = new Date(endDate.getTime() - 48 * 60 * 60 * 1000);

const result = await client.searchDoc({
  query: 'technology',
  startDateTime: client.formatDateTime(startDate),
  endDateTime: client.formatDateTime(endDate),
  mode: 'ArtList',
});
```

### Complex Query Building

```typescript
const query = createQuery()
  .phrase('machine learning')
  .or('neural networks', 'deep learning', 'AI')
  .exclude('cryptocurrency')
  .exclude('bitcoin')
  .domain('arxiv.org')
  .theme('SCIENCE')
  .tone('>3')
  .build();
```

### Multi-format Export

```typescript
// Get JSON for processing
const jsonResult = await client.getArticles('query', {
  format: 'json',
  maxRecords: 100,
});

// Get CSV for spreadsheets
const csvResult = await client.getArticles('query', {
  format: 'csv',
  maxRecords: 100,
});

// Save to file
await Bun.write('export.csv', csvResult.data);
```

## Resources

- [GDELT Project](https://www.gdeltproject.org/)
- [DOC API Documentation](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)
- [GEO API Documentation](https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/)
- [TV API Documentation](https://blog.gdeltproject.org/gdelt-2-0-television-api-debuts/)

## License

This client is provided as-is for use with the GDELT Project APIs.

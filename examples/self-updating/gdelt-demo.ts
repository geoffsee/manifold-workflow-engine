/**
 * Demo script showcasing the GDELT Client capabilities
 */

import { createGdeltClient, createQuery } from './gdelt-client';

async function main() {
  console.log('================================================================================');
  console.log('GDELT API Client Demo');
  console.log('================================================================================\n');

  const client = createGdeltClient({
    defaultFormat: 'json',
    defaultMaxRecords: 5,
  });

  // ============================================================================
  // Example 1: Basic Article Search
  // ============================================================================
  console.log('Example 1: Searching for articles about "climate change"');
  console.log('-'.repeat(80));

  try {
    const result = await client.getArticles('climate change', {
      timeSpan: '24h',
      maxRecords: 3,
    });

    console.log(`Found ${result.data.articles?.length || 0} articles\n`);

    if (result.data.articles && result.data.articles.length > 0) {
      result.data.articles.forEach((article: any, idx: number) => {
        console.log(`${idx + 1}. ${article.title}`);
        console.log(`   URL: ${article.url}`);
        console.log(`   Language: ${article.language || 'N/A'}`);
        console.log(`   Source Country: ${article.sourcecountry || 'N/A'}`);
        console.log();
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // ============================================================================
  // Example 2: Timeline Analysis
  // ============================================================================
  console.log('\nExample 2: Coverage timeline for "artificial intelligence"');
  console.log('-'.repeat(80));

  try {
    const result = await client.getTimeline('artificial intelligence', {
      timeSpan: '3d',
    });

    const timeline = result.data.timeline?.[0]?.data;
    if (timeline && timeline.length > 0) {
      console.log(`\nShowing ${Math.min(5, timeline.length)} data points from timeline:\n`);
      timeline.slice(0, 5).forEach((point: any) => {
        console.log(`${point.date}: ${point.value}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // ============================================================================
  // Example 3: Tone Analysis
  // ============================================================================
  console.log('\n\nExample 3: Tone analysis for "stock market"');
  console.log('-'.repeat(80));

  try {
    const result = await client.getToneTimeline('stock market', {
      timeSpan: '24h',
    });

    const timeline = result.data.timeline?.[0]?.data;
    if (timeline && timeline.length > 0) {
      console.log(`\nShowing ${Math.min(5, timeline.length)} tone data points:\n`);
      timeline.slice(0, 5).forEach((point: any) => {
        const tone = parseFloat(point.value);
        const sentiment = tone > 0 ? '(positive)' : tone < 0 ? '(negative)' : '(neutral)';
        console.log(`${point.date}: ${tone.toFixed(4)} ${sentiment}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // ============================================================================
  // Example 4: Advanced Query with QueryBuilder
  // ============================================================================
  console.log('\n\nExample 4: Advanced query using QueryBuilder');
  console.log('-'.repeat(80));

  try {
    const query = createQuery()
      .phrase('renewable energy')
      .or('solar', 'wind', 'hydroelectric')
      .exclude('oil')
      .build();

    console.log(`Query: ${query}\n`);

    const result = await client.getArticles(query, {
      timeSpan: '24h',
      maxRecords: 3,
    });

    console.log(`Found ${result.data.articles?.length || 0} articles\n`);

    if (result.data.articles && result.data.articles.length > 0) {
      result.data.articles.forEach((article: any, idx: number) => {
        console.log(`${idx + 1}. ${article.title}`);
        console.log(`   Domain: ${article.domain}`);
        console.log();
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // ============================================================================
  // Example 5: Domain Filtering
  // ============================================================================
  console.log('\nExample 5: Articles from specific domain (bbc.com)');
  console.log('-'.repeat(80));

  try {
    const result = await client.searchDoc({
      query: 'technology',
      domain: 'bbc.com',
      timeSpan: '24h',
      mode: 'ArtList',
      maxRecords: 3,
    });

    console.log(`Found ${result.data.articles?.length || 0} articles from BBC\n`);

    if (result.data.articles && result.data.articles.length > 0) {
      result.data.articles.forEach((article: any, idx: number) => {
        console.log(`${idx + 1}. ${article.title}`);
        console.log(`   URL: ${article.url}`);
        console.log();
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // ============================================================================
  // Example 6: Multi-language Search
  // ============================================================================
  console.log('\nExample 6: Spanish language articles about "tecnología"');
  console.log('-'.repeat(80));

  try {
    const result = await client.searchDoc({
      query: 'tecnología',
      sourceLang: 'spanish',
      timeSpan: '24h',
      mode: 'ArtList',
      maxRecords: 3,
    });

    console.log(`Found ${result.data.articles?.length || 0} Spanish articles\n`);

    if (result.data.articles && result.data.articles.length > 0) {
      result.data.articles.forEach((article: any, idx: number) => {
        console.log(`${idx + 1}. ${article.title}`);
        console.log(`   Language: ${article.language}`);
        console.log(`   Country: ${article.sourcecountry}`);
        console.log();
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // ============================================================================
  // Example 7: CSV Format
  // ============================================================================
  console.log('\nExample 7: Exporting data as CSV');
  console.log('-'.repeat(80));

  try {
    const result = await client.getArticles('space exploration', {
      timeSpan: '24h',
      format: 'csv',
      maxRecords: 3,
    });

    const lines = result.data.split('\n');
    console.log(`\nReceived ${lines.length} lines of CSV data`);
    console.log('\nFirst 3 lines:');
    console.log(lines.slice(0, 3).join('\n'));
  } catch (error) {
    console.error('Error:', error);
  }

  // ============================================================================
  // Example 8: Date Range Query
  // ============================================================================
  console.log('\n\nExample 8: Articles within a specific date range');
  console.log('-'.repeat(80));

  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago

    console.log(`Time range: ${startDate.toISOString()} to ${endDate.toISOString()}\n`);

    const result = await client.searchDoc({
      query: 'economy',
      startDateTime: client.formatDateTime(startDate),
      endDateTime: client.formatDateTime(endDate),
      mode: 'ArtList',
      maxRecords: 3,
    });

    console.log(`Found ${result.data.articles?.length || 0} articles\n`);

    if (result.data.articles && result.data.articles.length > 0) {
      result.data.articles.forEach((article: any, idx: number) => {
        console.log(`${idx + 1}. ${article.title}`);
        console.log(`   Seen: ${article.seendate}`);
        console.log();
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // ============================================================================
  // Example 9: Theme Search
  // ============================================================================
  console.log('\nExample 9: Search by GDELT theme (ECON_STOCKMARKET)');
  console.log('-'.repeat(80));

  try {
    const result = await client.searchDoc({
      query: 'trading',
      theme: 'ECON_STOCKMARKET',
      timeSpan: '24h',
      mode: 'ArtList',
      maxRecords: 3,
    });

    console.log(`Found ${result.data.articles?.length || 0} articles about stock market\n`);

    if (result.data.articles && result.data.articles.length > 0) {
      result.data.articles.forEach((article: any, idx: number) => {
        console.log(`${idx + 1}. ${article.title}`);
        console.log(`   Domain: ${article.domain}`);
        console.log();
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // ============================================================================
  // Utility Examples
  // ============================================================================
  console.log('\nUtility Functions:');
  console.log('-'.repeat(80));

  console.log('\n1. Date formatting:');
  const testDate = new Date('2025-10-12T15:30:00Z');
  console.log(`   Input:  ${testDate.toISOString()}`);
  console.log(`   Output: ${client.formatDateTime(testDate)}`);

  console.log('\n2. Timespan creation:');
  console.log(`   3 days:  ${client.createTimespan(3, 'd')}`);
  console.log(`   24 hours: ${client.createTimespan(24, 'h')}`);
  console.log(`   7 weeks:  ${client.createTimespan(7, 'w')}`);

  console.log('\n3. URL generation:');
  const exampleUrl = client.getDocUrl({
    query: 'test',
    mode: 'ArtList',
    timeSpan: '24h',
  });
  console.log(`   ${exampleUrl}`);

  console.log('\n================================================================================');
  console.log('Demo Complete!');
  console.log('================================================================================\n');
}

if (import.meta.main) {
  main().catch(console.error);
}

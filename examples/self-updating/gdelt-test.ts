/**
 * Comprehensive test suite for the GDELT Client
 */

import { createGdeltClient, createQuery, type GdeltResponse } from './gdelt-client';

// ============================================================================
// Test Utilities
// ============================================================================

function printSection(title: string) {
  console.log('\n' + '='.repeat(80));
  console.log(title);
  console.log('='.repeat(80) + '\n');
}

function printSubsection(title: string) {
  console.log('\n' + '-'.repeat(60));
  console.log(title);
  console.log('-'.repeat(60));
}

function printResult(label: string, value: any) {
  console.log(`${label}:`, typeof value === 'object' ? JSON.stringify(value, null, 2) : value);
}

async function handleTest(
  testName: string,
  testFn: () => Promise<GdeltResponse>
) {
  try {
    printSubsection(testName);
    const result = await testFn();
    console.log(`Status: ${result.rawResponse.status} ${result.rawResponse.statusText}`);
    console.log(`Format: ${result.format}`);
    console.log(`URL: ${result.rawResponse.url}`);

    // Print sample data based on format
    if (result.format === 'json') {
      if (Array.isArray(result.data)) {
        console.log(`\nReturned ${result.data.length} items`);
        if (result.data.length > 0) {
          console.log('\nFirst item:');
          console.log(JSON.stringify(result.data[0], null, 2));
        }
      } else {
        console.log('\nData preview:');
        console.log(JSON.stringify(result.data, null, 2).slice(0, 500));
      }
    } else if (result.format === 'csv') {
      const lines = result.data.split('\n');
      console.log(`\nReturned ${lines.length} lines`);
      console.log('\nFirst 5 lines:');
      console.log(lines.slice(0, 5).join('\n'));
    } else {
      console.log(`\nData length: ${result.data.length} characters`);
      console.log('Preview:', result.data.slice(0, 200));
    }

    console.log('\nTest PASSED');
    return true;
  } catch (error) {
    console.error(`\nTest FAILED: ${error}`);
    if (error instanceof Error && 'response' in error) {
      console.error(`Response status: ${(error as any).statusCode}`);
    }
    return false;
  }
}

// ============================================================================
// Main Test Suite
// ============================================================================

async function runTests() {
  printSection('GDELT API Client - Comprehensive Test Suite');

  const client = createGdeltClient({
    defaultFormat: 'json',
    defaultMaxRecords: 10,
  });

  const results: { [key: string]: boolean } = {};

  // ==========================================================================
  // DOC API Tests
  // ==========================================================================

  printSection('1. DOC API Tests');

  // Test 1: Basic article search
  results['doc-articles'] = await handleTest(
    'Test 1.1: Search for articles about "climate change"',
    () => client.getArticles('climate change', {
      timeSpan: '3d',
      maxRecords: 5,
    })
  );

  // Test 2: Timeline search
  results['doc-timeline'] = await handleTest(
    'Test 1.2: Get timeline for "artificial intelligence"',
    () => client.getTimeline('artificial intelligence', {
      timeSpan: '7d',
    })
  );

  // Test 3: Tone timeline
  results['doc-tone'] = await handleTest(
    'Test 1.3: Get tone timeline for "stock market"',
    () => client.getToneTimeline('stock market', {
      timeSpan: '24h',
    })
  );

  // Test 4: Word cloud
  results['doc-wordcloud'] = await handleTest(
    'Test 1.4: Get word cloud for "technology"',
    () => client.getWordCloud('technology', {
      timeSpan: '24h',
    })
  );

  // Test 5: Advanced query with query builder
  const advancedQuery = createQuery()
    .phrase('electric vehicles')
    .or('Tesla', 'Ford', 'GM')
    .exclude('accident')
    .build();

  results['doc-query-builder'] = await handleTest(
    'Test 1.5: Advanced query using QueryBuilder',
    () => client.getArticles(advancedQuery, {
      timeSpan: '24h',
      maxRecords: 5,
    })
  );

  // Test 6: Domain filtering
  results['doc-domain'] = await handleTest(
    'Test 1.6: Search with domain filter (nytimes.com)',
    () => client.searchDoc({
      query: 'politics',
      domain: 'nytimes.com',
      timeSpan: '24h',
      mode: 'ArtList',
      maxRecords: 5,
    })
  );

  // Test 7: Language filtering
  results['doc-language'] = await handleTest(
    'Test 1.7: Search Spanish language articles',
    () => client.searchDoc({
      query: 'tecnologia',
      sourceLang: 'spanish',
      timeSpan: '24h',
      mode: 'ArtList',
      maxRecords: 5,
    })
  );

  // Test 8: Theme search
  results['doc-theme'] = await handleTest(
    'Test 1.8: Search by theme (TERROR)',
    () => client.searchDoc({
      query: 'security',
      theme: 'TERROR',
      timeSpan: '24h',
      mode: 'ArtList',
      maxRecords: 5,
    })
  );

  // Test 9: CSV format
  results['doc-csv'] = await handleTest(
    'Test 1.9: Get articles in CSV format',
    () => client.getArticles('economy', {
      timeSpan: '24h',
      format: 'csv',
      maxRecords: 5,
    })
  );

  // Test 10: Date range query
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago

  results['doc-daterange'] = await handleTest(
    'Test 1.10: Search with specific date range',
    () => client.searchDoc({
      query: 'technology',
      startDateTime: client.formatDateTime(startDate),
      endDateTime: client.formatDateTime(endDate),
      mode: 'ArtList',
      maxRecords: 5,
    })
  );

  // ==========================================================================
  // GEO API Tests
  // ==========================================================================

  printSection('2. GEO API Tests');

  // Test 11: Geographic point data
  results['geo-points'] = await handleTest(
    'Test 2.1: Get geographic points for "earthquake"',
    () => client.getGeoPoints('earthquake', {
      timeSpan: '7d',
      maxRecords: 10,
    })
  );

  // Test 12: Geographic heatmap
  results['geo-heatmap'] = await handleTest(
    'Test 2.2: Get geographic heatmap for "election"',
    () => client.getGeoHeatmap('election', {
      timeSpan: '7d',
      maxRecords: 10,
    })
  );

  // Test 13: Geo with source country
  results['geo-country'] = await handleTest(
    'Test 2.3: Geographic search filtered by source country (US)',
    () => client.searchGeo({
      query: 'trade',
      sourceCountry: 'US',
      mode: 'PointData',
      timeSpan: '7d',
      maxRecords: 10,
    })
  );

  // ==========================================================================
  // TV API Tests
  // ==========================================================================

  printSection('3. TV API Tests');

  // Test 14: TV clips
  results['tv-clips'] = await handleTest(
    'Test 3.1: Get TV clips for "congress"',
    () => client.getTvClips('congress', {
      timeSpan: '24h',
      maxRecords: 5,
    })
  );

  // Test 15: TV timeline
  results['tv-timeline'] = await handleTest(
    'Test 3.2: Get TV coverage timeline for "president"',
    () => client.getTvTimeline('president', {
      timeSpan: '7d',
    })
  );

  // Test 16: TV station chart
  results['tv-stations'] = await handleTest(
    'Test 3.3: Get TV station chart for "health care"',
    () => client.getTvStationChart('health care', {
      timeSpan: '24h',
    })
  );

  // Test 17: TV network filtering
  results['tv-network'] = await handleTest(
    'Test 3.4: Search CNN for "breaking news"',
    () => client.searchTv({
      query: 'breaking news',
      network: 'CNN',
      mode: 'ClipGallery',
      timeSpan: '24h',
      maxRecords: 5,
    })
  );

  // Test 18: TV market filtering
  results['tv-market'] = await handleTest(
    'Test 3.5: Search national TV for "weather"',
    () => client.searchTv({
      query: 'weather',
      market: 'National',
      mode: 'ClipGallery',
      timeSpan: '24h',
      maxRecords: 5,
    })
  );

  // ==========================================================================
  // Utility Method Tests
  // ==========================================================================

  printSection('4. Utility Method Tests');

  printSubsection('Test 4.1: Date formatting');
  const testDate = new Date('2025-10-12T15:30:45');
  const formattedDate = client.formatDateTime(testDate);
  printResult('Input date', testDate.toISOString());
  printResult('Formatted date', formattedDate);
  console.log(formattedDate === '20251012153045' ? 'Test PASSED' : 'Test FAILED');
  results['util-date'] = formattedDate === '20251012153045';

  printSubsection('Test 4.2: Timespan creation');
  const timespan3Days = client.createTimespan(3, 'd');
  const timespan24Hours = client.createTimespan(24, 'h');
  const timespan7Days = client.createTimespan(7, 'd');
  printResult('3 days', timespan3Days);
  printResult('24 hours', timespan24Hours);
  printResult('7 days', timespan7Days);
  results['util-timespan'] =
    timespan3Days === '3d' && timespan24Hours === '24h' && timespan7Days === '7d';
  console.log(results['util-timespan'] ? 'Test PASSED' : 'Test FAILED');

  printSubsection('Test 4.3: Query builder');
  const complexQuery = createQuery()
    .phrase('machine learning')
    .or('AI', 'neural networks', 'deep learning')
    .exclude('cryptocurrency')
    .domain('arxiv.org')
    .tone('>5')
    .build();
  printResult('Built query', complexQuery);
  results['util-query-builder'] = complexQuery.includes('"machine learning"') &&
    complexQuery.includes('OR') &&
    complexQuery.includes('-cryptocurrency');
  console.log(results['util-query-builder'] ? 'Test PASSED' : 'Test FAILED');

  printSubsection('Test 4.4: URL generation (DOC API)');
  const docUrl = client.getDocUrl({
    query: 'test',
    mode: 'ArtList',
    timeSpan: '24h',
    maxRecords: 10,
  });
  printResult('Generated URL', docUrl);
  results['util-doc-url'] =
    docUrl.includes('api.gdeltproject.org') &&
    docUrl.includes('query=test') &&
    docUrl.includes('mode=ArtList');
  console.log(results['util-doc-url'] ? 'Test PASSED' : 'Test FAILED');

  printSubsection('Test 4.5: URL generation (GEO API)');
  const geoUrl = client.getGeoUrl({
    query: 'test',
    mode: 'PointData',
    timeSpan: '7d',
  });
  printResult('Generated URL', geoUrl);
  results['util-geo-url'] =
    geoUrl.includes('/geo/') &&
    geoUrl.includes('query=test') &&
    geoUrl.includes('mode=PointData');
  console.log(results['util-geo-url'] ? 'Test PASSED' : 'Test FAILED');

  printSubsection('Test 4.6: URL generation (TV API)');
  const tvUrl = client.getTvUrl({
    query: 'test',
    mode: 'ClipGallery',
    network: 'CNN',
  });
  printResult('Generated URL', tvUrl);
  results['util-tv-url'] =
    tvUrl.includes('/tv/') &&
    tvUrl.includes('query=test') &&
    tvUrl.includes('network=CNN');
  console.log(results['util-tv-url'] ? 'Test PASSED' : 'Test FAILED');

  // ==========================================================================
  // Test Summary
  // ==========================================================================

  printSection('Test Summary');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;

  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

  if (failedTests > 0) {
    console.log('\nFailed tests:');
    Object.entries(results)
      .filter(([_, passed]) => !passed)
      .forEach(([testName]) => console.log(`  - ${testName}`));
  }

  printSection('Test Suite Complete');

  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    results,
  };
}

// ============================================================================
// Run Tests
// ============================================================================

if (import.meta.main) {
  runTests()
    .then((summary) => {
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Test suite crashed:', error);
      process.exit(1);
    });
}

/**
 * Comprehensive GDELT API Client
 *
 * Supports three main APIs:
 * - DOC API: Full text search across 65 languages (3-month rolling window)
 * - GEO API: Geographic mapping of keywords (7-day window)
 * - TV API: Television news search and analysis
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type OutputFormat = 'html' | 'json' | 'csv' | 'rss' | 'jsonfeed';

export type DocMode =
  | 'ArtList'           // Article list with URLs, dates, titles, etc.
  | 'ArtGallery'        // Visual gallery of articles with images
  | 'TimelineVol'       // Timeline showing volume of coverage
  | 'TimelineVolInfo'   // Timeline with article counts
  | 'TimelineTone'      // Timeline showing average tone
  | 'TimelineLang'      // Timeline by language
  | 'TimelineSourceCountry' // Timeline by source country
  | 'WordCloud'         // Word cloud of most common words
  | 'ImageCollage'      // Collage of images from matching articles
  | 'ImageCollageInfo'  // Image collage with metadata
  | 'ImageCollageVideo' // Video collage
  | 'ImageWebGraph'     // Network graph of images
  | 'ToneChart';        // Chart showing tone distribution

export type GeoMode =
  | 'PointData'         // Raw point data
  | 'Heatmap'           // Geographic heatmap
  | 'SourceCountry';    // Map by source country

export type TvMode =
  | 'ClipGallery'         // Gallery of video clips
  | 'TimelineVol'         // Timeline of coverage volume
  | 'TimelineVolHeatmap'  // Hourly airtime trends heatmap
  | 'TimelineVolStream'   // Streamgraph timeline
  | 'TimelineVolNorm'     // Total airtime per station
  | 'TrendingTopics'      // Most common topics
  | 'WordCloud'           // Word cloud
  | 'StationChart'        // Chart by station
  | 'ShowChart'           // Chart by show
  | 'StationDetails';     // List of available stations

export type TimeUnit = 'm' | 'h' | 'd' | 'w' | 'M';

export interface BaseQueryParams {
  query: string;
  format?: OutputFormat;
  maxRecords?: number;
}

export interface DocQueryParams extends BaseQueryParams {
  mode?: DocMode;
  timeSpan?: string;  // e.g., "3d", "24h", "7d"
  startDateTime?: string; // YYYYMMDDHHMMSS
  endDateTime?: string;   // YYYYMMDDHHMMSS
  sourceLang?: string;    // ISO 639 language code
  sourceCountry?: string; // FIPS 2-letter country code
  domain?: string;        // Domain filter (partial match)
  domainExact?: string;   // Domain filter (exact match)
  theme?: string;         // GDELT GKG theme
  tone?: string;          // e.g., ">5" or "<-5"
  imageTag?: string;      // Image analysis tag
  sort?: 'DateDesc' | 'DateAsc' | 'ToneAsc' | 'ToneDesc' | 'HybridRel';
}

export interface GeoQueryParams extends BaseQueryParams {
  mode?: GeoMode;
  timeSpan?: string;
  sourceLang?: string;
  sourceCountry?: string;
  theme?: string;
  tone?: string;
}

export interface TvQueryParams extends BaseQueryParams {
  mode?: TvMode;
  timeSpan?: string;
  startDateTime?: string;
  endDateTime?: string;
  market?: string;        // e.g., "National", "Boston", "Philadelphia"
  network?: string;       // e.g., "CNN", "MSNBC", "FOXNEWS", "BBCNEWS"
  show?: string;          // Show name
  station?: string;       // Station call letters
}

export interface GdeltResponse<T = any> {
  data: T;
  rawResponse: Response;
  format: OutputFormat;
}

export interface GdeltError extends Error {
  statusCode?: number;
  response?: Response;
}

// ============================================================================
// Query Builder Helpers
// ============================================================================

export class QueryBuilder {
  private parts: string[] = [];

  /**
   * Add a keyword or phrase to the query
   */
  add(term: string): this {
    this.parts.push(term);
    return this;
  }

  /**
   * Add an exact phrase search
   */
  phrase(phrase: string): this {
    this.parts.push(`"${phrase}"`);
    return this;
  }

  /**
   * Add OR-ed terms
   */
  or(...terms: string[]): this {
    const orClause = `(${terms.join(' OR ')})`;
    this.parts.push(orClause);
    return this;
  }

  /**
   * Exclude a term
   */
  exclude(term: string): this {
    this.parts.push(`-${term}`);
    return this;
  }

  /**
   * Filter by source language
   */
  sourceLang(lang: string): this {
    this.parts.push(`sourcelang:${lang}`);
    return this;
  }

  /**
   * Filter by source country
   */
  sourceCountry(country: string): this {
    this.parts.push(`sourcecountry:${country}`);
    return this;
  }

  /**
   * Filter by domain
   */
  domain(domain: string): this {
    this.parts.push(`domain:${domain}`);
    return this;
  }

  /**
   * Filter by theme
   */
  theme(theme: string): this {
    this.parts.push(`theme:${theme}`);
    return this;
  }

  /**
   * Filter by image tag
   */
  imageTag(tag: string): this {
    this.parts.push(`imagetag:${tag}`);
    return this;
  }

  /**
   * Filter by tone (e.g., ">5" for positive, "<-5" for negative)
   */
  tone(operator: string): this {
    this.parts.push(`tone${operator}`);
    return this;
  }

  /**
   * Build the final query string
   */
  build(): string {
    return this.parts.join(' ');
  }

  /**
   * Reset the query builder
   */
  reset(): this {
    this.parts = [];
    return this;
  }
}

// ============================================================================
// Main GDELT Client
// ============================================================================

export class GdeltClient {
  private readonly baseUrls = {
    doc: 'https://api.gdeltproject.org/api/v2/doc/doc',
    geo: 'https://api.gdeltproject.org/api/v2/geo/geo',
    tv: 'https://api.gdeltproject.org/api/v2/tv/tv',
  };

  private defaultFormat: OutputFormat = 'json';
  private defaultMaxRecords: number = 250;

  constructor(
    options: {
      defaultFormat?: OutputFormat;
      defaultMaxRecords?: number;
    } = {}
  ) {
    if (options.defaultFormat) {
      this.defaultFormat = options.defaultFormat;
    }
    if (options.defaultMaxRecords) {
      this.defaultMaxRecords = options.defaultMaxRecords;
    }
  }

  // ==========================================================================
  // DOC API Methods
  // ==========================================================================

  /**
   * Search the GDELT DOC 2.0 API
   * Searches across 65 languages with a 3-month rolling window
   */
  async searchDoc(params: DocQueryParams): Promise<GdeltResponse> {
    const url = this.buildDocUrl(params);
    return this.executeRequest(url, params.format || this.defaultFormat);
  }

  /**
   * Get article list
   */
  async getArticles(
    query: string,
    options: Omit<DocQueryParams, 'query' | 'mode'> = {}
  ): Promise<GdeltResponse> {
    return this.searchDoc({
      query,
      mode: 'ArtList',
      ...options,
    });
  }

  /**
   * Get timeline of coverage volume
   */
  async getTimeline(
    query: string,
    options: Omit<DocQueryParams, 'query' | 'mode'> = {}
  ): Promise<GdeltResponse> {
    return this.searchDoc({
      query,
      mode: 'TimelineVol',
      ...options,
    });
  }

  /**
   * Get tone analysis over time
   */
  async getToneTimeline(
    query: string,
    options: Omit<DocQueryParams, 'query' | 'mode'> = {}
  ): Promise<GdeltResponse> {
    return this.searchDoc({
      query,
      mode: 'TimelineTone',
      ...options,
    });
  }

  /**
   * Get word cloud
   */
  async getWordCloud(
    query: string,
    options: Omit<DocQueryParams, 'query' | 'mode'> = {}
  ): Promise<GdeltResponse> {
    return this.searchDoc({
      query,
      mode: 'WordCloud',
      ...options,
    });
  }

  /**
   * Get image collage
   */
  async getImageCollage(
    query: string,
    options: Omit<DocQueryParams, 'query' | 'mode'> = {}
  ): Promise<GdeltResponse> {
    return this.searchDoc({
      query,
      mode: 'ImageCollage',
      ...options,
    });
  }

  // ==========================================================================
  // GEO API Methods
  // ==========================================================================

  /**
   * Search the GDELT GEO 2.0 API
   * Creates maps showing locations mentioned near keywords
   */
  async searchGeo(params: GeoQueryParams): Promise<GdeltResponse> {
    const url = this.buildGeoUrl(params);
    return this.executeRequest(url, params.format || this.defaultFormat);
  }

  /**
   * Get geographic point data
   */
  async getGeoPoints(
    query: string,
    options: Omit<GeoQueryParams, 'query' | 'mode'> = {}
  ): Promise<GdeltResponse> {
    return this.searchGeo({
      query,
      mode: 'PointData',
      ...options,
    });
  }

  /**
   * Get geographic heatmap
   */
  async getGeoHeatmap(
    query: string,
    options: Omit<GeoQueryParams, 'query' | 'mode'> = {}
  ): Promise<GdeltResponse> {
    return this.searchGeo({
      query,
      mode: 'Heatmap',
      ...options,
    });
  }

  // ==========================================================================
  // TV API Methods
  // ==========================================================================

  /**
   * Search the GDELT TV 2.0 API
   * Searches television news transcripts
   */
  async searchTv(params: TvQueryParams): Promise<GdeltResponse> {
    const url = this.buildTvUrl(params);
    return this.executeRequest(url, params.format || this.defaultFormat);
  }

  /**
   * Get TV clip gallery
   */
  async getTvClips(
    query: string,
    options: Omit<TvQueryParams, 'query' | 'mode'> = {}
  ): Promise<GdeltResponse> {
    return this.searchTv({
      query,
      mode: 'ClipGallery',
      ...options,
    });
  }

  /**
   * Get TV coverage timeline
   */
  async getTvTimeline(
    query: string,
    options: Omit<TvQueryParams, 'query' | 'mode'> = {}
  ): Promise<GdeltResponse> {
    return this.searchTv({
      query,
      mode: 'TimelineVol',
      ...options,
    });
  }

  /**
   * Get TV station chart
   */
  async getTvStationChart(
    query: string,
    options: Omit<TvQueryParams, 'query' | 'mode'> = {}
  ): Promise<GdeltResponse> {
    return this.searchTv({
      query,
      mode: 'StationChart',
      ...options,
    });
  }

  // ==========================================================================
  // URL Building Methods
  // ==========================================================================

  private buildDocUrl(params: DocQueryParams): string {
    const url = new URL(this.baseUrls.doc);
    this.addCommonParams(url, params);

    if (params.mode) url.searchParams.set('mode', params.mode);
    if (params.timeSpan) url.searchParams.set('timespan', params.timeSpan);
    if (params.startDateTime) url.searchParams.set('startdatetime', params.startDateTime);
    if (params.endDateTime) url.searchParams.set('enddatetime', params.endDateTime);
    if (params.sourceLang) url.searchParams.set('sourcelang', params.sourceLang);
    if (params.sourceCountry) url.searchParams.set('sourcecountry', params.sourceCountry);
    if (params.domain) url.searchParams.set('domain', params.domain);
    if (params.domainExact) url.searchParams.set('domainexact', params.domainExact);
    if (params.theme) url.searchParams.set('theme', params.theme);
    if (params.tone) url.searchParams.set('tone', params.tone);
    if (params.imageTag) url.searchParams.set('imagetag', params.imageTag);
    if (params.sort) url.searchParams.set('sort', params.sort);

    return url.toString();
  }

  private buildGeoUrl(params: GeoQueryParams): string {
    const url = new URL(this.baseUrls.geo);
    this.addCommonParams(url, params);

    if (params.mode) url.searchParams.set('mode', params.mode);
    if (params.timeSpan) url.searchParams.set('timespan', params.timeSpan);
    if (params.sourceLang) url.searchParams.set('sourcelang', params.sourceLang);
    if (params.sourceCountry) url.searchParams.set('sourcecountry', params.sourceCountry);
    if (params.theme) url.searchParams.set('theme', params.theme);
    if (params.tone) url.searchParams.set('tone', params.tone);

    return url.toString();
  }

  private buildTvUrl(params: TvQueryParams): string {
    const url = new URL(this.baseUrls.tv);
    this.addCommonParams(url, params);

    if (params.mode) url.searchParams.set('mode', params.mode);
    if (params.timeSpan) url.searchParams.set('timespan', params.timeSpan);
    if (params.startDateTime) url.searchParams.set('startdatetime', params.startDateTime);
    if (params.endDateTime) url.searchParams.set('enddatetime', params.endDateTime);
    if (params.market) url.searchParams.set('market', params.market);
    if (params.network) url.searchParams.set('network', params.network);
    if (params.show) url.searchParams.set('show', params.show);
    if (params.station) url.searchParams.set('station', params.station);

    return url.toString();
  }

  private addCommonParams(url: URL, params: BaseQueryParams): void {
    url.searchParams.set('query', params.query);
    url.searchParams.set('format', params.format || this.defaultFormat);
    url.searchParams.set('maxrecords', String(params.maxRecords || this.defaultMaxRecords));
  }

  // ==========================================================================
  // Request Execution
  // ==========================================================================

  private async executeRequest(
    url: string,
    format: OutputFormat
  ): Promise<GdeltResponse> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        const error: GdeltError = new Error(
          `GDELT API request failed: ${response.status} ${response.statusText}`
        );
        error.statusCode = response.status;
        error.response = response;
        throw error;
      }

      // First get the text to check for error messages
      const text = await response.text();

      // Check for API error messages
      if (text.includes('Invalid mode') ||
          text.includes('Invalid query') ||
          text.includes('earliest start date')) {
        const error: GdeltError = new Error(`GDELT API Error: ${text.substring(0, 200)}`);
        error.statusCode = 400;
        error.response = response;
        throw error;
      }

      let data: any;

      switch (format) {
        case 'json':
        case 'jsonfeed':
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            // If JSON parsing fails, check if we got HTML instead
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
              const error: GdeltError = new Error(
                'Expected JSON but received HTML. This mode may not support JSON format or requires different parameters.'
              );
              error.statusCode = 400;
              error.response = response;
              throw error;
            }
            throw parseError;
          }
          break;
        case 'csv':
        case 'html':
        case 'rss':
        default:
          data = text;
      }

      return {
        data,
        rawResponse: response,
        format,
      };
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      throw new Error(`Failed to execute GDELT API request: ${error}`);
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Create a new query builder
   */
  createQuery(): QueryBuilder {
    return new QueryBuilder();
  }

  /**
   * Format a date for use in GDELT API queries
   */
  formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Create a timespan string
   */
  createTimespan(value: number, unit: TimeUnit): string {
    return `${value}${unit}`;
  }

  /**
   * Get the URL that would be used for a query (for debugging)
   */
  getDocUrl(params: DocQueryParams): string {
    return this.buildDocUrl(params);
  }

  getGeoUrl(params: GeoQueryParams): string {
    return this.buildGeoUrl(params);
  }

  getTvUrl(params: TvQueryParams): string {
    return this.buildTvUrl(params);
  }
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Create a new GDELT client instance
 */
export function createGdeltClient(
  options?: ConstructorParameters<typeof GdeltClient>[0]
): GdeltClient {
  return new GdeltClient(options);
}

/**
 * Create a query builder
 */
export function createQuery(): QueryBuilder {
  return new QueryBuilder();
}

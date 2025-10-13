/**
 * Simple static intent mapping for workflow navigation
 * Maps prompts directly to actions without AI
 */

export interface IntentResult {
  confidence: number;
  action: string;
}

export class StaticIntentMap {
  private mapping: Record<string, string>;

  constructor(mapping: Record<string, string>) {
    this.mapping = mapping;
  }

  async query(prompt: string): Promise<IntentResult> {
    const lowerPrompt = prompt.toLowerCase();

    // Direct match
    for (const [key, action] of Object.entries(this.mapping)) {
      if (lowerPrompt === key.toLowerCase()) {
        return { confidence: 1.0, action };
      }
    }

    // Partial match
    for (const [key, action] of Object.entries(this.mapping)) {
      if (lowerPrompt.includes(key.toLowerCase())) {
        return { confidence: 0.9, action };
      }
    }

    // No match
    return { confidence: 0.1, action: 'unknown' };
  }
}

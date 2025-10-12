import OpenAI from 'openai';

export interface IntentResult {
  confidence: number;
  action: string;
}

/**
 * OpenAI-powered intent mapping for workflow navigation.
 * Uses GPT to intelligently match natural language prompts to workflow actions.
 */
export class OpenAIIntentMap {
  private client: OpenAI;
  private availableActions: string[];

  constructor(apiKey: string, availableActions: string[]) {
    this.client = new OpenAI({ apiKey });
    this.availableActions = availableActions;
  }

  async query(prompt: string): Promise<IntentResult> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an intent classifier for a workflow engine. Given a user prompt, determine which action best matches the intent.

Available actions: ${this.availableActions.join(', ')}

Respond with a JSON object containing:
- "action": the matching action name (must be one of the available actions, or "unknown" if no match)
- "confidence": a number between 0 and 1 indicating match confidence

Consider semantic similarity, not just exact matches. For example:
- "get the latest news" → fetch-data (high confidence)
- "validate the information" → validation (high confidence)
- "clean up the data" → filtering (medium-high confidence)
- "what's the weather?" → unknown (low confidence, not an available action)`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(
        completion.choices[0].message.content || '{"action":"unknown","confidence":0.1}'
      );

      return {
        action: result.action || 'unknown',
        confidence: result.confidence || 0.1,
      };
    } catch (error) {
      console.error('OpenAI intent mapping error:', error);
      return { action: 'unknown', confidence: 0.1 };
    }
  }
}

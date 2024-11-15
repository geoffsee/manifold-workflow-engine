// src/types.d.ts
export interface WorkflowState {
  [key: string]: unknown;
  validated?: boolean;
  cleaned?: boolean;
  analyzed?: boolean;
  transformed?: boolean;
  test?: boolean;
  executed?: boolean;
  modified?: boolean;
  step1?: boolean;
  step2?: boolean;
}

export interface IntentResult {
  confidence: number;
  action: string;
}
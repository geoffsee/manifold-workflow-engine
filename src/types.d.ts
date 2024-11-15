// src/types.d.ts
interface WorkflowState {
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

interface IntentResult {
  confidence: number;
  action: string;
}
export interface QueryResult {
    confidence: number;
    action: string;
}

export interface LLMService {
    query(prompt: string): Promise<QueryResult>;
}

export interface State {
    [key: string]: any;
}

export class DummyLlmService implements LLMService {
    query(prompt: string): Promise<QueryResult>;
}

export class WorkflowOperator {
    constructor(name: string, operation: (state: State) => Promise<State>);
    name: string;
    execute(state: State): Promise<State>;
}

export class ManifoldRegion {
    constructor(name: string, operators?: WorkflowOperator[]);
    name: string;
    operators: WorkflowOperator[];
    adjacentRegions: Set<ManifoldRegion>;
    addOperator(operator: WorkflowOperator): void;
    connectTo(region: ManifoldRegion): void;
    getValidOperators(state: State): Promise<WorkflowOperator[]>;
}

export class NestedManifoldRegion extends ManifoldRegion {
    constructor(name: string, nestedManifold: WorkflowFunctionManifold);
    nestedManifold: WorkflowFunctionManifold;
    navigate(prompt: string): Promise<boolean>;
    executeWorkflow(prompt: string): Promise<boolean>;
}

export class WorkflowFunctionManifold {
    constructor(llmService: LLMService);
    llmService: LLMService;
    regions: Map<string, ManifoldRegion | NestedManifoldRegion>;
    currentRegion: ManifoldRegion | NestedManifoldRegion | null;
    state: State;
    addRegion(region: ManifoldRegion | NestedManifoldRegion): void;
    navigate(prompt: string): Promise<boolean>;
    executeWorkflow(prompt: string): Promise<boolean>;
}

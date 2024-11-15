import { log } from './logger';

export class DummyIntentMap {
    async query(prompt: string): Promise<IntentResult> {
        log.debug(`Processing intent query for prompt: ${prompt}`);
        const intents: Record<string, IntentResult> = {
            analyze: { confidence: 0.9, action: 'analysis' },
            process: { confidence: 0.8, action: 'processing' },
            transform: { confidence: 0.7, action: 'transformation' },
            validate: { confidence: 0.85, action: 'validation' },
            clean: { confidence: 0.85, action: 'cleaning' },
            test: { confidence: 0.9, action: 'testOperation' },
            operator1: { confidence: 0.9, action: 'operator1' },
            operator2: { confidence: 0.9, action: 'operator2' }
        };
        const matchedIntent = Object.entries(intents).find(([key]) =>
          prompt.toLowerCase().includes(key)
        );
        const result = matchedIntent ? matchedIntent[1] : { confidence: 0.1, action: 'unknown' };
        log.debug(`Intent match result: ${JSON.stringify(result)}`);
        return result;
    }
}

export class WorkflowOperator {
    name: string;
    operation: (state: WorkflowState) => Promise<WorkflowState>;

    constructor(name: string, operation: (state: WorkflowState) => Promise<WorkflowState>) {
        this.name = name;
        this.operation = operation;
        log.info(`Created new WorkflowOperator: ${name}`);
    }

    async execute(state: WorkflowState): Promise<WorkflowState> {
        log.debug(`Executing operator ${this.name} with state: ${JSON.stringify(state)}`);
        const result = await this.operation(state);
        log.debug(`Operator ${this.name} execution complete. New state: ${JSON.stringify(result)}`);
        return result;
    }
}

export class ManifoldRegion {
    name: string;
    operators: WorkflowOperator[];
    adjacentRegions: Set<ManifoldRegion>;

    constructor(name: string, operators: WorkflowOperator[] = []) {
        this.name = name;
        this.operators = operators;
        this.adjacentRegions = new Set<ManifoldRegion>();
        log.info(`Created new ManifoldRegion: ${name} with ${operators.length} operators`);
    }

    addOperator(operator: WorkflowOperator): void {
        log.debug(`Adding operator ${operator.name} to region ${this.name}`);
        this.operators.push(operator);
    }

    connectTo(region: ManifoldRegion): void {
        log.info(`Connecting region ${this.name} to ${region.name}`);
        this.adjacentRegions.add(region);
        region.adjacentRegions.add(this);
    }

    async getValidOperators(state: WorkflowState): Promise<WorkflowOperator[]> {
        log.debug(`Getting valid operators for region ${this.name}`);
        return this.operators;
    }
}

export class NestedManifoldRegion extends ManifoldRegion {
    nestedManifold: WorkflowFunctionManifold;

    constructor(name: string, nestedManifold: WorkflowFunctionManifold) {
        super(name);
        this.nestedManifold = nestedManifold;
        this.nestedManifold.state = {};
        log.info(`Created new NestedManifoldRegion: ${name}`);
    }

    async getValidOperators(state: WorkflowState): Promise<WorkflowOperator[]> {
        log.debug(`Getting valid operators for nested region ${this.name}`);
        if (!this.nestedManifold.currentRegion) {
            log.warn(`No current region in nested manifold for ${this.name}`);
            return [];
        }
        return await this.nestedManifold.currentRegion.getValidOperators(state);
    }

    async navigate(prompt: string): Promise<boolean> {
        log.debug(`Navigating nested manifold in ${this.name} with prompt: ${prompt}`);
        return await this.nestedManifold.navigate(prompt);
    }

    async executeWorkflow(prompt: string): Promise<boolean> {
        log.debug(`Executing nested workflow in ${this.name} with prompt: ${prompt}`);
        const result = await this.nestedManifold.executeWorkflow(prompt);
        if (result) {
            log.debug(`Nested workflow execution successful, updating state`);
            Object.assign(this.nestedManifold.state, this.nestedManifold.state);
        }
        return result;
    }
}

export class WorkflowFunctionManifold {
    intentMap: DummyIntentMap;
    regions: Map<string, ManifoldRegion>;
    currentRegion: ManifoldRegion | null;
    state: WorkflowState;
    parentManifold?: WorkflowFunctionManifold;

    constructor(intentMap: DummyIntentMap) {
        this.intentMap = intentMap;
        this.regions = new Map<string, ManifoldRegion>();
        this.currentRegion = null;
        this.state = {};
        log.info('Created new WorkflowFunctionManifold');
    }

    addRegion(region: ManifoldRegion): void {
        log.info(`Adding region ${region.name} to manifold`);
        this.regions.set(region.name, region);
        if (!this.currentRegion) {
            log.debug(`Setting ${region.name} as current region`);
            this.currentRegion = region;
        }
        if (region instanceof NestedManifoldRegion) {
            log.debug(`Setting parent manifold for nested region ${region.name}`);
            region.nestedManifold.parentManifold = this;
        }
    }

    async navigate(prompt: string): Promise<boolean> {
        try {
            log.debug(`Attempting navigation with prompt: ${prompt}`);

            if (this.currentRegion instanceof NestedManifoldRegion) {
                log.debug('Current region is nested, attempting nested navigation');
                const nestedNavigated = await this.currentRegion.navigate(prompt);
                if (nestedNavigated) {
                    log.debug('Nested navigation successful');
                    return true;
                }
            }

            const intent = await this.intentMap.query(prompt);
            if (intent.confidence <= 0.5) {
                log.warn(`Low confidence intent match: ${intent.confidence}`);
                return false;
            }

            if (!this.currentRegion) {
                log.error('No current region set');
                return false;
            }

            let nextRegion = Array.from(this.currentRegion.adjacentRegions).find(region =>
              region.name.toLowerCase() === intent.action.toLowerCase()
            );

            if (!nextRegion) {
                nextRegion = Array.from(this.currentRegion.adjacentRegions).find(region =>
                  region.name.toLowerCase().includes(intent.action.toLowerCase())
                );
            }

            if (nextRegion) {
                log.info(`Navigating from ${this.currentRegion.name} to ${nextRegion.name}`);
                this.currentRegion = nextRegion;
                return true;
            }

            log.warn(`No valid navigation target found for prompt: ${prompt}`);
            return false;
        } catch (error) {
            log.error('Navigation error:', error);
            return false;
        }
    }

    async executeWorkflow(prompt: string): Promise<boolean> {
        try {
            log.debug(`Executing workflow with prompt: ${prompt}`);

            if (this.currentRegion instanceof NestedManifoldRegion) {
                log.debug('Executing nested workflow');
                const nestedResult = await this.currentRegion.executeWorkflow(prompt);
                if (nestedResult) {
                    log.debug('Nested workflow successful, updating state');
                    this.state = {
                        ...this.state,
                        ...this.currentRegion.nestedManifold.state
                    };
                }
                return nestedResult;
            }

            const intent = await this.intentMap.query(prompt);
            if (!this.currentRegion) {
                log.error('No current region set for workflow execution');
                return false;
            }

            const operators = await this.currentRegion.getValidOperators(this.state);
            const matchedOperator = operators.find(op =>
              op.name.toLowerCase() === intent.action.toLowerCase()
            );

            if (matchedOperator && intent.confidence > 0.5) {
                log.info(`Executing operator ${matchedOperator.name}`);
                const newState = await matchedOperator.execute(this.state);
                this.state = { ...this.state, ...newState };
                if (this.parentManifold) {
                    log.debug('Updating parent manifold state');
                    this.parentManifold.state = {
                        ...this.parentManifold.state,
                        ...this.state
                    };
                }
                return true;
            }

            log.warn(`No matching operator found for prompt: ${prompt}`);
            return false;
        } catch (error) {
            log.error('Workflow execution error:', error);
            return false;
        }
    }
}
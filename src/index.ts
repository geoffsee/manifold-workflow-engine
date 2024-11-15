export class DummyIntentMap {
    async query(prompt: string): Promise<{ confidence: number; action: string }> {
        const intents: Record<string, { confidence: number; action: string }> = {
            analyze: { confidence: 0.9, action: 'analysis' },
            process: { confidence: 0.8, action: 'processing' },
            transform: { confidence: 0.7, action: 'transformation' },
            validate: { confidence: 0.85, action: 'validation' },
            clean: { confidence: 0.85, action: 'cleaning' },
            test: { confidence: 0.9, action: 'testOperation' },  // <-- Added this entry
            operator1: { confidence: 0.9, action: 'operator1' }, // <-- Added these entries
            operator2: { confidence: 0.9, action: 'operator2' }
        };
        const matchedIntent = Object.entries(intents).find(([key]) =>
            prompt.toLowerCase().includes(key)
        );
        return matchedIntent ? matchedIntent[1] : { confidence: 0.1, action: 'unknown' };
    }
}

export class WorkflowOperator {
    name: string;
    operation: (state: any) => Promise<any>;

    constructor(name: string, operation: (state: any) => Promise<any>) {
        this.name = name;
        this.operation = operation;
    }

    async execute(state: any): Promise<any> {
        return await this.operation(state);
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
    }

    addOperator(operator: WorkflowOperator): void {
        this.operators.push(operator);
    }

    connectTo(region: ManifoldRegion): void {
        this.adjacentRegions.add(region);
        region.adjacentRegions.add(this);
    }

    async getValidOperators(_state: any): Promise<WorkflowOperator[]> {
        return this.operators;
    }
}

// First fix the NestedManifoldRegion class to properly propagate state
export class NestedManifoldRegion extends ManifoldRegion {
    nestedManifold: WorkflowFunctionManifold;

    constructor(name: string, nestedManifold: WorkflowFunctionManifold) {
        super(name);
        this.nestedManifold = nestedManifold;
        // Initialize nested manifold state
        this.nestedManifold.state = {};
    }

    async getValidOperators(state: any): Promise<WorkflowOperator[]> {
        if (!this.nestedManifold.currentRegion) {
            return [];
        }
        return await this.nestedManifold.currentRegion.getValidOperators(state);
    }

    async navigate(prompt: string): Promise<boolean> {
        return await this.nestedManifold.navigate(prompt);
    }

    async executeWorkflow(prompt: string): Promise<boolean> {
        const result = await this.nestedManifold.executeWorkflow(prompt);
        if (result) {
            // Merge nested manifold state with parent manifold state
            Object.assign(this.nestedManifold.state, this.nestedManifold.state);
        }
        return result;
    }
}

// Update WorkflowFunctionManifold to handle nested state and logging
export class WorkflowFunctionManifold {
    intentMap: DummyIntentMap;
    regions: Map<string, ManifoldRegion>;
    currentRegion: ManifoldRegion | null;
    state: any;
    parentManifold?: WorkflowFunctionManifold;

    constructor(intentMap: DummyIntentMap) {
        this.intentMap = intentMap;
        this.regions = new Map<string, ManifoldRegion>();
        this.currentRegion = null;
        this.state = {};
    }

    addRegion(region: ManifoldRegion): void {
        this.regions.set(region.name, region);
        if (!this.currentRegion) {
            this.currentRegion = region;
        }
        if (region instanceof NestedManifoldRegion) {
            region.nestedManifold.parentManifold = this;
        }
    }

    async navigate(prompt: string): Promise<boolean> {
        try {
            console.log(`Navigating with prompt: "${prompt}"`);

            if (this.currentRegion instanceof NestedManifoldRegion) {
                const nestedNavigated = await this.currentRegion.navigate(prompt);
                if (nestedNavigated) {
                    return true;
                }
            }

            const intent = await this.intentMap.query(prompt);
            console.log(`Matched intent: ${intent.action}, confidence: ${intent.confidence}`);

            if (intent.confidence <= 0.5) {
                console.log(`Low confidence (${intent.confidence}) for prompt: "${prompt}"`);
                console.warn(`Low confidence navigation attempt for prompt: "${prompt}"`);
                return false;
            }

            if (!this.currentRegion) {
                console.warn('No current region available for navigation');
                return false;
            }

            // First try exact match
            let nextRegion = Array.from(this.currentRegion.adjacentRegions).find(region =>
                region.name.toLowerCase() === intent.action.toLowerCase()
            );

            // Then try partial match
            if (!nextRegion) {
                nextRegion = Array.from(this.currentRegion.adjacentRegions).find(region =>
                    region.name.toLowerCase().includes(intent.action.toLowerCase())
                );
            }

            if (nextRegion) {
                this.currentRegion = nextRegion;
                console.log(`Navigated to region: "${nextRegion.name}"`);
                return true;
            } else {
                console.warn(`No matching region found for intent action: "${intent.action}"`);
            }

            return false;
        } catch (error) {
            console.warn('Navigation error:', error);
            return false;
        }
    }

    async executeWorkflow(prompt: string): Promise<boolean> {
        try {
            if (this.currentRegion instanceof NestedManifoldRegion) {
                const nestedResult = await this.currentRegion.executeWorkflow(prompt);
                if (nestedResult) {
                    // Propagate state changes up to parent
                    this.state = {
                        ...this.state,
                        ...this.currentRegion.nestedManifold.state
                    };
                }
                return nestedResult;
            }

            const intent = await this.intentMap.query(prompt);
            if (!this.currentRegion) {
                console.warn('No current region available for execution');
                return false;
            }

            const operators = await this.currentRegion.getValidOperators(this.state);
            const matchedOperator = operators.find(op =>
                op.name.toLowerCase() === intent.action.toLowerCase()
            );

            if (matchedOperator && intent.confidence > 0.5) {
                const newState = await matchedOperator.execute(this.state);
                this.state = { ...this.state, ...newState };

                // If this is a nested manifold, propagate state changes up
                if (this.parentManifold) {
                    this.parentManifold.state = {
                        ...this.parentManifold.state,
                        ...this.state
                    };
                }

                return true;
            }

            console.warn(`No matching operator found for intent action: "${intent.action}"`);
            return false;
        } catch (error) {
            console.warn('Execution error:', error);
            return false;
        }
    }
}
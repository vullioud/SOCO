// In src/core/SoCoABeAgent.js -- REPLACE THE ENTIRE FILE CONTENT

class SoCoABeAgent {
    constructor(owner, agentId) {
        this.owner = owner;
        this.agentId = agentId;

        // Core Traits
        this.preferences = null;
        this.resources = null;
        this.riskTolerance = null;
        this.freedom = null;
        this.tenureTotal = 0;
        this.tenureLeft = 0;
        this.generation = 1;

        // Beliefs & State
        this.beliefs = { structure: { alpha: 1, beta: 1 } };
        this.managedStands = [];
        this.standStrategies = {};
        this.speciesChoiceFunction = null; // Will be set by sampleFromOwner

        // Action Tracking
        this.standsChangedThisYear = 0;
        this.standSatisfactions = {}; // Was missing
        this.averageSatisfaction = 0; // Was missing
        
        // Modules
        this.observationModule = new ObservationModule(this);
        this.cognitionModule = new CognitionModule(this);
        this.actionModule = new ActionModule(this);
        this.speciesModule = new SpeciesSelectionModule(this); // --- ADD THIS LINE ---
        this.standSnapshots = {}; // --- ADD THIS LINE ---
    }

    observe() {
        this.observationModule.performObservation();
    }

    makeDecision(currentYear) {
        this.cognitionModule.makeDecision(currentYear);
    }
    
    assignStands(standIds) {
        this.managedStands = standIds;
        standIds.forEach(id => {
            this.standStrategies[id] = null;
        });
    }

     sampleFromOwner() {
        this.preferences = this.owner.sampleAgentPreferences();
        this.resources = this.owner.sampleAgentResources();
        this.riskTolerance = this.owner.sampleAgentRisk();
        this.freedom = this.owner.sampleAgentFreedom();
        this.tenureTotal = this.owner.sampleAgentTenureYears();
        this.tenureLeft = this.tenureTotal;

        this.speciesChoiceFunction = function() { return {}; }; // PLACEHOLDER

        // 2. Select an initial base STP for all stands.
        const baseStpNames = Object.keys(this.owner.dependencies.BASE_STP_DEFINITIONS);
        const initialStp = baseStpNames[Math.floor(Math.random() * baseStpNames.length)];
        
        this.managedStands.forEach(id => { 
            this.standStrategies[id] = 'Initial'; 
            fmengine.standId = id;
            if (stand && stand.id > 0) {
                stand.setFlag('nextAssessmentYear', SoCoABE_CONFIG.warmupPeriod + Math.floor(Math.random() * 10));
            }
        });
    }


    updateBeliefs(noisyStructureScore) {
        const forgettingFactor = SoCoABE_CONFIG.AGENT.forgettingFactor;
        const { alpha, beta } = Distributions.updateBeta(this.beliefs.structure.alpha, this.beliefs.structure.beta, noisyStructureScore, forgettingFactor);
        this.beliefs.structure.alpha = alpha;
        this.beliefs.structure.beta = beta;
    }

    calculateBeliefPrecision() {
        return this.beliefs.structure.alpha + this.beliefs.structure.beta;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoCoABeAgent;
} else {
    this.SoCoABeAgent = SoCoABeAgent;
}
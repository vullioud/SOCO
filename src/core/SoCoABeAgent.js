// In src/core/SoCoABeAgent.js

/**
 * Represents an individual decision-making agent in the SoCoABE model.
 * This class acts as a "conductor," holding the agent's state and delegating
 * the core tasks of observing, deciding, and acting to specialized modules.
 */
class SoCoABeAgent {
    constructor(owner, agentId) {
        // --- Identity & Affiliation ---
        this.owner = owner;
        this.agentId = agentId;

        // --- Core Traits (Sampled from Owner) ---
        this.preferences = null;     // [production, biodiversity, carbon]
        this.resources = null;       // Determines monitoring/decision frequency
        this.riskTolerance = null;   // Single value [0,1]
        this.freedom = null;         // Latitude to deviate from proto-STP [0,1]
        this.tenureTotal = 0;
        this.tenureLeft = 0;
        this.generation = 1;
        this.inertia = 0.5;          // Cognitive resistance to change

        // --- Beliefs & State ---
        this.beliefs = { production: { alpha: 1, beta: 1 }, biodiversity: { alpha: 1, beta: 1 }, carbon: { alpha: 1, beta: 1 } };
        this.managedStands = [];     // Array of stand IDs
        this.currentProtoSTP = null; // The agent's currently preferred/default STP
        this.standStrategies = {};   // {standId: currentSTPname} - tracks individual stand management

        // --- Performance Metrics ---
        this.satisfactionHistory = [];   // History of agent's average satisfaction
        this.averageSatisfaction = -1;   // The agent's current overall satisfaction
        this.standSatisfactions = {};    // {standId: satisfactionScore}
        
        // --- Action Tracking ---
        this.actionHistory = [];
        this.switchCount = 0;
        this.standsChangedThisYear = 0;

        // --- Composition: The Agent's Functional Modules ---
        this.observationModule = new ObservationModule(this);
        this.cognitionModule = new CognitionModule(this);
        this.actionModule = new ActionModule(this);
    }

    /**
     * The main observation cycle, delegated to the ObservationModule.
     */
    observe() {
        this.observationModule.performObservation();
    }

    /**
     * The main decision cycle, delegated to the Cognition and Action Modules.
     */
    makeDecision() {
        const decision = this.cognitionModule.makeDecision();
        this.actionModule.executeDecision(decision);
    }
    
    /**
     * Assigns a list of stand IDs for this agent to manage.
     * @param {number[]} standIds - Array of stand IDs.
     */
    assignStands(standIds) {
        this.managedStands = standIds;
        standIds.forEach(id => {
            this.standStrategies[id] = null;
            this.standSatisfactions[id] = -1;
        });
    }

    /**
     * Samples all personal characteristics from its owner's distributions.
     */
    sampleFromOwner() {
        this.preferences = this.owner.sampleAgentPreferences();
        this.resources = this.owner.sampleAgentResources();
        this.riskTolerance = this.owner.sampleAgentRisk();
        this.freedom = this.owner.sampleAgentFreedom();
        this.tenureTotal = this.owner.sampleAgentTenureYears();
        this.tenureLeft = this.tenureTotal;
        this.monitoringCycle = Math.max(1, Math.floor(10 - (this.resources / 10)));
        this.decisionCycle = Math.max(5, Math.floor(20 - (this.resources / 5)));
        if (this.owner.config.beliefPriors) {
            this.beliefs = JSON.parse(JSON.stringify(this.owner.config.beliefPriors));
        }
        this.currentProtoSTP = this.owner.selectProtoSTP(this.preferences);
        this.managedStands.forEach(id => { this.standStrategies[id] = this.currentProtoSTP; });
    }

    /**
     * Updates the agent's internal belief distributions based on new observations.
     * @param {object} observations - The averaged ES scores from observation.
     */
    updateBeliefs(observations) {
        const forgettingFactor = SoCoABE_CONFIG.AGENT.forgettingFactor;
        Object.keys(observations).forEach(es => {
            if (this.beliefs[es]) {
                const { alpha, beta } = Distributions.updateBeta(this.beliefs[es].alpha, this.beliefs[es].beta, observations[es], forgettingFactor);
                this.beliefs[es].alpha = alpha;
                this.beliefs[es].beta = beta;
            }
        });
    }

    /**
     * Calculates the agent's overall confidence in its beliefs.
     * @returns {number} The average precision (alpha + beta) across all beliefs.
     */
    calculateBeliefPrecision() {
        const precisions = Object.values(this.beliefs).map(b => b.alpha + b.beta);
        return precisions.reduce((a, b) => a + b, 0) / precisions.length;
    }
}

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoCoABeAgent;
} else {
    this.SoCoABeAgent = SoCoABeAgent;
}
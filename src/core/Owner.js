/**
 * Represents an Owner, a meta-agent that manages a portfolio of stands
 * and a population of SoCoABeAgents.
 */
class Owner {
    /**
     * @param {Institution} institution - A reference to the parent Institution object.
     * @param {string} type
     * @param {object} config
     * @param {object[]} assignedStands
     * @param {object} dependencies - An object containing required utility classes.
     */
    constructor(institution, type, config, assignedStands, dependencies) {
        this.institution = institution; // Store reference to the parent institution
        this.type = type;
        this.config = config;
        this.assignedStands = assignedStands;
        
        if (!dependencies || !dependencies.SoCoABeAgent || !dependencies.Helpers || !dependencies.Distributions) {
            throw new Error("Owner constructor requires dependencies (SoCoABeAgent, Helpers, Distributions).");
        }
        this.SoCoABeAgent = dependencies.SoCoABeAgent;
        this.Helpers = dependencies.Helpers;
        this.Distributions = dependencies.Distributions;

        this.agents = [];
        this.stpPerformance = {};
        this.recruitmentProbabilities = {};
        
        this.initializePerformanceTracking();
    }

    initializePerformanceTracking() {
        this.config.protoSTPs.forEach(stpName => {
            this.stpPerformance[stpName] = { satisfactions: [], usageCount: 0, avgSatisfaction: 0.5 };
        });
        const equalProb = 1.0 / this.config.protoSTPs.length;
        this.config.protoSTPs.forEach(stpName => { this.recruitmentProbabilities[stpName] = equalProb; });
    }

    createAgents() {
        const totalStandsForOwner = this.assignedStands.length;
        if (totalStandsForOwner === 0) {
            console.log(`Owner '${this.type}' has no stands assigned, creating 0 agents.`);
            return;
        }

        let remainingStandIds = this.assignedStands.map(s => s.id);
        let agentCounter = 0;

        while (remainingStandIds.length > 0) {
            const intensity = this.config.managementIntensity;
            if (!intensity) {
                throw new Error(`'managementIntensity' is not defined for owner type '${this.type}'.`);
            }
            
            const standsToAssignCount = Math.max(1, 
                Math.round(this.Distributions.sampleNormal(intensity.meanStandsPerAgent, intensity.stddev))
            );
            
            const actualCount = Math.min(standsToAssignCount, remainingStandIds.length);
            const assignedIds = remainingStandIds.splice(0, actualCount);

            const agent = new this.SoCoABeAgent(this, `${this.type}_agent_${agentCounter}`);
            agent.assignStands(assignedIds);
            agent.sampleFromOwner();
            
            this.agents.push(agent);
            agentCounter++;
        }

        console.log(`Owner '${this.type}' with ${totalStandsForOwner} stands created ${this.agents.length} agents through iterative assignment.`);
    }

   /**
     * Creates a new agent to replace a retiring one.
     * This is a key part of generational turnover.
     * @param {SoCoABeAgent} retiringAgent - The agent who is retiring.
     * @param {number} currentYear - The current simulation year.
     * @returns {SoCoABeAgent} The new replacement agent.
     */
     replaceAgent(retiringAgent, currentYear) {
        const newGeneration = retiringAgent.generation + 1;
        const newAgentName = `${this.type}_agent_gen${newGeneration}_${currentYear}`;
        const newAgent = new this.SoCoABeAgent(this, newAgentName);
        
        newAgent.generation = newGeneration;
        newAgent.assignStands(retiringAgent.managedStands);
        newAgent.sampleFromOwner(); 
        
        return newAgent;
    }

    
    /**
     * Samples the tenure (time in service) for a new agent.
     * @returns {number} The number of years the agent will be active.
     */
    sampleAgentTenureYears() {
        const tenureConfig = this.config.tenure;
        if (!tenureConfig) return 30; // Default tenure
        
        const sample = this.Distributions.sampleBeta(tenureConfig.alpha, tenureConfig.beta);
        return Math.floor(tenureConfig.min + (tenureConfig.max - tenureConfig.min) * sample);
    }

    // --- Sampling Methods ---
    sampleAgentPreferences() { return this.Distributions.sampleDirichlet(this.config.esPreferences); }
    sampleAgentResources() { return this.Distributions.sampleGamma(this.config.resources.alpha, this.config.resources.scale); }
    sampleAgentRisk() { return this.Distributions.sampleBeta(this.config.riskTolerance.alpha, this.config.riskTolerance.beta); }
    sampleAgentFreedom() { return this.Distributions.sampleBeta(this.config.freedomDistribution.alpha, this.config.freedomDistribution.beta); }
    
    selectProtoSTP(agentPreferences) {
        const availableSTPs = this.config.protoSTPs;
        const randomIndex = Math.floor(Math.random() * availableSTPs.length);
        return availableSTPs[randomIndex];
    }
}

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Owner;
} else {
    this.Owner = Owner;
}
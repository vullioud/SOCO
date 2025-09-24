/**
 * Represents an Owner, a meta-agent that manages a portfolio of stands
 * and a population of SoCoABeAgents.
 */

class Owner {
    /**
     * @param {string} type
     * @param {object} config
     * @param {object[]} assignedStands
     * @param {object} dependencies - An object containing required utility classes.
     */
    constructor(type, config, assignedStands, dependencies) {
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
            return; // No stands, no agents.
        }

        // ============================================================================
        // ===== NEW ITERATIVE LOGIC FOR AGENT CREATION AND STAND ASSIGNMENT ==========
        // ============================================================================

        // Start with a list of all available stand IDs for this owner.
        let remainingStandIds = this.assignedStands.map(s => s.id);
        let agentCounter = 0;

        while (remainingStandIds.length > 0) {
            // 1. Determine the management capacity for this new agent.
            const intensity = this.config.managementIntensity;
            if (!intensity) {
                throw new Error(`'managementIntensity' is not defined for owner type '${this.type}'.`);
            }
            
            // Sample how many stands this specific agent will manage. Ensure it's at least 1.
            const standsToAssignCount = Math.max(1, 
                Math.round(this.Distributions.sampleNormal(intensity.meanStandsPerAgent, intensity.stddev))
            );
            
            // 2. Take the stands from the remaining list.
            // The number of stands is the smaller of the agent's capacity or what's left.
            const actualCount = Math.min(standsToAssignCount, remainingStandIds.length);
            const assignedIds = remainingStandIds.splice(0, actualCount);

            // 3. Create and configure the new agent.
            const agent = new this.SoCoABeAgent(this, `${this.type}_agent_${agentCounter}`);
            agent.assignStands(assignedIds);
            agent.sampleFromOwner();
            
            // 4. Add the fully configured agent to the list.
            this.agents.push(agent);
            agentCounter++;
        }
        // ============================================================================

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

        // 1. Get the generation from the retiring agent and increment it.
        const newGeneration = retiringAgent.generation + 1;

        // 2. Create the new agent's name using this correct generation number.
        const newAgentName = `${this.type}_agent_gen${newGeneration}_${currentYear}`;
        const newAgent = new this.SoCoABeAgent(this, newAgentName);
        
        // 3. Assign the correct generation number to the new agent object.
        newAgent.generation = newGeneration;

        // 4. The rest of the logic remains the same.
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
        
        // Sample from a Beta distribution and scale to the min/max range
        const sample = this.Distributions.sampleBeta(tenureConfig.alpha, tenureConfig.beta);
        return Math.floor(tenureConfig.min + (tenureConfig.max - tenureConfig.min) * sample);
    }

    // --- Sampling Methods ---
    sampleAgentPreferences() { return this.Distributions.sampleDirichlet(this.config.esPreferences); }
    sampleAgentResources() { return this.Distributions.sampleGamma(this.config.resources.alpha, this.config.resources.scale); }
    sampleAgentRisk() { return this.Distributions.sampleBeta(this.config.riskTolerance.alpha, this.config.riskTolerance.beta); }
    sampleAgentFreedom() { return this.Distributions.sampleBeta(this.config.freedomDistribution.alpha, this.config.freedomDistribution.beta); }
    sampleAgentAge() { return this.Distributions.sampleNormal(this.config.ageDistribution.mean, this.config.ageDistribution.stddev); }
    
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
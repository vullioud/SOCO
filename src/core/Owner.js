
class Owner {
    constructor(institution, type, config, assignedStands, dependencies) {
        this.institution = institution;
        this.type = type;
        this.config = config;
        this.assignedStands = assignedStands;
        this.dependencies = dependencies; // Store dependencies for agent creation
        
        if (!dependencies || !dependencies.SoCoABeAgent || !dependencies.Helpers || !dependencies.Distributions) {
            throw new Error("Owner constructor requires dependencies (SoCoABeAgent, Helpers, Distributions).");
        }
        this.SoCoABeAgent = dependencies.SoCoABeAgent;
        this.Helpers = dependencies.Helpers;
        this.Distributions = dependencies.Distributions;

        this.agents = [];
    }

    createAgents() {
        const totalStandsForOwner = this.assignedStands.length;
        if (totalStandsForOwner === 0) {
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
        console.log(`Owner '${this.type}' with ${totalStandsForOwner} stands created ${this.agents.length} agents.`);
    }

    replaceAgent(retiringAgent, currentYear) {
        const newGeneration = retiringAgent.generation + 1;
        const newAgentName = `${this.type}_agent_gen${newGeneration}_${currentYear}`;
        const newAgent = new this.SoCoABeAgent(this, newAgentName);
        
        newAgent.generation = newGeneration;
        newAgent.assignStands(retiringAgent.managedStands);
        newAgent.sampleFromOwner(); 
        
        newAgent.managedStands.forEach(standId => {
            fmengine.standId = standId;
            if (stand && stand.id > 0) {
                stand.setFlag('nextAssessmentYear', 0); 
            }
        });
        
        return newAgent;
    }
    
    sampleAgentTenureYears() {
        const tenureConfig = this.config.tenure;
        if (!tenureConfig) return 30;
        
        const sample = this.Distributions.sampleBeta(tenureConfig.alpha, tenureConfig.beta);
        return Math.floor(tenureConfig.min + (tenureConfig.max - tenureConfig.min) * sample);
    }

    // --- Sampling Methods ---
    sampleAgentPreferences() { return this.Distributions.sampleDirichlet(this.config.esPreferences); }
    sampleAgentResources() { return this.Distributions.sampleGamma(this.config.resources.alpha, this.config.resources.scale); }
    sampleAgentRisk() { return this.Distributions.sampleBeta(this.config.riskTolerance.alpha, this.config.riskTolerance.beta); }
    sampleAgentFreedom() { return this.Distributions.sampleBeta(this.config.freedomDistribution.alpha, this.config.freedomDistribution.beta); }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Owner;
} else {
    this.Owner = Owner;
}
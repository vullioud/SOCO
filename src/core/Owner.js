// File: src/core/Owner.js (ES5 Constructor Version)

function Owner(institution, type, config, assignedStands, dependencies) {
    this.institution = institution;
    this.type = type;
    this.config = config;
    this.assignedStands = assignedStands;
    this.dependencies = dependencies;

    if (!dependencies || !dependencies.SoCoABeAgent || !dependencies.Helpers || !dependencies.Distributions) {
        throw new Error("Owner constructor requires dependencies (SoCoABeAgent, Helpers, Distributions).");
    }
    
    this.SoCoABeAgent = dependencies.SoCoABeAgent;
    this.Helpers = dependencies.Helpers;
    this.Distributions = dependencies.Distributions;

    this.agents = [];
}

Owner.prototype.createAgents = function() {
    var totalStandsForOwner = this.assignedStands.length;
    if (totalStandsForOwner === 0) {
        return;
    }

    var remainingStandIds = this.assignedStands.map(function(s) { return s.id; });
    var agentCounter = 0;

    while (remainingStandIds.length > 0) {
        var intensity = this.config.managementIntensity;
        if (!intensity) {
            throw new Error("'managementIntensity' is not defined for owner type '" + this.type + "'.");
        }
        
        var standsToAssignCount = Math.max(1, 
            Math.round(this.Distributions.sampleNormal(intensity.meanStandsPerAgent, intensity.stddev))
        );
        
        var actualCount = Math.min(standsToAssignCount, remainingStandIds.length);
        var assignedIds = remainingStandIds.splice(0, actualCount);

        var agent = new this.SoCoABeAgent(this, this.type + "_agent_" + agentCounter);
        agent.assignStands(assignedIds);
        agent.sampleFromOwner();
        
        this.agents.push(agent);
        agentCounter++;
    }
    console.log("Owner '" + this.type + "' with " + totalStandsForOwner + " stands created " + this.agents.length + " agents.");
};

Owner.prototype.replaceAgent = function(retiringAgent, currentYear) {
    var newGeneration = retiringAgent.generation + 1;
    var newAgentName = this.type + "_agent_gen" + newGeneration + "_" + currentYear;
    var newAgent = new this.SoCoABeAgent(this, newAgentName);
    
    newAgent.engineId = retiringAgent.engineId;
    newAgent.generation = newGeneration;
    newAgent.assignStands(retiringAgent.managedStands);
    newAgent.sampleFromOwner(); 
    
    newAgent.managedStands.forEach(function(standId) {
        fmengine.standId = standId;
        if (stand && stand.id > 0) {
            stand.setFlag('nextAssessmentYear', 0); 
        }
    });
    
    return newAgent;
};

Owner.prototype.sampleAgentTenureYears = function() {
    var tenureConfig = this.config.tenure;
    if (!tenureConfig) return 30;
    
    var sample = this.Distributions.sampleBeta(tenureConfig.alpha, tenureConfig.beta);
    return Math.floor(tenureConfig.min + (tenureConfig.max - tenureConfig.min) * sample);
};

Owner.prototype.sampleAgentPreferences = function() { return this.Distributions.sampleDirichlet(this.config.esPreferences); };
Owner.prototype.sampleAgentResources = function() { return this.Distributions.sampleGamma(this.config.resources.alpha, this.config.resources.scale); };
Owner.prototype.sampleAgentRisk = function() { return this.Distributions.sampleBeta(this.config.riskTolerance.alpha, this.config.riskTolerance.beta); };
Owner.prototype.sampleAgentFreedom = function() { return this.Distributions.sampleBeta(this.config.freedomDistribution.alpha, this.config.freedomDistribution.beta); };

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Owner;
} else {
    this.Owner = Owner;
}
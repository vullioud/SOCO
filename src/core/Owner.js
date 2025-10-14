// File: src/core/Owner.js (ES5 Constructor Version) — FIXED

// Per-process turnover sequence to guarantee unique replacement names
var __OWNER_TURNOVER_SEQ__ = 0;

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
    if (totalStandsForOwner === 0) return;

    var remainingStandIds = this.assignedStands.map(function(s) { return s.id; });
    var agentCounter = 0;

    while (remainingStandIds.length > 0) {
        var intensity = this.config.managementIntensity;
        if (!intensity) {
            throw new Error("'managementIntensity' is not defined for owner type '" + this.type + "'.");
        }
        
        var standsToAssignCount = Math.max(1, Math.round(this.Distributions.sampleNormal(intensity.meanStandsPerAgent, intensity.stddev)));
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

/**
 * Replace a retiring SoCoABE agent with a new persona/brain.
 * NOTE: This does NOT create/remove any ABE engine agents. Engine bindings remain unchanged.
 */
Owner.prototype.replaceAgent = function(retiringAgent, currentYear) {
    var newGeneration = (retiringAgent.generation || 1) + 1;

    // Ensure per-replacement uniqueness (avoid name collisions within same year/type)
    __OWNER_TURNOVER_SEQ__ += 1;
    var baseName = this.type + "_agent";
    var newAgentName = baseName + "_gen" + newGeneration + "_" + currentYear + "_" + __OWNER_TURNOVER_SEQ__;

    var newAgent = new this.SoCoABeAgent(this, newAgentName);
    
    // Preserve engine binding; do NOT touch fmengine here
    newAgent.engineId   = retiringAgent.engineId;
    newAgent.generation = newGeneration;

    // Assign the same stands (use a copy to avoid aliasing the old array)
    newAgent.assignStands([].concat(retiringAgent.managedStands));

    // The new persona draws its own preferences/resources
    newAgent.sampleFromOwner();

    // Force immediate reassessment on all stands for the new manager
    var i;
    for (i = 0; i < newAgent.managedStands.length; i++) {
        var standId = newAgent.managedStands[i];
        fmengine.standId = standId;
        if (stand && stand.id > 0) {
            stand.setFlag('nextAssessmentYear', currentYear);
        }
    }

    // Helpful log mapping old -> new (with generation)
    var oldId = retiringAgent.agentId || retiringAgent.name || (this.type + "_agent_unknown");
    var newId = newAgent.agentId || newAgent.name;
    console.log("  > " + oldId + " -> " + newId + " (gen " + newGeneration + ")");

    return newAgent;
};

Owner.prototype.sampleAgentTenureYears = function() {
    var tenureConfig = this.config.tenure;
    if (!tenureConfig) return 30;
    var sample = this.Distributions.sampleBeta(tenureConfig.alpha, tenureConfig.beta);
    return Math.floor(tenureConfig.min + (tenureConfig.max - tenureConfig.min) * sample);
};

Owner.prototype.sampleAgentPreferences = function() { return this.Distributions.sampleDirichlet(this.config.esPreferences); };
Owner.prototype.sampleAgentResources   = function() { return this.Distributions.sampleBeta(this.config.resources.alpha, this.config.resources.beta); };
Owner.prototype.sampleAgentRisk        = function() { return this.Distributions.sampleBeta(this.config.riskTolerance.alpha, this.config.riskTolerance.beta); };
Owner.prototype.sampleAgentFreedom     = function() { return this.Distributions.sampleBeta(this.config.freedomDistribution.alpha, this.config.freedomDistribution.beta); };

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Owner;
} else {
    this.Owner = Owner;
}

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
    // --- In-place persona switch (no object replacement, no engine rebinding) ---
    // Keep the same JS object reference and the same ABE engine bindings.
    var agent = retiringAgent;

    // Increment "generation" marker for logging/analysis.
    agent.generation = (agent.generation || 1) + 1;
    agent.agentId = agent.agentId + "_g" + agent.generation;
    // Resample behavioral traits from owner config
    var newPrefs = this.sampleAgentPreferences();
    var newResources = this.sampleAgentResources();
    var newRisk = this.sampleAgentRisk();
    var newFreedom = this.sampleAgentFreedom ? this.sampleAgentFreedom() : undefined;

    agent.preferences = newPrefs;
    agent.resources = newResources;
    agent.riskTolerance = newRisk;
    if (typeof newFreedom !== 'undefined') agent.freedom = newFreedom;

    // Reset tenure
    agent.tenureLeft = this.sampleAgentTenureYears();

    // Force immediate reassessment across all managed stands
    var i;
    for (i = 0; i < agent.managedStands.length; i++) {
        var standId = agent.managedStands[i];
        fmengine.standId = standId;
        if (stand && stand.id > 0) {
            // Trigger cognition soon: let nextAssessmentYear be currentYear
            stand.setFlag('nextAssessmentYear', currentYear + 1);

        }
    }

    // Log mapping old->same (in-place) with generation bump
    var agentId = agent.agentId || agent.name || (this.type + "_agent");
    console.log("  > " + agentId + " in-place persona switch (gen " + agent.generation + ")");

    // Return the SAME reference (important for callers that expect a return value)
    return agent;
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

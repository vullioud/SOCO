// In: SOCO/src/core/SoCoABeAgent.js (Corrected ES5 Version)

function SoCoABeAgent(owner, agentId) {
    this.owner = owner;
    this.agentId = agentId;
    this.engineId = null;
    
    // Core Traits
    this.preferences = null;
    this.resources = null;
    this.riskTolerance = null;
    this.tenureLeft = 0;

    this.beliefs = { structure: { alpha: 1, beta: 1 } };
    this.generation = 1
;    // State
    this.managedStands = [];
    this.standStrategies = {};
    
    // Modules
    this.observationModule = new ObservationModule(this);
    this.cognitionModule = new CognitionModule(this);
    this.actionModule = new ActionModule(this);
    this.speciesModule = new SpeciesSelectionModule(this);
    this.standSnapshots = {};
}

SoCoABeAgent.prototype.observe = function() { this.observationModule.performObservation(); };
SoCoABeAgent.prototype.makeDecision = function(currentYear) { this.cognitionModule.makeDecision(currentYear); };

SoCoABeAgent.prototype.assignStands = function(standIds) {
    this.managedStands = standIds;
    standIds.forEach(function(id) { this.standStrategies[id] = null; }, this);
};

SoCoABeAgent.prototype.sampleFromOwner = function() {
    this.preferences = this.owner.sampleAgentPreferences();
    this.resources = this.owner.sampleAgentResources();
    this.riskTolerance = this.owner.sampleAgentRisk();
    this.tenureLeft = this.owner.sampleAgentTenureYears();

    this.managedStands.forEach(function(id) { 
        this.standStrategies[id] = 'Initial'; 
        fmengine.standId = id;
        if (stand && stand.id > 0) {
            stand.setFlag('nextAssessmentYear', SoCoABE_CONFIG.warmupPeriod + Math.floor(Math.random() * 10));
        }
    }, this);
};

SoCoABeAgent.prototype.updateBeliefs = function(noisyStructureScore) {
    var forgettingFactor = SoCoABE_CONFIG.AGENT.forgettingFactor;
    // The error occurred because 'this.beliefs' was undefined. It is now fixed.
    var params = Distributions.updateBeta(this.beliefs.structure.alpha, this.beliefs.structure.beta, noisyStructureScore, forgettingFactor);
    this.beliefs.structure.alpha = params.alpha;
    this.beliefs.structure.beta = params.beta;
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoCoABeAgent;
} else {
    this.SoCoABeAgent = SoCoABeAgent;
}
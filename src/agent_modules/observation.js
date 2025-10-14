// In: SOCO/src/agent_modules/observation.js (ES5 Compatible)
function ObservationModule(agent) {
    this.agent = agent;
    this.metricsMapper = new ForestMetricsMapper();
}

ObservationModule.prototype.performObservation = function() {
    var benchmark = this.agent.owner.institution.dynamicBenchmark;
    if (!benchmark || !benchmark.dbhStdDev) return;

    this.agent.standSnapshots = {};

    this.agent.managedStands.forEach(function(standId) {
        var snapshot = new StandSnapshot(standId);
        if (snapshot.isValid) {
            this.agent.standSnapshots[standId] = snapshot;
            var trueStructureScore = this.metricsMapper.normalize(snapshot.structure.dbhStdDev, benchmark.dbhStdDev.min, benchmark.dbhStdDev.max);
            var noiseLevel = Math.max(0, (1 - (this.agent.resources)) * 0.3);
            var noise = (Math.random() - 0.5) * 2 * noiseLevel;
            var noisyStructureScore = Math.max(0, Math.min(1, trueStructureScore + noise));
            this.agent.updateBeliefs(noisyStructureScore);
        }
    }, this); // Pass 'this' to forEach to maintain context
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObservationModule;
} else {
    this.ObservationModule = ObservationModule;
}
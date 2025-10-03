class ObservationModule {
    constructor(agent) {
        this.agent = agent;
        // --- THE FIX IS HERE ---
        // --- REMOVE ---
        // this.esMapper = new ESMapper();
        
        // +++ ADD +++
        // Use the correctly named ForestMetricsMapper class
        this.metricsMapper = new ForestMetricsMapper();
    }

    performObservation() {
        const benchmark = this.agent.owner.institution.dynamicBenchmark;
        if (!benchmark || !benchmark.dbhStdDev) return; // Guard against missing benchmark

        this.agent.standSnapshots = {};

        this.agent.managedStands.forEach(standId => {
            const snapshot = new StandSnapshot(standId);

            if (snapshot.isValid) {
                this.agent.standSnapshots[standId] = snapshot;

                // Normalize the observed structure score
                const trueStructureScore = this.metricsMapper.normalize(snapshot.structure.dbhStdDev, benchmark.dbhStdDev.min, benchmark.dbhStdDev.max);

                // Add noise to the observation based on agent resources
                const noiseLevel = Math.max(0, (1 - (this.agent.resources / 100)) * 0.3);
                const noise = (Math.random() - 0.5) * 2 * noiseLevel;
                const noisyStructureScore = Math.max(0, Math.min(1, trueStructureScore + noise));

                // Update the agent's belief about the structure
                this.agent.updateBeliefs(noisyStructureScore);
            }
        });
    }

        performObservationForStand(standId) {
        const benchmark = this.agent.owner.institution.dynamicBenchmark;
        const snapshot = new StandSnapshot(standId);

        if (snapshot.isValid) {
            this.agent.standSnapshots[standId] = snapshot;

            // This module's only job is to classify the stand state.
            // The logic for classification should be implemented here.
            // For now, we'll use placeholders.
            const structure = (snapshot.volume > 300) ? 'high_structure' : 'low_structure';
            const dominance = (snapshot.composition.dominantSpecies === 'piab') ? 'conifer_dominated' : 'broadleaf_dominated';

            // Store the assessment directly on the agent for the cognition module to use.
            if (!this.agent.standAssessments) {
                this.agent.standAssessments = {};
            }
            this.agent.standAssessments[standId] = { structure, dominance };
        }
    }
}

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObservationModule;
} else {
    this.ObservationModule = ObservationModule;
}
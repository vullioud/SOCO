// In src/agent_modules/observation.js

class ObservationModule {
    constructor(agent) {
        this.agent = agent;
        this.esMapper = new ESMapper();
    }

    performObservation() {
        // Get the up-to-date benchmark from the institution for this observation cycle.
        const benchmark = this.agent.owner.institution.dynamicBenchmark;

        let validStands = 0;
        let totalSatisfaction = 0;

        this.agent.managedStands.forEach(standId => {
            fmengine.standId = standId;
            if (stand && stand.id > 0) {
                // Pass the stand AND the benchmark to the ESMapper.
                const esScores = this.esMapper.mapForestMetricsToES(stand, benchmark);
                const noisyScores = this.esMapper.addObservationNoise(esScores, this.agent.resources / 100);

                // This part remains the same, but the underlying ES scores are now dynamically normalized. TO CHANGE! 
                const { overallSatisfaction: standSatisfaction } = Helpers.calculateSatisfaction(this.agent.preferences, [
                    { alpha: noisyScores.production * 10, beta: (1 - noisyScores.production) * 10 },
                    { alpha: noisyScores.biodiversity * 10, beta: (1 - noisyScores.biodiversity) * 10 },
                    { alpha: noisyScores.carbon * 10, beta: (1 - noisyScores.carbon) * 10 }
                ]);

                this.agent.standSatisfactions[standId] = standSatisfaction;
                totalSatisfaction += standSatisfaction;
                validStands++;
            }
        });

        if (validStands > 0) {
            this.agent.averageSatisfaction = totalSatisfaction / validStands;
            this.agent.satisfactionHistory.push(this.agent.averageSatisfaction);
        }
    }
}

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObservationModule;
} else {
    this.ObservationModule = ObservationModule;
}
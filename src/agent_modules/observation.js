// In src/agent_modules/observation.js

class ObservationModule {
    constructor(agent) {
        this.agent = agent;
        this.esMapper = new ESMapper();
    }

    performObservation() {
        const benchmark = this.agent.owner.institution.dynamicBenchmark;
        let validStands = 0;
        let totalSatisfaction = 0;
        
        this.agent.standSnapshots = {};

        this.agent.managedStands.forEach(standId => {
            // The constructor is now simpler
            const snapshot = new StandSnapshot(standId);

            if (snapshot.isValid) {
                this.agent.standSnapshots[standId] = snapshot;

                const esScores = this.esMapper.mapForestMetricsToES(snapshot, benchmark);
                const noisyScores = this.esMapper.addObservationNoise(esScores, this.agent.resources / 100);

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
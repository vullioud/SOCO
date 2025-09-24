// In src/agent_modules/ObservationModule.js

class ObservationModule {
    constructor(agent) {
        this.agent = agent; // Store a reference to the main agent object
        this.esMapper = new ESMapper();
    }

    performObservation() {
        let validStands = 0;
        let totalSatisfaction = 0;

        this.agent.managedStands.forEach(standId => {
            fmengine.standId = standId;
            if (stand && stand.id > 0) {
                const esScores = this.esMapper.mapForestMetricsToES(stand);
                const noisyScores = this.esMapper.addObservationNoise(esScores, this.agent.resources / 100);

                const { overallSatisfaction: standSatisfaction } = Helpers.calculateSatisfaction(this.agent.preferences, [
                    { alpha: noisyScores.production * 10, beta: (1 - noisyScores.production) * 10 },
                    { alpha: noisyScores.biodiversity * 10, beta: (1 - noisyScores.biodiversity) * 10 },
                    { alpha: noisyScores.carbon * 10, beta: (1 - noisyScores.carbon) * 10 }
                ]);

                // Update the agent's state directly
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObservationModule;
} else {
    this.ObservationModule = ObservationModule;
}
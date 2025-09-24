// In src/agent_modules/CognitionModule.js

class CognitionModule {
    constructor(agent) {
        this.agent = agent;
    }

    makeDecision() {
        const agent = this.agent;
        const overallSatisfaction = agent.averageSatisfaction;
        
        if (overallSatisfaction === -1) {
            console.log(`  > ${agent.agentId} has no satisfaction data, deferring decision.`);
            return { action: 'CONTINUE', reason: 'No satisfaction data' };
        }

        const precision = agent.calculateBeliefPrecision(); // This helper method can stay on the agent
        const switchProbability = Helpers.calculateSwitchProbability(overallSatisfaction, precision, agent.inertia);
        
        console.log(`  > ${agent.agentId} Avg Sat: ${overallSatisfaction.toFixed(3)}, Switch Prob: ${switchProbability.toFixed(3)}`);

        if (Math.random() < switchProbability) {
            return this.formulateSwitchStrategy();
        } else {
            return { action: 'CONTINUE', reason: 'Satisfaction is adequate' };
        }
    }

    formulateSwitchStrategy() {
        const agent = this.agent;
        const satisfactionThreshold = 0.5;
        const underperformingStandIds = agent.managedStands.filter(
            id => agent.standSatisfactions[id] < satisfactionThreshold
        );

        if (underperformingStandIds.length === 0) {
            return { action: 'CONTINUE', reason: 'Low avg satisfaction but no specific underperforming stands found' };
        }

        const newSTP = agent.owner.selectProtoSTP(agent.preferences);
        
        // Return a clear, structured decision object
        return {
            action: 'SWITCH_STRATEGY',
            targets: underperformingStandIds,
            newStpName: newSTP,
            reason: `${underperformingStandIds.length} stands are below satisfaction threshold.`
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CognitionModule;
} else {
    this.CognitionModule = CognitionModule;
}
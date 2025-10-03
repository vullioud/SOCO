// ----- Start of File: src/agent_modules/action.js -----

class ActionModule {
    constructor(agent) {
        this.agent = agent;
    }

    executeDecision(decision) {
         if (decision.action === 'CONTINUE') {
            return;
        }

        if (decision.action === 'SWITCH_STRATEGY') {
            const newStpName = decision.baseStpName;
            console.log(`  > ${this.agent.agentId} is switching strategy for stand ${decision.targetStand} to '${newStpName}'`);

            // Queue the action to apply the PRE-REGISTERED STP by its name.
            socoabeActionQueue.push({
                agentId: this.agent.agentId,
                standId: decision.targetStand,
                newStpName: newStpName
            });

            // Update the agent's internal record of which STP is applied to the stand.
            this.agent.standStrategies[decision.targetStand] = newStpName;
            this.agent.standsChangedThisYear++;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActionModule;
} else {
    this.ActionModule = ActionModule;
}

// ----- End of File: src/agent_modules/action.js -----
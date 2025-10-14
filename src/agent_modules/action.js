// ----- Start of File: src/agent_modules/action.js -----

function ActionModule(agent) {
    this.agent = agent;
}

ActionModule.prototype.executeDecision = function(decision) {
     if (decision.action === 'CONTINUE') {
        return;
    }

    if (decision.action === 'SWITCH_STRATEGY') {
        var newStpName = decision.baseStpName;
        console.log("  > " + this.agent.agentId + " is switching strategy for stand " + decision.targetStand + " to '" + newStpName + "'");

        socoabeActionQueue.push({
            agentId: this.agent.agentId,
            standId: decision.targetStand,
            newStpName: newStpName
        });

        this.agent.standStrategies[decision.targetStand] = newStpName;
        this.agent.standsChangedThisYear++;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActionModule;
} else {
    this.ActionModule = ActionModule;
}
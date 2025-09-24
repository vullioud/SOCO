
class ActionModule {
    constructor(agent) {
        this.agent = agent;
    }

    executeDecision(decision) {
        if (decision.action === 'CONTINUE') {
            console.log(`  > ${this.agent.agentId} decided to CONTINUE with existing strategies: ${decision.reason}`);
            return;
        }

        if (decision.action === 'SWITCH_STRATEGY') {
            console.log(`  > !!! ${this.agent.agentId} is SWITCHING STRATEGY: ${decision.reason}`);
            
            const newStpName = decision.newStpName;
            const standIdsToUpdate = decision.targets;
            
            this.agent.currentProtoSTP = newStpName;
            this.agent.switchCount++;
            this.agent.standsChangedThisYear = standIdsToUpdate.length;

            const newStpTemplate = PROTO_STPS[newStpName];
            if (!newStpTemplate) {
                console.error(`ActionModule: Cannot find new STP template: ${newStpName}`);
                return;
            }

            standIdsToUpdate.forEach(standId => {
                fmengine.standId = standId;
                if (stand && stand.id > 0) {
                    // This logic remains the same
                    const isCommitted = stand.U > 0 && stand.U < 120 && stand.absoluteAge > (stand.U * 0.8);
                    if (isCommitted) {
                        console.log(`  > Agent ${this.agent.agentId} deferred switching on committed stand ${standId}.`);
                    } else {
                        console.log(`  > ${this.agent.agentId} QUEUEING action for stand ${standId}: set STP to ${newStpName}`);
                        socoabeActionQueue.push({
                            agentId: this.agent.agentId,
                            standId: standId,
                            newStpName: newStpName
                        });
                        this.agent.standStrategies[standId] = newStpName;
                    }
                }
            });
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActionModule;
} else {
    this.ActionModule = ActionModule;
}
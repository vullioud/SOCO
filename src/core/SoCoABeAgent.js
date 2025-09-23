/**
 * Represents an individual decision-making agent in the SoCoABE model.
 * This version ONLY makes decisions and queues them for later execution.
 */
class SoCoABeAgent {
    constructor(owner, agentId) {
        this.owner = owner;
        this.agentId = agentId;
        this.preferences = null;
        this.resources = null;
        this.riskTolerance = null;
        this.freedom = null;
        this.age = 0;
        this.inertia = 0.5;
        this.beliefs = { production: { alpha: 1, beta: 1 }, biodiversity: { alpha: 1, beta: 1 }, carbon: { alpha: 1, beta: 1 } };
        this.managedStands = [];
        this.currentProtoSTP = null;
        this.standStrategies = {};
        this.lastObservation = 0;
        this.lastDecision = 0;
        this.monitoringCycle = 5;
        this.decisionCycle = 10;
        this.satisfactionHistory = [];
        this.satisfaction = -1; 
        this.actionHistory = [];
        this.switchCount = 0;
        this.tenureTotal = 0;
        this.tenureLeft = 0;
        this.generation = 1; 
    }

    assignStands(standIds) {
        this.managedStands = standIds;
        standIds.forEach(id => { this.standStrategies[id] = null; });
    }

    sampleFromOwner() {
        this.preferences = this.owner.sampleAgentPreferences();
        this.resources = this.owner.sampleAgentResources();
        this.riskTolerance = this.owner.sampleAgentRisk();
        this.freedom = this.owner.sampleAgentFreedom();
        this.age = Math.floor(this.owner.sampleAgentAge());
        this.tenureTotal = this.owner.sampleAgentTenureYears();
        this.tenureLeft = this.tenureTotal;
        // Monitoring and decision cycles scale with resources (more resources = more frequent actions)
        this.monitoringCycle = Math.max(1, Math.floor(10 - (this.resources / 10)));
        this.decisionCycle = Math.max(5, Math.floor(20 - (this.resources / 5)));
        if (this.owner.config.beliefPriors) {
            this.beliefs = JSON.parse(JSON.stringify(this.owner.config.beliefPriors));
        }
        this.currentProtoSTP = this.owner.selectProtoSTP(this.preferences);
    }

    observe() {
        const esMapper = new ESMapper();
        let totalObservations = { production: 0, biodiversity: 0, carbon: 0 };
        let validStands = 0;
        this.managedStands.forEach(standId => {
            fmengine.standId = standId;
            if (stand && stand.id > 0) {
                const esScores = esMapper.mapForestMetricsToES(stand);
                const resourceLevel = this.resources / 100;
                const noisyScores = esMapper.addObservationNoise(esScores, resourceLevel);
                Object.keys(totalObservations).forEach(key => totalObservations[key] += noisyScores[key]);
                validStands++;
            }
        });
        if (validStands > 0) {
            const avgObservations = {
                production: totalObservations.production / validStands,
                biodiversity: totalObservations.biodiversity / validStands,
                carbon: totalObservations.carbon / validStands
            };
            this.updateBeliefs(avgObservations);

            const { overallSatisfaction } = Helpers.calculateSatisfaction(this.preferences, Object.values(this.beliefs));
            this.satisfaction = overallSatisfaction;
            this.satisfactionHistory.push(this.satisfaction);
        }
    }

    updateBeliefs(observations) {
        const forgettingFactor =  SoCoABE_CONFIG.AGENT.forgettingFactor;
        Object.keys(observations).forEach(es => {
            if (this.beliefs[es]) {
                const { alpha, beta } = Distributions.updateBeta(this.beliefs[es].alpha, this.beliefs[es].beta, observations[es], forgettingFactor);
                this.beliefs[es].alpha = alpha;
                this.beliefs[es].beta = beta;
            }
        });
    }

    makeDecision() {
        // Satisfaction is now read directly from the agent's state
        const overallSatisfaction = this.satisfaction; 
        
        // If satisfaction has not been calculated yet, abort decision
        if (overallSatisfaction === -1) {
            console.log(`  > ${this.agentId} has no satisfaction data yet, deferring decision.`);
            return;
        }

        const precision = this.calculateBeliefPrecision();
        const switchProbability = Helpers.calculateSwitchProbability(overallSatisfaction, precision, this.inertia);
        
        console.log(`  > ${this.agentId} Satisfaction: ${overallSatisfaction.toFixed(3)}, Belief Precision: ${precision.toFixed(2)}, Switch Prob: ${switchProbability.toFixed(3)}`);

        if (Math.random() < switchProbability) {
            this.switchProtoSTP();
        } else {
            console.log(`  > ${this.agentId} decided to CONTINUE with STP: ${this.currentProtoSTP}`);
        }
    }
    
    calculateBeliefPrecision() {
        const precisions = Object.values(this.beliefs).map(b => b.alpha + b.beta);
        return precisions.reduce((a, b) => a + b, 0) / precisions.length;
    }

    switchProtoSTP() {
        const newSTP = this.owner.selectProtoSTP(this.preferences);
        if (newSTP !== this.currentProtoSTP) {
            console.log(`  > !!! ${this.agentId} WANTS TO SWITCH from ${this.currentProtoSTP} to ${newSTP} !!!`);
            this.currentProtoSTP = newSTP;
            this.switchCount++;
            this.queueStandUpdates();
        } else {
             console.log(`  > ${this.agentId} considered switching but selected the same STP again: ${newSTP}`);
        }
    }
    
    queueStandUpdates() {
        const newStpTemplate = PROTO_STPS[this.currentProtoSTP];
        if (!newStpTemplate || !newStpTemplate.U) {
            console.error(`Cannot find a valid U for new STP: ${this.currentProtoSTP}`);
            return;
        }

        this.managedStands.forEach(standId => {
            fmengine.standId = standId;
            if (stand && stand.id > 0) {
                const isCommittedToCurrentPlan = stand.U > 0 && stand.U < 120 && stand.absoluteAge > (stand.U * 0.8);
                
                if (isCommittedToCurrentPlan) {
                    console.log(`  > Agent ${this.agentId} deferred switching STP on committed stand ${standId} (Age: ${stand.absoluteAge.toFixed(0)} of ${stand.U}).`);
                } else {
                    console.log(`  > ${this.agentId} QUEUEING action for stand ${standId}: set STP to ${this.currentProtoSTP}`);
                    socoabeActionQueue.push({
                        agentId: this.agentId,
                        standId: standId,
                        newStpName: this.currentProtoSTP
                    });
                }
            }
        });
    }
}

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoCoABeAgent;
} else {
    this.SoCoABeAgent = SoCoABeAgent;
}
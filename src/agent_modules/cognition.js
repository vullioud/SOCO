// ----- Start of File: src/agent_modules/cognition.js (Enhanced) -----

class CognitionModule {
    constructor(agent) {
        this.agent = agent;
        this.dependencies = agent.owner.dependencies;
        this.metricsMapper = new ForestMetricsMapper();
    }

    makeDecision(currentYear) {
        this.agent.managedStands.forEach(standId => {
            const snapshot = this.agent.standSnapshots[standId];
            if (snapshot && snapshot.isValid && (snapshot.nextAssessmentYear <= currentYear)) {
                this.formulateNewStrategy(standId, currentYear);
            }
        });
    }

    weightedRandomChoice(choices) {
        const rand = Math.random();
        let cumulativeProb = 0;
        for (const choice of choices) {
            cumulativeProb += choice.probability;
            if (rand < cumulativeProb) {
                return choice.stp;
            }
        }
        return choices[choices.length - 1].stp;
    }

    formulateNewStrategy(standId, currentYear) {
        const snapshot = this.agent.standSnapshots[standId];
        const benchmark = this.agent.owner.institution.dynamicBenchmark;
        if (!benchmark || !benchmark.dbhStdDev) return;

        // --- NEW LOGIC TO BUILD THE FULL STP NAME ---

        // 1. Determine base STP from structure and owner type
        const ownerType = this.agent.owner.type;
        const structureScore = this.metricsMapper.normalize(snapshot.structure.dbhStdDev, benchmark.dbhStdDev.min, benchmark.dbhStdDev.max);
        const structureClass = this.metricsMapper.classifyStructure(structureScore);
        let speciesClass = this.metricsMapper.classifySpecies(snapshot.composition);
        if (speciesClass === 'mixed') {
            speciesClass = Math.random() < 0.5 ? 'conifer_dominated' : 'broadleaf_dominated';
        }
        
        const choices = this.dependencies.STP_DECISION_MATRIX[ownerType]?.[structureClass]?.[speciesClass];
        if (!choices) {
            console.error(`No choices found in matrix for: ${ownerType}, ${structureClass}, ${speciesClass}`);
            return;
        }
        const baseStpName = this.weightedRandomChoice(choices);

        // If 'no_management' is chosen, we don't need suffixes.
        if (baseStpName === 'no_management') {
            const finalStpName = 'no_management';
            this.logAndExecuteDecision(standId, finalStpName, currentYear);
            return;
        }

        // 2. Determine Species Choice suffix (_SC or _noSC)
        const speciesStrategy = this.agent.speciesModule.determineSpeciesStrategy();
        // A simple logic: if the strategy is to just use what's there ('IST' in your file), we don't need dynamic species choice.
        const speciesChoiceSuffix = (speciesStrategy === 'IST') ? '_noSC' : '_SC';

        // 3. Determine Speed suffix (_slow, _fast, or '')
        // Placeholder logic: Low resource agents work slower, high resource agents work faster.
        let speedSuffix = '';
        if (this.agent.resources < 40) speedSuffix = '_slow';
        if (this.agent.resources > 120) speedSuffix = '_fast';

        // 4. Assemble the final, valid STP name
        const finalStpName = `${baseStpName}${speciesChoiceSuffix}${speedSuffix}`;
        
        // 5. Log and execute the decision
        this.logAndExecuteDecision(standId, finalStpName, currentYear, speciesStrategy, structureClass);
    }

    logAndExecuteDecision(standId, newStpName, currentYear, speciesStrategy, structureClass) {
        const currentSTP = this.agent.standStrategies[standId] || 'Initial';
        
        let decisionLog = `> Agent ${this.agent.agentId} assessed stand ${standId}. Species Strategy: '${speciesStrategy}'. Structure: ${structureClass}. `;
        
        if (currentSTP === newStpName) {
            decisionLog += `Continuing with STP: ${newStpName}.`;
        } else {
            decisionLog += `Switching from ${currentSTP} to ${newStpName}.`;
        }
        console.log(decisionLog);

        fmengine.standId = standId;
        if (stand && stand.id > 0) {
            const newAssessmentYear = currentYear + 10;
            stand.setFlag('nextAssessmentYear', newAssessmentYear);
            stand.setFlag('targetSpecies', speciesStrategy); 
        }

        if (newStpName !== currentSTP) {
            const decision = {
                action: 'SWITCH_STRATEGY',
                targetStand: standId,
                baseStpName: newStpName, // Pass the final, correct name
                reason: `Strategy switch based on assessment.`
            };
            this.agent.actionModule.executeDecision(decision);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CognitionModule;
} else {
    this.CognitionModule = CognitionModule;
}
// ----- End of File: src/agent_modules/cognition.js -----
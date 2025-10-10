// ----- Start of File: src/agent_modules/cognition.js (Enhanced) -----

class CognitionModule {
    constructor(agent) {
        this.agent = agent;
        this.dependencies = agent.owner.dependencies;
        this.metricsMapper = new ForestMetricsMapper();
    }

    makeDecision(currentYear) {
        // --- Respect the enableReassessment debug flag ---
        if (SoCoABE_CONFIG.DEBUG.enableReassessment === false) {
            // If reassessment is disabled, only make a decision if no strategy has ever been set.
            // This now correctly handles newly created agents.
            this.agent.managedStands.forEach(standId => {
                if (!this.agent.standStrategies[standId] || this.agent.standStrategies[standId] === 'Initial') {
                     this.formulateNewStrategy(standId, currentYear);
                }
            });
            return; // Exit after this check
        }

        // --- Normal Re-assessment Logic ---
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

        if (SoCoABE_CONFIG.DEBUG && SoCoABE_CONFIG.DEBUG.forceSingleSTP) {
            const forcedStpName = SoCoABE_CONFIG.DEBUG.forceSingleSTP;
            // First, verify the forced STP name is valid before using it.
            if (!this.dependencies.BASE_STP_DEFINITIONS[forcedStpName]) {
                 console.error(`!!! DEBUG ERROR: The forced STP name '${forcedStpName}' is NOT a valid STP defined in base_STP_definitions.js. Aborting decision.`);
                 return;
            }
            this.logAndExecuteDecision(standId, forcedStpName, currentYear, 'FORCED_DEBUG', 'FORCED_DEBUG');
            return;
        }

        const snapshot = this.agent.standSnapshots[standId];
        const benchmark = this.agent.owner.institution.dynamicBenchmark;
        
        const resources = this.agent.resources; // Get the agent's 0-1 resource value
        const minSpeed = 0.7;
        const maxSpeed = 1.3;
        const speedFactor = minSpeed + resources * (maxSpeed - minSpeed);

        fmengine.standId = standId; // Set context to the correct stand
        if (stand && stand.id > 0) {
        stand.setFlag('agentSpeedFactor', speedFactor);
        }

        // --- ADD THESE GUARD CLAUSES ---
        if (!snapshot || !snapshot.isValid) {
            console.error(`Agent ${this.agent.agentId} cannot decide for stand ${standId}: Stand Snapshot is missing or invalid.`);
            return;
        }
        if (!benchmark || !benchmark.dbhStdDev || !benchmark.dbhStdDev.max) {
            console.error(`Agent ${this.agent.agentId} cannot decide for stand ${standId}: Dynamic Benchmark is not ready.`);
            return;
        }
        // --- END OF ADDED GUARD CLAUSES ---

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
            console.error(`No choices found in STP_DECISION_MATRIX for: Owner='${ownerType}', Structure='${structureClass}', Species='${speciesClass}'. Aborting decision for stand ${standId}.`);
            return; // This prevents proceeding with an undefined choice.
        }
        const baseStpName = this.weightedRandomChoice(choices);

        // If 'no_management' is chosen, we don't need suffixes.
        if (baseStpName === 'no_management') {
            const finalStpName = 'no_management';
            this.logAndExecuteDecision(standId, finalStpName, currentYear, 'None', structureClass); // Pass valid strings
            return;
        }

        // 2. Determine Species Choice suffix (_SC or _noSC)
        const speciesStrategy = this.agent.speciesModule.determineSpeciesStrategy();
        const speciesChoiceSuffix = (speciesStrategy === 'IST') ? '_noSC' : '_SC';

        // 4. Assemble the final, valid STP name
        const finalStpName = `${baseStpName}${speciesChoiceSuffix}`;
        
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


        if (newStpName !== currentSTP) {
            const decision = {
                action: 'SWITCH_STRATEGY',
                targetStand: standId,
                baseStpName: newStpName,
                // --- ADD speciesStrategy TO THE ACTION OBJECT ---
                speciesStrategy: speciesStrategy, 
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
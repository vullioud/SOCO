/**
 * The CognitionModule is the "brain" of the SoCoABE agent. It assesses stand conditions,
 * consults the agent's internal state and decision matrix, and formulates a management strategy.
 * This version is written in ES5 for compatibility with the iLand engine and includes
 * debugging switches to force specific behaviors.
 */
function CognitionModule(agent) {
    this.agent = agent;
    this.dependencies = agent.owner.dependencies;
    this.metricsMapper = new ForestMetricsMapper();
}

/**
 * The main decision-making entry point for the agent, called each year.
 * It determines which stands need a strategy re-assessment and triggers the process.
 * Obeys the `enableReassessment` debug flag.
 * @param {number} currentYear - The current simulation year.
 */
CognitionModule.prototype.makeDecision = function(currentYear) {
    // --- Respect the enableReassessment debug flag ---
    if (SoCoABE_CONFIG.DEBUG.enableReassessment === false) {
        // If reassessment is disabled, only make a decision if no strategy has ever been set.
        // This correctly handles newly created agents.
        this.agent.managedStands.forEach(function(standId) {
            if (!this.agent.standStrategies[standId] || this.agent.standStrategies[standId] === 'Initial') {
                 this.formulateNewStrategy(standId, currentYear);
            }
        }, this); // Pass 'this' to maintain context inside the forEach callback
        return; // Exit after this check
    }

    // --- Normal Re-assessment Logic ---
    this.agent.managedStands.forEach(function(standId) {
        var snapshot = this.agent.standSnapshots[standId];
        if (snapshot && snapshot.isValid && (snapshot.nextAssessmentYear <= currentYear)) {
            this.formulateNewStrategy(standId, currentYear);
        }
    }, this); // Pass 'this' to maintain context
};

/**
 * Selects an item from a list of choices based on their assigned probabilities.
 * @param {Array} choices - An array of objects, each with 'stp' and 'probability' properties.
 * @returns {string} The name of the chosen STP.
 */
CognitionModule.prototype.weightedRandomChoice = function(choices) {
    var rand = Math.random();
    var cumulativeProb = 0;
    for (var i = 0; i < choices.length; i++) {
        var choice = choices[i];
        cumulativeProb += choice.probability;
        if (rand < cumulativeProb) {
            return choice.stp;
        }
    }
    // Fallback in case of rounding errors
    return choices[choices.length - 1].stp;
};

/**
 * Formulates a new management strategy (STP) for a single stand.
 * This is the core cognitive process, which can be overridden by debug flags.
 * @param {number} standId - The ID of the stand to assess.
 * @param {number} currentYear - The current simulation year.
 */
CognitionModule.prototype.formulateNewStrategy = function(standId, currentYear) {

    // --- Handle the forceSingleSTP debug flag ---
    if (SoCoABE_CONFIG.DEBUG && SoCoABE_CONFIG.DEBUG.forceSingleSTP) {
        var forcedStpName = SoCoABE_CONFIG.DEBUG.forceSingleSTP;
        // Verify the forced STP name is a valid, registered STP before using it.
        if (!this.dependencies.BASE_STP_DEFINITIONS[forcedStpName]) {
             console.error("!!! DEBUG ERROR: The forced STP name '" + forcedStpName + "' is NOT a valid STP defined in base_STP_definitions.js. Aborting decision.");
             return;
        }
        this.logAndExecuteDecision(standId, forcedStpName, currentYear, 'FORCED_DEBUG', 'FORCED_DEBUG');
        return; // Bypass normal cognitive logic
    }

    var snapshot = this.agent.standSnapshots[standId];
    var benchmark = this.agent.owner.institution.dynamicBenchmark;
    
    // Set dynamic speed factor for activities
    var resources = this.agent.resources;
    var minSpeed = 0.7;
    var maxSpeed = 1.3;
    var speedFactor = minSpeed + resources * (maxSpeed - minSpeed);

    fmengine.standId = standId; // Set context to the correct stand
    if (stand && stand.id > 0) {
        stand.setFlag('agentSpeedFactor', speedFactor);
    }

    // --- Guard Clauses to prevent errors if data is not ready ---
    if (!snapshot || !snapshot.isValid) {
        console.error("Agent " + this.agent.agentId + " cannot decide for stand " + standId + ": Stand Snapshot is missing or invalid.");
        return;
    }
    if (!benchmark || !benchmark.dbhStdDev || !benchmark.dbhStdDev.max) {
        console.error("Agent " + this.agent.agentId + " cannot decide for stand " + standId + ": Dynamic Benchmark is not ready.");
        return;
    }

    // 1. Determine base STP from structure and owner type
    var ownerType = this.agent.owner.type;
    var structureScore = this.metricsMapper.normalize(snapshot.structure.dbhStdDev, benchmark.dbhStdDev.min, benchmark.dbhStdDev.max);
    var structureClass = this.metricsMapper.classifyStructure(structureScore);
    var speciesClass = this.metricsMapper.classifySpecies(snapshot.composition);
    if (speciesClass === 'mixed') {
        speciesClass = Math.random() < 0.5 ? 'conifer_dominated' : 'broadleaf_dominated';
    }
    
    var choices = this.dependencies.STP_DECISION_MATRIX[ownerType] &&
                  this.dependencies.STP_DECISION_MATRIX[ownerType][structureClass] &&
                  this.dependencies.STP_DECISION_MATRIX[ownerType][structureClass][speciesClass];

    if (!choices) {
        console.error("No choices found in STP_DECISION_MATRIX for: Owner='" + ownerType + "', Structure='" + structureClass + "', Species='" + speciesClass + "'. Aborting decision for stand " + standId + ".");
        return;
    }
    var baseStpName = this.weightedRandomChoice(choices);

    // If 'no_management' is chosen, no suffixes are needed.
    if (baseStpName === 'no_management') {
        this.logAndExecuteDecision(standId, 'no_management', currentYear, 'None', structureClass);
        return;
    }

    // 2. Determine Species Choice suffix (_SC or _noSC)
    var speciesStrategy = this.agent.speciesModule.determineSpeciesStrategy();
    var speciesChoiceSuffix = (speciesStrategy === 'IST') ? '_noSC' : '_SC';

    // 3. Assemble the final, valid STP name
    var finalStpName = baseStpName + speciesChoiceSuffix;
    
    // 4. Log and execute the decision
    this.logAndExecuteDecision(standId, finalStpName, currentYear, speciesStrategy, structureClass);
};

/**
 * Logs the agent's decision and, if a change is needed, creates a
 * decision object to be passed to the ActionModule.
 * @param {number} standId - The ID of the target stand.
 * @param {string} newStpName - The name of the newly chosen STP.
 * @param {number} currentYear - The current simulation year.
 * @param {string} speciesStrategy - The chosen species strategy (for logging).
 * @param {string} structureClass - The classified stand structure (for logging).
 */
CognitionModule.prototype.logAndExecuteDecision = function(standId, newStpName, currentYear, speciesStrategy, structureClass) {
    var currentSTP = this.agent.standStrategies[standId] || 'Initial';
    
    var decisionLog = "> Agent " + this.agent.agentId + " assessed stand " + standId + ". Species Strategy: '" + speciesStrategy + "'. Structure: " + structureClass + ". ";
    
    if (currentSTP === newStpName) {
        decisionLog += "Continuing with STP: " + newStpName + ".";
    } else {
        decisionLog += "Switching from " + currentSTP + " to " + newStpName + ".";
    }
    console.log(decisionLog);

    if (newStpName !== currentSTP) {
        var decision = {
            action: 'SWITCH_STRATEGY',
            targetStand: standId,
            baseStpName: newStpName,
            speciesStrategy: speciesStrategy, 
            reason: "Strategy switch based on assessment."
        };
        this.agent.actionModule.executeDecision(decision);
    }
};

// Universal Module Definition for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CognitionModule;
} else {
    this.CognitionModule = CognitionModule;
}
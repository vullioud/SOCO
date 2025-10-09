// ----- Start of File: src/integration/socoabe_main.js (Corrected)-----

var socoabeActionQueue = [];

class SoCoABeMain {
    constructor() {
        this.institution = null;
        this.agents = [];
        this.initialized = false;
    }

initialize() {
    if (this.initialized) return;
    console.log("--- Initializing SoCoABE Cognitive Layer ---");
    
    const dependencies = {
        Distributions,
        Helpers,
        ForestMetricsMapper,
        Owner, 
        SoCoABeAgent,
        OWNER_TYPE_CONFIGS,
        BASE_STP_DEFINITIONS, 
        STP_DECISION_MATRIX   
    };
    
    this.institution = new Institution();
    // The institution will now discover stands and agents by itself
    this.institution.initialize(dependencies); 
    
    this.owners = this.institution.owners;
    this.agents = this.institution.agents;
    
    this.initialized = true;
    console.log("--- SoCoABE Initialization Complete ---");

    Reporting.runPopulationValidation(this.owners, this.agents);
}

    update(year) {
        // The `update` function no longer handles initialization.
        if (!this.initialized) {
            console.error("FATAL: socoabe.update() called before initialize().");
            fmengine.abort("SoCoABE not initialized.");
            return;
        }
        
        console.log(`\n--- SoCoABE Update Cycle: Year ${year} ---`);
        
        socoabeActionQueue = [];

        if (this.agents.length > 0) {
            this.institution.updateDynamicBenchmark(year);
        }
        
        this.agents.forEach(agent => {
            agent.observe();
            agent.makeDecision(year);
            agent.tenureLeft = Math.max(0, agent.tenureLeft - 1);
        });

        if (SoCoABE_CONFIG.DEBUG.enableAgentTurnover) {
            this.handleAgentTurnover(year);
        }

        this.executeActions(year);

        // Reporting calls
        if (year % 5 === 0 || year === SoCoABE_CONFIG.warmupPeriod) { 
            Reporting.collectAgentLog(year, this.agents, this.institution);
            Reporting.collectStandLog(year, this.agents, this.institution);
        }
    }

    executeActions(year) {
    if (socoabeActionQueue.length === 0) return;

    console.log(`--- SoCoABE Action Phase: Executing ${socoabeActionQueue.length} queued actions ---`);
    
    socoabeActionQueue.forEach(action => {
        try {
            fmengine.standId = action.standId;
            if (stand && stand.id > 0) {
                stand.setSTP(action.newStpName);
                stand.setAbsoluteAge(0); 
                stand.setFlag('nextAssessmentYear', year + 10);
                if (action.speciesStrategy) {
                    stand.setFlag('targetSpecies', action.speciesStrategy);
                }
                // --- CORRECTED LINE ---
                console.log(`> Stand ${action.standId}: Agent ${stand.agent.name} switched STP to '${action.newStpName}'.`);
            }
        } catch (e) {
            console.error(`Error executing action for stand ${action.standId}: ${e.message}`);
        }
    });
    socoabeActionQueue = []; // Clear the queue
    }

    handleAgentTurnover(year) {
        const replacedAgentsLog = [];
        const newAgentsList = [...this.agents]; // Work on a copy

        for (let i = 0; i < newAgentsList.length; i++) {
            const agent = newAgentsList[i];
            if (agent.tenureLeft <= 0) {
                const owner = agent.owner;
                // Create the new "brain"
                const replacementAgent = owner.replaceAgent(agent, year);
                
                if (replacementAgent) {
                    replacedAgentsLog.push({ old: agent.agentId, neo: replacementAgent.agentId });
                    // Swap the old brain for the new one in our list
                    newAgentsList[i] = replacementAgent;
                    
                    // Also update the owner's internal list
                    const ownerAgentIndex = owner.agents.indexOf(agent);
                    if (ownerAgentIndex !== -1) {
                        owner.agents[ownerAgentIndex] = replacementAgent;
                    }
                }
            }
        }

        // Update the main agent lists
        this.agents = newAgentsList;
        this.institution.agents = this.agents;

        if (replacedAgentsLog.length > 0) {
            console.log(`--- Tenure turnover @ Year ${year}: replaced ${replacedAgentsLog.length} agents ---`);
            replacedAgentsLog.forEach(r => console.log(`  > ${r.old} -> ${r.neo}`));
        }
    }
}

var socoabe = new SoCoABeMain();


function run(year) {
    // --- Warm-up period logic is correct, keep it ---
    if (year < SoCoABE_CONFIG.warmupPeriod) {
        if (year === 1) {
            console.log(`--- SoCoABE is in warm-up until year ${SoCoABE_CONFIG.warmupPeriod}. ---`);
            // (Your debug logging here is good)
        }
        return;
    }
    
    try {
        // --- This part is CRUCIAL ---
        // 1. Ensure the model is initialized
        if (!socoabe.initialized) {
            // This now happens in onAfterInit, but it's a safe check.
            return; 
        }

        // 2. Run the cognitive cycle for all agents. This will fill the action queue.
        socoabe.update(year);

        // 3. Process the action queue to apply changes to the iLand world.
        if (socoabeActionQueue.length > 0) {
            const actionsToExecute = [...socoabeActionQueue]; // Make a copy
            socoabeActionQueue = []; // Clear the global queue for the next year

            console.log(`--- SoCoABE Action Phase: Executing ${actionsToExecute.length} queued actions for year ${year} ---`);
            
            actionsToExecute.forEach(action => {
                try {
                    // Set the context to the target stand
                    fmengine.standId = action.standId;
                    
                    if (stand && stand.id > 0) {
                        // **This is the link from Brain to Body**
                        stand.setSTP(action.newStpName);
                        
                        // Reset the management clock for this stand
                        stand.setAbsoluteAge(0);
                        
                        // Schedule the next cognitive assessment for this stand
                        const nextAssessmentYear = year + SoCoABE_CONFIG.AGENT.assessmentInterval;
                        stand.setFlag('nextAssessmentYear', nextAssessmentYear);
                        
                        // Re-initialize the stand's internal ABE state after changing STP
                        stand.initialize(); 

                    } else {
                        console.error(`Action Queue: Could not find or set context for stand ${action.standId}. Action skipped.`);
                    }
                } catch (e) {
                    console.error(`Error executing action for stand ${action.standId}: ${e.message}`, e.stack);
                }
            });
        }
        
        // 4. Run Reporting
        if (year % 5 === 0 || year === SoCoABE_CONFIG.warmupPeriod) { 
            Reporting.collectAgentLog(year, socoabe.agents, socoabe.institution);
            Reporting.collectStandLog(year, socoabe.agents, socoabe.institution);
        }

    } catch (error) {
        console.error(`SoCoABE run failed at year ${year}:`, error, error.stack);
        fmengine.abort("SoCoABE update failed.");
    }
}

function onBeforeDestroy() {
    console.log("--- Simulation finished. Calling onBeforeDestroy() to save logs. ---");
    if (socoabe && socoabe.initialized) {
        Reporting.saveLogsToFile();
    } else {
        console.log("SoCoABE object not ready, cannot save log file.");
    }
    console.log("--- onBeforeDestroy() complete. ---");
}

// ----- End of File: src/integration/socoabe_main.js -----```

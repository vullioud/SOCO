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



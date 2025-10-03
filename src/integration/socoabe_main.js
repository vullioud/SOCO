// ----- Start of File: src/integration/socoabe_main.js (Corrected)-----

var socoabeActionQueue = [];

class SoCoABeMain {
    constructor() {
        this.institution = null;
        this.owners = [];
        this.agents = [];
        this.initialized = false;
        this.currentYear = 0;
    }

    // --- MODIFIED ---
    // The initializeBaseSTPs method has been REMOVED from this file.
    // The call to it has also been REMOVED from the initialize() method below.
    initialize() {
        if (this.initialized) return;
        console.log("--- Initializing SoCoABE Simulation World ---");
        const standData = fmengine.standIds.map(id => ({ id: id }));
        
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
        this.institution.initialize(standData, dependencies);
        
        this.owners = this.institution.owners;
        this.agents = this.institution.agents;
        
        this.initialized = true;
        console.log("--- SoCoABE Initialization Complete ---");

        Reporting.runPopulationValidation(this.owners, this.agents);
    }

    update(year) {
        this.currentYear = year;
        if (!this.initialized) { this.initialize(); }
        
        console.log(`\n--- SoCoABE Update Cycle: Year ${year} ---`);
        
        if (this.agents.length > 0) {
            console.log("--- Updating Landscape Benchmark ---");
            this.institution.updateDynamicBenchmark(year);
        }
        
        this.agents.forEach(agent => {
            agent.observe();
            agent.makeDecision(year);
            agent.tenureLeft = Math.max(0, agent.tenureLeft - 1);
        });
        
        this.handleAgentTurnover(year);
    }

    handleAgentTurnover(year) {
        const replaced = [];
        for (let i = 0; i < this.agents.length; i++) {
            const agent = this.agents[i];
            if (agent.tenureLeft <= 0) {
                const owner = agent.owner;
                const replacement = owner.replaceAgent(agent, year);
                if (replacement) {
                    replaced.push({ old: agent.agentId, neo: replacement.agentId });
                    this.agents[i] = replacement;
                    const ownerAgentIndex = owner.agents.indexOf(agent);
                    if (ownerAgentIndex !== -1) {
                        owner.agents[ownerAgentIndex] = replacement;
                    }
                }
            }
        }
        this.institution.agents = this.agents;
        if (replaced.length > 0) {
            console.log(`--- Tenure turnover @ Year ${year}: replaced ${replaced.length} agents ---`);
        }
    }
}

var socoabe = new SoCoABeMain();

function run(year) {
    try {
        const warmup_period = 10; 
        if (year < warmup_period) {
            if (year === 1) {
                console.log(`--- SoCoABE model is in warm-up period until year ${warmup_period}. Forest is developing naturally. ---`);
            }
            return;
        }

        if (!socoabe.initialized) {
            socoabe.initialize();
        }
        
        socoabeActionQueue = [];
        socoabe.update(year);

        if (socoabeActionQueue.length > 0) {
            const actions = [...socoabeActionQueue];
            socoabeActionQueue = [];
            console.log(`--- SoCoABE Action Phase: Executing ${actions.length} queued actions ---`);
            
            actions.forEach(action => {
                try {
                    fmengine.standId = action.standId;
                    
                    if (stand && stand.id > 0) {
                        
                        const currentAge = stand.absoluteAge;
                        stand.setAbsoluteAge(0); 
                        stand.setSTP(action.newStpName);
                        stand.setAbsoluteAge(currentAge);
                        lib.initStandObj();

                    } else {
                        console.error(`Action Queue: Could not find or set context for stand ${action.standId}. Action skipped.`);
                    }
                } catch (e) {
                    console.error(`Error executing action for stand ${action.standId}: ${e.message}`);
                }
            });
        }
        
        if (year % 5 === 0 || year === warmup_period) { 
            Reporting.collectAgentLog(year, socoabe.agents, socoabe.institution);
            Reporting.collectStandLog(year, socoabe.agents, socoabe.institution);
        }
        
    } catch (error) {
        console.error(`SoCoABE run failed at year ${year}:`, error);
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

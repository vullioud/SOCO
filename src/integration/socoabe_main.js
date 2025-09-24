// In src/integration/socoabe_main.js

/**
 * SoCoABE Main Simulation Controller.
 * This class orchestrates the simulation by initializing the model components
 * and managing the annual update cycle. It delegates all reporting and logging
 * tasks to the 'Reporting' utility class.
 */
var socoabeActionQueue = [];

class SoCoABeMain {
    constructor() {
        this.institution = null;
        this.owners = [];
        this.agents = [];
        this.initialized = false;
        this.currentYear = 0;
    }

    initialize() {
        if (this.initialized) return;
        console.log("--- Initializing SoCoABE Simulation World ---");
        const standData = fmengine.standIds.map(id => ({ id: id }));
        const dependencies = { Distributions, Helpers, ESMapper, Owner, SoCoABeAgent, OWNER_TYPE_CONFIGS, PROTO_STPS, lib };
        
        this.institution = new Institution();
        this.institution.initialize(standData, dependencies);
        
        this.owners = this.institution.owners;
        this.agents = this.institution.agents;
        
        this.initialized = true;
        console.log("--- SoCoABE Initialization Complete ---");

        // Use the Reporting utility to validate the initial population
        Reporting.runPopulationValidation(this.owners, this.agents);
    }

    update(year) {
        this.currentYear = year;
        if (!this.initialized) { this.initialize(); }
        
        console.log(`\n--- SoCoABE Update Cycle: Year ${year} ---`);
        
        this.agents.forEach(agent => { agent.standsChangedThisYear = 0; });

        this.agents.forEach(agent => {
            if (year % agent.monitoringCycle === 0) agent.observe();
            if (year % agent.decisionCycle === 0) agent.makeDecision();
            agent.age++;
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
                        stand.setSTP(action.newStpName);
                        lib.initStandObj();
                        stand.setAbsoluteAge(0); 
                    }
                } catch (e) {
                    console.error(`Error executing action for stand ${action.standId}: ${e.message}`);
                }
            });
        }
        
        // Use the Reporting utility to collect this year's log data
        if (year % 5 === 0 || year === 1) { 
            Reporting.collectAgentLog(year, socoabe.agents);
        }
        
    } catch (error) {
        console.error(`SoCoABE run failed at year ${year}:`, error);
    }
}

function onBeforeDestroy() {
    console.log("--- Simulation finished. Calling onBeforeDestroy() to save logs. ---");
    if (socoabe && socoabe.initialized) {
        // Use the Reporting utility to save the final log file
        Reporting.saveLogToFile();
    } else {
        console.log("SoCoABE object not ready, cannot save log file.");
    }
    console.log("--- onBeforeDestroy() complete. ---");
}
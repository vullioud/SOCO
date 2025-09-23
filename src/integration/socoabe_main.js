/**
 * SoCoABE Main Simulation Controller
 */
var socoabeActionQueue = [];

class SoCoABeMain {
    constructor() {
        this.institution = null;
        this.agents = [];
        this.initialized = false;
        this.currentYear = 0;
        this.agentLogData = [];
        this.isAgentLogInitialized = false;
    }

initialize() {
    if (this.initialized) return;
    console.log("--- Initializing SoCoABE Simulation World ---");
    const standData = fmengine.standIds.map(id => ({ id: id }));
    const dependencies = { Distributions, Helpers, ESMapper, Owner, SoCoABeAgent, OWNER_TYPE_CONFIGS, PROTO_STPS, lib };
    
    this.institution = new Institution();
    this.institution.initialize(standData, dependencies);
    
    // Link the created owners and agents from the institution to this main controller
    this.owners = this.institution.owners;
    this.agents = this.institution.agents;
    // ============================================================================
    
    this.initialized = true;
    console.log("--- SoCoABE Initialization Complete ---");
    
    this.runPopulationValidation();
}

    update(year) {
        // ... (this function remains unchanged)
        this.currentYear = year;
        if (!this.initialized) { this.initialize(); }
        console.log(`\n--- SoCoABE Update Cycle: Year ${year} ---`);
        this.agents.forEach(agent => {
            if (year % agent.monitoringCycle === 0) agent.observe();
            if (year % agent.decisionCycle === 0) agent.makeDecision();
            agent.age++;
            agent.tenureLeft = Math.max(0, agent.tenureLeft - 1);
        });
        this.handleAgentTurnover(year);
    }
    
    collectAgentLog(year) {
        // ... (this function remains unchanged)
        if (!this.agents || this.agents.length === 0) return;
        if (!this.isAgentLogInitialized) {
            this.agentLogData.push('year,agentId,ownerType,age,tenureLeft,pref_prod,pref_bio,pref_carb,belief_prod,belief_bio,belief_carb,satisfaction,switchCount,currentSTP,managedStandCount');
            this.isAgentLogInitialized = true;
        }
        this.agents.forEach(agent => {
            const b_prod = agent.beliefs.production.alpha / (agent.beliefs.production.alpha + agent.beliefs.production.beta);
            const b_bio = agent.beliefs.biodiversity.alpha / (agent.beliefs.biodiversity.alpha + agent.beliefs.biodiversity.beta);
            const b_carb = agent.beliefs.carbon.alpha / (agent.beliefs.carbon.alpha + agent.beliefs.carbon.beta);
            const satisfaction = agent.satisfactionHistory.length > 0 ? agent.satisfactionHistory[agent.satisfactionHistory.length - 1] : -1;
            const row = [year, agent.agentId, agent.owner.type, agent.age, agent.tenureLeft, agent.preferences[0].toFixed(3), agent.preferences[1].toFixed(3), agent.preferences[2].toFixed(3), b_prod.toFixed(3), b_bio.toFixed(3), b_carb.toFixed(3), satisfaction.toFixed(3), agent.switchCount, agent.currentProtoSTP, agent.managedStands.length].join(',');
            this.agentLogData.push(row);
        });
    }

    saveLogToFile() {
        // ... (this function remains unchanged)
        console.log("--- Preparing to save SoCoABE agent log. ---");
        if (this.agentLogData.length > 1) {
            const filePath = Globals.path("output/socoabe_agent_log.csv");
            const fileContent = this.agentLogData.join('\n');
            console.log(`Attempting to save ${this.agentLogData.length} rows to: ${filePath}`);
            try {
                Globals.saveTextFile(filePath, fileContent);
                console.log("--- Agent log successfully saved! ---");
            } catch (e) {
                console.error("ERROR during Globals.saveTextFile call:", e.message);
            }
        } else {
            console.log("No agent log data collected, skipping file write.");
        }
    }

    handleAgentTurnover(year) {
        // ... (this function remains unchanged)
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

   
    runPopulationValidation() {
        console.log("\n--- Running Agent Population Validation & Visualization Report ---");
        if (!this.agents || this.agents.length === 0) {
            console.log("No agents to validate.");
            return;
        }
        const populationReport = this.generatePopulationReport();
        this.printPopulationSummary(populationReport);
        this.savePopulationReportToFile(populationReport); // Note: This function now has a different name
        console.log("--- Validation Complete. Check 'output/population_report.json' for details. ---\n");
    }

    generatePopulationReport() {
        const report = {};
        this.owners.forEach(owner => {
            const ownerAgents = this.agents.filter(a => a.owner.type === owner.type);
            if (ownerAgents.length === 0) return;
            report[owner.type] = {
                config: {
                    esPreferences: owner.config.esPreferences,
                    riskTolerance: owner.config.riskTolerance,
                    resources: owner.config.resources
                },
                agents: ownerAgents.map(agent => ({
                    agentId: agent.agentId,
                    preferences: agent.preferences,
                    riskTolerance: agent.riskTolerance,
                    resources: agent.resources,
                    freedom: agent.freedom,
                    initialAge: agent.age,
                    monitoringCycle: agent.monitoringCycle,
                    decisionCycle: agent.decisionCycle
                }))
            };
        });
        return report;
    }

    printPopulationSummary(report) {
        for (const ownerType in report) {
            const data = report[ownerType];
            console.log(`\n--- Owner: ${ownerType.toUpperCase()} (${data.agents.length} agents) ---`);
            const riskTol = data.agents.map(a => a.riskTolerance);
            const avgRisk = riskTol.reduce((a, b) => a + b, 0) / riskTol.length;
            console.log(`Risk Tolerance (Beta α=${data.config.riskTolerance.alpha}, β=${data.config.riskTolerance.beta}):`);
            console.log(`  - Avg Sampled: ${avgRisk.toFixed(3)} (Theoretical Mean: ${(data.config.riskTolerance.alpha / (data.config.riskTolerance.alpha + data.config.riskTolerance.beta)).toFixed(3)})`);
            const res = data.agents.map(a => a.resources);
            const avgRes = res.reduce((a, b) => a + b, 0) / res.length;
            console.log(`Resources (Gamma α=${data.config.resources.alpha}, θ=${data.config.resources.scale}):`);
            console.log(`  - Avg Sampled: ${avgRes.toFixed(3)} (Theoretical Mean: ${(data.config.resources.alpha * data.config.resources.scale).toFixed(3)})`);
        }
    }

    savePopulationReportToFile(report) {
        try {
            const filePath = Globals.path("output/population_report.json");
            const fileContent = JSON.stringify(report, null, 2); // Pretty-print JSON
            Globals.saveTextFile(filePath, fileContent);
            console.log(`\nSuccessfully saved detailed population report to: ${filePath}`);
        } catch (e) {
            console.error(`ERROR saving population report: ${e.message}`);
        }
    }
    // ============================================================================
    // ===== END OF MOVED FUNCTIONS ===============================================
    // ============================================================================

} // <-- THIS IS THE END OF THE SoCoABeMain CLASS

// These definitions are now correctly in the global scope
var socoabe = new SoCoABeMain();

function run(year) {
    // ... (this function remains unchanged)
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
        if (year % 5 === 0 || year === 1) { 
            socoabe.collectAgentLog(year);
        }
    } catch (error) {
        console.error(`SoCoABE run failed at year ${year}:`, error);
    }
}

function onBeforeDestroy() {
    // ... (this function remains unchanged)
    console.log("--- Simulation finished. Calling onBeforeDestroy() to save logs. ---");
    if (socoabe && socoabe.initialized) {
        socoabe.saveLogToFile();
    } else {
        console.log("SoCoABE object not ready, cannot save log file.");
    }
    console.log("--- onBeforeDestroy() complete. ---");
}
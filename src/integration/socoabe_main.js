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
        this.agents = this.institution.agents;
        this.initialized = true;
        console.log("--- SoCoABE Initialization Complete ---");
    }

    update(year) {
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
      console.log("--- Preparing to save SoCoABE agent log. ---");
        if (this.agentLogData.length > 1) {
        // ============================================================================
        // ===== THE FIX IS HERE ======================================================
        // ============================================================================
        // OLD LINE: const filePath = Globals.projectDirectory + "/socoabe_agent_log.csv";
        // We use Globals.path() to correctly create a path inside the project's output folder.
        const filePath = Globals.path("output/socoabe_agent_log.csv");
        // ============================================================================

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
        const replaced = [];
        // Use a traditional for loop for safe in-place modification
        for (let i = 0; i < this.agents.length; i++) {
            const agent = this.agents[i];
            
            if (agent.tenureLeft <= 0) {
                const owner = agent.owner;
                const replacement = owner.replaceAgent(agent, year);
                
                if (replacement) {
                    replaced.push({ old: agent.agentId, neo: replacement.agentId });

                    // ** THE CRITICAL FIX **
                    // 1. Replace the agent in the main simulation list
                    this.agents[i] = replacement;

                    // 2. Find and replace the agent in its owner's list
                    const ownerAgentIndex = owner.agents.indexOf(agent);
                    if (ownerAgentIndex !== -1) {
                        owner.agents[ownerAgentIndex] = replacement;
                    }
                }
            }
        }
        
        // Also update the institution's reference to the master list
        this.institution.agents = this.agents;

        if (replaced.length > 0) {
            console.log(`--- Tenure turnover @ Year ${year}: replaced ${replaced.length} agents ---`);
        }
    }
}

var socoabe = new SoCoABeMain();

function run(year) {
    try {
        // Initialize on the first run if needed.
        if (!socoabe.initialized) {
            socoabe.initialize();
        }
        
        // 1. Reset the global queue for the new year's cycle.
        socoabeActionQueue = [];
        
        // 2. Run the update loop, where agents will add their desired actions to the queue.
        socoabe.update(year);

        // 3. Check if any actions were queued during the update.
        if (socoabeActionQueue.length > 0) {
            
            // 4. Create a safe, local copy of the actions for this cycle.
            const actions = [...socoabeActionQueue];
            
            // 5. Immediately clear the global queue so it's ready for the next cycle.
            socoabeActionQueue = [];
            
            console.log(`--- SoCoABE Action Phase: Executing ${actions.length} queued actions ---`);
            
            // 6. Iterate over the local copy to execute the actions.
            actions.forEach(action => {
                try {
                    fmengine.standId = action.standId;
                    if (stand && stand.id > 0) {
                        stand.setSTP(action.newStpName);
                        lib.initStandObj();
                        // Reset the stand's age to 0 to start the new rotation.
                        stand.setAbsoluteAge(0); 
                    }
                } catch (e) {
                    console.error(`Error executing action for stand ${action.standId}: ${e.message}`);
                }
            });
        }
        
        // 7. Collect data for the log file periodically.
        if (year % 5 === 0 || year === 1) { 
            socoabe.collectAgentLog(year);
        }
        
    } catch (error) {
        console.error(`SoCoABE run failed at year ${year}:`, error);
    }
}

// ============================================================================
// ===== THIS IS THE NEWLY ADDED FUNCTION TO FIX THE SAVING ISSUE =============
// ============================================================================
/**
 * This is a standard iLand event handler that is called once after the
 * simulation has finished running. It's the perfect place to save log files.
 */
function onBeforeDestroy() {
    console.log("--- Simulation finished. Calling onBeforeDestroy() to save logs. ---");
    if (socoabe && socoabe.initialized) {
        socoabe.saveLogToFile();
    } else {
        console.log("SoCoABE object not ready, cannot save log file.");
    }
    console.log("--- onBeforeDestroy() complete. ---");
}
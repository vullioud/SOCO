// In src/utils/reporting.js

/**
 * A utility class with static methods for handling all simulation reporting,
 * including population validation, periodic logging, and final file saving.
 */
class Reporting {
    // NOTE: The static properties are now defined OUTSIDE and AFTER the class block.
    // The static METHODS remain inside the class.

    /**
     * Runs a full validation and reporting sequence on the initial agent population.
     * @param {Owner[]} owners - The array of Owner objects.
     * @param {SoCoABeAgent[]} agents - The array of SoCoABeAgent objects.
     */
    static runPopulationValidation(owners, agents) {
        console.log("\n--- Running Agent Population Validation & Visualization Report ---");
        if (!agents || agents.length === 0) {
            console.log("No agents to validate.");
            return;
        }

        const populationReport = this.generatePopulationReport(owners, agents);
        this.printPopulationSummary(populationReport);
        this.savePopulationReportToFile(populationReport);

        console.log("--- Validation Complete. Check 'output/population_report.json' for details. ---\n");
    }

    /**
     * Generates a structured object of all agent characteristics for external analysis.
     * @param {Owner[]} owners - The array of Owner objects.
     * @param {SoCoABeAgent[]} agents - The array of SoCoABeAgent objects.
     * @returns {object} The population report object.
     */
    static generatePopulationReport(owners, agents) {
        const report = {};
        owners.forEach(owner => {
            const ownerAgents = agents.filter(a => a.owner.type === owner.type);
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
                    initialAge: agent.age
                }))
            };
        });
        return report;
    }

    /**
     * Prints a summary of the initial agent population to the iLand console.
     * @param {object} report - The report from generatePopulationReport.
     */
    static printPopulationSummary(report) {
        for (const ownerType in report) {
            const data = report[ownerType];
            console.log(`\n--- Owner: ${ownerType.toUpperCase()} (${data.agents.length} agents) ---`);
            const riskTol = data.agents.map(a => a.riskTolerance);
            const avgRisk = riskTol.reduce((a, b) => a + b, 0) / riskTol.length;
            console.log(`Risk Tolerance (Beta α=${data.config.riskTolerance.alpha}, β=${data.config.riskTolerance.beta}):`);
            console.log(`  - Avg Sampled: ${avgRisk.toFixed(3)} (Theoretical Mean: ${(data.config.riskTolerance.alpha / (data.config.riskTolerance.alpha + data.config.riskTolerance.beta)).toFixed(3)})`);
        }
    }

    /**
     * Saves the detailed population report to a JSON file.
     * @param {object} report - The report from generatePopulationReport.
     */
    static savePopulationReportToFile(report) {
        try {
            const filePath = Globals.path("output/population_report.json");
            const fileContent = JSON.stringify(report, null, 2);
            Globals.saveTextFile(filePath, fileContent);
            console.log(`\nSuccessfully saved population report to: ${filePath}`);
        } catch (e) {
            console.error(`ERROR saving population report: ${e.message}`);
        }
    }

    /**
     * Collects and formats data from all agents for the yearly CSV log.
     * @param {number} year - The current simulation year.
     * @param {SoCoABeAgent[]} agents - The array of SoCoABeAgent objects.
     */
    static collectAgentLog(year, agents) {
        if (!agents || agents.length === 0) return;
        
        if (!this.isAgentLogInitialized) {
            this.agentLogData.push('year,agentId,ownerType,standId,age,tenureLeft,pref_prod,pref_bio,pref_carb,stand_satisfaction,currentSTP,agent_avg_satisfaction,stands_changed_stp,stp_coherence');
            this.isAgentLogInitialized = true;
        }
    
        agents.forEach(agent => {
            const agentAvgSatisfaction = agent.averageSatisfaction;
            const standsChangedStp = agent.standsChangedThisYear;
            const uniqueStps = new Set(Object.values(agent.standStrategies));
            const stpCoherence = agent.managedStands.length / (uniqueStps.size > 0 ? uniqueStps.size : 1);

            agent.managedStands.forEach(standId => {
                const standSatisfaction = agent.standSatisfactions[standId] !== undefined ? agent.standSatisfactions[standId] : -1;
                const currentSTP = agent.standStrategies[standId] || agent.currentProtoSTP;
    
                const row = [
                    year, agent.agentId, agent.owner.type, standId, agent.age, agent.tenureLeft,
                    agent.preferences[0].toFixed(3), agent.preferences[1].toFixed(3), agent.preferences[2].toFixed(3),
                    standSatisfaction.toFixed(3), currentSTP, agentAvgSatisfaction.toFixed(3),
                    standsChangedStp, stpCoherence.toFixed(2)
                ].join(',');
                
                this.agentLogData.push(row);
            });
        });
    }

    /**
     * Saves the collected agent log data to a CSV file.
     */
    static saveLogToFile() {
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
}

// ============================================================================
// ===== THE FIX IS HERE: Define static properties on the class constructor =====
// ============================================================================
Reporting.agentLogData = [];
Reporting.isAgentLogInitialized = false;
// ============================================================================


// Universal Module Definition for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Reporting;
} else {
    this.Reporting = Reporting;
}
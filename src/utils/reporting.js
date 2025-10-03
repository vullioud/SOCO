// In src/utils/reporting.js

/**
 * A utility class with static methods for handling all simulation reporting,
 * including population validation, periodic logging, and final file saving.
 */
class Reporting {
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
     */
    static collectAgentLog(year, agents, institution) {
        if (!agents || agents.length === 0) return;
        
        if (!Reporting.isAgentLogInitialized) {
            const newHeader = [
                'year', 'agentId', 'ownerType', 'standId', 'currentSTP', 'tenureLeft',
                'pref_prod', 'pref_bio', 'pref_carb',
                'agent_managed_stands', 'agent_unique_stps', 'agent_stp_coherence',
                'bm_vol_min', 'bm_vol_max', 'bm_spec_min', 'bm_spec_max'
            ].join(',');
            Reporting.agentLogData.push(newHeader);
            Reporting.isAgentLogInitialized = true;
        }
    
        const benchmark = institution.dynamicBenchmark || {};
        const bm_vol = benchmark.volume || { min: -1, max: -1 };
        const bm_spec = benchmark.speciesCount || { min: -1, max: -1 };

        agents.forEach(agent => {
            const managedStandsCount = agent.managedStands.length;
            const uniqueStps = new Set(Object.values(agent.standStrategies));
            const uniqueStpsCount = uniqueStps.size > 0 ? uniqueStps.size : 1;
            const stpCoherence = managedStandsCount / uniqueStpsCount;

            agent.managedStands.forEach(standId => {
                const currentSTP = agent.standStrategies[standId] || 'None';
    
                const row = [
                    year, agent.agentId, agent.owner.type, standId, currentSTP, agent.tenureLeft,
                    agent.preferences[0].toFixed(3), agent.preferences[1].toFixed(3), agent.preferences[2].toFixed(3),
                    managedStandsCount, uniqueStpsCount, stpCoherence.toFixed(2),
                    bm_vol.min.toFixed(2), bm_vol.max.toFixed(2),
                    bm_spec.min.toFixed(0), bm_spec.max.toFixed(0)
                ].join(',');
                
                Reporting.agentLogData.push(row);
            });
            
            agent.standsChangedThisYear = 0;
        });
    }

    /**
     * NEW FUNCTION: Collects detailed data for each stand.
     */
    static collectStandLog(year, agents, institution) {
        if (!agents || agents.length === 0) return;

        if (!Reporting.isStandLogInitialized) {
            const newHeader = [
                'year', 'standId', 'agentId', 'ownerType', 'currentSTP', 'age', 'volume', 'basalArea',
                'structure_dbh_stddev', 'structure_score_normalized', 'structure_class',
                'species_class', 'dominant_species', 'species_count', 'species_distribution'
            ].join(',');
            Reporting.standLogData.push(newHeader);
            Reporting.isStandLogInitialized = true;
        }

        const benchmark = institution.dynamicBenchmark;
        if (!benchmark || !benchmark.dbhStdDev) return; // Wait for benchmark to be ready

        const metricsMapper = new ForestMetricsMapper();

        agents.forEach(agent => {
            agent.managedStands.forEach(standId => {
                const snapshot = agent.standSnapshots[standId];
                if (!snapshot || !snapshot.isValid) return;

                const currentSTP = agent.standStrategies[standId] || 'None';
                
                // Calculate structure metrics
                const rawStructureValue = snapshot.structure.dbhStdDev;
                const normalizedScore = metricsMapper.normalize(rawStructureValue, benchmark.dbhStdDev.min, benchmark.dbhStdDev.max);
                const structureClass = metricsMapper.classifyStructure(normalizedScore);
                
                // Get species metrics
                const speciesClass = metricsMapper.classifySpecies(snapshot.composition);
                
                // Format species distribution object into a string: "piab:0.75|fasy:0.25"
                const speciesDistString = Object.entries(snapshot.composition.distribution)
                    .map(([species, share]) => `${species}:${share.toFixed(2)}`)
                    .join('|');

                const row = [
                    year, snapshot.id, agent.agentId, agent.owner.type, currentSTP, snapshot.age.toFixed(1),
                    snapshot.volume.toFixed(2), snapshot.basalArea.toFixed(2),
                    rawStructureValue.toFixed(2), normalizedScore.toFixed(3), structureClass,
                    speciesClass, snapshot.composition.dominantSpecies, snapshot.composition.speciesCount,
                    speciesDistString
                ].join(',');

                Reporting.standLogData.push(row);
            });
        });
    }
 
    /**
     * MODIFIED FUNCTION: Saves all collected log data to their respective CSV files.
     */
    static saveLogsToFile() {
        console.log("--- Preparing to save SoCoABE logs. ---");
        this._saveAgentLog();
        this._saveStandLog();
    }

    /**
     * Private helper to save the agent log.
     */
    static _saveAgentLog() {
        if (Reporting.agentLogData.length > 1) {
            const filePath = Globals.path("output/socoabe_agent_log.csv");
            const fileContent = Reporting.agentLogData.join('\n');
            console.log(`Attempting to save ${Reporting.agentLogData.length} agent log rows to: ${filePath}`);
            try {
                Globals.saveTextFile(filePath, fileContent);
                console.log("--- Agent log successfully saved! ---");
            } catch (e) {
                console.error("ERROR during agent log save:", e.message);
            }
        } else {
            console.log("No agent log data collected, skipping file write.");
        }
    }

    /**
     * NEW Private helper to save the stand log.
     */
    static _saveStandLog() {
        if (Reporting.standLogData.length > 1) {
            const filePath = Globals.path("output/socoabe_stand_log.csv");
            const fileContent = Reporting.standLogData.join('\n');
            console.log(`Attempting to save ${Reporting.standLogData.length} stand log rows to: ${filePath}`);
            try {
                Globals.saveTextFile(filePath, fileContent);
                console.log("--- Stand log successfully saved! ---");
            } catch (e) {
                console.error("ERROR during stand log save:", e.message);
            }
        } else {
            console.log("No stand log data collected, skipping file write.");
        }
    }
}

// Initialize static properties for both logs
Reporting.agentLogData = [];
Reporting.isAgentLogInitialized = false;
Reporting.standLogData = [];
Reporting.isStandLogInitialized = false;

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Reporting;
} else {
    this.Reporting = Reporting;
}
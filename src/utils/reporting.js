// In: src/utils/reporting.js (Corrected ES5 Version)

/**
 * A utility object with static-like methods for handling all simulation reporting,
 * including population validation, periodic logging, and final file saving.
 */
var Reporting = {
    // --- Properties to hold log data ---
    agentLogData: [],
    isAgentLogInitialized: false,
    standLogData: [],
    isStandLogInitialized: false,

    /**
     * Runs a full validation and reporting sequence on the initial agent population.
     * @param {Owner[]} owners - The array of Owner objects.
     * @param {SoCoABeAgent[]} agents - The array of SoCoABeAgent objects.
     */
    runPopulationValidation: function(owners, agents) {
        console.log("\n--- Running Agent Population Validation & Visualization Report ---");
        if (!agents || agents.length === 0) {
            console.log("No agents to validate.");
            return;
        }

        var populationReport = this.generatePopulationReport(owners, agents);
        this.printPopulationSummary(populationReport);
        this.savePopulationReportToFile(populationReport);

        console.log("--- Validation Complete. Check 'output/population_report.json' for details. ---\n");
    },

    /**
     * Generates a structured object of all agent characteristics for external analysis.
     */
    generatePopulationReport: function(owners, agents) {
        var report = {};
        owners.forEach(function(owner) {
            var ownerAgents = agents.filter(function(a) { return a.owner.type === owner.type; });
            if (ownerAgents.length === 0) return;

            report[owner.type] = {
                config: {
                    esPreferences: owner.config.esPreferences,
                    riskTolerance: owner.config.riskTolerance,
                    resources: owner.config.resources
                },
                agents: ownerAgents.map(function(agent) {
                    return {
                        agentId: agent.agentId,
                        preferences: agent.preferences,
                        riskTolerance: agent.riskTolerance,
                        resources: agent.resources,
                        freedom: agent.freedom,
                        initialAge: agent.age
                    };
                })
            };
        });
        return report;
    },

    /**
     * Prints a summary of the initial agent population to the iLand console.
     */
    printPopulationSummary: function(report) {
        for (var ownerType in report) {
            var data = report[ownerType];
            console.log("\n--- Owner: " + ownerType.toUpperCase() + " (" + data.agents.length + " agents) ---");
            var riskTol = data.agents.map(function(a) { return a.riskTolerance; });
            var avgRisk = riskTol.reduce(function(a, b) { return a + b; }, 0) / riskTol.length;
            console.log("Risk Tolerance (Beta α=" + data.config.riskTolerance.alpha + ", β=" + data.config.riskTolerance.beta + "):");
            console.log("  - Avg Sampled: " + avgRisk.toFixed(3) + " (Theoretical Mean: " + (data.config.riskTolerance.alpha / (data.config.riskTolerance.alpha + data.config.riskTolerance.beta)).toFixed(3) + ")");
        }
    },

    /**
     * Saves the detailed population report to a JSON file.
     */
    savePopulationReportToFile: function(report) {
        try {
            var filePath = Globals.path("output/population_report.json");
            var fileContent = JSON.stringify(report, null, 2);
            Globals.saveTextFile(filePath, fileContent);
            console.log("\nSuccessfully saved population report to: " + filePath);
        } catch (e) {
            console.error("ERROR saving population report: " + e.message);
        }
    },

    /**
     * Collects and formats data from all agents for the yearly CSV log.
     */
    collectAgentLog: function(year, agents, institution) {
        if (!agents || agents.length === 0) return;
        
        if (!this.isAgentLogInitialized) {
            var newHeader = [
                'year', 'agentId', 'ownerType', 'standId', 'currentSTP', 'tenureLeft',
                'pref_prod', 'pref_bio', 'pref_carb',
                'agent_managed_stands', 'agent_unique_stps', 'agent_stp_coherence',
                'bm_vol_min', 'bm_vol_max', 'bm_spec_min', 'bm_spec_max'
            ].join(',');
            this.agentLogData.push(newHeader);
            this.isAgentLogInitialized = true;
        }
    
        var benchmark = institution.dynamicBenchmark || {};
        var bm_vol = benchmark.volume || { min: -1, max: -1 };
        var bm_spec = benchmark.speciesCount || { min: -1, max: -1 };

        var self = this; // Store context for forEach
        agents.forEach(function(agent) {
            var managedStandsCount = agent.managedStands.length;
            var uniqueStps = new Set(Object.values(agent.standStrategies));
            var uniqueStpsCount = uniqueStps.size > 0 ? uniqueStps.size : 1;
            var stpCoherence = managedStandsCount / uniqueStpsCount;

            agent.managedStands.forEach(function(standId) {
                var currentSTP = agent.standStrategies[standId] || 'None';
    
                var row = [
                    year, agent.agentId, agent.owner.type, standId, currentSTP, agent.tenureLeft,
                    agent.preferences[0].toFixed(3), agent.preferences[1].toFixed(3), agent.preferences[2].toFixed(3),
                    managedStandsCount, uniqueStpsCount, stpCoherence.toFixed(2),
                    bm_vol.min.toFixed(2), bm_vol.max.toFixed(2),
                    bm_spec.min.toFixed(0), bm_spec.max.toFixed(0)
                ].join(',');
                
                self.agentLogData.push(row);
            });
            
            agent.standsChangedThisYear = 0;
        });
    },

    /**
     * Collects detailed data for each stand for the CSV log.
     */
    collectStandLog: function(year, agents, institution) {
        if (!agents || agents.length === 0) return;

        if (!this.isStandLogInitialized) {
            var newHeader = [
                'year', 'standId', 'agentId', 'ownerType', 'currentSTP', 'age', 'absoluteAge', 'volume', 'basalArea',
                'structure_dbh_stddev', 'structure_score_normalized', 'structure_class',
                'species_class', 'dominant_species', 'species_count', 'species_distribution'
            ].join(',');
            this.standLogData.push(newHeader);
            this.isStandLogInitialized = true;
        }

        var benchmark = institution.dynamicBenchmark;
        if (!benchmark || !benchmark.dbhStdDev) return;

        var metricsMapper = new ForestMetricsMapper();
        var self = this; // Store context for forEach

        agents.forEach(function(agent) {
            agent.managedStands.forEach(function(standId) {
                var snapshot = agent.standSnapshots[standId];
                if (!snapshot || !snapshot.isValid) return;

                var currentSTP = agent.standStrategies[standId] || 'None';
                
                var rawStructureValue = snapshot.structure.dbhStdDev;
                var normalizedScore = metricsMapper.normalize(rawStructureValue, benchmark.dbhStdDev.min, benchmark.dbhStdDev.max);
                var structureClass = metricsMapper.classifyStructure(normalizedScore);
                
                var speciesClass = metricsMapper.classifySpecies(snapshot.composition);
                
                var speciesDistString = Object.keys(snapshot.composition.distribution)
                    .map(function(species) {
                        return species + ':' + snapshot.composition.distribution[species].toFixed(2);
                    })
                    .join('|');

                var row = [
                    year, snapshot.id, agent.agentId, agent.owner.type, currentSTP, snapshot.age.toFixed(1), snapshot.absoluteAge.toFixed(1),
                    snapshot.volume.toFixed(2), snapshot.basalArea.toFixed(2),
                    rawStructureValue.toFixed(2), normalizedScore.toFixed(3), structureClass,
                    speciesClass, snapshot.composition.dominantSpecies, snapshot.composition.speciesCount,
                    speciesDistString
                ].join(',');

                self.standLogData.push(row);
            });
        });
    },

    /**
     * NEW FUNCTION: Prints a snapshot of all stand data directly to the console.
     */
logStandSnapshotsToConsole: function(year, agents, institution) {
    console.log("\n--- Stand Snapshot Log for Year " + year + " ---");
    if (!agents || agents.length === 0) {
        console.log("No agents to report on.");
        return;
    }

    // Define and print the new header
    var header = [
        'standId', 'agentId', 'currentSTP', 'age', 'absoluteAge', 'volume',
        'lastActivity', 'nextAssessment'
    ].join(',');
    console.log(header);

    agents.forEach(function(agent) {
        agent.managedStands.forEach(function(standId) {
            // We MUST set the fmengine context to get live stand data for each stand
            fmengine.standId = standId;
            if (!stand || stand.id <= 0) return;

            // Get the new data directly from the live stand object
            var currentSTP = agent.standStrategies[standId] || 'None';
            var lastActivity = stand.lastActivity || 'None';
            var nextAssessment = stand.flag('nextAssessmentYear') || 'N/A';
            
            var row = [
                stand.id,
                agent.agentId,
                currentSTP,
            //    stand.age.toFixed(1),
                stand.absoluteAge.toFixed(1),
              //  stand.volume.toFixed(2),
                lastActivity,
                nextAssessment
            ].join(',');

            console.log(row);
        });
    });
    console.log("--- End of Snapshot Log for Year " + year + " ---\n");
},
 
    /**
     * Saves all collected log data to their respective CSV files.
     */
    saveLogsToFile: function() {
        console.log("--- Preparing to save SoCoABE logs. ---");
        this._saveAgentLog();
        this._saveStandLog();
    },

    /**
     * Private helper to save the agent log.
     */
    _saveAgentLog: function() {
        if (this.agentLogData.length > 1) {
            var filePath = Globals.path("output/socoabe_agent_log.csv");
            var fileContent = this.agentLogData.join('\n');
            console.log("Attempting to save " + this.agentLogData.length + " agent log rows to: " + filePath);
            try {
                Globals.saveTextFile(filePath, fileContent);
                console.log("--- Agent log successfully saved! ---");
            } catch (e) {
                console.error("ERROR during agent log save:", e.message);
            }
        } else {
            console.log("No agent log data collected, skipping file write.");
        }
    },

    /**
     * Private helper to save the stand log.
     */
    _saveStandLog: function() {
        if (this.standLogData.length > 1) {
            var filePath = Globals.path("output/socoabe_stand_log.csv");
            var fileContent = this.standLogData.join('\n');
            console.log("Attempting to save " + this.standLogData.length + " stand log rows to: " + filePath);
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
};

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Reporting;
} else {
    this.Reporting = Reporting;
}
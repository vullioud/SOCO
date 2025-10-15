// ----- Start of File: src/utils/reporting.js -----

/**
 * Append helper for iLand's file API.
 * If appendTextFile doesn't exist in your build, emulate it.
 */
if (typeof Globals.appendTextFile === 'undefined') {
    Globals.appendTextFile = function(path, content) {
        var already = "";
        try { if (Globals.fileExists(path)) already = Globals.loadTextFile(path); } catch (e) { /* ignore */ }
        Globals.saveTextFile(path, already + content + '\n');
    };
}

/**
 * Central place for all reporting. Keeps buffered yearly logs for agents/stands,
 * and writes STP switch events immediately (crash-proof).
 */
var Reporting = {
    // Buffered yearly logs
    agentLogData: [],
    standLogData: [],

    // CSV headers
    agentLogHeader: "year,agentId,ownerType,standId,currentSTP,tenureLeft,pref_prod,pref_bio,pref_carb,agent_managed_stands,agent_unique_stps,agent_stp_coherence,bm_vol_min,bm_vol_max,bm_spec_min,bm_spec_max",
    standLogHeader: "year,standId,agentId,ownerType,currentSTP,age,absoluteAge,volume,basalArea,structure_dbh_stddev,structure_score_normalized,structure_class,species_class,dominant_species,species_count,species_distribution",
    stpLogHeader: "year_decision,year_apply,agent_id,stand_id,old_stp,new_stp,status",

    // internal state
    isStpLogInitialized: false,

    // ---- Immediate STP switch logger (header-once + append) ----
    logStpSwitchImmediate: function(yearDecision, yearApply, agentId, standId, oldStp, newStp, status) {
        var row = [yearDecision, yearApply, agentId, standId, oldStp, newStp, status].join(',');
        var filePath = Globals.path("output/socoabe_stp_switch_log.csv");
        try {
            if (!this.isStpLogInitialized) {
                Globals.saveTextFile(filePath, this.stpLogHeader + '\n');
                this.isStpLogInitialized = true;
            }
            Globals.appendTextFile(filePath, row);
        } catch (e) {
            console.error("STP switch log write failed: " + (e && e.message ? e.message : e));
        }
    },

    // ---- Buffered yearly agent log ----
    collectAgentLog: function(year, agents, institution) {
        if (!agents || agents.length === 0) return;
        var bm = institution.dynamicBenchmark || { volume: {}, speciesCount: {} };
        var self = this;

        agents.forEach(function(agent) {
            var managed = agent.managedStands.length;
            var uniqueStps = new Set(Object.values(agent.standStrategies));
            var coherence = managed / (uniqueStps.size || 1);

            agent.managedStands.forEach(function(standId) {
                var row = [
                    year, agent.agentId, agent.owner.type, standId,
                    agent.standStrategies[standId] || 'None', agent.tenureLeft,
                    agent.preferences[0].toFixed(3), agent.preferences[1].toFixed(3), agent.preferences[2].toFixed(3),
                    managed, uniqueStps.size, coherence.toFixed(2),
                    (bm.volume.min || -1).toFixed(2), (bm.volume.max || -1).toFixed(2),
                    (bm.speciesCount.min || -1).toFixed(0), (bm.speciesCount.max || -1).toFixed(0)
                ].join(',');
                self.agentLogData.push(row);
            });
        });
    },

    // ---- Buffered yearly stand log ----
    collectStandLog: function(year, agents, institution) {
        if (!agents || agents.length === 0) return;
        var bm = institution.dynamicBenchmark;
        if (!bm || !bm.dbhStdDev) return;

        var mapper = new ForestMetricsMapper();
        var self = this;

        agents.forEach(function(agent) {
            agent.managedStands.forEach(function(standId) {
                var s = agent.standSnapshots[standId];
                if (!s || !s.isValid) return;

                var raw = s.structure.dbhStdDev;
                var norm = mapper.normalize(raw, bm.dbhStdDev.min, bm.dbhStdDev.max);
                var dist = Object.keys(s.composition.distribution)
                    .map(function(sp){ return sp + ':' + s.composition.distribution[sp].toFixed(2); })
                    .join('|');

                var row = [
                    year, s.id, agent.agentId, agent.owner.type, agent.standStrategies[standId] || 'None',
                    s.age.toFixed(1), s.absoluteAge.toFixed(1), s.volume.toFixed(2), s.basalArea.toFixed(2),
                    raw.toFixed(2), norm.toFixed(3), mapper.classifyStructure(norm),
                    mapper.classifySpecies(s.composition), s.composition.dominantSpecies,
                    s.composition.speciesCount, dist
                ].join(',');
                self.standLogData.push(row);
            });
        });
    },

    // ---- End-of-run saves for buffered yearly logs ----
    saveFinalLogs: function() {
        console.log("--- Saving final buffered SoCoABE logs. ---");
        this._save("output/socoabe_agent_log.csv", this.agentLogHeader, this.agentLogData, "Agent");
        this._save("output/socoabe_stand_log.csv", this.standLogHeader, this.standLogData, "Stand");
    },

    _save: function(path, header, buffer, name) {
        if (!buffer || buffer.length === 0) return;
        try {
            Globals.saveTextFile(Globals.path(path), header + '\n' + buffer.join('\n'));
            console.log("--- " + name + " log saved (" + buffer.length + " rows). ---");
        } catch (e) {
            console.error("ERROR saving " + name + " log: " + (e && e.message ? e.message : e));
        }
    },

    // ---- Diagnostics (console) ----
    logStandSnapshotsToConsole: function(year, agents) {
        console.log("\n--- Stand Snapshot Log for Year " + year + " ---");
        console.log(['standId','agentId','currentSTP','absoluteAge','lastActivity','nextAssessment'].join(','));
        agents.forEach(function(agent){
            agent.managedStands.forEach(function(standId){
                fmengine.standId = standId;
                if (!stand || stand.id <= 0) return;
                var row = [
                    stand.id,
                    agent.agentId,
                    agent.standStrategies[standId] || 'None',
                    stand.absoluteAge.toFixed(1),
                    stand.lastActivity || 'None',
                    stand.flag('nextAssessmentYear') || 'N/A'
                ].join(',');
                console.log(row);
            });
        });
        console.log("--- End of Snapshot Log for Year " + year + " ---\n");
    },

    // ---- Optional: population validation helpers (unchanged) ----
    runPopulationValidation: function(owners, agents) {
        console.log("\n--- Running Agent Population Validation ---");
        if (!agents || agents.length === 0) return;
        var report = this.generatePopulationReport(owners, agents);
        this.printPopulationSummary(report);
        this.savePopulationReportToFile(report);
        console.log("--- Validation Complete. ---\n");
    },
    generatePopulationReport: function(owners, agents) {
        var rep = {};
        owners.forEach(function(owner){
            var list = agents.filter(function(a){ return a.owner.type === owner.type; });
            if (list.length > 0) {
                rep[owner.type] = {
                    config: owner.config,
                    agents: list.map(function(a){ return { agentId:a.agentId, preferences:a.preferences, riskTolerance:a.riskTolerance, resources:a.resources }; })
                };
            }
        });
        return rep;
    },
    printPopulationSummary: function(rep) {
        for (var k in rep) {
            var data = rep[k];
            console.log("\n--- Owner: " + k.toUpperCase() + " (" + data.agents.length + " agents) ---");
            var r = data.agents.map(function(a){ return a.riskTolerance; });
            var avg = r.reduce(function(a,b){return a+b;},0) / r.length;
            console.log("Risk Tolerance avg: " + avg.toFixed(3));
        }
    },
    savePopulationReportToFile: function(rep) {
        try {
            Globals.saveTextFile(Globals.path("output/population_report.json"), JSON.stringify(rep, null, 2));
            console.log("Saved population_report.json");
        } catch (e) {
            console.error("ERROR saving population report: " + (e && e.message ? e.message : e));
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Reporting;
} else {
    this.Reporting = Reporting;
}

// ----- End of File: src/utils/reporting.js -----

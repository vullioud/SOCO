var DebugHelpers = {
    /**
     * Logs the current state of every stand managed by the agents.
     * @param {number} year - The current simulation year.
     * @param {SoCoABeAgent[]} agents - The array of all agents.
     */
    logAllStandStates: function(year, agents) {
        if (!agents || agents.length === 0) return;

        console.log("--- DEBUG SNAPSHOT | Year: " + year + " ---");
        
        var metricsMapper = new ForestMetricsMapper();

        for (var i = 0; i < agents.length; i++) {
            var agent = agents[i];
            for (var j = 0; j < agent.managedStands.length; j++) {
                var standId = agent.managedStands[j];
                fmengine.standId = standId;
                if (stand && stand.id > 0) {
                    var snapshot = new StandSnapshot(standId);
                    if (snapshot.isValid) {
                        var structureClass = metricsMapper.classifyStructure(snapshot.structure.dbhStdDev);
                        var speciesClass = metricsMapper.classifySpecies(snapshot.composition);

                        var logString = "> Stand: " + standId + " | Agent: " + agent.agentId + " | STP: " + (agent.standStrategies[standId] || 'None') + " | Age: " + snapshot.age.toFixed(1) + " | Vol: " + snapshot.volume.toFixed(2) + " | Struct: " + structureClass + " | Species: " + speciesClass + " | LastActivity: " + (stand.lastActivity || 'None');
                        console.log(logString);
                    }
                }
            }
        }
        console.log("--- END DEBUG SNAPSHOT | Year: " + year + " ---");
    }
};

// Make it available globally
this.DebugHelpers = DebugHelpers;
// ----- Start of File: src/utils/debug_helpers.js -----

class DebugHelpers {
    /**
     * Logs the current state of every stand managed by the agents.
     * This provides a periodic snapshot of the entire forest.
     * @param {number} year - The current simulation year.
     * @param {SoCoABeAgent[]} agents - The array of all agents.
     */
    static logAllStandStates(year, agents) {
        if (!agents || agents.length === 0) return;

        console.log(`--- DEBUG SNAPSHOT | Year: ${year} ---`);
        
        const metricsMapper = new ForestMetricsMapper(); // We need this for classification

        for (const agent of agents) {
            for (const standId of agent.managedStands) {
                // We need to set the context to get stand data
                fmengine.standId = standId;
                if (stand && stand.id > 0) {
                    const snapshot = new StandSnapshot(standId);
                    if (snapshot.isValid) {
                        const structureClass = metricsMapper.classifyStructure(snapshot.structure.dbhStdDev);
                        const speciesClass = metricsMapper.classifySpecies(snapshot.composition);

                        const logString = `> Stand: ${standId} | Agent: ${agent.agentId} | STP: ${agent.standStrategies[standId] || 'None'} | Age: ${snapshot.age.toFixed(1)} | Vol: ${snapshot.volume.toFixed(2)} | Struct: ${structureClass} | Species: ${speciesClass} | LastActivity: ${stand.lastActivity || 'None'}`;
                        console.log(logString);
                    }
                }
            }
        }
        console.log(`--- END DEBUG SNAPSHOT | Year: ${year} ---`);
    }
}

// Make it available globally
this.DebugHelpers = DebugHelpers;

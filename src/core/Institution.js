// ----- Start of File: SOCO/src/core/Institution.js -----

/**
 * The Institution class manages the creation and lifecycle of all owners and agents in the simulation.
 * This version discovers the landscape structure (agents, units, stands) that was pre-built by iLand's
 * ABE from the agent data CSV file, making the CSV the single source of truth for the spatial setup.
 * Written in ES5 syntax for maximum compatibility with the iLand engine.
 */
function Institution() {
    this.owners = [];
    this.agents = [];
    this.year = 0;
    this.benchmarkHistory = [];
    this.dynamicBenchmark = {};
    this.memoryWindow = SoCoABE_CONFIG.ECOMETRICS.benchmarkMemoryWindow;
    this.dependencies = null;
}

/**
 * Initializes the SoCoABE cognitive layer by discovering the iLand-managed landscape.
 * It identifies agents and their stands as defined in the CSV and creates the corresponding
 * SoCoABE "brain" objects.
 * @param {object} dependencies - A collection of required classes and configurations.
 */
Institution.prototype.initialize = function(dependencies) {
    console.log("--- SoCoABE Institution: Discovering iLand-managed landscape ---");
    this.dependencies = dependencies;
    
    var ownerStands = { state: [], big_company: [], small_private: [] };
    var agentStandMap = {}; // Maps ABE agent names to their stands and owner type

    // Step 1: Discover the structure ABE created from the CSV
    fmengine.standIds.forEach(function(standId) {
        fmengine.standId = standId;
        if (stand && stand.agent) {
            var agentName = stand.agent.name;
            var ownerType = stand.flag('owner_type'); // Read from the CSV extra column

            if (!ownerType) {
                console.error("Stand " + standId + " is missing the 'owner_type' flag from the CSV. It will be ignored.");
                return;
            }

            if (!agentStandMap[agentName]) {
                agentStandMap[agentName] = { stands: [], ownerType: ownerType };
            }
            agentStandMap[agentName].stands.push(standId);

            if (ownerStands[ownerType]) {
                ownerStands[ownerType].push({ id: standId });
            }
        }
    });
    
    // Step 2: Create Owner objects based on discovered stands
    Object.keys(ownerStands).forEach(function(ownerType) {
        if (ownerStands[ownerType].length > 0) {
            var ownerConfig = this.dependencies.OWNER_TYPE_CONFIGS[ownerType];
            var owner = new this.dependencies.Owner(this, ownerType, ownerConfig, ownerStands[ownerType], this.dependencies);
            this.owners.push(owner);
        }
    }, this);

    // Step 3: Create one SoCoABE "brain" for each discovered iLand "body"
    Object.keys(agentStandMap).forEach(function(agentName) {
        var agentInfo = agentStandMap[agentName];
        var owner = this.owners.find(function(o) { return o.type === agentInfo.ownerType; });
        
        if (!owner) {
            console.error("Could not find owner of type '" + agentInfo.ownerType + "' for agent '" + agentName + "'");
            return;
        }

        var socoabeAgent = new this.dependencies.SoCoABeAgent(owner, agentName);
        socoabeAgent.engineId = agentName; // This is the link: brain.engineId = body.name
        socoabeAgent.assignStands(agentInfo.stands);
        socoabeAgent.sampleFromOwner();

        this.agents.push(socoabeAgent);
        owner.agents.push(socoabeAgent);
    }, this);
    
    console.log("Institution initialized with " + this.owners.length + " owners and " + this.agents.length + " total agents.");
};

/**
 * Updates the landscape-wide benchmark of ecological metrics.
 * @param {number} year - The current simulation year.
 */
Institution.prototype.updateDynamicBenchmark = function(year) {
    this.year = year;
    var currentYearStats = {
        mai: { min: Infinity, max: -Infinity },
        volume: { min: Infinity, max: -Infinity },
        speciesCount: { min: Infinity, max: -Infinity },
        topHeight: { min: Infinity, max: -Infinity },
        dbhStdDev: { min: Infinity, max: -Infinity }
    };
    var allStandIds = fmengine.standIds;
    
    for (var i = 0; i < allStandIds.length; i++) {
        var id = allStandIds[i];
        fmengine.standId = id;
        if (stand && stand.id > 0) {
            currentYearStats.mai.min = Math.min(currentYearStats.mai.min, (stand.age > 0 ? stand.volume / stand.age : 0));
            currentYearStats.mai.max = Math.max(currentYearStats.mai.max, (stand.age > 0 ? stand.volume / stand.age : 0));
            currentYearStats.volume.min = Math.min(currentYearStats.volume.min, stand.volume);
            currentYearStats.volume.max = Math.max(currentYearStats.volume.max, stand.volume);
            currentYearStats.speciesCount.min = Math.min(currentYearStats.speciesCount.min, stand.nspecies);
            currentYearStats.speciesCount.max = Math.max(currentYearStats.speciesCount.max, stand.nspecies);
            currentYearStats.topHeight.min = Math.min(currentYearStats.topHeight.min, stand.topHeight);
            currentYearStats.topHeight.max = Math.max(currentYearStats.topHeight.max, stand.topHeight);

            stand.trees.loadAll();
            var dbhValues = [];
            for (var j = 0; j < stand.trees.count; j++) {
                dbhValues.push(stand.trees.tree(j).dbh);
            }
            var dbhStdDev = Helpers.calculateStdDev(dbhValues);
            currentYearStats.dbhStdDev.min = Math.min(currentYearStats.dbhStdDev.min, dbhStdDev);
            currentYearStats.dbhStdDev.max = Math.max(currentYearStats.dbhStdDev.max, dbhStdDev);
        }
    }

    this.benchmarkHistory.push(currentYearStats);
    if (this.benchmarkHistory.length > this.memoryWindow) {
        this.benchmarkHistory.shift();
    }

    var finalBenchmark = {};
    for (var metric in currentYearStats) {
        if (currentYearStats.hasOwnProperty(metric)) {
            var minValues = this.benchmarkHistory.map(function(r) { return r[metric].min; });
            var maxValues = this.benchmarkHistory.map(function(r) { return r[metric].max; });
            finalBenchmark[metric] = {
                min: Math.min.apply(null, minValues.filter(isFinite)),
                max: Math.max.apply(null, maxValues.filter(isFinite))
            };
        }
    }
    
    this.dynamicBenchmark = finalBenchmark;
};

// Universal Module Definition for NodeJS compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Institution;
} else {
    this.Institution = Institution;
}

// ----- End of File -----
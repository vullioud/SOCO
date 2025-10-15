// ----- Start of File: src/integration/socoabe_main.js -----

var socoabeActionQueue = [];
var pendingStpByYear = Object.create(null);

function pushDeferredSwitch(year, payload) {
    if (!pendingStpByYear[year]) pendingStpByYear[year] = [];
    pendingStpByYear[year].push(payload);
}

var DEFER_APPLY_CAP_GLOBAL = 400;
var DEFER_APPLY_CAP_PER_OWNER = 100;

function SoCoABeMain() {
    this.institution = null;
    this.owners = [];
    this.agents = [];
    this.initialized = false;
}

SoCoABeMain.prototype.initialize = function() {
    if (this.initialized) return;
    console.log("--- Initializing SoCoABE Cognitive Layer ---");

    var deps = {
        Distributions: Distributions, Helpers: Helpers, ForestMetricsMapper: ForestMetricsMapper,
        Owner: Owner, SoCoABeAgent: SoCoABeAgent, OWNER_TYPE_CONFIGS: OWNER_TYPE_CONFIGS,
        BASE_STP_DEFINITIONS: BASE_STP_DEFINITIONS, STP_DECISION_MATRIX: STP_DECISION_MATRIX
    };

    this.institution = new Institution();
    this.institution.initialize(deps);
    this.owners = this.institution.owners;
    this.agents = this.institution.agents;
    this.initialized = true;

    console.log("--- SoCoABE Initialization Complete ---");
    Reporting.runPopulationValidation(this.owners, this.agents);
};

SoCoABeMain.prototype.applyDeferredSwitchesForYear = function(year) {
    var bucket = pendingStpByYear[year];
    if (!bucket || bucket.length === 0) return;

    // Shuffle (Fisher–Yates)
    for (var i = bucket.length - 1; i > 0; --i) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = bucket[i]; bucket[i] = bucket[j]; bucket[j] = t;
    }

    var applied = 0;
    var perOwner = Object.create(null);

    for (var b = 0; b < bucket.length; ++b) {
        var action = bucket[b];
        try {
            fmengine.standId = action.standId;
            if (!stand || stand.id <= 0) continue;

            var ownerName = (stand.unit && stand.unit.agent) ? stand.unit.agent.name : 'owner';
            if (!perOwner[ownerName]) perOwner[ownerName] = 0;
            if (perOwner[ownerName] >= DEFER_APPLY_CAP_PER_OWNER || applied >= DEFER_APPLY_CAP_GLOBAL) break;

            // Disable current activities
            if (stand.stp && stand.stp.activityNames) {
                for (var k = 0; k < stand.stp.activityNames.length; ++k) {
                    var act = stand.activityByName(stand.stp.activityNames[k]);
                    if (act) act.enabled = false;
                }
            }

            // APPLYING_DEFERRED
            Reporting.logStpSwitchImmediate(action.yearDecision, year, action.agentId, action.standId, 'Unknown', action.newStpName, 'APPLYING_DEFERRED');

            // Validate target STP before switching
            if (!fmengine.isValidStp(action.newStpName)) {
                console.error("Invalid STP '" + action.newStpName + "' for stand " + action.standId);
                continue;
            }

            // Optional: debug print
            console.log("[STP SWITCH/DEFERRED] year=" + year + " stand=" + action.standId + " -> " + action.newStpName);

            // Switch
            stand.setSTP(action.newStpName);

            // SUCCESS
            Reporting.logStpSwitchImmediate(action.yearDecision, year, action.agentId, action.standId, 'Unknown', action.newStpName, 'SUCCESS');

            // Housekeeping after switch
            var jitter = Math.floor(Math.random() * 6) - 3;
            stand.setFlag('nextAssessmentYear', year + 10 + jitter);
            if (action.speciesStrategy) stand.setFlag('targetSpecies', action.speciesStrategy);

            applied++;
            perOwner[ownerName]++;
        } catch (e) {
            console.error("Deferred switch failed for stand " + (action && action.standId) + ": " + (e && e.message ? e.message : e));
        }
    }

    if (applied >= bucket.length) delete pendingStpByYear[year];
    else pendingStpByYear[year] = bucket.slice(applied);
};

SoCoABeMain.prototype.update = function(year) {
    if (!this.initialized) {
        fmengine.abort("SoCoABE not initialized.");
        return;
    }

    console.log("\n--- SoCoABE Update Cycle: Year " + year + " ---");

    // Apply any due deferred switches
    this.applyDeferredSwitchesForYear(year);

    // Reset per-tick action queue
    socoabeActionQueue = [];

    if (this.agents.length > 0) {
        this.institution.updateDynamicBenchmark(year);
    }

    // Observe + decide
    this.agents.forEach(function(agent) {
        agent.observe();
        agent.makeDecision(year);
        agent.tenureLeft = Math.max(0, agent.tenureLeft - 1);
    });

    if (SoCoABE_CONFIG.DEBUG && SoCoABE_CONFIG.DEBUG.enableAgentTurnover) {
        this.handleAgentTurnover(year);
    }

    // Execute decisions
    this.executeActions(year);

    // Buffered logs
    Reporting.collectAgentLog(year, this.agents, this.institution);
    Reporting.collectStandLog(year, this.agents, this.institution);

    // Periodic console snapshot
    if (year % 5 === 0) Reporting.logStandSnapshotsToConsole(year, this.agents);
};

SoCoABeMain.prototype.executeActions = function(year) {
    if (socoabeActionQueue.length === 0) return;

    // Shuffle
    for (var i = socoabeActionQueue.length - 1; i > 0; --i) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = socoabeActionQueue[i]; socoabeActionQueue[i] = socoabeActionQueue[j]; socoabeActionQueue[j] = t;
    }

    var immediateCap = Math.min(20, socoabeActionQueue.length);
    var appliedNow = 0;
    console.log("--- SoCoABE Action Phase: " + socoabeActionQueue.length + " decided switches (cap immediate=" + immediateCap + ") ---");

    // ---- Immediate branch ----
    for (; appliedNow < immediateCap; appliedNow++) {
        var action = socoabeActionQueue[appliedNow];
        try {
            fmengine.standId = action.standId;
            if (stand && stand.id > 0) {
                var agent = this.agents.find(function(a){ return a.agentId === action.agentId; });
                var oldStp = agent ? (agent.standStrategies[action.standId] || 'Initial') : 'Unknown';

                // Record the decision itself for completeness
                Reporting.logStpSwitchImmediate(year, year, action.agentId, action.standId, oldStp, action.newStpName, 'DECIDED');

                // APPLYING_IMMEDIATE
                Reporting.logStpSwitchImmediate(year, year, action.agentId, action.standId, oldStp, action.newStpName, 'APPLYING_IMMEDIATE');

                // Disable current activities
                if (stand.stp && stand.stp.activityNames) {
                    for (var k = 0; k < stand.stp.activityNames.length; ++k) {
                        var act = stand.activityByName(stand.stp.activityNames[k]);
                        if (act) act.enabled = false;
                    }
                }

                // Validate target STP before switching
                if (!fmengine.isValidStp(action.newStpName)) {
                    console.error("Invalid STP '" + action.newStpName + "' for stand " + action.standId);
                    continue;
                }

                // Optional: debug print
                console.log("[STP SWITCH/IMMEDIATE] year=" + year + " stand=" + action.standId + " old=" + oldStp + " -> " + action.newStpName);

                // Switch
                stand.setSTP(action.newStpName);

                // SUCCESS
                Reporting.logStpSwitchImmediate(year, year, action.agentId, action.standId, oldStp, action.newStpName, 'SUCCESS');

                // Housekeeping
                var jitter = Math.floor(Math.random() * 6) - 3;
                stand.setFlag('nextAssessmentYear', year + 20 + jitter);
                if (action.speciesStrategy) stand.setFlag('targetSpecies', action.speciesStrategy);
            }
        } catch (e) {
            console.error("Error executing immediate action for stand " + action.standId + ": " + (e && e.message ? e.message : e));
        }
    }

    // ---- Deferred branch (create future applications) ----
    for (var m = appliedNow; m < socoabeActionQueue.length; m++) {
        var action = socoabeActionQueue[m];
        try {
            fmengine.standId = action.standId;
            if (!stand || stand.id <= 0) continue;

            // phase-based spacing
            var absAge = Number(stand.absoluteAge || 0);
            var phase = Math.max(0, Math.min(4, Math.floor(absAge % 5)));
            var pushYears = 2 + phase;
            var targetYear = year + pushYears;

            var agent = this.agents.find(function(a){ return a.agentId === action.agentId; });
            var oldStp = agent ? (agent.standStrategies[action.standId] || 'Initial') : 'Unknown';

            // DECIDED (now logged immediately; NO in-memory push)
            Reporting.logStpSwitchImmediate(year, targetYear, action.agentId, action.standId, oldStp, action.newStpName, 'DECIDED');

            // enqueue the actual application payload
            pushDeferredSwitch(targetYear, {
                standId: action.standId,
                newStpName: action.newStpName,
                speciesStrategy: action.speciesStrategy || null,
                agentId: action.agentId,
                yearDecision: year
            });
        } catch (e) {
            console.error("Error deferring action for stand " + (action && action.standId) + ": " + (e && e.message ? e.message : e));
        }
    }

    socoabeActionQueue = [];
};

SoCoABeMain.prototype.handleAgentTurnover = function(year) {
    var replaced = [];
    for (var i = 0; i < this.agents.length; i++) {
        var agent = this.agents[i];
        if (agent.tenureLeft <= 0) {
            var owner = agent.owner;
            var same = owner.replaceAgent(agent, year);
            replaced.push({ old: agent.agentId, neo: same.agentId });
        }
    }
    if (replaced.length > 0) {
        console.log("--- Tenure turnover @ Year " + year + ": updated " + replaced.length + " agents in place ---");
        for (var r = 0; r < replaced.length; r++) {
            console.log("  > " + replaced[r].old + " -> " + replaced[r].neo + " (in-place)");
        }
    }
};

var socoabe = new SoCoABeMain();

// ----- End of File: src/integration/socoabe_main.js -----

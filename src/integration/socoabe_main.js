// ===== File: src/integration/socoabe_main.js =====

// Global action queue (decisions made by agents this year)
var socoabeActionQueue = [];

// >>> Global deferred-application bucket: year -> [{standId, newStpName, speciesStrategy}]
var pendingStpByYear = Object.create(null);

// Small helper
function pushDeferredSwitch(year, payload) {
    if (!pendingStpByYear[year]) pendingStpByYear[year] = [];
    pendingStpByYear[year].push(payload);
}

// Hard caps to avoid stampedes and scheduler stress
var DEFER_APPLY_CAP_GLOBAL = 400;   // max # of switches applied per year globally
var DEFER_APPLY_CAP_PER_OWNER = 100; // safety cap per owner (optional, soft check)

// ----- Controller -----
function SoCoABeMain() {
    this.institution = null;
    this.owners = [];
    this.agents = [];
    this.initialized = false;
}

SoCoABeMain.prototype.initialize = function() {
    if (this.initialized) return;
    console.log("--- Initializing SoCoABE Cognitive Layer ---");

    var dependencies = {
        Distributions: Distributions,
        Helpers: Helpers,
        ForestMetricsMapper: ForestMetricsMapper,
        Owner: Owner,
        SoCoABeAgent: SoCoABeAgent,
        OWNER_TYPE_CONFIGS: OWNER_TYPE_CONFIGS,
        BASE_STP_DEFINITIONS: BASE_STP_DEFINITIONS,
        STP_DECISION_MATRIX: STP_DECISION_MATRIX
    };

    this.institution = new Institution();
    this.institution.initialize(dependencies);

    this.owners = this.institution.owners;
    this.agents = this.institution.agents;

    this.initialized = true;
    console.log("--- SoCoABE Initialization Complete ---");

    Reporting.runPopulationValidation(this.owners, this.agents);
};

// Apply up to N deferred switches at the very start of the year.
SoCoABeMain.prototype.applyDeferredSwitchesForYear = function(year) {
    var bucket = pendingStpByYear[year];
    if (!bucket || bucket.length === 0) return;

    // Randomize to avoid owner/agent clustering
    for (let i = bucket.length - 1; i > 0; --i) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = bucket[i]; bucket[i] = bucket[j]; bucket[j] = tmp;
    }

    var applied = 0;
    var appliedPerOwner = Object.create(null);

    console.log(`--- SoCoABE: Applying ${bucket.length} deferred STP switches for year ${year} ---`);

    for (let i = 0; i < bucket.length; i++) {
        if (applied >= DEFER_APPLY_CAP_GLOBAL) break;
        const action = bucket[i];
        try {
            fmengine.standId = action.standId;
            if (!stand || stand.id <= 0) continue;

            // Optional: throttle per owner as well
            var ownerName = (stand.unit && stand.unit.agent && stand.unit.agent.typeName) ? stand.unit.agent.typeName : "unknown_owner";
            appliedPerOwner[ownerName] = (appliedPerOwner[ownerName] || 0);
            if (appliedPerOwner[ownerName] >= DEFER_APPLY_CAP_PER_OWNER) continue;

            // Core: set STP safely (engine clears schedule & initializes internally)
            stand.setSTP(action.newStpName);

            // Schedule next assessment in ~10y with jitter (spreads load)
            var jitter = Math.floor(Math.random() * 6) - 3; // [-3..+2]
            stand.setFlag('nextAssessmentYear', year + 10 + jitter);

            // Persist species choice if any
            if (action.speciesStrategy) stand.setFlag('targetSpecies', action.speciesStrategy);

            console.log(`> [deferred] Stand ${action.standId} now uses STP '${action.newStpName}'.`);
            applied++;
            appliedPerOwner[ownerName]++;
        } catch (e) {
            console.error(`Deferred switch failed for stand ${action && action.standId}: ${e && e.message ? e.message : e}`);
        }
    }

    // Drop processed entries, keep any leftovers for next year (or discard them to be strict)
    if (applied >= bucket.length) {
        delete pendingStpByYear[year];
    } else {
        pendingStpByYear[year] = bucket.slice(applied); // leave remainder for next year
    }
};

SoCoABeMain.prototype.update = function(year) {
    if (!this.initialized) {
        console.error("FATAL: socoabe.update() called before initialize().");
        fmengine.abort("SoCoABE not initialized.");
        return;
    }

    console.log("\n--- SoCoABE Update Cycle: Year " + year + " ---");

    // 0) First, apply *some* deferred switches from previous decisions.
    this.applyDeferredSwitchesForYear(year);

    socoabeActionQueue = [];

    // 1) Update benchmark (used by cognition)
    if (this.agents.length > 0) {
        this.institution.updateDynamicBenchmark(year);
    }

    // 2) Each agent runs perception + decision
    this.agents.forEach(function(agent) {
        agent.observe();
        agent.makeDecision(year);
        agent.tenureLeft = Math.max(0, agent.tenureLeft - 1);
    });

    // 3) Optional: tenure turnover
    if (SoCoABE_CONFIG.DEBUG && SoCoABE_CONFIG.DEBUG.enableAgentTurnover) {
        this.handleAgentTurnover(year);
    }

    // 4) Apply part of the new actions now or push to a future year
    this.executeActions(year);

    // 5) Reporting
    if (year % 5 === 0 || year === SoCoABE_CONFIG.warmupPeriod) {
        Reporting.collectAgentLog(year, this.agents, this.institution);
        Reporting.collectStandLog(year, this.agents, this.institution);
        Reporting.logStandSnapshotsToConsole(year, this.agents, this.institution);
    }
};

// Turn action queue into actual STP switches, but **defer most** to avoid spikes.
// Also: no stand.initialize() and no absoluteAge reset here.
SoCoABeMain.prototype.executeActions = function(year) {
    if (socoabeActionQueue.length === 0) return;

    // Randomize the queue so one agent doesn’t monopolize the cap.
    for (let i = socoabeActionQueue.length - 1; i > 0; --i) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = socoabeActionQueue[i]; socoabeActionQueue[i] = socoabeActionQueue[j]; socoabeActionQueue[j] = tmp;
    }

    // Apply a tiny slice instantly to keep the system responsive (optional)
    const immediateCap = Math.min(400, socoabeActionQueue.length);
    let appliedNow = 0;

    console.log(`--- SoCoABE Action Phase: ${socoabeActionQueue.length} decided switches (cap immediate=${immediateCap}) ---`);

    // 4a) Apply a small number immediately
    for (; appliedNow < immediateCap; appliedNow++) {
        const action = socoabeActionQueue[appliedNow];
        try {
            fmengine.standId = action.standId;
            if (stand && stand.id > 0) {
                stand.setSTP(action.newStpName);
                // Jittered next assessment
                var jitter = Math.floor(Math.random() * 6) - 3;
                stand.setFlag('nextAssessmentYear', year + 10 + jitter);
                if (action.speciesStrategy) stand.setFlag('targetSpecies', action.speciesStrategy);
                console.log(`> Stand ${action.standId}: Agent ${stand.agent && stand.agent.name ? stand.agent.name : 'NA'} switched STP to '${action.newStpName}'.`);
            }
        } catch (e) {
            console.error("Error executing action for stand " + action.standId + ": " + (e && e.message ? e.message : e));
        }
    }

    // 4b) Defer the rest over future years to avoid spikes.
    //    Spread over the next 2–5 years, plus per-stand jitter based on absoluteAge to decorrelate.
    for (let k = appliedNow; k < socoabeActionQueue.length; k++) {
        const action = socoabeActionQueue[k];
        try {
            fmengine.standId = action.standId;
            if (!stand || stand.id <= 0) continue;

            const absAge = Number(stand.absoluteAge || 0);
            const phase = Math.max(0, Math.min(4, Math.floor(absAge % 5))); // 0..4
            const pushYears = 2 + phase; // scatter 2..6 years ahead
            const targetYear = year + pushYears;
            pushDeferredSwitch(targetYear, {
                standId: action.standId,
                newStpName: action.newStpName,
                speciesStrategy: action.speciesStrategy || null
            });
        } catch (e) {
            console.error("Error deferring action for stand " + (action && action.standId) + ": " + (e && e.message ? e.message : e));
        }
    }

    socoabeActionQueue = []; // clear
};

// Tenure turnover unchanged except for safer logging & replacement plumbing
SoCoABeMain.prototype.handleAgentTurnover = function(year) {
    var replacedAgentsLog = [];

    // Iterate over the existing array IN PLACE (no replacement of entries)
    for (var i = 0; i < this.agents.length; i++) {
        var agent = this.agents[i];
        if (agent.tenureLeft <= 0) {
            var owner = agent.owner;
            var sameAgent = owner.replaceAgent(agent, year); // now mutates in place and returns same reference

            // For logging only
            replacedAgentsLog.push({ old: agent.agentId, neo: sameAgent.agentId });
        }
    }

    // No changes to owner.agents arrays or this.agents arrays are needed anymore.

    if (replacedAgentsLog.length > 0) {
        console.log("--- Tenure turnover @ Year " + year + ": updated " + replacedAgentsLog.length + " agents in place ---");
        for (var j = 0; j < replacedAgentsLog.length; j++) {
            var r = replacedAgentsLog[j];
            console.log("  > " + r.old + " -> " + r.neo + " (in-place)");
        }
    }
};

// Export a single global
var socoabe = new SoCoABeMain();

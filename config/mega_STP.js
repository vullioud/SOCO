/**
 * =================================================================================
 * FILE: mega_STP.js
 * TYPE: Configuration (iLand Stand Treatment Program)
 * =================================================================================
 * DESCRIPTION:
 * This file defines the single, comprehensive "Mega-STP" for the SoCoABE model.
 * It contains definitions for ALL possible management activities. The SoCoABE agent
 * triggers a specific activity by setting the 'abe_next_activity' flag on a stand.
 *
 * Each activity uses an `onEvaluate` function to check this flag, acting as a
 * gatekeeper to ensure only the agent's chosen activity can run.
 * =================================================================================
 */

if (typeof lib === 'undefined') {
    fmengine.abort("ABE Library ('lib') is not defined. MegaSTP cannot be built.");
}

console.log("--- Defining the SoCoABE Mega-STP (Full Version) ---");

// --- I. DEFAULTS & HELPER ---

const MEGA_STP_DEFAULTS = {
    clearcut:           { rotation_age: 100 },
    AllBigTrees:        { dbh_threshold: 60 },
    shelterwood:        { times: 3, interval: 8, nTrees: 50, speciesSelectivity: {} },
    femel:              { steps: 3, interval: 10, N: 4 },
    targetDBH:          { times: 5, targetDBH: 50, dbhList: {} },
    fromBelow:          { times: 4, interval: 8, thinningShare: 0.15, speciesSelectivity: {} },
    selectiveThinning:  { times: 5, interval: 5, nTrees: 80, nCompetitors: 4, speciesSelectivity: {} },
    plenter:            { interval: 10, plenterCurve: {} },
    tending:            { times: 3, interval: 3, intensity: 10, speciesSelectivity: {} },
    planting:           { speciesSelectivity: {} }
};

function getFlag(flagName, defaultValue) {
    const value = stand.flag(flagName);
    return (value !== undefined && value !== null) ? value : defaultValue;
}

const MEGA_STP_ACTIVITIES = {};

// --- II. ACTIVITY DEFINITIONS ---

// 1. No Management
MEGA_STP_ACTIVITIES['noManagement'] = lib.harvest.noManagement();
MEGA_STP_ACTIVITIES['noManagement'].onEvaluate = function() {
    return getFlag('abe_next_activity', 'none') === 'noManagement';
};

// 2. Clearcut
MEGA_STP_ACTIVITIES['clearcut'] = lib.harvest.clearcut({
    id: 'MegaSTP_Clearcut',
    schedule: { opt: () => getFlag('abe_param_rotation_age', MEGA_STP_DEFAULTS.clearcut.rotation_age), force: true },
    sendSignal: 'Activity_Completed'
});
MEGA_STP_ACTIVITIES['clearcut'].onEvaluate = function() {
    return getFlag('abe_next_activity', 'none') === 'clearcut';
};

// 3. Harvest All Big Trees
MEGA_STP_ACTIVITIES['AllBigTrees'] = lib.harvest.HarvestAllBigTrees({
    id: 'MegaSTP_AllBigTrees',
    schedule: { min: 1, opt: 10, max: 500 },
    preferenceFunction: () => 'dbh > ' + getFlag('abe_param_dbh_threshold', MEGA_STP_DEFAULTS.AllBigTrees.dbh_threshold),
    sendSignal: 'Activity_Completed'
});
MEGA_STP_ACTIVITIES['AllBigTrees'].onEvaluate = function() {
    return getFlag('abe_next_activity', 'none') === 'AllBigTrees';
};

// 4. Shelterwood
var shelterwoodProgram = lib.harvest.shelterwood({
    id: 'MegaSTP_Shelterwood',
    schedule: { min: 1, opt: 10, max: 500 },
    times:              () => getFlag('abe_param_times', MEGA_STP_DEFAULTS.shelterwood.times),
    interval:           () => getFlag('abe_param_interval', MEGA_STP_DEFAULTS.shelterwood.interval),
    nTrees:             () => getFlag('abe_param_nTrees', MEGA_STP_DEFAULTS.shelterwood.nTrees),
    speciesSelectivity: () => getFlag('abe_param_speciesSelectivity', MEGA_STP_DEFAULTS.shelterwood.speciesSelectivity),
    sendSignal: 'Activity_Completed'
});
for (var key in shelterwoodProgram) {
    if (typeof shelterwoodProgram[key] === 'object' && shelterwoodProgram[key].type) {
        shelterwoodProgram[key].onEvaluate = function() {
            return getFlag('abe_next_activity', 'none') === 'shelterwood';
        };
        MEGA_STP_ACTIVITIES['shelterwood_' + key] = shelterwoodProgram[key];
    }
}

// 5. Femel Harvest System
var femelProgram = {
    SelectPatches: lib.selectOptimalPatches({
        id: 'MegaSTP_Femel_Select',
        schedule: { min: 1, opt: 10, max: 500 },
        N: () => getFlag('abe_param_N', MEGA_STP_DEFAULTS.femel.N),
        patchsize: 2,
        criterium: 'max_basalarea',
        sendSignal: 'Internal_Femel_Patches_Selected'
    }),
    HarvestSequence: lib.harvest.femel({
        id: 'MegaSTP_Femel_Harvest',
        schedule: { signal: 'Internal_Femel_Patches_Selected' },
        steps:    () => getFlag('abe_param_steps', MEGA_STP_DEFAULTS.femel.steps),
        interval: () => getFlag('abe_param_interval', MEGA_STP_DEFAULTS.femel.interval),
        sendSignal: 'Activity_Completed'
    })
};
femelProgram.SelectPatches.onEvaluate = function() {
    return getFlag('abe_next_activity', 'none') === 'femel';
};
MEGA_STP_ACTIVITIES['femel_SelectPatches'] = femelProgram.SelectPatches;
for (var femelKey in femelProgram.HarvestSequence) {
    if (typeof femelProgram.HarvestSequence[femelKey] === 'object' && femelProgram.HarvestSequence[femelKey].type) {
        MEGA_STP_ACTIVITIES['femel_' + femelKey] = femelProgram.HarvestSequence[femelKey];
    }
}

// 6. Target Diameter Harvest
MEGA_STP_ACTIVITIES['targetDBH'] = lib.harvest.targetDBH({
    id: 'MegaSTP_TargetDBH',
    schedule: { repeat: true, repeatInterval: () => getFlag('abe_param_times', MEGA_STP_DEFAULTS.targetDBH.times) },
    targetDBH: () => getFlag('abe_param_targetDBH', MEGA_STP_DEFAULTS.targetDBH.targetDBH),
    dbhList:   () => getFlag('abe_param_dbhList', MEGA_STP_DEFAULTS.targetDBH.dbhList)
});
MEGA_STP_ACTIVITIES['targetDBH'].onEvaluate = function() {
    return getFlag('abe_next_activity', 'none') === 'targetDBH';
};

// 7. Thinning from Below
var fromBelowProgram = lib.thinning.fromBelow({
    id: 'MegaSTP_FromBelow',
    schedule: { min: 20, opt: 30, max: 500 },
    thinningShare:      () => getFlag('abe_param_thinningShare', MEGA_STP_DEFAULTS.fromBelow.thinningShare),
    speciesSelectivity: () => getFlag('abe_param_speciesSelectivity', MEGA_STP_DEFAULTS.fromBelow.speciesSelectivity),
    times:              () => getFlag('abe_param_times', MEGA_STP_DEFAULTS.fromBelow.times),
    interval:           () => getFlag('abe_param_interval', MEGA_STP_DEFAULTS.fromBelow.interval),
    sendSignal: 'Activity_Completed'
});
for (var fbKey in fromBelowProgram) {
    if (typeof fromBelowProgram[fbKey] === 'object' && fromBelowProgram[fbKey].type) {
        fromBelowProgram[fbKey].onEvaluate = function() {
            return getFlag('abe_next_activity', 'none') === 'fromBelow';
        };
        MEGA_STP_ACTIVITIES['fromBelow_' + fbKey] = fromBelowProgram[fbKey];
    }
}

// 8. Selective Thinning
var selectiveProgram = lib.thinning.selectiveThinning({
    id: 'MegaSTP_Selective',
    schedule: { min: 1, opt: 10, max: 500 },
    nTrees:             () => getFlag('abe_param_nTrees', MEGA_STP_DEFAULTS.selectiveThinning.nTrees),
    nCompetitors:       () => getFlag('abe_param_nCompetitors', MEGA_STP_DEFAULTS.selectiveThinning.nCompetitors),
    times:              () => getFlag('abe_param_times', MEGA_STP_DEFAULTS.selectiveThinning.times),
    interval:           () => getFlag('abe_param_interval', MEGA_STP_DEFAULTS.selectiveThinning.interval),
    speciesSelectivity: () => getFlag('abe_param_speciesSelectivity', MEGA_STP_DEFAULTS.selectiveThinning.speciesSelectivity),
    sendSignal: 'Activity_Completed'
});
for (var selKey in selectiveProgram) {
    if (typeof selectiveProgram[selKey] === 'object' && selectiveProgram[selKey].type) {
        selectiveProgram[selKey].onEvaluate = function() {
            return getFlag('abe_next_activity', 'none') === 'selectiveThinning';
        };
        MEGA_STP_ACTIVITIES['selectiveThinning_' + selKey] = selectiveProgram[selKey];
    }
}

// 9. Plenter
var plenterProgram = lib.thinning.plenter({
    id: 'MegaSTP_Plenter',
    schedule: { min: 1, opt: 10, max: 500 },
    interval:     () => getFlag('abe_param_interval', MEGA_STP_DEFAULTS.plenter.interval),
    plenterCurve: () => getFlag('abe_param_plenterCurve', MEGA_STP_DEFAULTS.plenter.plenterCurve)
});
for (var pKey in plenterProgram) {
    if (typeof plenterProgram[pKey] === 'object' && plenterProgram[pKey].type) {
         plenterProgram[pKey].onEvaluate = function() {
            return getFlag('abe_next_activity', 'none') === 'plenter';
         };
         MEGA_STP_ACTIVITIES['plenter_' + pKey] = plenterProgram[pKey];
    }
}

// 10. Tending
var tendingProgram = lib.thinning.tending({
    id: 'MegaSTP_Tending',
    schedule: { min: 1, opt: 10, max: 500 },
    times:              () => getFlag('abe_param_times', MEGA_STP_DEFAULTS.tending.times),
    interval:           () => getFlag('abe_param_interval', MEGA_STP_DEFAULTS.tending.interval),
    intensity:          () => getFlag('abe_param_intensity', MEGA_STP_DEFAULTS.tending.intensity),
    speciesSelectivity: () => getFlag('abe_param_speciesSelectivity', MEGA_STP_DEFAULTS.tending.speciesSelectivity),
    sendSignal: 'Activity_Completed'
});
for (var tKey in tendingProgram) {
    if (typeof tendingProgram[tKey] === 'object' && tendingProgram[tKey].type) {
        tendingProgram[tKey].onEvaluate = function() {
            return getFlag('abe_next_activity', 'none') === 'tending';
        };
        MEGA_STP_ACTIVITIES['tending_' + tKey] = tendingProgram[tKey];
    }
}

// 11. Planting
MEGA_STP_ACTIVITIES['planting'] = lib.planting.dynamic({
    id: 'MegaSTP_Planting',
    schedule: { min: 1, opt: 2, max: 5 },
    speciesSelectivity: () => getFlag('abe_param_speciesSelectivity', MEGA_STP_DEFAULTS.planting.speciesSelectivity),
    sendSignal: 'Activity_Completed'
});
MEGA_STP_ACTIVITIES['planting'].onEvaluate = function() {
    return getFlag('abe_next_activity', 'none') === 'planting';
};

// 12. Universal Salvage (NO onEvaluate CHECK NEEDED)
MEGA_STP_ACTIVITIES['salvage'] = lib.harvest.salvage({
    id: 'Universal_Salvage',
    clearAll: true,
    sendSignal: 'Activity_Completed'
});

// --- III. FINAL STP ASSEMBLY ---
var MegaSTP = {
    U: [120, 150, 180],
    activities: MEGA_STP_ACTIVITIES,
    onSignal: function(signal) {
        if (!stand || !stand.id) return;
        if (signal === 'Activity_Completed') {
            var activityName = stand.activity ? stand.activity.name : 'unknown';
            fmengine.log(`Activity '${activityName}' completed. Flagging stand ${stand.id} for agent reassessment.`);
            stand.setFlag('abe_last_activity', activityName);
            stand.setFlag('abe_last_activity_year', Globals.year);
            stand.setFlag('abe_need_reassessment', true);
            stand.setFlag('abe_next_activity', null);
        }
    }
};

this.MegaSTP = MegaSTP;
console.log("--- SoCoABE Mega-STP (Full Version) defined successfully. ---");
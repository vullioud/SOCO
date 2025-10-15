// ----- Start of Corrected File: config/base_STP_definitions.js -----

var BASE_STP_DEFINITIONS = {};

/**
 * Reads the agent-specific SpeedFactor from a flag on the stand.
 */
function getSpeedFactorFromFlag() {
    if (!stand) return 1.0;
    var speedFactor = stand.flag('agentSpeedFactor');
    return (typeof speedFactor === 'number' && !isNaN(speedFactor)) ? speedFactor : 1.0;
}

// --- No Management ---
BASE_STP_DEFINITIONS['no_management'] = {
    U: [200, 250, 300],
    activities: function() { return [lib.harvest.noManagement()]; }
};

// --- Low Structure 1: Clearcut System (No Species Choice) ---
BASE_STP_DEFINITIONS['clearcut_system_noSC'] = {
    U: [70, 80, 100],
    activities: function() {
        var tending = lib.thinning.tending({ id: 'LS1Tending_noSC', schedule: { opt: 5 }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(3 / getSpeedFactorFromFlag()); }, intensity: 1, block: false });
        var thinning = lib.thinning.fromBelow({ id: 'LS1ThinningFromBelow_noSC', schedule: { min: 20, opt: 25, max: 30 }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, thinningShare: function() { return 0.01 * getSpeedFactorFromFlag(); } });
        var regularClearcut = lib.harvest.clearcut({ id: 'LS1Clearcut_noSC', schedule: { minRel: 0.7, optRel: 1, maxRel: 1.2, force: true }, sendSignal: 'Clearcut_done' });
        var cleanupClearcut = lib.harvest.clearcut({ id: 'LS1CleanupClearcut_noSC', schedule: { opt: 1, force: true }, constraint: 'stand.absoluteAge > 100', sendSignal: 'Clearcut_done' });
        var salvage = lib.harvest.salvage({ id: 'LS1Salvage_noSC', clearAll: true, sendSignal: 'Clearcut_done' });
        return [tending, thinning, regularClearcut, cleanupClearcut, salvage];
    }
};

// --- Low Structure 1: Clearcut System (WITH Species Choice) ---
BASE_STP_DEFINITIONS['clearcut_system_SC'] = {
    U: [80, 100, 120],
    activities: function() {
        var planting = lib.planting.dynamic({ id: 'LS1Planting_SC', schedule: { signal: 'Clearcut_done' }, speciesSelectivity: dynamicPlantingSelectivity });
        var tending = lib.thinning.tending({ id: 'LS1Tending_SC', schedule: { opt: 5 }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(3 / getSpeedFactorFromFlag()); }, intensity: 10, speciesSelectivity: dynamicTendingSelectivity, block: false });
        var thinning = lib.thinning.fromBelow({ id: 'LS1ThinningFromBelow_SC', schedule: { min: 20, opt: 25, max: 30 }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, speciesSelectivity: dynamicPlantingSelectivity, thinningShare: function() { return 0.15 * getSpeedFactorFromFlag(); } });
        var regularClearcut = lib.harvest.clearcut({ id: 'LS1Clearcut_SC', schedule: { minRel: 0.7, optRel: 1, maxRel: 1.2, force: true }, sendSignal: 'Clearcut_done' });
        var cleanupClearcut = lib.harvest.clearcut({ id: 'LS1CleanupClearcut_SC', schedule: { opt: 1, force: true }, constraint: 'stand.absoluteAge > 100', sendSignal: 'Clearcut_done' });
        var salvage = lib.harvest.salvage({ id: 'LS1Salvage_SC', clearAll: true, sendSignal: 'Clearcut_done' });
        return [planting, tending, thinning, regularClearcut, cleanupClearcut, salvage];
    }
};

// --- Low Structure 2: Shelterwood System (No Species Choice) ---
BASE_STP_DEFINITIONS['shelterwood_system_noSC'] = {
    U: [80, 100, 120],
    activities: function() {
        var tending = lib.thinning.tending({ id: 'LS2Tending_noSC', schedule: { opt: 5 }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(3 / getSpeedFactorFromFlag()); }, intensity: 10, block: false });
        var thinning = lib.thinning.fromBelow({ id: 'LS2ThinningFromBelow_noSC', schedule: { min: 30, opt: 35, max: 70 }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, thinningShare: function() { return 0.15 * getSpeedFactorFromFlag(); }, block: false });
        var shelterwood = lib.harvest.shelterwood({ id: 'LS2Shelterwood_noSC', schedule: { minRel: 0.8, optRel: 0.9, maxRel: 1.2, force: true }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(3 * getSpeedFactorFromFlag()); }, internalSignal: 'Shelterwood_remove' });
        var salvage = lib.harvest.salvage({ id: 'LS2Salvage_noSC', clearAll: true, sendSignal: 'Shelterwood_remove' });
        return [tending, thinning, shelterwood, salvage];
    }
};

// --- Low Structure 2: Shelterwood System (WITH Species Choice) ---
BASE_STP_DEFINITIONS['shelterwood_system_SC'] = {
    U: [100, 120, 140],
    activities: function() {
        var planting = lib.planting.dynamic({ id: 'LS2Planting_SC', schedule: { signal: 'Shelterwood_remove' }, speciesSelectivity: dynamicPlantingSelectivity });
        var tending = lib.thinning.tending({ id: 'LS2Tending_SC', schedule: { opt: 5 }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(3 / getSpeedFactorFromFlag()); }, intensity: 10, speciesSelectivity: dynamicTendingSelectivity, block: false, constraint: 'stand.age > 5 and stand.volume > 10' });
        var thinning = lib.thinning.fromBelow({ id: 'LS2ThinningFromBelow_SC', schedule: { min: 30, opt: 35, max: 70 }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, speciesSelectivity: dynamicTendingSelectivity, thinningShare: function() { return 0.15 * getSpeedFactorFromFlag(); }, constraint: 'stand.age > 30 and stand.volume > 80' });
        var shelterwood = lib.harvest.shelterwood({ id: 'LS2Shelterwood_SC', schedule: { minRel: 0.8, optRel: 0.9, maxRel: 1.2, force: true }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(3 * getSpeedFactorFromFlag()); }, speciesSelectivity: dynamicTendingSelectivity, internalSignal: 'Shelterwood_remove', constraint: 'stand.age > 70 and stand.volume > 180' });
        var salvage = lib.harvest.salvage({ id: 'LS2Salvage_SC', clearAll: true, sendSignal: 'Shelterwood_remove' });
        return [planting, tending, thinning, shelterwood, salvage];
    }
};

// --- Medium Structure: Femel System (No Species Choice) ---
BASE_STP_DEFINITIONS['femel_system_noSC'] = {
    U: [80, 90, 100],
    activities: function() {
        var tending = lib.thinning.tending({ id: 'MSTending_noSC', schedule: { opt: 10 }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(3 / getSpeedFactorFromFlag()); }, intensity: 10, block: false });
        var selectiveThinning = lib.thinning.selectiveThinning({ id: 'MSSelectiveThinning_noSC', schedule: { min: 30, opt: 30, max: 50, force: true }, mode: 'dynamic', nTrees: 80, nCompetitors: function() { return Math.max(1, Math.round(4 * getSpeedFactorFromFlag())); }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, sendSignal: 'selective_thinning_remove' });
        var selectPatches = lib.selectOptimalPatches({ id: 'MSSelectPatches_noSC', schedule: { minRel: 0.95, optRel: 0.95, maxRel: 1.2, force: true }, N: function() { return Math.round(2 * getSpeedFactorFromFlag()); }, patchId: 1, patchsize: 2, spacing: 0, criterium: 'max_basalarea', sendSignal: 'PatchesSelected' });
        var harvestPatches = lib.harvest.femel({ id: 'MSHarvestPatches_noSC', schedule: { signal: 'PatchesSelected' }, steps: function() { return Math.round(2 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(10 / getSpeedFactorFromFlag()); }, harvestAll: true });
        var salvage = lib.harvest.salvage({ id: 'MSSalvage_noSC', sendSignal: 'MS_Salvage_done' });
        var reselectAfterSalvage = lib.selectOptimalPatches({ id: 'MSReselectAfterSalvage_noSC', schedule: { signal: 'MS_Salvage_done', wait: 1 }, N: function() { return Math.round(4 * getSpeedFactorFromFlag()); }, patchId: 1, patchsize: 2, spacing: 0, criterium: 'max_light', sendSignal: 'PatchesSelected' });
        return [tending, selectiveThinning, selectPatches, harvestPatches, salvage, reselectAfterSalvage];
    }
};

// --- Medium Structure: Femel System (WITH Species Choice) ---
BASE_STP_DEFINITIONS['femel_system_SC'] = {
    U: [100, 110, 120],
    activities: function() {
        var tending = lib.thinning.tending({ id: 'MSTending_SC', schedule: { opt: 10 }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(3 / getSpeedFactorFromFlag()); }, intensity: 10, speciesSelectivity: dynamicTendingSelectivity, block: false });
        var selectiveThinning = lib.thinning.selectiveThinning({ id: 'MSSelectiveThinning_SC', schedule: { min: 30, opt: 30, max: 50, force: true }, mode: 'dynamic', nTrees: 20, nCompetitors: function() { return Math.max(1, Math.round(4 * getSpeedFactorFromFlag())); }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, speciesSelectivity: dynamicTendingSelectivity, sendSignal: 'selective_thinning_remove' });
        var selectPatches = lib.selectOptimalPatches({ id: 'MSSelectPatches_SC', schedule: { minRel: 0.95, optRel: 0.95, maxRel: 1.2, force: true }, N: function() { return Math.round(2 * getSpeedFactorFromFlag()); }, patchId: 1, patchsize: 2, spacing: 0, criterium: 'max_basalarea', sendSignal: 'PatchesSelected' });
        var planting = lib.planting.dynamic({ id: 'MSPlanting_SC', schedule: { signal: 'PatchesSelected' }, patches: 'patch>=1', speciesSelectivity: dynamicPlantingSelectivity });
        var harvestPatches = lib.harvest.femel({ id: 'MSHarvestPatches_SC', schedule: { signal: 'PatchesSelected' }, steps: function() { return Math.round(2 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(10 / getSpeedFactorFromFlag()); }, harvestAll: true });
        var salvage = lib.harvest.salvage({ id: 'MSSalvage_SC', sendSignal: 'MS_Salvage_done' });
        var reselectAfterSalvage = lib.selectOptimalPatches({ id: 'MSReselectAfterSalvage_SC', schedule: { signal: 'MS_Salvage_done', wait: 1 }, N: function() { return Math.round(4 * getSpeedFactorFromFlag()); }, patchId: 1, patchsize: 2, spacing: 0, criterium: 'max_light', sendSignal: 'PatchesSelected' });
        return [tending, selectiveThinning, selectPatches, planting, harvestPatches, salvage, reselectAfterSalvage];
    }
};

// --- High Structure: Plenter System (No Species Choice) ---
BASE_STP_DEFINITIONS['plenter_system_noSC'] = {
    U: [140, 180, 220],
    activities: function() {
        // CORRECTED SCHEDULE: Removed conflicting absolute time properties.
        var plenterThinning = lib.thinning.plenter({
            schedule: { repeat: true, repeatInterval: 5 },
            id: 'HSPlenterThinning_noSC',
            sendSignal: 'plenter_execute',
            block: false
        });
        var harvest = lib.harvest.targetDBH({ id: 'HSHarvest_noSC', schedule: { signal: 'plenter_execute' }, dbhList: function() { var sf = getSpeedFactorFromFlag(); return { "fasy": 65/sf, "frex": 60/sf, "piab": 45/sf, "quro": 75/sf, "pisy": 45/sf, "lade": 65/sf, "qupe": 75/sf, "psme": 65/sf, "abal": 45/sf, "acps": 60/sf, "pini": 45/sf }; } });
        var salvage = lib.harvest.salvage({ id: 'HSSalvage_noSC', sendSignal: "doNothing" });
        return [plenterThinning, harvest, salvage];
    }
};

// --- High Structure: Plenter System (WITH Species Choice) ---
BASE_STP_DEFINITIONS['plenter_system_SC'] = {
    U: [140, 180, 220],
    activities: function() {
        // CORRECTED SCHEDULE: Removed conflicting absolute time properties.
        var plenterThinning = lib.thinning.plenter({
            id: 'HSPlenterThinning_SC',
            schedule: { repeat: true, repeatInterval: 5 },
            sendSignal: 'plenter_execute',
            block: false
        });
        var harvest = lib.harvest.targetDBH({ id: 'HSHarvest_SC', schedule: { signal: 'plenter_execute' }, dbhList: function() { var sf = getSpeedFactorFromFlag(); return { "fasy": 65/sf, "frex": 60/sf, "piab": 45/sf, "quro": 75/sf, "pisy": 45/sf, "lade": 65/sf, "qupe": 75/sf, "psme": 65/sf, "abal": 45/sf, "acps": 60/sf, "pini": 45/sf }; } });
        var salvage = lib.harvest.salvage({ id: 'HSSalvage_SC', sendSignal: 'HS_Salvage_done' });
        var reselectAfterSalvage = lib.selectOptimalPatches({ id: 'HSReselectAfterSalvage_SC', schedule: { signal: 'HS_Salvage_done', wait: 1 }, N: function() { return Math.round(4 * getSpeedFactorFromFlag()); }, patchId: 1, patchsize: 2, spacing: 0, criterium: 'max_light', sendSignal: 'PatchesSelected' });
        var replantAfterReselect = lib.planting.dynamic({ id: 'HSReplantAfterReselect_SC', schedule: { signal: 'PatchesSelected', wait: 1 }, patches: 'patch>=1', speciesSelectivity: dynamicPlantingSelectivity });
        return [plenterThinning, harvest, salvage, reselectAfterSalvage, replantAfterReselect];
    }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BASE_STP_DEFINITIONS;
}
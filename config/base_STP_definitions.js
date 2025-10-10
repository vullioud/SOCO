var BASE_STP_DEFINITIONS = {};

// --- Helper Function for Dynamic Parameters ---
function getSpeedFactorFromFlag() {
    if (!stand) return 1.0;
    const speedFactor = stand.flag('agentSpeedFactor');
    return (typeof speedFactor === 'number' && !isNaN(speedFactor)) ? speedFactor : 1.0;
}

// --- No Management ---
BASE_STP_DEFINITIONS['no_management'] = {
    U: [200, 250, 300],
    activities: () => [lib.harvest.noManagement()]
};

// --- Low Structure 1: Clearcut System (No Species Choice) ---
BASE_STP_DEFINITIONS['clearcut_system_noSC'] = {
    U: [80, 100, 120],
    activities: () => {
        let tending = lib.thinning.tending({ id: 'LS1Tending_noSC', schedule: { opt: 5 }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(3 / getSpeedFactorFromFlag()); }, intensity: 10, block: false, constraint: 'stand.age > 5 && stand.volume > 10' });
        let thinning = lib.thinning.fromBelow({ id: 'LS1ThinningFromBelow_noSC', schedule: { min: 20, opt: 25, max: 30 }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, thinningShare: function() { return 0.15 * getSpeedFactorFromFlag(); }, constraint: 'stand.age > 20 && stand.volume > 50' });
        // CORRECTED: Changed stand.age to stand.absoluteAge for final harvest constraint
        let clearcut = lib.harvest.clearcut({ id: 'LS1Clearcut_noSC', schedule: { minRel: function() { return 0.8 / getSpeedFactorFromFlag(); }, optRel: function() { return 1.0 / getSpeedFactorFromFlag(); }, maxRel: function() { return 1.2 / getSpeedFactorFromFlag(); }, force: true }, sendSignal: 'Clearcut_done', constraint: 'stand.absoluteAge > 60 && stand.volume > 150' });
        let salvage = lib.harvest.salvage({ id: 'LS1Salvage_noSC', clearAll: true, sendSignal: 'Clearcut_done' });
        return [tending, thinning, clearcut, salvage];
    }
};

// --- Low Structure 1: Clearcut System (WITH Species Choice) ---
BASE_STP_DEFINITIONS['clearcut_system_SC'] = {
    U: [80, 100, 120],
    activities: () => {
        let planting = lib.planting.dynamic({ id: 'LS1Planting_SC', schedule: { signal: 'Clearcut_done' }, speciesSelectivity: dynamicPlantingSelectivity });
        let tending = lib.thinning.tending({ id: 'LS1Tending_SC', schedule: { opt: 5 }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(3 / getSpeedFactorFromFlag()); }, intensity: 10, speciesSelectivity: dynamicTendingSelectivity, block: false, constraint: 'stand.age > 5 && stand.volume > 10' });
        let thinning = lib.thinning.fromBelow({ id: 'LS1ThinningFromBelow_SC', schedule: { min: 20, opt: 25, max: 30 }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, speciesSelectivity: dynamicPlantingSelectivity, thinningShare: function() { return 0.15 * getSpeedFactorFromFlag(); }, constraint: 'stand.age > 20 && stand.volume > 50' });
        // CORRECTED: Changed stand.age to stand.absoluteAge for final harvest constraint
        let clearcut = lib.harvest.clearcut({ id: 'LS1Clearcut_SC', schedule: { minRel: function() { return 0.8 / getSpeedFactorFromFlag(); }, optRel: function() { return 1.0 / getSpeedFactorFromFlag(); }, maxRel: function() { return 1.2 / getSpeedFactorFromFlag(); }, force: true }, sendSignal: 'Clearcut_done', constraint: 'stand.absoluteAge > 60 && stand.volume > 150' });
        let salvage = lib.harvest.salvage({ id: 'LS1Salvage_SC', clearAll: true, sendSignal: 'Clearcut_done' });
        return [planting, tending, thinning, clearcut, salvage];
    }
};

// --- Low Structure 2: Shelterwood System (No Species Choice) ---
BASE_STP_DEFINITIONS['shelterwood_system_noSC'] = {
    U: [100, 120, 140],
    activities: () => {
        let tending = lib.thinning.tending({ id: 'LS2Tending_noSC', schedule: { opt: 5 }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(3 / getSpeedFactorFromFlag()); }, intensity: 10, block: false, constraint: 'stand.age > 5 && stand.volume > 10' });
        let thinning = lib.thinning.fromBelow({ id: 'LS2ThinningFromBelow_noSC', schedule: { min: 30, opt: 35, max: 70 }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, thinningShare: function() { return 0.15 * getSpeedFactorFromFlag(); }, constraint: 'stand.age > 30 && stand.volume > 80' });
        // CORRECTED: Changed stand.age to stand.absoluteAge for final harvest constraint
        let shelterwood = lib.harvest.shelterwood({ id: 'LS2Shelterwood_noSC', schedule: { minRel: function() { return 0.8 / getSpeedFactorFromFlag(); }, optRel: function() { return 0.9 / getSpeedFactorFromFlag(); }, maxRel: function() { return 200 / getSpeedFactorFromFlag(); }, force: true }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(3 * getSpeedFactorFromFlag()); }, internalSignal: 'Shelterwood_remove', constraint: 'stand.absoluteAge > 70 && stand.volume > 180' });
        let salvage = lib.harvest.salvage({ id: 'LS2Salvage_noSC', clearAll: true, sendSignal: 'Shelterwood_remove' });
        return [tending, thinning, shelterwood, salvage];
    }
};

// --- Low Structure 2: Shelterwood System (WITH Species Choice) ---
BASE_STP_DEFINITIONS['shelterwood_system_SC'] = {
    U: [100, 120, 140],
    activities: () => {
        let planting = lib.planting.dynamic({ id: 'LS2Planting_SC', schedule: { signal: 'Shelterwood_remove' }, speciesSelectivity: dynamicPlantingSelectivity });
        let tending = lib.thinning.tending({ id: 'LS2Tending_SC', schedule: { opt: 5 }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(3 / getSpeedFactorFromFlag()); }, intensity: 10, speciesSelectivity: dynamicPlantingSelectivity, block: false, constraint: 'stand.age > 5 && stand.volume > 10' });
        let thinning = lib.thinning.fromBelow({ id: 'LS2ThinningFromBelow_SC', schedule: { min: 30, opt: 35, max: 70 }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, speciesSelectivity: dynamicTendingSelectivity, thinningShare: function() { return 0.15 * getSpeedFactorFromFlag(); }, constraint: 'stand.age > 30 && stand.volume > 80' });
        // CORRECTED: Changed stand.age to stand.absoluteAge for final harvest constraint
        let shelterwood = lib.harvest.shelterwood({ id: 'LS2Shelterwood_SC', schedule: { minRel: function() { return 0.8 / getSpeedFactorFromFlag(); }, optRel: function() { return 0.9 / getSpeedFactorFromFlag(); }, maxRel: function() { return 200 / getSpeedFactorFromFlag(); }, force: true }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(3 * getSpeedFactorFromFlag()); }, speciesSelectivity: dynamicTendingSelectivity, internalSignal: 'Shelterwood_remove', constraint: 'stand.absoluteAge > 70 && stand.volume > 180' });
        let salvage = lib.harvest.salvage({ id: 'LS2Salvage_SC', clearAll: true, sendSignal: 'Shelterwood_remove' });
        return [planting, tending, thinning, shelterwood, salvage];
    }
};

// --- Medium Structure: Femel System (No Species Choice) ---
BASE_STP_DEFINITIONS['femel_system_noSC'] = {
    U: [120, 150, 180],
    activities: () => {
        let tending = lib.thinning.tending({ id: 'MSTending_noSC', schedule: { opt: 10 }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(3 / getSpeedFactorFromFlag()); }, intensity: 10, block: false, constraint: 'stand.age > 10 && stand.volume > 20' });
        let selectiveThinning = lib.thinning.selectiveThinning({ id: 'MSSelectiveThinning_noSC', schedule: { min: 30, opt: 30, max: 50, force: true }, mode: 'dynamic', nTrees: 80, nCompetitors: function() { return 4 * getSpeedFactorFromFlag(); }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, sendSignal: 'selective_thinning_remove', constraint: 'stand.age > 30 && stand.volume > 100' });
        
        let selectPatches = lib.selectOptimalPatches({ id: 'MSSelectPatches_noSC', schedule: { minRel: 0.95, optRel: 0.95, maxRel: 200, force: true }, N: function() { return Math.round(4 * getSpeedFactorFromFlag()); }, patchId: 1, patchsize: 2, spacing: 0, criterium: 'max_basalarea', sendSignal: 'PatchesSelected' });
        // CORRECTED: Changed stand.age to stand.absoluteAge for final harvest constraint
        selectPatches.constraint = 'stand.absoluteAge > 80 && stand.volume > 200';
        
        let harvestPatches = lib.harvest.femel({ id: 'MSHarvestPatches_noSC', schedule: { signal: 'PatchesSelected' }, steps: function() { return Math.round(2 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(10 / getSpeedFactorFromFlag()); }, harvestAll: true });
        let salvage = lib.harvest.salvage({ id: 'MSSalvage_noSC', onClear: function() { stand.stp.signal('start'); lib.log(`Disturbance Management: Selecting new patches.`); lib.selectOptimalPatches({ schedule: { signal: 'start' }, N: function() { return Math.round(4 * getSpeedFactorFromFlag()); }, patchId: 1, patchsize: 2, spacing: 0, criterium: 'max_light', sendSignal: 'PatchesSelected' }).action(); } });
        return [tending, selectiveThinning, selectPatches, harvestPatches, salvage];
    }
};

// --- Medium Structure: Femel System (WITH Species Choice) ---
BASE_STP_DEFINITIONS['femel_system_SC'] = {
    U: [120, 150, 180],
    activities: () => {
        let tending = lib.thinning.tending({ id: 'MSTending_SC', schedule: { opt: 10 }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(3 / getSpeedFactorFromFlag()); }, intensity: 10, speciesSelectivity: dynamicTendingSelectivity, block: false, constraint: 'stand.age > 10 && stand.volume > 20' });
        let selectiveThinning = lib.thinning.selectiveThinning({ id: 'MSSelectiveThinning_SC', schedule: { min: 30, opt: 30, max: 50, force: true }, mode: 'dynamic', nTrees: 20, nCompetitors: function() { return 4 * getSpeedFactorFromFlag(); }, interval: function() { return Math.round(5 / getSpeedFactorFromFlag()); }, times: function() { return Math.round(5 * getSpeedFactorFromFlag()); }, speciesSelectivity: dynamicTendingSelectivity, sendSignal: 'selective_thinning_remove', constraint: 'stand.age > 30 && stand.volume > 100' });

        let selectPatches = lib.selectOptimalPatches({ id: 'MSSelectPatches_SC', schedule: { minRel: 0.95, optRel: 0.95, maxRel: 200, force: true }, N: function() { return Math.round(4 * getSpeedFactorFromFlag()); }, patchId: 1, patchsize: 2, spacing: 0, criterium: 'max_basalarea', sendSignal: 'PatchesSelected' });
        // CORRECTED: Changed stand.age to stand.absoluteAge for final harvest constraint
        selectPatches.constraint = 'stand.absoluteAge > 80 && stand.volume > 200';

        let planting = lib.planting.dynamic({ id: 'MSPlanting_SC', schedule: { signal: 'PatchesSelected' }, patches: 'patch>=1', speciesSelectivity: dynamicPlantingSelectivity });
        let harvestPatches = lib.harvest.femel({ id: 'MSHarvestPatches_SC', schedule: { signal: 'PatchesSelected' }, steps: function() { return Math.round(2 * getSpeedFactorFromFlag()); }, interval: function() { return Math.round(10 / getSpeedFactorFromFlag()); } });
        let salvage = lib.harvest.salvage({ id: 'MSSalvage_SC', onClear: function() { stand.stp.signal('start'); lib.log(`Disturbance Management: Selecting new patches.`); lib.selectOptimalPatches({ schedule: { signal: 'start' }, N: function() { return Math.round(4 * getSpeedFactorFromFlag()); }, patchId: 1, patchsize: 2, spacing: 0, criterium: 'max_light', sendSignal: 'PatchesSelected' }).action(); } });
        return [tending, selectiveThinning, selectPatches, planting, harvestPatches, salvage];
    }
};

// --- High Structure: Plenter System ---
// (No changes needed as these are continuous cover systems without a final rotation age)
BASE_STP_DEFINITIONS['plenter_system_noSC'] = {
    U: [140, 180, 220],
    activities: () => {
        let plenterThinning = lib.thinning.plenter({ id: 'HSPlenterThinning_noSC', schedule: { min: 1, opt: 1, max: 1, force: true, absolute: true }, sendSignal: 'plenter_execute', block: false, constraint: 'stand.volume > 100' });
        let harvest = lib.harvest.targetDBH({ id: 'HSHarvest_noSC', schedule: { signal: 'plenter_execute' }, dbhList: function() { const sf = getSpeedFactorFromFlag(); return { "fasy": 65/sf, "frex": 60/sf, "piab": 45/sf, "quro": 75/sf, "pisy": 45/sf, "lade": 65/sf, "qupe": 75/sf, "psme": 65/sf, "abal": 45/sf, "acps": 60/sf, "pini": 45/sf }; }, constraint: 'stand.volume > 100' });
        let salvage = lib.harvest.salvage({ id: 'HSSalvage_noSC', sendSignal: "doNothing" });
        return [plenterThinning, harvest, salvage];
    }
};

BASE_STP_DEFINITIONS['plenter_system_SC'] = {
    U: [140, 180, 220],
    activities: () => {
        let plenterThinning = lib.thinning.plenter({ id: 'HSPlenterThinning_SC', schedule: { min: 1, opt: 1, max: 1, force: true, absolute: true }, sendSignal: 'plenter_execute', block: false, constraint: 'stand.volume > 100' });
        let harvest = lib.harvest.targetDBH({ id: 'HSHarvest_SC', schedule: { signal: 'plenter_execute' }, dbhList: function() { const sf = getSpeedFactorFromFlag(); return { "fasy": 65/sf, "frex": 60/sf, "piab": 45/sf, "quro": 75/sf, "pisy": 45/sf, "lade": 65/sf, "qupe": 75/sf, "psme": 65/sf, "abal": 45/sf, "acps": 60/sf, "pini": 45/sf }; }, constraint: 'stand.volume > 100' });
        let salvage = lib.harvest.salvage({ id: 'HSSalvage_SC', onClear: function() { stand.stp.signal('start'); lib.log(`Disturbance Management: Selecting patches and planting.`); lib.selectOptimalPatches({ schedule: { signal: 'start' }, N: function() { return Math.round(4 * getSpeedFactorFromFlag()); }, patchId: 1, patchsize: 2, spacing: 0, criterium: 'max_light', sendSignal: 'PatchesSelected' }).action(); lib.planting.dynamic({ schedule: {signal: 'PatchesSelected'}, patches: 'patch>=1', speciesSelectivity: dynamicPlantingSelectivity }).onExecute(); } });
        return [plenterThinning, harvest, salvage];
    }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BASE_STP_DEFINITIONS;
}
// ----- Start of File: config/base_STP_definitions.js -----

/**
 * A centralized library of all "Base" Stand Treatment Program (STP) definitions,
 * based on the user's detailed specification.
 */
var BASE_STP_DEFINITIONS = {};

// Helper function to generate STPs for different speeds
function createSpeedVariants(baseName, config) {
    const speeds = {
        '': 1.0,        // Regular speed
        '_slow': 0.8,   // Slow speed
        '_fast': 1.2    // Fast speed
    };

    for (const [suffix, speedFactor] of Object.entries(speeds)) {
        const stpName = `${baseName}${suffix}`;
        BASE_STP_DEFINITIONS[stpName] = {
            U: config.U,
            activities: config.activities.bind(null, speedFactor) // Bind the speed factor to the function
        };
    }
}

// --- No Management ---
BASE_STP_DEFINITIONS['no_management'] = {
    U: [200, 250, 300],
    activities: () => [lib.harvest.noManagement()]
};


// --- Low Structure 1: Clearcut System (No Species Choice) ---
createSpeedVariants('clearcut_system_noSC', {
    U: [80, 100, 120],
    activities: (SpeedFactor) => [
        lib.thinning.tending({ id: 'LS1Tending_noSC', schedule: { opt: 5 }, times: Math.round(5 * SpeedFactor), interval: Math.round(3 / SpeedFactor), intensity: 10, block: false }),
        lib.thinning.fromBelow({ id: 'LS1ThinningFromBelow_noSC', schedule: { min: 20, opt: 25, max: 30 }, interval: Math.round(5 / SpeedFactor), times: Math.round(5 * SpeedFactor), thinningShare: 0.15 * SpeedFactor }),
        lib.harvest.clearcut({ id: 'LS1Clearcut_noSC', schedule: { minRel: 0.8 / SpeedFactor, optRel: 1 / SpeedFactor, maxRel: 1.2 / SpeedFactor, force: true }, sendSignal: 'Clearcut_done' }),
        lib.harvest.salvage({ id: 'LS1Salvage_noSC', clearAll: true, sendSignal: 'Clearcut_done' })
    ]
});

// --- Low Structure 1: Clearcut System (WITH Species Choice) ---
createSpeedVariants('clearcut_system_SC', {
    U: [80, 100, 120],
    activities: (SpeedFactor) => [
        lib.planting.dynamic({ id: 'LS1Planting_SC', schedule: { signal: 'Clearcut_done' }, speciesSelectivity: dynamicPlantingSelectivity }),
        lib.thinning.tending({ id: 'LS1Tending_SC', schedule: { opt: 5 }, times: Math.round(5 * SpeedFactor), interval: Math.round(3 / SpeedFactor), intensity: 10, speciesSelectivity: dynamicTendingSelectivity, block: false }),
        lib.thinning.fromBelow({ id: 'LS1ThinningFromBelow_SC', schedule: { min: 20, opt: 25, max: 30 }, interval: Math.round(5 / SpeedFactor), times: Math.round(5 * SpeedFactor), speciesSelectivity: dynamicPlantingSelectivity, thinningShare: 0.15 * SpeedFactor }),
        lib.harvest.clearcut({ id: 'LS1Clearcut_SC', schedule: { minRel: 0.8 / SpeedFactor, optRel: 1 / SpeedFactor, maxRel: 1.2 / SpeedFactor, force: true }, sendSignal: 'Clearcut_done' }),
        lib.harvest.salvage({ id: 'LS1Salvage_SC', clearAll: true, sendSignal: 'Clearcut_done' })
    ]
});

// --- Low Structure 2: Shelterwood System (No Species Choice) ---
createSpeedVariants('shelterwood_system_noSC', {
    U: [100, 120, 140],
    activities: (SpeedFactor) => [
        lib.thinning.tending({ id: 'LS2Tending_noSC', schedule: { opt: 5 }, times: Math.round(5 * SpeedFactor), interval: Math.round(3 / SpeedFactor), intensity: 10, block: false }),
        lib.thinning.fromBelow({ id: 'LS2ThinningFromBelow_noSC', schedule: { min: 30, opt: 35, max: 70 }, interval: Math.round(5 / SpeedFactor), times: Math.round(5 * SpeedFactor), thinningShare: 0.15 * SpeedFactor }),
        lib.harvest.shelterwood({ id: 'LS2Shelterwood_noSC', schedule: { minRel: 0.8 / SpeedFactor, optRel: 0.9 / SpeedFactor, maxRel: 200 / SpeedFactor, force: true }, interval: Math.round(5 / SpeedFactor), times: Math.round(3 * SpeedFactor), internalSignal: 'Shelterwood_remove' }),
        lib.harvest.salvage({ id: 'LS2Salvage_noSC', clearAll: true, sendSignal: 'Shelterwood_remove' })
    ]
});

// --- Low Structure 2: Shelterwood System (WITH Species Choice) ---
createSpeedVariants('shelterwood_system_SC', {
    U: [100, 120, 140],
    activities: (SpeedFactor) => [
        lib.planting.dynamic({ id: 'LS2Planting_SC', schedule: { signal: 'Shelterwood_remove' }, speciesSelectivity: dynamicPlantingSelectivity }),
        lib.thinning.tending({ id: 'LS2Tending_SC', schedule: { opt: 5 }, times: Math.round(5 * SpeedFactor), interval: Math.round(3 / SpeedFactor), intensity: 10, speciesSelectivity: dynamicPlantingSelectivity, block: false }),
        lib.thinning.fromBelow({ id: 'LS2ThinningFromBelow_SC', schedule: { min: 30, opt: 35, max: 70 }, interval: Math.round(5 / SpeedFactor), times: Math.round(5 * SpeedFactor), speciesSelectivity: dynamicTendingSelectivity, thinningShare: 0.15 * SpeedFactor }),
        lib.harvest.shelterwood({ id: 'LS2Shelterwood_SC', schedule: { minRel: 0.8 / SpeedFactor, optRel: 0.9 / SpeedFactor, maxRel: 200 / SpeedFactor, force: true }, interval: Math.round(5 / SpeedFactor), times: Math.round(3 * SpeedFactor), speciesSelectivity: dynamicTendingSelectivity, internalSignal: 'Shelterwood_remove' }),
        lib.harvest.salvage({ id: 'LS2Salvage_SC', clearAll: true, sendSignal: 'Shelterwood_remove' })
    ]
});

// --- Medium Structure: Femel System (No Species Choice) ---
createSpeedVariants('femel_system_noSC', {
    U: [120, 150, 180],
    activities: (SpeedFactor) => [
        lib.thinning.tending({ id: 'MSTending_noSC', schedule: { opt: 10 }, times: Math.round(5 * SpeedFactor), interval: Math.round(3 / SpeedFactor), intensity: 10, block: false }),
        lib.thinning.selectiveThinning({ id: 'MSSelectiveThinning_noSC', schedule: { min: Math.round(30 / SpeedFactor), opt: Math.round(30 / SpeedFactor), max: Math.round(50 / SpeedFactor), force: true }, mode: 'dynamic', nTrees: 80, nCompetitors: 4 * SpeedFactor, interval: Math.round(5 / SpeedFactor), times: Math.round(5 * SpeedFactor), sendSignal: 'selective_thinning_remove' }),
        lib.selectOptimalPatches({ id: 'MSSelectPatches_noSC', schedule: { minRel: 0.95 / SpeedFactor, optRel: 0.95 / SpeedFactor, maxRel: 200 / SpeedFactor, force: true }, N: Math.round(4 * SpeedFactor), patchId: 1, patchsize: 2, spacing: 0, criterium: 'max_basalarea', sendSignal: 'PatchesSelected' }),
        lib.harvest.femel({ id: 'MSHarvestPatches_noSC', schedule: { signal: 'PatchesSelected' }, steps: Math.round(2 * SpeedFactor), interval: Math.round(10 / SpeedFactor), harvestAll: true }),
        lib.harvest.salvage({ id: 'MSSalvage_noSC', onClear: function() { stand.stp.signal('PatchesSelected'); } }) // Simplified onClear
    ]
});

// --- Medium Structure: Femel System (WITH Species Choice) ---
createSpeedVariants('femel_system_SC', {
    U: [120, 150, 180],
    activities: (SpeedFactor) => [
        lib.thinning.tending({ id: 'MSTending_SC', schedule: { opt: 10 }, times: Math.round(5 * SpeedFactor), interval: Math.round(3 / SpeedFactor), intensity: 10, speciesSelectivity: dynamicTendingSelectivity, block: false }),
        lib.thinning.selectiveThinning({ id: 'MSSelectiveThinning_SC', schedule: { min: Math.round(30 / SpeedFactor), opt: Math.round(30 / SpeedFactor), max: Math.round(50 / SpeedFactor), force: true }, mode: 'dynamic', nTrees: 80, nCompetitors: 4 * SpeedFactor, interval: Math.round(5 / SpeedFactor), times: Math.round(5 * SpeedFactor), speciesSelectivity: dynamicTendingSelectivity, sendSignal: 'selective_thinning_remove' }),
        lib.selectOptimalPatches({ id: 'MSSelectPatches_SC', schedule: { minRel: 0.95 / SpeedFactor, optRel: 0.95 / SpeedFactor, maxRel: 200 / SpeedFactor, force: true }, N: Math.round(4 * SpeedFactor), patchId: 1, patchsize: 2, spacing: 0, criterium: 'max_basalarea', sendSignal: 'PatchesSelected' }),
        lib.planting.dynamic({ id: 'MSPlanting_SC', schedule: { signal: 'PatchesSelected' }, patches: 'patch>=1', speciesSelectivity: dynamicPlantingSelectivity }),
        lib.harvest.femel({ id: 'MSHarvestPatches_SC', schedule: { signal: 'PatchesSelected' }, steps: Math.round(2 * SpeedFactor), interval: Math.round(10 / SpeedFactor) }),
        lib.harvest.salvage({ id: 'MSSalvage_SC', onClear: function() { stand.stp.signal('PatchesSelected'); } }) // Simplified onClear
    ]
});

// --- High Structure: Plenter System (No Species Choice) ---
createSpeedVariants('plenter_system_noSC', {
    U: [140, 180, 220],
    activities: (SpeedFactor) => [
        lib.thinning.plenter({ id: 'HSPlenterThinning_noSC', schedule: { min: 1, opt: 1, max: 1, force: true, absolute: true }, sendSignal: 'plenter_execute', block: false }),
        lib.harvest.targetDBH({ id: 'HSHarvest_noSC', schedule: { signal: 'plenter_execute' }, targetDBH: 50 / SpeedFactor, times: 5 * SpeedFactor, dbhList: { "fasy": 65/SpeedFactor, "frex": 60/SpeedFactor, "piab": 45/SpeedFactor, "quro": 75/SpeedFactor, "pisy": 45/SpeedFactor, "lade": 65/SpeedFactor, "qupe": 75/SpeedFactor, "psme": 65/SpeedFactor, "abal": 45/SpeedFactor, "acps": 60/SpeedFactor, "pini": 45/SpeedFactor } }),
        lib.harvest.salvage({ id: 'HSSalvage_noSC', onClear: function() { stand.setSTP(stand.stp.name); } })
    ]
});

// --- High Structure: Plenter System (WITH Species Choice) ---
createSpeedVariants('plenter_system_SC', {
    U: [140, 180, 220],
    activities: (SpeedFactor) => [
        lib.thinning.plenter({ id: 'HSPlenterThinning_SC', schedule: { min: 1, opt: 1, max: 1, force: true, absolute: true }, sendSignal: 'plenter_execute', block: false }),
        lib.harvest.targetDBH({ id: 'HSHarvest_SC', schedule: { signal: 'plenter_execute' }, targetDBH: 50 / SpeedFactor, times: 5 * SpeedFactor, dbhList: { "fasy": 65/SpeedFactor, "frex": 60/SpeedFactor, "piab": 45/SpeedFactor, "quro": 75/SpeedFactor, "pisy": 45/SpeedFactor, "lade": 65/SpeedFactor, "qupe": 75/SpeedFactor, "psme": 65/SpeedFactor, "abal": 45/SpeedFactor, "acps": 60/SpeedFactor, "pini": 45/SpeedFactor } }),
        lib.harvest.salvage({ id: 'HSSalvage_SC', onClear: function() { stand.setSTP(stand.stp.name); } }) // onClear simplified
    ]
});

// For NodeJS testing compatibility
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BASE_STP_DEFINITIONS;
}
// ----- End of File: config/base_STP_definitions.js -----
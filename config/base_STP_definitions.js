// ----- Start of File: config/base_STP_definitions.js (Corrected Syntax and Logging) -----

/**
 * A centralized library of all "Base" Stand Treatment Program (STP) definitions.
 */
var BASE_STP_DEFINITIONS = {};

// Helper to create speed variants (_slow, '', _fast)
function createSpeedVariants(baseName, config) {
    const speeds = {
        '': 1.0,        // Regular
        '_slow': 0.8,   // Slow
        '_fast': 1.2    // Fast
    };

    for (const [suffix, speedFactor] of Object.entries(speeds)) {
        const stpName = `${baseName}${suffix}`;
        BASE_STP_DEFINITIONS[stpName] = {
            U: config.U,
            activities: config.activities.bind(null, speedFactor)
        };
    }
}

function logActivity(id) {
    // This function is now a wrapper to maintain compatibility with existing calls.
    // It creates a snapshot and passes it to the new, more robust logging function.
    if (stand && stand.id > 0) {
        const snapshot = new StandSnapshot(stand.id);
        logActivityWithSnapshot(id, snapshot);
    }
}

function logActivityWithSnapshot(activityId, snapshot) {
    // This function does the actual logging using clean data from the snapshot.
    // It is not called directly by signals, so it won't produce warnings.
    if (!snapshot || !snapshot.isValid) return;

    fmengine.log(
        `EXEC ACTIVITY: ${activityId} | ` +
        `Stand: ${snapshot.id}, ` +
        `Abs. Age: ${snapshot.absoluteAge.toFixed(1)}, ` + // Using absoluteAge from snapshot
        `Eco. Age: ${snapshot.age.toFixed(1)}, ` +
        `Vol: ${snapshot.volume.toFixed(2)}, ` +
        `DBH_std: ${snapshot.structure.dbhStdDev.toFixed(2)}`
    );
}

// --- No Management ---
BASE_STP_DEFINITIONS['no_management'] = {
    U: [200, 250, 300],
    activities: () => [lib.harvest.noManagement()]
};

// --- Low Structure 1: Clearcut System (No Species Choice) ---
createSpeedVariants('clearcut_system_noSC', {
    U: [80, 100, 120],
    activities: (SpeedFactor) => {
        let tending = lib.thinning.tending({ id: 'LS1Tending_noSC', schedule: { opt: 5 }, times: Math.round(5 * SpeedFactor), interval: Math.round(3 / SpeedFactor), intensity: 10, block: false });
        tending.constraint = 'stand.age > 5 and stand.volume > 10';
        tending.onExecute = function() { logActivity(this.id); stand.trees.removeMarkedTrees(); };

        let thinning = lib.thinning.fromBelow({ id: 'LS1ThinningFromBelow_noSC', schedule: { min: 20, opt: 25, max: 30 }, interval: Math.round(5 / SpeedFactor), times: Math.round(5 * SpeedFactor), thinningShare: 0.15 * SpeedFactor });
        thinning.constraint = 'stand.age > 20 and stand.volume > 50';
        thinning.onExecute = function() { logActivity(this.id); stand.trees.removeMarkedTrees(); };

        let clearcut = lib.harvest.clearcut({ id: 'LS1Clearcut_noSC', schedule: { minRel: 0.8 / SpeedFactor, optRel: 1 / SpeedFactor, maxRel: 1.2 / SpeedFactor, force: true }, sendSignal: 'Clearcut_done' });
        clearcut.constraint = 'stand.age > 60 and stand.volume > 150';
        const originalClearcutExecute = clearcut.onExecute;
        clearcut.onExecute = function() { logActivity(this.id); originalClearcutExecute.apply(this, arguments); };

        let salvage = lib.harvest.salvage({ id: 'LS1Salvage_noSC', clearAll: true, sendSignal: 'Clearcut_done' });
        
        return [tending, thinning, clearcut, salvage];
    }
});

// --- Low Structure 1: Clearcut System (WITH Species Choice) ---
createSpeedVariants('clearcut_system_SC', {
    U: [80, 100, 120],
    activities: (SpeedFactor) => {
        let planting = lib.planting.dynamic({ id: 'LS1Planting_SC', schedule: { signal: 'Clearcut_done' }, speciesSelectivity: dynamicPlantingSelectivity });
        
        let tending = lib.thinning.tending({ id: 'LS1Tending_SC', schedule: { opt: 5 }, times: Math.round(5 * SpeedFactor), interval: Math.round(3 / SpeedFactor), intensity: 10, speciesSelectivity: dynamicTendingSelectivity, block: false });
        tending.constraint = 'stand.age > 5 and stand.volume > 10';
        tending.onExecute = function() { logActivity(this.id); stand.trees.removeMarkedTrees(); };

        let thinning = lib.thinning.fromBelow({ id: 'LS1ThinningFromBelow_SC', schedule: { min: 20, opt: 25, max: 30 }, interval: Math.round(5 / SpeedFactor), times: Math.round(5 * SpeedFactor), speciesSelectivity: dynamicPlantingSelectivity, thinningShare: 0.15 * SpeedFactor });
        thinning.constraint = 'stand.age > 20 and stand.volume > 50';
        thinning.onExecute = function() { logActivity(this.id); stand.trees.removeMarkedTrees(); };
        
        let clearcut = lib.harvest.clearcut({ id: 'LS1Clearcut_SC', schedule: { minRel: 0.8 / SpeedFactor, optRel: 1 / SpeedFactor, maxRel: 1.2 / SpeedFactor, force: true }, sendSignal: 'Clearcut_done' });
        clearcut.constraint = 'stand.age > 60 and stand.volume > 150';
        const originalClearcutExecute = clearcut.onExecute;
        clearcut.onExecute = function() { logActivity(this.id); originalClearcutExecute.apply(this, arguments); };
        
        let salvage = lib.harvest.salvage({ id: 'LS1Salvage_SC', clearAll: true, sendSignal: 'Clearcut_done' });

        return [planting, tending, thinning, clearcut, salvage];
    }
});

// --- Low Structure 2: Shelterwood System (No Species Choice) ---
createSpeedVariants('shelterwood_system_noSC', {
    U: [100, 120, 140],
    activities: (SpeedFactor) => {
        let tending = lib.thinning.tending({ id: 'LS2Tending_noSC', schedule: { opt: 5 }, times: Math.round(5 * SpeedFactor), interval: Math.round(3 / SpeedFactor), intensity: 10, block: false });
        tending.constraint = 'stand.age > 5 and stand.volume > 10';
        tending.onExecute = function() { logActivity(this.id); stand.trees.removeMarkedTrees(); };

        let thinning = lib.thinning.fromBelow({ id: 'LS2ThinningFromBelow_noSC', schedule: { min: 30, opt: 35, max: 70 }, interval: Math.round(5 / SpeedFactor), times: Math.round(5 * SpeedFactor), thinningShare: 0.15 * SpeedFactor });
        thinning.constraint = 'stand.age > 30 and stand.volume > 80';
        thinning.onExecute = function() { logActivity(this.id); stand.trees.removeMarkedTrees(); };

        let shelterwood = lib.harvest.shelterwood({ id: 'LS2Shelterwood_noSC', schedule: { minRel: 0.8 / SpeedFactor, optRel: 0.9 / SpeedFactor, maxRel: 200 / SpeedFactor, force: true }, interval: Math.round(5 / SpeedFactor), times: Math.round(3 * SpeedFactor), internalSignal: 'Shelterwood_remove' });
        shelterwood.constraint = 'stand.age > 70 and stand.volume > 180';
        
        let salvage = lib.harvest.salvage({ id: 'LS2Salvage_noSC', clearAll: true, sendSignal: 'Shelterwood_remove' });
        
        return [tending, thinning, shelterwood, salvage];
    }
});

// --- Low Structure 2: Shelterwood System (WITH Species Choice) ---
createSpeedVariants('shelterwood_system_SC', {
    U: [100, 120, 140],
    activities: (SpeedFactor) => {
        let planting = lib.planting.dynamic({ id: 'LS2Planting_SC', schedule: { signal: 'Shelterwood_remove' }, speciesSelectivity: dynamicPlantingSelectivity });

        let tending = lib.thinning.tending({ id: 'LS2Tending_SC', schedule: { opt: 5 }, times: Math.round(5 * SpeedFactor), interval: Math.round(3 / SpeedFactor), intensity: 10, speciesSelectivity: dynamicPlantingSelectivity, block: false });
        tending.constraint = 'stand.age > 5 and stand.volume > 10';
        tending.onExecute = function() { logActivity(this.id); stand.trees.removeMarkedTrees(); };

        let thinning = lib.thinning.fromBelow({ id: 'LS2ThinningFromBelow_SC', schedule: { min: 30, opt: 35, max: 70 }, interval: Math.round(5 / SpeedFactor), times: Math.round(5 * SpeedFactor), speciesSelectivity: dynamicTendingSelectivity, thinningShare: 0.15 * SpeedFactor });
        thinning.constraint = 'stand.age > 30 and stand.volume > 80';
        thinning.onExecute = function() { logActivity(this.id); stand.trees.removeMarkedTrees(); };
        
        let shelterwood = lib.harvest.shelterwood({ id: 'LS2Shelterwood_SC', schedule: { minRel: 0.8 / SpeedFactor, optRel: 0.9 / SpeedFactor, maxRel: 200 / SpeedFactor, force: true }, interval: Math.round(5 / SpeedFactor), times: Math.round(3 * SpeedFactor), speciesSelectivity: dynamicTendingSelectivity, internalSignal: 'Shelterwood_remove' });
        shelterwood.constraint = 'stand.age > 70 and stand.volume > 180';
        
        let salvage = lib.harvest.salvage({ id: 'LS2Salvage_SC', clearAll: true, sendSignal: 'Shelterwood_remove' });

        return [planting, tending, thinning, shelterwood, salvage];
    }
});

// --- Medium Structure: Femel System (No Species Choice) ---
createSpeedVariants('femel_system_noSC', {
    U: [120, 150, 180],
    activities: (SpeedFactor) => {
        let tending = lib.thinning.tending({ id: 'MSTending_noSC', schedule: { opt: 10 }, times: Math.round(5 * SpeedFactor), interval: Math.round(3 / SpeedFactor), intensity: 10, block: false });
        tending.constraint = 'stand.age > 10 and stand.volume > 20';
        tending.onExecute = function() { logActivity(this.id); stand.trees.removeMarkedTrees(); };

        let selectiveThinning = lib.thinning.selectiveThinning({ id: 'MSSelectiveThinning_noSC', schedule: { min: Math.round(30 / SpeedFactor), opt: Math.round(30 / SpeedFactor), max: Math.round(50 / SpeedFactor), force: true }, mode: 'dynamic', nTrees: 80, nCompetitors: 4 * SpeedFactor, interval: Math.round(5 / SpeedFactor), times: Math.round(5 * SpeedFactor), sendSignal: 'selective_thinning_remove' });
        selectiveThinning.constraint = 'stand.age > 30 and stand.volume > 100';

        let selectPatches = lib.selectOptimalPatches({ id: 'MSSelectPatches_noSC', schedule: { minRel: 0.95 / SpeedFactor, optRel: 0.95 / SpeedFactor, maxRel: 200 / SpeedFactor, force: true }, N: Math.round(4 * SpeedFactor), patchId: 1, patchsize: 2, spacing: 0, criterium: 'max_basalarea', sendSignal: 'PatchesSelected' });
        selectPatches.constraint = 'stand.age > 80 and stand.volume > 200';
        const originalSelectAction = selectPatches.action;
        selectPatches.action = function() { logActivity(this.id); originalSelectAction.apply(this, arguments); };

        let harvestPatches = lib.harvest.femel({ id: 'MSHarvestPatches_noSC', schedule: { signal: 'PatchesSelected' }, steps: Math.round(2 * SpeedFactor), interval: Math.round(10 / SpeedFactor), harvestAll: true });
        
        let salvage = lib.harvest.salvage({ id: 'MSSalvage_noSC', onClear: function() { logActivity('MSSalvage_noSC_onClear'); stand.stp.signal('PatchesSelected'); } });

        return [tending, selectiveThinning, selectPatches, harvestPatches, salvage];
    }
});

// --- Medium Structure: Femel System (WITH Species Choice) ---
createSpeedVariants('femel_system_SC', {
    U: [120, 150, 180],
    activities: (SpeedFactor) => {
        let tending = lib.thinning.tending({ id: 'MSTending_SC', schedule: { opt: 10 }, times: Math.round(5 * SpeedFactor), interval: Math.round(3 / SpeedFactor), intensity: 10, speciesSelectivity: dynamicTendingSelectivity, block: false });
        tending.constraint = 'stand.age > 10 and stand.volume > 20';
        tending.onExecute = function() { logActivity(this.id); stand.trees.removeMarkedTrees(); };

        let selectiveThinning = lib.thinning.selectiveThinning({ id: 'MSSelectiveThinning_SC', schedule: { min: Math.round(30 / SpeedFactor), opt: Math.round(30 / SpeedFactor), max: Math.round(50 / SpeedFactor), force: true }, mode: 'dynamic', nTrees: 20, nCompetitors: 4 * SpeedFactor, interval: Math.round(5 / SpeedFactor), times: Math.round(5 * SpeedFactor), speciesSelectivity: dynamicTendingSelectivity, sendSignal: 'selective_thinning_remove' });
        selectiveThinning.constraint = 'stand.age > 30 and stand.volume > 100';

        let selectPatches = lib.selectOptimalPatches({ id: 'MSSelectPatches_SC', schedule: { minRel: 0.95 / SpeedFactor, optRel: 0.95 / SpeedFactor, maxRel: 200 / SpeedFactor, force: true }, N: Math.round(4 * SpeedFactor), patchId: 1, patchsize: 2, spacing: 0, criterium: 'max_basalarea', sendSignal: 'PatchesSelected' });
        selectPatches.constraint = 'stand.age > 80 and stand.volume > 200';
        const originalSelectAction = selectPatches.action;
        selectPatches.action = function() { logActivity(this.id); originalSelectAction.apply(this, arguments); };

        let planting = lib.planting.dynamic({ id: 'MSPlanting_SC', schedule: { signal: 'PatchesSelected' }, patches: 'patch>=1', speciesSelectivity: dynamicPlantingSelectivity });
        
        let harvestPatches = lib.harvest.femel({ id: 'MSHarvestPatches_SC', schedule: { signal: 'PatchesSelected' }, steps: Math.round(2 * SpeedFactor), interval: Math.round(10 / SpeedFactor) });
        
        let salvage = lib.harvest.salvage({ id: 'MSSalvage_SC', onClear: function() { logActivity('MSSalvage_SC_onClear'); stand.stp.signal('PatchesSelected'); } });
        
        return [tending, selectiveThinning, selectPatches, planting, harvestPatches, salvage];
    }
});

// --- High Structure: Plenter System (No Species Choice) ---
createSpeedVariants('plenter_system_noSC', {
    U: [140, 180, 220],
    activities: (SpeedFactor) => {
        let plenterThinning = lib.thinning.plenter({ id: 'HSPlenterThinning_noSC', schedule: { min: 1, opt: 1, max: 1, force: true, absolute: true }, sendSignal: 'plenter_execute', block: false });

        let harvest = lib.harvest.targetDBH({ id: 'HSHarvest_noSC', schedule: { signal: 'plenter_execute' }, targetDBH: 50 / SpeedFactor, times: 5 * SpeedFactor, dbhList: { "fasy": 65/SpeedFactor, "frex": 60/SpeedFactor, "piab": 45/SpeedFactor, "quro": 75/SpeedFactor, "pisy": 45/SpeedFactor, "lade": 65/SpeedFactor, "qupe": 75/SpeedFactor, "psme": 65/SpeedFactor, "abal": 45/SpeedFactor, "acps": 60/SpeedFactor, "pini": 45/SpeedFactor } });
        harvest.constraint = 'stand.volume > 100';
        const originalHarvestAction = harvest.action;
        harvest.action = function() { logActivity(this.id); originalHarvestAction.apply(this, arguments); };

        let salvage = lib.harvest.salvage({ id: 'HSSalvage_noSC', onClear: function() { logActivity('HSSalvage_noSC_onClear'); stand.setSTP(stand.stp.name); } });
        
        return [plenterThinning, harvest, salvage];
    }
});

// --- High Structure: Plenter System (WITH Species Choice) ---
createSpeedVariants('plenter_system_SC', {
    U: [140, 180, 220],
    activities: (SpeedFactor) => {
        let plenterThinning = lib.thinning.plenter({ id: 'HSPlenterThinning_SC', schedule: { min: 1, opt: 1, max: 1, force: true, absolute: true }, sendSignal: 'plenter_execute', block: false });
        
        let harvest = lib.harvest.targetDBH({ id: 'HSHarvest_SC', schedule: { signal: 'plenter_execute' }, targetDBH: 50 / SpeedFactor, times: 5 * SpeedFactor, dbhList: { "fasy": 65/SpeedFactor, "frex": 60/SpeedFactor, "piab": 45/SpeedFactor, "quro": 75/SpeedFactor, "pisy": 45/SpeedFactor, "lade": 65/SpeedFactor, "qupe": 75/SpeedFactor, "psme": 65/SpeedFactor, "abal": 45/SpeedFactor, "acps": 60/SpeedFactor, "pini": 45/SpeedFactor } });
        harvest.constraint = 'stand.volume > 100';
        const originalHarvestAction = harvest.action;
        harvest.action = function() { logActivity(this.id); originalHarvestAction.apply(this, arguments); };

        let salvage = lib.harvest.salvage({ id: 'HSSalvage_SC', onClear: function() { logActivity('HSSalvage_SC_onClear'); stand.setSTP(stand.stp.name); } });
        
        return [plenterThinning, harvest, salvage];
    }
});

// For NodeJS testing compatibility
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BASE_STP_DEFINITIONS;
}

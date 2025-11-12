/**
 * =================================================================================
 * FILE: mega_STP.js
 * =================================================================================
 */

if (typeof lib === 'undefined') {
    fmengine.abort("ABE Library ('lib') is not defined. MegaSTP cannot be built.");
}

console.log("--- Defining the SoCoABE Mega-STP ---");

const MEGA_STP_ACTIVITIES = {};

// --- ACTIVITY DEFINITIONS ---

// 1. No Management
MEGA_STP_ACTIVITIES['noManagement'] = {
    id: 'MegaSTP_NoManagement',
    type: 'general',
    schedule: { signal: 'do_noManagement' },
    action: function() {
        console.log(`[MEGA-STP] Executing 'noManagement' for stand ${stand.id}.`);
    },
    // onExecuted is the reliable event for post-action logic for both general and scheduled activities.
    onExecuted: function() {
        console.log(`[MEGA-STP] onExecuted for noManagement on stand ${stand.id}.`);
        stand.setFlag('abe_last_activity', 'MegaSTP_NoManagement');
        stand.setFlag('abe_last_activity_year', Globals.year);
        stand.setFlag('abe_need_reassessment', false);
    }
};

// 2. Clearcut
MEGA_STP_ACTIVITIES['clearcut'] = {
    id: 'MegaSTP_Clearcut',
    type: 'scheduled',
    schedule: { signal: 'do_clearcut' },
    finalHarvest: true,

    onEvaluate: function() {
        return true; 
    },

    onExecute: function() {
        console.log(`[MEGA-STP] Executing 'clearcut' for stand ${stand.id}.`);
        var preferenceFunction = stand.flag('abe_param_preferenceFunction') || 'dbh > 0';
        stand.trees.load(preferenceFunction);
        var harvested_count = stand.trees.harvest();
        stand.trees.removeMarkedTrees();
        console.log(`[MEGA-STP] -> Harvested ${harvested_count} trees.`);
    },

    // onExecuted is called after a successful onExecute, even for signal-triggered activities.
    onExecuted: function() {
        console.log(`[MEGA-STP] onExecuted for clearcut on stand ${stand.id}.`);
        stand.setFlag('abe_last_activity', 'MegaSTP_Clearcut');
        stand.setFlag('abe_last_activity_year', Globals.year);
        stand.setFlag('abe_need_reassessment', true);
        stand.setAbsoluteAge(0);  
    }
};

// 3. Target DBH Harvest
MEGA_STP_ACTIVITIES['targetDBH'] = {
    id: 'MegaSTP_TargetDBH',
    type: 'scheduled',
    schedule: { signal: 'do_targetDBH' },
    finalHarvest: false, // This is typically an intermediate thinning, not a final harvest.

    onEvaluate: function() {
        return true; 
    },

    onExecute: function() {
        console.log(`[MEGA-STP] Executing 'targetDBH' for stand ${stand.id}.`);

        var dbhList = stand.flag('abe_param_dbhList') || {};
        var harvested_count = 0;

        // Manually implement the logic from lib.harvest.targetDBH
        for (var species in dbhList) {
            if (dbhList.hasOwnProperty(species)) {
                var dbh = dbhList[species];
                var filter = 'species = ' + species + ' and dbh > ' + dbh;
                stand.trees.load(filter);
                harvested_count += stand.trees.harvest();
            }
        }
        stand.trees.removeMarkedTrees();
        console.log(`[MEGA-STP] -> Harvested ${harvested_count} trees via targetDBH.`);
    },

    onExecuted: function() {
        console.log(`[MEGA-STP] onExecuted for targetDBH on stand ${stand.id}.`);
        stand.setFlag('abe_last_activity', 'MegaSTP_TargetDBH');
        stand.setFlag('abe_last_activity_year', Globals.year);
        // TargetDBH is a thinning, so we don't trigger a full reassessment.
        stand.setFlag('abe_need_reassessment', false);
    }
};


// --- FINAL STP ASSEMBLY ---
var MegaSTP = {
    U: [120, 150, 180],
    activities: MEGA_STP_ACTIVITIES
};

// Make it available for registration
this.MegaSTP = MegaSTP;
console.log("--- SoCoABE Mega-STP defined successfully. ---");
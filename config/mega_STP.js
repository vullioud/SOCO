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
    finalHarvest: false,

    onEvaluate: function() {
        return true; 
    },

    onExecute: function() {
        console.log(`[MEGA-STP] Executing 'targetDBH' for stand ${stand.id}.`);

        var dbhList = stand.flag('abe_param_dbhList') || {};
        var total_harvested_count = 0;

        console.log("[MEGA-STP] -> Received dbhList: " + JSON.stringify(dbhList));

        // --- DETAILED STAND INVENTORY LOGGING ---
        console.log("[MEGA-STP] -> Stand Inventory Before Harvest:");
        stand.trees.loadAll();
        
        // Get a list of unique species IDs present in the stand
        var species_ids = [];
        for (var i = 0; i < stand.nspecies; i++) {
            species_ids.push(stand.speciesId(i));
        }

        for (var i = 0; i < species_ids.length; i++) {
            var species_id = species_ids[i];
            var filter = 'species=' + species_id;
            var species_count = stand.trees.sum('1', filter);
            
            if (species_count > 0) {
                var min_dbh = stand.trees.mean('dbh', filter, 'min'); // Using mean with a filter to get min
                var max_dbh = stand.trees.mean('dbh', filter, 'max'); // Using mean with a filter to get max
                console.log(`  - Species: ${species_id}, Count: ${species_count}, DBH Range: [${min_dbh.toFixed(1)} - ${max_dbh.toFixed(1)}] cm`);
            }
        }
        // --- END DIAGNOSTIC LOGGING ---

        // Manually implement the harvest logic
        for (var species in dbhList) {
            if (dbhList.hasOwnProperty(species)) {
                var dbh = dbhList[species];
                var filter = 'species = ' + species + ' and dbh > ' + dbh;
                stand.trees.load(filter);
                total_harvested_count += stand.trees.harvest();
            }
        }
        stand.trees.removeMarkedTrees();
        console.log(`[MEGA-STP] -> Total harvested trees: ${total_harvested_count}.`);
    },

    onExecuted: function() {
        console.log(`[MEGA-STP] onExecuted for targetDBH on stand ${stand.id}.`);
        stand.setFlag('abe_last_activity', 'MegaSTP_TargetDBH');
        stand.setFlag('abe_last_activity_year', Globals.year);
        stand.setFlag('abe_need_reassessment', false);
    }
};

// 4. Plenter Thinning
// 4. Plenter Thinning
MEGA_STP_ACTIVITIES['plenter'] = {
    id: 'MegaSTP_Plenter',
    type: 'scheduled',
    schedule: { signal: 'do_plenter' },
    finalHarvest: false,

    onEvaluate: function() {
        return true; 
    },

    onExecute: function() {
        console.log(`[MEGA-STP] Executing 'plenter' for stand ${stand.id}.`);

        var plenterCurve = stand.flag('abe_param_plenterCurve') || {};
        const dbhSteps = 5;
        var total_harvested_count = 0;

        console.log("[MEGA-STP] -> Received plenterCurve: " + JSON.stringify(plenterCurve));
        
        var original_list = new TreeList();
        original_list.loadAll();
        
        console.log("[MEGA-STP] -> Stand Inventory Before Harvest:");
        var species_ids = [];
        for (var i = 0; i < original_list.count; i++) {
            var species_id = original_list.tree(i).species;
            if (species_ids.indexOf(species_id) === -1) {
                species_ids.push(species_id);
            }
        }
        for (var i = 0; i < species_ids.length; i++) {
            var species_id = species_ids[i];
            var temp_list = new TreeList();
            temp_list.loadFromList(original_list, 'species="' + species_id + '"');
            if (temp_list.count > 0) {
                temp_list.sort('dbh');
                var min_dbh = temp_list.tree(0).dbh;
                var max_dbh = temp_list.tree(temp_list.count - 1).dbh;
                console.log(`  - Species: ${species_id}, Count: ${temp_list.count}, DBH Range: [${min_dbh.toFixed(1)} - ${max_dbh.toFixed(1)}] cm`);
            }
        }

        var dbhClasses = Object.keys(plenterCurve).sort(function(a, b) { return a - b; });

        for (var i = dbhClasses.length - 1; i >= 0; i--) {
            var dbh = parseInt(dbhClasses[i], 10);
            var targetCount = plenterCurve[dbh] * stand.area;
            
            var filter = 'dbh > ' + (dbh - dbhSteps) + ' and dbh <= ' + dbh;
            
            // Use a temporary list to count and then harvest
            var class_list = new TreeList();
            var treesInClass = class_list.loadFromList(original_list, filter);

            if (treesInClass > targetCount) {
                var treesToHarvest = treesInClass - targetCount;
                class_list.filterRandom(treesToHarvest); 
                var harvested_this_class = class_list.harvest();
                total_harvested_count += harvested_this_class;
                console.log(`  - DBH Class ${dbh}: In stand=${treesInClass}, Target=${targetCount.toFixed(0)}. Harvesting ${harvested_this_class} trees.`);
            }
        }
        
        stand.trees.removeMarkedTrees();
        console.log(`[MEGA-STP] -> Total harvested trees: ${total_harvested_count}.`);
    },

    onExecuted: function() {
        console.log(`[MEGA-STP] onExecuted for plenter on stand ${stand.id}.`);
        stand.setFlag('abe_last_activity', 'MegaSTP_Plenter');
        stand.setFlag('abe_last_activity_year', Globals.year);
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
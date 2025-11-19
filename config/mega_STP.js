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
        
        
        console.log("[MEGA-STP] -> Stand Inventory Before Harvest:");
        stand.trees.loadAll(); // Load all trees FROM THE CURRENT STAND.
        
        // Diagnostic Logging (now correctly scoped)
        var species_ids = [];
        for (var i = 0; i < stand.trees.count; i++) {
            var species_id = stand.trees.tree(i).species;
            if (species_ids.indexOf(species_id) === -1) {
                species_ids.push(species_id);
            }
        }
        for (var i = 0; i < species_ids.length; i++) {
            var species_id = species_ids[i];
            var filter_string = 'species=' + species_id;
            // Use sum() on the already loaded list for efficiency
            var species_count = stand.trees.sum('1', filter_string);
            if (species_count > 0) {
                console.log(`  - Species: ${species_id}, Count: ${species_count}`);
            }
        }

        var dbhClasses = Object.keys(plenterCurve).sort(function(a, b) { return parseInt(b) - parseInt(a); }); // Sort descending

        for (var i = 0; i < dbhClasses.length; i++) {
            var dbh = parseInt(dbhClasses[i], 10);
            var targetCount = plenterCurve[dbh] * stand.area;
            
            var filter = 'dbh > ' + (dbh - dbhSteps) + ' and dbh <= ' + dbh;
            
            // Load only the trees for the current class into the list.
            var treesInClass = stand.trees.load(filter);

            if (treesInClass > targetCount) {
                var treesToHarvest = treesInClass - targetCount;
                
                var treesToKeepInListForHarvest = treesInClass - (treesInClass - treesToHarvest);
                stand.trees.filterRandomExclude(treesToKeepInListForHarvest);
                
                var harvested_this_class = stand.trees.harvest();
                total_harvested_count += harvested_this_class;
                console.log(`  - DBH Class ${dbh}: In stand=${treesInClass}, Target=${targetCount.toFixed(0)}. Surplus=${treesToHarvest}. Marking ${harvested_this_class} trees for harvest.`);
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


// 5. Selective Thinning - Phase 1: SELECTION (CORRECT LIBRARY PATTERN)
MEGA_STP_ACTIVITIES['selectiveThinning_select'] = {
    id: 'MegaSTP_SelectiveThinning_Select',
    type: 'thinning',
    thinning: 'selection',
    schedule: { signal: 'do_selectiveThinning_select' },
    
    N: function() { return stand.flag('abe_param_nTrees'); },
    NCompetitors: function() { return stand.flag('abe_param_nCompetitors'); },
  //  speciesSelectivity: function() { return stand.flag('abe_param_speciesSelectivity') || {}; },
    ranking: 'height',
    
    // This forces the signal-triggered execution path: evaluate() -> removeMarkedTrees()
    // Since only 'markcompetitor' is set, no trees are actually removed.
    onCreate: function(act) { 
        act.scheduled = false;
    },
    
    onExecuted: function() {
        // This runs AFTER the C++ has marked the trees.
        console.log(`[MEGA-STP - onExecuted] SELECT phase for stand ${stand.id}.`);
        
        var marked_crop = stand.trees.load('markcrop=true');
        var marked_competitors = stand.trees.load('markcompetitor=true');
        
        console.log(`  -> RESULT: Found ${marked_crop} marked crop trees.`);
        console.log(`  -> RESULT: Found ${marked_competitors} marked competitors.`);

        // Set the initialization flag so the next agent call triggers the 'remove' phase.
        stand.setFlag('abe_selective_thinning_initialized', true);
        stand.setFlag('abe_last_activity', 'MegaSTP_SelectiveThinning_Select');
        stand.setFlag('abe_last_activity_year', Globals.year);
    }
};

// 6. Selective Thinning - Phase 2: REMOVAL
MEGA_STP_ACTIVITIES['selectiveThinning_remove'] = {
    id: 'MegaSTP_SelectiveThinning_Remove',
    type: 'general', // Use 'general' for custom removal logic
    schedule: { signal: 'do_selectiveThinning_remove' },
    
    action: function() {
        console.log(`\n[MEGA-STP - action] REMOVE phase for stand ${stand.id}.`);
        
        var fraction_to_remove = stand.flag('abe_param_fraction_to_remove') || 0;
        var remaining_competitors = stand.trees.load('markcompetitor=true');
        
        console.log(`  -> Found ${remaining_competitors} remaining competitors.`);
        console.log(`  -> Agent requested removal of fraction: ${fraction_to_remove.toFixed(2)}`);
        
        var trees_to_remove_this_step = Math.ceil(remaining_competitors * fraction_to_remove);
        
        stand.trees.filterRandomExclude(trees_to_remove_this_step);
        var harvested_count = stand.trees.harvest();
        stand.trees.removeMarkedTrees();
        
        console.log(`  -> Subsequent removal: Harvested ${harvested_count} trees this step.`);
    },
    onExecuted: function() {
        console.log(`[MEGA-STP - onExecuted] REMOVE phase complete for stand ${stand.id}.`);
        stand.setFlag('abe_last_activity', 'MegaSTP_SelectiveThinning_Remove');
        stand.setFlag('abe_last_activity_year', Globals.year);
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
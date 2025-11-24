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

// 7. Thinning From Below
MEGA_STP_ACTIVITIES['thinningFromBelow'] = {
    // id: 'MegaSTP_ThinningFromBelow', // Removed to fix validation error
    type: 'thinning',
    thinning: 'custom',
    schedule: { signal: 'do_thinningFromBelow' },
    
    targetVariable: 'volume',
    targetRelative: true,
    minDbh: 0,
    classes: [80, 15, 4, 0.9, 0.1],

    targetValue: function() {
        var share = stand.flag('abe_param_thinningShare');
        if (share === undefined || share === null) share = 0;
        return share * 100; 
    },

    onEvaluate: function() { return true; },

    onExecute: function() {
        console.log(`[MEGA-STP] Executing 'thinningFromBelow' for stand ${stand.id}.`);

        var share = stand.flag('abe_param_thinningShare') || 0.0;
        
        // 1. Load all trees
        var total_count = stand.trees.loadAll();
        var total_volume = stand.trees.sum('volume');
        var target_removal_volume = total_volume * share;

        console.log(`  -> Stand Stats: Count=${total_count}, Vol=${total_volume.toFixed(1)}m3. Target Removal: ${target_removal_volume.toFixed(1)}m3 (${(share*100).toFixed(0)}%)`);

        if (target_removal_volume <= 0) {
            console.log("  -> Target volume is 0. Skipping.");
            return;
        }

        // 2. Sort by DBH ascending (smallest trees first)
        stand.trees.sort('dbh');

        // 3. Filter: Keep trees in the list where cumulative volume <= target
        var count_in_list = stand.trees.filter(`incsum(volume) <= ${target_removal_volume}`);
        
        // Calculate what is actually in the list now
        var vol_in_list = stand.trees.sum('volume');

        console.log(`  -> Selection: ${count_in_list} trees selected for removal (Vol: ${vol_in_list.toFixed(1)}m3).`);

        // 4. Harvest
        if (count_in_list > 0) {
            var harvested_count = stand.trees.harvest();
            stand.trees.removeMarkedTrees();
            console.log(`  -> HARVEST EXECUTION: Removed ${harvested_count} trees.`);
        } else {
            console.log(`  -> No trees selected (smallest tree might be larger than target volume).`);
        }
    },

    onExecuted: function() {
        console.log(`[MEGA-STP] onExecuted for thinningFromBelow on stand ${stand.id}.`);
        stand.setFlag('abe_last_activity', 'MegaSTP_ThinningFromBelow');
        stand.setFlag('abe_last_activity_year', Globals.year);
        stand.setFlag('abe_need_reassessment', false);
    }
};

// 8. Tending
MEGA_STP_ACTIVITIES['tending'] = {
    // id: 'MegaSTP_Tending', 
    type: 'thinning',
    thinning: 'tending',
    schedule: { signal: 'do_tending' },

    intensity: 10, // NEED TO BE STATIC

    // DYNAMIC PARAMETER
    speciesSelectivity: function() {
        return stand.flag('abe_param_speciesSelectivity');
    },

    // --- CRITICAL FIX: Force Signal Path ---
    // This ensures ActThinning::execute enters the (!isScheduled) block and runs evaluate().
    onCreate: function(act) { 
        act.scheduled = false; 
    },

    // --- REMOVED onExecute ---
    // By removing onExecute, we let ActThinning::execute fall through to the 'else' block
    // which calls removeMarkedTrees().

    onExecuted: function() {
        // Just logging. Trees should be gone by now.
        console.log(`[MEGA-STP] onExecuted for Tending on stand ${stand.id}.`);
        stand.setFlag('abe_last_activity', 'MegaSTP_Tending');
        stand.setFlag('abe_last_activity_year', Globals.year);
        stand.setFlag('abe_need_reassessment', false);
    }
};

MEGA_STP_ACTIVITIES['shelterwood_select'] = {
    // id: 'MegaSTP_Shelterwood_Select',
    type: 'thinning',
    thinning: 'selection',
    schedule: { signal: 'do_shelterwood_select' },

    // Dynamic parameters from flags
    N: function() { return stand.flag('abe_param_nTrees'); },
    NCompetitors: function() { return stand.flag('abe_param_nCompetitors'); },
   // speciesSelectivity: function() { return stand.flag('abe_param_speciesSelectivity'); },  // commented out in waiting for a good way to select species.
    ranking: 'height', // Standard for shelterwood: keep dominant trees

    // Force signal execution path
    onCreate: function(act) { 
        act.scheduled = false; 
    },

    // No onExecute: Let C++ mark trees automatically.

    // Post-marking logic: Record stats and perform FIRST removal pass.
    onExecuted: function() {
        console.log(`[MEGA-STP] Shelterwood Select: Marking complete.`);
        
        // 1. Snapshot total competitors
        var total_competitors = stand.trees.load('markcompetitor=true');
        stand.setFlag('abe_param_totalCompetitors', total_competitors);
        
        // 2. Perform First Removal
        // Fraction calculated by prepare_flags based on remaining steps
        var fraction = stand.flag('abe_param_fraction_to_remove') || 0;
        var to_remove = Math.ceil(total_competitors * fraction);

        console.log(`  -> Marked ${total_competitors} competitors. Removing ${to_remove} (${(fraction*100).toFixed(1)}%).`);
        
        if (to_remove > 0) {
            stand.trees.filterRandom(to_remove); // Keep 'to_remove' in list
            var harvested = stand.trees.harvest(); // Remove them
            // Do NOT call removeMarkedTrees() here; we need marks for next steps!
            console.log(`  -> Harvested ${harvested} trees.`);
        }

        // 3. Set Initialization Flag
        stand.setFlag('abe_shelterwood_initialized', true);
        stand.setFlag('abe_last_activity', 'MegaSTP_Shelterwood_Select');
        stand.setFlag('abe_last_activity_year', Globals.year);
        stand.setFlag('abe_need_reassessment', false);
    }
};

// 10. Shelterwood - Phase 2: Removal (Subsequent Passes)
MEGA_STP_ACTIVITIES['shelterwood_remove'] = {
    type: 'general',
    schedule: { signal: 'do_shelterwood_remove' },
    
    action: function() {
        console.log(`[MEGA-STP] Shelterwood Remove: Executing phase.`);

        // 1. Load remaining marked competitors
        var remaining = stand.trees.load('markcompetitor=true');
        
        // 2. Calculate removal
        var fraction = stand.flag('abe_param_fraction_to_remove') || 0;
        var to_remove = Math.ceil(remaining * fraction);

        console.log(`  -> Remaining competitors: ${remaining}. Target removal: ${to_remove} (${(fraction*100).toFixed(1)}%).`);

        if (to_remove > 0) {
            stand.trees.filterRandomExclude(to_remove);
            var harvested = stand.trees.harvest();
            console.log(`  -> Harvested ${harvested} trees.`);
        }
    },
    onExecuted: function() {
        stand.setFlag('abe_last_activity', 'MegaSTP_Shelterwood_Remove');
        stand.setFlag('abe_last_activity_year', Globals.year);
        stand.setFlag('abe_need_reassessment', false);

    }
};

// 11. Shelterwood - Phase 3: Final Harvest (Clearcut)
MEGA_STP_ACTIVITIES['shelterwood_final'] = {
    type: 'scheduled',
    schedule: { signal: 'do_shelterwood_final' },
    finalHarvest: true,

    // --- FIX: Force signal path for scheduled activity ---
    onCreate: function(act) { 
        act.scheduled = false; 
    },

    onEvaluate: function() { return true; },

    onExecute: function() {
        console.log(`[MEGA-STP] Shelterwood Final Harvest: Clearing overstory.`);
        
        // Load EVERYTHING marked (Crop trees + any leftover competitors)
        stand.trees.load('markcompetitor=true or markcrop=true');
        
        var count = stand.trees.harvest();
        
        // Cleanup: Remove any stray marks on the stand
        stand.trees.resetMarks(); 
        
        console.log(`  -> Removed ${count} seed trees and remnants.`);
        
        // Reset Rotation
        stand.setAbsoluteAge(0);
        
        // Clear Logic Flags
        stand.setFlag('abe_shelterwood_initialized', null);
        stand.setFlag('abe_param_totalCompetitors', null);
    },

    onExecuted: function() {
        stand.setFlag('abe_last_activity', 'MegaSTP_Shelterwood_Final');
        stand.setFlag('abe_last_activity_year', Globals.year);
        stand.setFlag('abe_need_reassessment', true);
    }
};

MEGA_STP_ACTIVITIES['planting'] = {
    type: 'scheduled',
    schedule: { signal: 'do_planting' },

    onCreate: function(act) { act.scheduled = false; },
    onEvaluate: function() { return true; },

    onExecute: function() {
        console.log(`[MEGA-STP] Executing Planting on stand ${stand.id}.`);
        
        var species_val = stand.flag('abe_param_planting_species');
        var fraction_val = stand.flag('abe_param_planting_fraction');

        // --- Helper to force Arrays ---
        // Handles: ["a","b"], "a,b", "a"
        function toArray(val, isNumeric) {
            if (val === undefined || val === null) return [];
            if (Array.isArray(val)) return val;
            if (typeof val === 'string' && val.indexOf(',') > -1) {
                var parts = val.split(',');
                if (isNumeric) return parts.map(Number);
                return parts;
            }
            return [val];
        }

        var species_arr = toArray(species_val, false);
        var fraction_arr = toArray(fraction_val, true);

        // Defaults
        if (species_arr.length === 0) species_arr = ['piab'];
        if (fraction_arr.length === 0) fraction_arr = [1.0];

        for (var i = 0; i < species_arr.length; i++) {
            var sp = species_arr[i];
            // Trim whitespace if it was a split string
            if (typeof sp === 'string') sp = sp.trim();
            
            var fr = (i < fraction_arr.length) ? fraction_arr[i] : 1.0;

            var item = {
                species: sp,
                fraction: fr,
                height: 0.2,
                age: 2,
                clear: false 
            };
            
            console.log(`  -> Planting ${sp} on ${(fr*100).toFixed(0)}% of area.`);
            fmengine.runPlanting(stand.id, item);
        }
    },

    onExecuted: function() {
        stand.setFlag('abe_last_activity', 'MegaSTP_Planting');
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
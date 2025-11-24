/**
 * =================================================================================
 * FILE: harvestshelterwood_flags.js
 * =================================================================================
 * DESCRIPTION:
 * Prepares parameters for Shelterwood.
 * - Calculates dynamic removal fraction based on remaining steps.
 * - Handles cleanup of C++ tree marks.
 * =================================================================================
 */

Action.prepare.shelterwood = function(params, stand_data_obj) {
    
    // --- 1. Basic Parameters ---
    stand.setFlag('abe_param_nTrees', params.nTrees || 40); 
    stand.setFlag('abe_param_nCompetitors', params.nCompetitors || 1000);
    
    // --- 2. Dynamic Removal Fraction ---
    // We need to know how many removal events are left before the final harvest.
    // If we enter late (e.g., step 1 of 3), we remove a larger chunk.
    
    var current_step = stand_data_obj.activity.sequence_current_step;
    var total_steps = stand_data_obj.activity.sequence_total_steps;
    
    // The final step is reserved for "Final Harvest" (Clearcut of seed trees).
    // All steps before that are "Removal" events (cutting competitors).
    var final_step_index = total_steps - 1;
    var removal_events_remaining = final_step_index - current_step;

    var fraction = 1.0; // Default to taking everything if calculation fails

    if (removal_events_remaining > 0) {
        // Example: Total 3 steps (0, 1, 2). Final is 2.
        // If at Step 0: Remaining = 2. Fraction = 1/2 = 0.5 (50%)
        // If at Step 1: Remaining = 1. Fraction = 1/1 = 1.0 (100%)
        fraction = 1.0 / removal_events_remaining;
    }
    
    // Clamp for safety
    if (fraction > 1.0) fraction = 1.0;
    if (fraction < 0.0) fraction = 0.0;

    stand.setFlag('abe_param_fraction_to_remove', fraction);


    // --- 3. Species Selectivity ---
    // Uses the same parsing logic as Tending/Thinning for the agent's profile table
    var speciesSelectivity = {};
    var agent = socoabe.institution.all_agents.find(function(a) { return a.id === stand_data_obj.agent_id; });
    
    if (agent && agent.species_profile_per_activity_table && params.species_profile) {
        var profileKey = params.species_profile;
        var profileData = agent.species_profile_per_activity_table[profileKey];
        
        if (profileData && profileData.shelterwood) {
            var activityData = profileData.shelterwood;
            if (activityData.species && activityData.intensity) {
                var species_arr = activityData.species[0].split('-');
                var intensity_arr = activityData.intensity[0].split('-').map(Number);
                
                if (species_arr.length === intensity_arr.length) {
                    for (var i = 0; i < species_arr.length; i++) {
                        speciesSelectivity[species_arr[i]] = intensity_arr[i];
                    }
                }
            }
        }
    }
    
    // Default: 'rest' is usually low selectivity in shelterwood to favor seed trees
    if (typeof speciesSelectivity.rest === 'undefined') {
        speciesSelectivity.rest = 0.1; 
    }
    
    stand.setFlag('abe_param_speciesSelectivity', speciesSelectivity);

    // console.log(`[Action] Prepared Shelterwood. Step ${current_step}/${total_steps}. Fraction: ${fraction.toFixed(2)}.`);
};

// --- CLEANUP FUNCTION ---
// Critical for preventing 'markcrop' flags from confusing subsequent activities
Action.prepare.clear_shelterwood_flags = function() {
    
    // Clear state flags
    stand.setFlag('abe_shelterwood_initialized', null);
    stand.setFlag('abe_param_totalCompetitors', null);
    
    // Clear C++ Tree Marks
    // This is essential. If an agent abandons a shelterwood, we must unmark the seed trees.
    if (stand && stand.id > 0) {
        stand.trees.loadAll();
        stand.trees.resetMarks(); 
        // console.log(`[Action] Shelterwood cleanup: Tree marks reset.`);
    }
};
/**
 * =================================================================================
 * FILE: selectiveThinning_flags.js (CORRECTED)
 * =================================================================================
 */
Action.prepare.selectiveThinning = function(params, stand_data_obj) {
    
    // 1. Pass through direct numerical parameters.
    stand.setFlag('abe_param_nTrees', params.nTrees || 80);
    stand.setFlag('abe_param_nCompetitors', params.nCompetitors || 2);
    
    // 2. Calculate the fraction of competitors to remove in this step.
    var current_step = stand_data_obj.activity.sequence_current_step;
    var total_steps = stand_data_obj.activity.sequence_total_steps;
    var steps_remaining = total_steps - current_step;

    if (steps_remaining > 0) {
        // This is the fraction of the *currently remaining* competitors to remove.
    
        var fraction_to_remove = steps_remaining > 0 ? (1 / steps_remaining) : 1;
        stand.setFlag('abe_param_fraction_to_remove', fraction_to_remove);
    }

    // 3. Process the species profile to create the 'speciesSelectivity' object.
    var speciesSelectivity = {};
    var agent = socoabe.institution.all_agents.find(function(a) { return a.id === stand_data_obj.agent_id; });
    
    if (agent && agent.species_profile_per_activity_table && params.species_profile) {
        var profile = agent.species_profile_per_activity_table[params.species_profile];
        if (profile && profile.thinning) {
            var species_arr = profile.thinning.species[0].split('-');
            var intensity_arr = profile.thinning.intensity[0].split('-').map(Number);
            if (species_arr.length === intensity_arr.length) {
                for (var i = 0; i < species_arr.length; i++) {
                    speciesSelectivity[species_arr[i]] = intensity_arr[i];
                }
            }
        }
    }
    if (typeof speciesSelectivity.rest === 'undefined') {
        speciesSelectivity.rest = 0.1;
    }
    stand.setFlag('abe_param_speciesSelectivity', speciesSelectivity);
};

Action.prepare.clear_selectiveThinning_flags = function() {
    
    // Get the current stand ID for logging purposes.
    var stand_id = -1;
    if (stand && stand.id > 0) {
        stand_id = stand.id;
    }
    
    console.log(`[COGNITION] Stand ${stand_id}: Cleaning up persistent flags for selective thinning sequence.`);
    stand.setFlag('abe_selective_thinning_initialized', null);
    stand.setFlag('abe_param_totalCompetitors', null);
    if (stand && stand.id > 0) {
        stand.trees.loadAll(); // Load all trees in the stand
        stand.trees.resetMarks(); // Remove all marks (crop, competitor, harvest, cut)
        console.log(`[COGNITION] -> Cleared all crop/competitor marks from trees on stand ${stand_id}.`);
    }
};
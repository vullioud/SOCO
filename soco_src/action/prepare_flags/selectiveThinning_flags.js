// ----- Start of File: soco_src/action/prepare_flags/selectiveThinning_flags.js -----

Action.prepare.selectiveThinning = function(params, stand_data_obj) {
    
    // 1. Numeric Params
    stand.setFlag('abe_param_nTrees', params.nTrees || 80);
    stand.setFlag('abe_param_nCompetitors', params.nCompetitors || 3);
    
    // 2. Fraction calculation (logic unchanged)
    var current_step = stand_data_obj.activity.sequence_current_step;
    var total_steps = stand_data_obj.activity.sequence_total_steps;
    var steps_remaining = total_steps - current_step;
    var fraction_to_remove = steps_remaining > 0 ? (1 / steps_remaining) : 1;
    stand.setFlag('abe_param_fraction_to_remove', fraction_to_remove);

    // 3. Species Selectivity from Profile
    var speciesSelectivity = {};
    var agent = socoabe.institution.all_agents.find(function(a) { return a.id === stand_data_obj.agent_id; });
    var profileKey = stand_data_obj.species_profile;

    if (agent && agent.species_profile_per_activity_table && profileKey) {
        var profile = agent.species_profile_per_activity_table[profileKey];
        if (profile && profile.thinning) {
            var actData = profile.thinning;
            if (actData.species && actData.intensity) {
                var species_arr = actData.species[0].split('-');
                var intensity_arr = actData.intensity[0].split('-').map(Number);
                
                for (var i = 0; i < species_arr.length; i++) {
                    if (i < intensity_arr.length) {
                        speciesSelectivity[species_arr[i]] = intensity_arr[i];
                    }
                }
            }
        }
    }

    if (typeof speciesSelectivity.rest === 'undefined') {
        speciesSelectivity.rest = 0.1;
    }
    stand.setFlag('abe_param_speciesSelectivity', speciesSelectivity);
};

// *** NEW: Cleanup Function ***
Action.prepare.clear_selectiveThinning_flags = function() {
    stand.setFlag('abe_selective_thinning_initialized', null);
    // Note: We don't necessarily need to clear nTrees/nCompetitors here as they are reset by clear_flags()
    // but clearing the initialization state is crucial.
    
    // Reset the physical marks on the trees in iLand
    if (stand && stand.id > 0) {
        stand.trees.loadAll();
        stand.trees.resetMarks();
    }
    console.log(`[Action] Cleared selective thinning state for stand ${stand.id}`);
};


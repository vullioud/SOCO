Action.prepare.shelterwood = function(params, stand_data_obj) {
    
    // 1. Standard Numeric Parameters
    stand.setFlag('abe_param_nTrees', params.nTrees || 40); 
    stand.setFlag('abe_param_nCompetitors', params.nCompetitors || 1000);
    
    // 2. Dynamic Removal Fraction (Logic remains same as before)
    var current_step = stand_data_obj.activity.sequence_current_step;
    var total_steps = stand_data_obj.activity.sequence_total_steps;
    var final_step_index = total_steps - 1;
    var removal_events_remaining = final_step_index - current_step;

    var fraction = 1.0; 
    if (removal_events_remaining > 0) {
        fraction = 1.0 / removal_events_remaining;
    }
    if (fraction > 1.0) fraction = 1.0;
    
    stand.setFlag('abe_param_fraction_to_remove', fraction);

    // 3. Species Selectivity (UPDATED for new JSON Profile)
    var speciesSelectivity = {};
    var agent = socoabe.institution.all_agents.find(function(a) { return a.id === stand_data_obj.agent_id; });
    var profileKey = stand_data_obj.species_profile;
    
    if (agent && agent.species_profile_per_activity_table && profileKey) {
        var profile = agent.species_profile_per_activity_table[profileKey];
        
        if (profile && profile.shelterwood) {
            var actData = profile.shelterwood;
            // Parse ["fasy-quro"], ["1.0-1.0"]
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
    
    // Default: 'rest' is usually low selectivity to favor selected seed trees
    if (typeof speciesSelectivity.rest === 'undefined') {
        speciesSelectivity.rest = 0.1; 
    }
    
    stand.setFlag('abe_param_speciesSelectivity', speciesSelectivity);
    
    console.log(`[Action] Prepared Shelterwood for ${profileKey}. Fraction: ${fraction.toFixed(2)}`);
};

Action.prepare.clear_shelterwood_flags = function() {
    stand.setFlag('abe_shelterwood_initialized', null);
    stand.setFlag('abe_param_totalCompetitors', null);
    if (stand && stand.id > 0) {
        stand.trees.loadAll();
        stand.trees.resetMarks(); 
    }
};
Action.prepare.tending = function(params, stand_data_obj) {
    
    var speciesSelectivity = {};
    var agent = socoabe.institution.all_agents.find(function(a) { return a.id === stand_data_obj.agent_id; });
    var profileKey = stand_data_obj.species_profile;

    if (agent && agent.species_profile_per_activity_table && profileKey) {
        var profile = agent.species_profile_per_activity_table[profileKey];
        
        if (profile && profile.tending) {
            var actData = profile.tending;
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

    // Default for 'rest' if not specified in profile
    if (typeof speciesSelectivity.rest === 'undefined') {
        speciesSelectivity.rest = 0.1; 
    }

    stand.setFlag('abe_param_speciesSelectivity', speciesSelectivity);
};
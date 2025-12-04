Action.prepare.planting = function(params, stand_data_obj) {
    
    var planting_species_list = []; 
    var planting_fractions_list = []; 
    
    var agent = socoabe.institution.all_agents.find(function(a) { return a.id === stand_data_obj.agent_id; });
    var profileKey = stand_data_obj.species_profile;

    if (agent && agent.species_profile_per_activity_table && profileKey) {
        var profile = agent.species_profile_per_activity_table[profileKey];
        
        if (profile && profile.planting) {
            var actData = profile.planting;
            // Parse "species": ["fasy-quro"], "intensity": ["0.6-0.3"]
            if (actData.species && actData.species.length > 0) {
                planting_species_list = actData.species[0].split('-');
            }
            if (actData.intensity && actData.intensity.length > 0) {
                planting_fractions_list = actData.intensity[0].split('-').map(Number);
            }
        }
    }

    // Fallback
    if (planting_species_list.length === 0) {
        planting_species_list = ['piab'];
        planting_fractions_list = [1.0];
    }

    stand.setFlag('abe_param_planting_species', planting_species_list);
    stand.setFlag('abe_param_planting_fraction', planting_fractions_list);
    
    console.log(`[Action] Prepared Planting for ${profileKey}: ${planting_species_list.join('+')}`);
};
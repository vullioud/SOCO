Action.prepare.planting = function(params, stand_data_obj) {
    
    // Arrays for multi-species
    var planting_species_list = ['piab']; 
    var planting_fractions_list = [1.0]; 
    
    var agent = socoabe.institution.all_agents.find(function(a) { return a.id === stand_data_obj.agent_id; });
    
    if (agent && agent.species_profile_per_activity_table && params.species_profile) {
        var profileKey = params.species_profile;
        var profileData = agent.species_profile_per_activity_table[profileKey];
        
        if (profileData && profileData.planting) {
            var activityData = profileData.planting;

            // JSON: "species": ["piab-pisy"], "intensity": ["0.5-0.5"]
            if (activityData.species && activityData.species.length > 0) {
                planting_species_list = activityData.species[0].split('-');
            }
            
            if (activityData.intensity && activityData.intensity.length > 0) {
                planting_fractions_list = activityData.intensity[0].split('-').map(Number);
            }
        }
    }

    // 3. Set Flags (We pass arrays now)
    // Note: iLand flags store JS objects/arrays fine.
    stand.setFlag('abe_param_planting_species', planting_species_list);
    stand.setFlag('abe_param_planting_fraction', planting_fractions_list);
    
    console.log(`[Action] Prepared Planting. Species: [${planting_species_list.join(', ')}], Fractions: [${planting_fractions_list.join(', ')}]`);
};
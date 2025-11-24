/**
 * =================================================================================
 * FILE: tending_flags.js
 * =================================================================================
 */

Action.prepare.tending = function(params, stand_data_obj) {
    
    var speciesSelectivity = {};
    
    // --- Special "Auto" Mode for Testing/Fallback ---
    // This calculates selectivity based on what is actually in the stand right now.
    if (params.species_profile === 'dynamic_auto') {
        // We need to peek at the stand to find the dominant species
        fmengine.standId = stand_data_obj.stand_id;
        stand.reload();
        
        var max_ba = -1;
        var dom_species = "";
        
        // Find dominant species
        for (var i = 0; i < stand.nspecies; i++) {
            var species = stand.speciesId(i);
            var ba = stand.speciesBasalArea(i);
            if (ba > max_ba) {
                max_ba = ba;
                dom_species = species;
            }
            // Default low selectivity for everyone
            speciesSelectivity[species] = 0.1; 
        }
        
        // Set dominant to High Selectivity (Save/Favor)
        if (dom_species !== "") {
            speciesSelectivity[dom_species] = 1.0;
            // console.log(`[Action] Dynamic Auto: Favoring ${dom_species} (1.0), suppressing others (0.1)`);
        }
    } 
    // --- Standard Profile Lookup ---
    else {
        var agent = socoabe.institution.all_agents.find(function(a) { return a.id === stand_data_obj.agent_id; });
        if (agent && agent.species_profile_per_activity_table && params.species_profile) {
            var profileKey = params.species_profile;
            var profileData = agent.species_profile_per_activity_table[profileKey];
            
            if (profileData && profileData.tending) {
                var activityData = profileData.tending;
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
    }
    
    // Default for 'rest' (species not explicitly named)
    if (typeof speciesSelectivity.rest === 'undefined') {
        speciesSelectivity.rest = 0.2; // Low selectivity for unknown species
    }

    stand.setFlag('abe_param_speciesSelectivity', speciesSelectivity);
    
    console.log(`[Action] Prepared Tending. Selectivity: ` + JSON.stringify(speciesSelectivity));
};
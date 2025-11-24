/**
 * =================================================================================
 * FILE: thinningfromBelow_flags.js
 * =================================================================================
 * DESCRIPTION:
 * Prepares parameters for Thinning From Below.
 * - Translates 'thinningShare' (0-1) to 'abe_param_thinningShare'.
 * - Processes 'species_profile' into 'abe_param_speciesSelectivity'.
 * =================================================================================
 */

Action.prepare.thinningFromBelow = function(params, stand_data_obj) {
    
    // --- 1. Thinning Share ---
    // Default to 20% removal if not specified
    var share = params.thinningShare !== undefined ? params.thinningShare : 0.2;
    
    // Safety clamp (0.0 to 1.0)
    if (share < 0) share = 0;
    if (share > 1) share = 1;

    stand.setFlag('abe_param_thinningShare', share);
    
    // --- 2. Species Selectivity ---
    var speciesSelectivity = {};
    
    // Find the agent object to access the config tables
    var agent = socoabe.institution.all_agents.find(function(a) { return a.id === stand_data_obj.agent_id; });
    
    if (agent && agent.species_profile_per_activity_table && params.species_profile) {
        var profileKey = params.species_profile; // e.g., "P2"
        var profileData = agent.species_profile_per_activity_table[profileKey];
        
        if (profileData) {
            // The JSON structure has "thinning", "tending", etc.
            var activityData = profileData.thinning;

            if (activityData && activityData.species && activityData.intensity) {
                // The JSON stores them as single-element arrays containing a hyphen-separated string
                // e.g., "species": ["piab-pisy-abal"]
                var species_str = activityData.species[0];
                var intensity_str = activityData.intensity[0];
                
                if (species_str && intensity_str) {
                    var species_arr = species_str.split('-');
                    var intensity_arr = intensity_str.split('-').map(Number);
                    
                    if (species_arr.length === intensity_arr.length) {
                        for (var i = 0; i < species_arr.length; i++) {
                            speciesSelectivity[species_arr[i]] = intensity_arr[i];
                        }
                    } else {
                        console.warn(`[Action] Warning: Species and intensity length mismatch in profile ${profileKey}`);
                    }
                }
            }
        }
    }
    
    // Default fallback for 'rest' (all other species)
    if (typeof speciesSelectivity.rest === 'undefined') {
        speciesSelectivity.rest = 1.0; // Default: no specific preference/removal pressure for others
    }

    stand.setFlag('abe_param_speciesSelectivity', speciesSelectivity);
    
    console.log(`[Action] Prepared ThinningFromBelow: Share=${(share * 100).toFixed(1)}%, SpeciesProfile='${params.species_profile || "none"}'`);
};
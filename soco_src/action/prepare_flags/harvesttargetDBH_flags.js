Action.prepare.targetDBH = function(params, stand_data_obj) {
    
    var dbhList = {};
    var agent = socoabe.institution.all_agents.find(function(a) { return a.id === stand_data_obj.agent_id; });
    var profileKey = stand_data_obj.species_profile; // e.g., "wet_01_buchen_mischwald"

    console.log(`[Action] Preparing targetDBH. Agent: ${agent.id}, Profile: ${profileKey}`);

    // 1. Look up the profile in the unified table
    if (agent && agent.species_profile_per_activity_table && profileKey) {
        var profile = agent.species_profile_per_activity_table[profileKey];
        
        if (profile && profile.targetDBH) {
            var actData = profile.targetDBH;
            
            // Parse: "species": ["fasy-quro..."], "limit": ["60-70..."]
            if (actData.species && actData.limit) {
                var species_arr = actData.species[0].split('-');
                var limit_arr = actData.limit[0].split('-').map(Number);

                if (species_arr.length === limit_arr.length) {
                    for (var i = 0; i < species_arr.length; i++) {
                        dbhList[species_arr[i]] = limit_arr[i];
                    }
                } else {
                    console.warn(`[Action] Mismatch in targetDBH arrays for profile ${profileKey}. Species: ${species_arr.length}, Limits: ${limit_arr.length}`);
                }
            }
        }
    }

    // 2. Safety Fallback
    if (Object.keys(dbhList).length === 0) {
        console.warn(`[Action] No valid targetDBH definitions found for ${profileKey}. Using default fallback.`);
        dbhList = { "fasy": 60, "piab": 50, "rest": 45 };
    }

    // 3. Set the flag for MegaSTP
    stand.setFlag('abe_param_dbhList', dbhList);
};
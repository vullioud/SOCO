Cognition.select_parameters = function(stand_data_obj, agent) {
    const activity_name = stand_data_obj.activity.chosen_Activity;
    const preference = stand_data_obj.preference_focus;
    const params_for_preference = agent.parameter_table?.[activity_name]?.[preference];

    if (!params_for_preference) {
        stand_data_obj.activity.parameters = {};
        return stand_data_obj;
    }

    const final_params = {};
    for (const param_name in params_for_preference) {
        const dist_config = params_for_preference[param_name];
        let sampled_value;

        if (dist_config.distribution_function === "lookup") {
            const profile_name_from_config = dist_config.distribution_params.profile_name;

            if (param_name === "species_profile") {
                // --- SPECIES LOGIC ---
                // 1. Get the stand's assigned profile name (e.g., "P7")
                const stand_profile_key = stand_data_obj.species_profile;
                // 2. Look up the weights for the current activity in the species profile table
                const profile_data = agent.species_profile_per_activity_table?.[stand_profile_key]?.[activity_name];
                
                if (profile_data) {
                    // Re-format the data into the {species: intensity} object that the ABE-Lib expects
                    const species = profile_data.species[0].split('-');
                    const intensities = profile_data.intensity[0].split('-').map(Number);
                    sampled_value = {};
                    species.forEach((s, i) => { sampled_value[s] = intensities[i]; });
                } else {
                    sampled_value = {}; // Default if no entry for this activity in the profile
                }

            } else if (param_name === "plenterCurve") {
                // --- PLENTER LOGIC ---
                sampled_value = agent.plenter_profiles_table[profile_name_from_config];
            } else if (param_name === "dbhListProfile") {
                // --- TARGETDBH LOGIC ---
                sampled_value = agent.targetDBH_profiles_table[profile_name_from_config];
            }

        } else {
            // Standard distribution sampling (normal, poisson, etc.)
            sampled_value = Distributions.sample(dist_config);
        }
        final_params[param_name] = sampled_value;
    }
    
    stand_data_obj.activity.parameters = final_params;
    return stand_data_obj;
};
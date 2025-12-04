// ----- Start of File: soco_src/cognition/select_parameters.js -----

Cognition.select_parameters = function(stand_data_obj, agent) {
    const activity_name = stand_data_obj.activity.chosen_Activity;
    const preference = stand_data_obj.preference_focus;
    
    // --- MAPPING FIX ---
    // Map Regime Matrix names to Parameter Table keys
    let param_key = activity_name;
    if (activity_name === 'plenter') param_key = 'plenter_harvest'; // Map plenter -> plenter_harvest
    // Add other mappings if necessary (e.g., if matrix has 'thinning' but table has 'thinningFromBelow')

    // Access the parameter configuration
    const params_for_preference = agent.parameter_table?.[param_key]?.[preference];

    if (!params_for_preference) {
        // If no config found, return empty. 
        // This explains why you saw warnings if the key didn't match.
        stand_data_obj.activity.parameters = {};
        return stand_data_obj;
    }

    const final_params = {};
    
    for (const param_name in params_for_preference) {
        const dist_config = params_for_preference[param_name];
        let sampled_value;

        // Unbox array if necessary
        let params_to_sample = dist_config.distribution_params;
        if (Array.isArray(params_to_sample)) {
            params_to_sample = params_to_sample[0];
        }

        // --- LOOKUP LOGIC ---
        if (dist_config.distribution_function === "lookup") {
            const profile_key = params_to_sample.profile_name; 
            
            if (param_name === "plenterCurve") {
                // Correctly access the table using the profile key
                sampled_value = agent.plenter_profiles_table[profile_key];
                if (!sampled_value) console.warn(`[SelectParams] Warning: Missing Plenter Profile '${profile_key}' for agent ${agent.id}`);
            } 
            else if (param_name === "dbhListProfile") {
                 // Just pass the string key, Action layer handles the lookup
                 sampled_value = profile_key; 
            }
             else if (param_name === "species_profile") {
                 sampled_value = stand_data_obj.species_profile;
            }
        } else {
            // Standard Sampling
            const sampler_config = {
                distribution_function: dist_config.distribution_function,
                distribution_params: params_to_sample
            };
            sampled_value = Distributions.sample(sampler_config);
        }
        
        final_params[param_name] = (sampled_value !== null && typeof sampled_value !== 'undefined') ? sampled_value : 0;
    }
    
    // Merge existing params (e.g. duration from regime definition)
    if (stand_data_obj.activity.parameters) {
        for (let key in stand_data_obj.activity.parameters) {
            if (final_params[key] === undefined) {
                final_params[key] = stand_data_obj.activity.parameters[key];
            }
        }
    }

    stand_data_obj.activity.parameters = final_params;
    return stand_data_obj;
};

// ----- End of File: soco_src/cognition/select_parameters.js -----
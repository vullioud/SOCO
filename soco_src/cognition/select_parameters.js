// ----- Start of File: soco_src/cognition/select_parameters.js -----

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

        // --- THIS IS THE ROBUSTNESS FIX ---
        // Check if distribution_params is an array and unbox it if necessary.
        let params_to_sample = dist_config.distribution_params;
        if (Array.isArray(params_to_sample)) {
            params_to_sample = params_to_sample[0];
        }
        // ---------------------------------

        if (dist_config.distribution_function === "lookup") {
            const profile_name = params_to_sample.profile_name;
            
            if (param_name === "species_profile") {
                sampled_value = stand_data_obj.species_profile;
            } else if (param_name === "plenterCurve") {
                sampled_value = agent.plenter_profiles_table[profile_name];
            } else if (param_name === "dbhListProfile") {
                sampled_value = agent.targetDBH_profiles_table[profile_name];
            }
        } else {
            // Create a new object to pass to the sampler
            const sampler_config = {
                distribution_function: dist_config.distribution_function,
                distribution_params: params_to_sample
            };
            sampled_value = Distributions.sample(sampler_config);
        }
        
        final_params[param_name] = (sampled_value !== null && typeof sampled_value !== 'undefined') ? sampled_value : 0;
    }
    
    stand_data_obj.activity.parameters = final_params;
    return stand_data_obj;
};


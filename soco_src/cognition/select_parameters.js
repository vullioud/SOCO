/**
 * =================================================================================
 * FILE: select_parameters.js (Cognition Module)
 * =================================================================================
 */

/**
 * Selects parameters for the chosen activity based on agent preferences.
 * @param {stand_data} stand_data_obj - The stand with a chosen activity.
 * @param {socoabe_agent} agent - The agent making the decision.
 * @returns {stand_data} The updated object with sampled parameters.
 */
Cognition.select_parameters = function(stand_data_obj, agent) {
    const activity_name = stand_data_obj.activity.chosen_Activity;
    const preference = stand_data_obj.preference_focus;
    
    console.log(`    (Cognition) Selecting parameters for '${activity_name}':`);
    console.log(`      -> Context: Preference='${preference}'`);

    const all_param_configs_for_activity = agent.parameter_table[activity_name];
    if (!all_param_configs_for_activity || all_param_configs_for_activity.length === 0) {
        console.log(`      -> No parameters defined for this activity.`);
        stand_data_obj.activity.parameters = {};
        return stand_data_obj;
    }

    const final_params = {};
    
    const relevant_param_configs = [];
    for (let i = 0; i < all_param_configs_for_activity.length; i++) {
        const p = all_param_configs_for_activity[i];
        if (p.preference_focus === preference) {
            relevant_param_configs.push(p);
        }
    }

    relevant_param_configs.forEach(param_config => {
        const param_name = param_config.parameter;
        const dist_func = param_config.distribution_function;
        const dist_params = param_config.distribution_params;

        console.log(`      -> Found Param '${param_name}': Dist='${dist_func}', Params=${JSON.stringify(dist_params)}`);

        let sampled_value;

        if (dist_func === "lookup") {
            const profile_group_name = dist_params.profile_group;
            const profile_name = dist_params.profile_name;

            if (profile_group_name && agent[profile_group_name + '_table']) {
                const profile_table = agent[profile_group_name + '_table'];
                const profile_keys = Object.keys(profile_table);
                const random_profile_name = profile_keys[Math.floor(Math.random() * profile_keys.length)];
                sampled_value = profile_table[random_profile_name];
                console.log(`        -> Looked up random profile '${random_profile_name}' from group '${profile_group_name}_table'.`);
            } else if (profile_name && agent.targetDBH_profiles_table[profile_name]) {
                sampled_value = agent.targetDBH_profiles_table[profile_name];
                console.log(`        -> Looked up specific profile '${profile_name}'.`);
            } else {
                 console.warn(`        -> WARNING: Could not find lookup profile for: ${JSON.stringify(dist_params)}`);
                 sampled_value = {};
            }
        } else {
            const dist_obj = {
                distribution_function: dist_func,
                distribution_params: dist_params
            };
            sampled_value = Distributions.sample(dist_obj);
        }
        
        final_params[param_name] = sampled_value;
    });
    
    stand_data_obj.activity.parameters = final_params;
    console.log(`      -> CHOSEN PARAMETERS: ${JSON.stringify(final_params)}`);

    return stand_data_obj;
};
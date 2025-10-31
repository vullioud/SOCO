/**
 * Attaches the 'select_parameters' function to the global Cognition namespace.
 */
Cognition.select_parameters = function(stand_data_obj, agent) {
    const activity_name = stand_data_obj.activity.chosen_Activity;
    const preference = stand_data_obj.preference_focus;
    
    const all_param_configs = agent.configs.parameters[activity_name];
    if (!all_param_configs) {
        stand_data_obj.activity.parameters = {};
        return stand_data_obj;
    }

    const final_params = {};

    all_param_configs.forEach(param_config => {
        if (param_config.preference_focus === preference) {
            const param_name = param_config.parameter;
            const dist_obj = {
                distribution_function: param_config.distribution_function,
                distribution_params: param_config.distribution_params
            };
            final_params[param_name] = Distributions.sample(dist_obj);
        }
    });
    
    stand_data_obj.activity.parameters = final_params;
    console.log(`    (Cognition) Selected parameters: ${JSON.stringify(final_params)}`);

    return stand_data_obj;
};
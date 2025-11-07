/**
 * Selects a new activity for a stand based on its state and the agent's profile.
 * This version uses a direct lookup and correctly handles the 'any' structure case.
 */
Cognition.select_activity = function(stand_data_obj, agent) {
    const { age_class, structure_class } = stand_data_obj.classified; //  destructuring assignment. same as stand_data_obj.classified.age_class
    const { preference_focus } = stand_data_obj;
   
    let context_params_array = null;

   
    const specific_params = agent.activity_table?.[age_class.toLowerCase()]?.[preference_focus]?.[structure_class];
    
    if (specific_params) {
        context_params_array = specific_params.distribution_params;
    } else {
        // 2. If not found, fall back and check for an 'any' structure class.
        const any_params = agent.activity_table?.[age_class]?.[preference_focus]?.['any'];
        if (any_params) {
            context_params_array = any_params.distribution_params;
        }
    }

    if (!context_params_array || context_params_array.length === 0) {
        stand_data_obj.activity.chosen_Activity = 'noManagement';
        return stand_data_obj;
    }
    
    const dist_params = context_params_array[0];

    const activity_weights = Distributions.sample({
        distribution_function: "dirichlet",
        distribution_params: dist_params 
    });

    stand_data_obj.activity.chosen_Activity = Distributions.weighted_random_choice(activity_weights);
    
    return stand_data_obj;
};
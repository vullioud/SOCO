/**
 * Attaches the 'select_activity' function to the global Cognition namespace.
 */
Cognition.select_activity = function(stand_data_obj, agent) {
    const age_class = stand_data_obj.classified.age_class;
    const structure = stand_data_obj.classified.structure_class;
    const preference = stand_data_obj.preference_focus;
    const owner_type = agent.owner.type;

    let activity_distribution_config;
    let age_class_key = age_class.toLowerCase(); // e.g., "thinning"

    // 1. Get the correct distribution table based on age class.
    if (agent.configs.activities[age_class_key]) {
        activity_distribution_config = agent.configs.activities[age_class_key][owner_type];
    }

    if (!activity_distribution_config) {
        stand_data_obj.activity.chosen_Activity = 'noManagement';
        return stand_data_obj;
    }

    // 2. Find the specific distribution for the stand's context.
    const context_params = activity_distribution_config.find(d => 
        d.structure === structure && d.preference === preference
    );

    if (!context_params) {
        console.warn(`Could not find activity distribution for ${owner_type}/${age_class}/${structure}/${preference}`);
        stand_data_obj.activity.chosen_Activity = 'noManagement';
        return stand_data_obj;
    }

    // 3. Create the distribution object for the sampler.
    const dist_obj = {
        distribution_function: "dirichlet",
        distribution_params: {
            options: context_params.options,
            alpha: context_params.params
        }
    };

    // 4. Sample the weights and choose an activity.
    const activity_weights = Distributions.sample(dist_obj);
    const chosen_activity = Distributions.weighted_random_choice(activity_weights);

    stand_data_obj.activity.chosen_Activity = chosen_activity;
    console.log(`    (Cognition) Selected activity: ${chosen_activity}`);
    
    return stand_data_obj;
};
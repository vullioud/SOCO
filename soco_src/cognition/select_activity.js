/**
 * =================================================================================
 * FILE: select_activity.js (Cognition Module)
 * =================================================================================
 */

/**
 * Selects a new activity for a stand based on its state and the agent's profile.
 * @param {stand_data} stand_data_obj - The stand needing a plan.
 * @param {socoabe_agent} agent - The agent that owns the stand.
 * @returns {stand_data} The updated stand_data object with a chosen activity.
 */
Cognition.select_activity = function(stand_data_obj, agent) {
    const age_class = stand_data_obj.classified.age_class;
    const structure = stand_data_obj.classified.structure_class;
    const preference = stand_data_obj.preference_focus;

    console.log(`    (Cognition) Selecting activity for stand ${stand_data_obj.stand_id}:`);
    console.log(`      -> Context: AgeClass='${age_class}', Structure='${structure}', Preference='${preference}'`);

    const age_class_key = age_class.toLowerCase();
    const activity_distributions = agent.activity_table[age_class_key];

    if (!activity_distributions) {
        console.warn(`      -> FATAL: No distributions found for age_class_key '${age_class_key}' in agent.activity_table.`);
        stand_data_obj.activity.chosen_Activity = 'noManagement';
        return stand_data_obj;
    }

    let context_params = null;
    for (let i = 0; i < activity_distributions.length; i++) {
        const d = activity_distributions[i];
        if (d.preference_focus === preference && (d.structure === structure || d.structure === 'any')) {
            context_params = d;
            break;
        }
    }

    if (!context_params) {
        console.warn(`      -> WARNING: Could not find a matching distribution for the context. Defaulting to noManagement.`);
        console.log(`      -> DEBUG: Looking for: preference_focus='${preference}', structure='${structure}' or 'any'`);
        console.log(`      -> DEBUG: Available configs for '${age_class_key}': ${JSON.stringify(activity_distributions)}`);
        stand_data_obj.activity.chosen_Activity = 'noManagement';
        return stand_data_obj;
    }
    
    console.log(`      -> Found Distribution Config: ${JSON.stringify(context_params)}`);

    const dist_obj = {
        distribution_function: "dirichlet",
        distribution_params: context_params.distribution_params
    };

    const activity_weights = Distributions.sample(dist_obj);
    console.log(`      -> Sampled Weights: ${JSON.stringify(activity_weights)}`);

    const chosen_activity = Distributions.weighted_random_choice(activity_weights);
    stand_data_obj.activity.chosen_Activity = chosen_activity;
    console.log(`      -> CHOSEN ACTIVITY: ${chosen_activity}`);
    
    return stand_data_obj;
};
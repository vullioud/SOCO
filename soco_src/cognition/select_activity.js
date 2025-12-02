
/**
 * Selects a new activity for a stand based on its state and the agent's profile.
 * MODIFIED: Now uses 'activity_class' (Height/Development Phase) instead of 'age_class'.
 */
Cognition.select_activity = function(stand_data_obj, agent) {
    // --- CHANGE 1: Destructure activity_class instead of age_class ---
    const { activity_class, structure_class } = stand_data_obj.classified; 
    const { preference_focus } = stand_data_obj;
   
    let context_params_array = null;

    // --- CHANGE 2: Use activity_class for lookup ---
    // Ensure we handle casing (e.g., "Thinning" -> "thinning") to match JSON keys
    const phase_key = activity_class ? activity_class.toLowerCase() : "unknown";

    // Debugging to verify the switch
    // console.log(`[Cognition] Selecting activity using Class: '${phase_key}' (Structure: ${structure_class})`);

    const specific_params = agent.activity_table?.[phase_key]?.[preference_focus]?.[structure_class];
    
    if (specific_params) {
        context_params_array = specific_params.distribution_params;
    } else {
        // 2. If not found, fall back and check for an 'any' structure class.
        const any_params = agent.activity_table?.[phase_key]?.[preference_focus]?.['any'];
        if (any_params) {
            context_params_array = any_params.distribution_params;
        }
    }

    if (!context_params_array || context_params_array.length === 0) {
        // console.log(`[Cognition] No activity found for ${phase_key}/${preference_focus}/${structure_class}. Defaulting to noManagement.`);
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

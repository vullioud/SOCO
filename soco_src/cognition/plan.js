/**
 * =================================================================================
 * FILE: plan.js (Cognition Module Main)
 * =================================================================================
 * This file defines the main Cognition pipeline orchestrator, 'Cognition.plan',
 * and attaches all other cognitive functions to the Cognition namespace.
 * =================================================================================
 */

/**
 * Main cognitive pipeline orchestrator.
 */
Cognition.plan = function(stand_data_obj, agent) {
    console.log(`  (Cognition) Planning for stand ${stand_data_obj.stand_id}...`);

    // Step 1: Decide if we continue an ongoing sequence or start fresh.
    stand_data_obj = Cognition.decide_on_going(stand_data_obj, agent);

    // Step 2: If no activity was chosen, select a new one based on stand state.
    // We add a check to avoid re-planning if decide_on_going already chose an activity.
    if (!stand_data_obj.activity.chosen_Activity || stand_data_obj.activity.chosen_Activity === 'noManagement') {
        stand_data_obj = Cognition.select_activity(stand_data_obj, agent);
    }
    
    // Step 3: Select parameters for the chosen activity.
    stand_data_obj = Cognition.select_parameters(stand_data_obj, agent);
    
    // Step 4: Compute the target year for the action.
    stand_data_obj = Cognition.compute_schedule(stand_data_obj, agent);

    // Step 5: Final validation (e.g., check resources).
    stand_data_obj = Cognition.validate_activity(stand_data_obj, agent);

    return stand_data_obj;
};


// --- ATTACH ALL OTHER COGNITION FUNCTIONS ---

// Placeholder for now
Cognition.decide_on_going = function(stand_data_obj, agent) {
    stand_data_obj.activity.chosen_Activity = 'noManagement';
    return stand_data_obj;
};

// Placeholder for now
Cognition.compute_schedule = function(stand_data_obj, agent) {
    stand_data_obj.activity.target_year = -1;
    return stand_data_obj;
};

// Placeholder for now
Cognition.validate_activity = function(stand_data_obj, agent) {
    stand_data_obj.activity.is_actionable = false;
    return stand_data_obj;
};
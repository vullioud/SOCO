/**
 * The main entry point for stand-level planning.
 * It orchestrates the entire cognitive process for a single stand that needs assessment.
 * @param {object} stand_data_obj - The data object for the stand to be planned.
 * @param {object} agent - The parent agent, needed for its configuration tables.
 * @returns {object} The updated stand_data_obj with a complete plan.
 */
Cognition.create_stand_plan = function(stand_data_obj, agent) {

    // Check the initial state to determine which path to take.
    var is_ongoing_sequence = stand_data_obj.activity.is_Sequence &&
                              (stand_data_obj.activity.sequence_current_step < stand_data_obj.activity.sequence_total_steps);

    if (is_ongoing_sequence) {
        // --- PATH 1: Handle an ONGOING sequence ---
        stand_data_obj = Cognition.decide_on_going(stand_data_obj);

    } else {
        // --- PATH 2: Create a NEW plan from scratch ---
        stand_data_obj = Cognition.select_activity(stand_data_obj, agent);
        stand_data_obj = Cognition.select_parameters(stand_data_obj, agent);
    }

    // --- CONVERGENCE POINT for both paths ---
    stand_data_obj = Cognition.compute_schedule(stand_data_obj);
    stand_data_obj = Cognition.validate_activity(stand_data_obj);

    return stand_data_obj;
};
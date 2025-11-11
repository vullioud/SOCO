/**
 * Reads the last activity flags from the iLand stand and updates the history
 * section of the stand_data object.
 */
Perception.update_history = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return stand_data_obj;

    const history = stand_data_obj.history;
    const activity = stand_data_obj.activity;
    const last_activity_flag = getFlag('abe_last_activity', null);
    const last_activity_year_flag = getFlag('abe_last_activity_year', -1);

    // 1. Update general history if a new activity was flagged.
    if (last_activity_flag && last_activity_year_flag === (Globals.year - 1)) {
        history.last_activity = last_activity_flag;
        history.last_activity_Year = last_activity_year_flag;
    }
    
    // 2. Check if a planned sequence step was just completed.
    const was_sequence_step_completed = 
        activity.is_Sequence &&
        history.last_activity_Year === (Globals.year - 1) &&
        activity.timeline[activity.sequence_current_step] === (Globals.year - 1);

    if (was_sequence_step_completed) {
        console.log(`[OBSERVE] Stand ${stand_data_obj.stand_id}: Detected completion of step ${activity.sequence_current_step + 1}/${activity.sequence_total_steps} for '${activity.chosen_Activity}'.`);
        activity.sequence_current_step += 1;

        // 3. Check if the entire sequence is now finished.
        if (activity.sequence_current_step >= activity.sequence_total_steps) {
            console.log(`[OBSERVE] Stand ${stand_data_obj.stand_id}: Sequence for '${activity.chosen_Activity}' is complete. Resetting plan.`);
            
            // Reset the entire activity plan to its default state.
            activity.chosen_Activity = 'noManagement';
            activity.parameters = {};
            activity.timeline = [];
            activity.is_Sequence = false;
            activity.sequence_total_steps = 0;
            activity.sequence_current_step = 0;
            activity.target_year = -1;

            // Flag that this stand doesn't need a new assessment until next cycle.
            stand_data_obj.iLand_stand_data.needs_reassessment = false;
        }
    }
    
    return stand_data_obj;
};

/**
 * Reads the reassessment flag from the iLand stand.
 */
Perception.get_reassessment_flags = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return stand_data_obj;

    stand_data_obj.iLand_stand_data.needs_reassessment = getFlag('abe_need_reassessment', false);

    return stand_data_obj;
};


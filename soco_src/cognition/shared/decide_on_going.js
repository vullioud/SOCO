// ----- Start of File: soco_src/cognition/decide_on_going.js -----

Cognition.update_ongoing_sequence = function(stand_data_obj) {
    var activity = stand_data_obj.activity;
    var current_year = Globals.year;

    // 1. If not a sequence, nothing to update.
    if (!activity.is_Sequence) {
        return stand_data_obj;
    }

    // 2. TIMELINE CHECK
    var next_target_year = -1;
    var next_step_index = -1;

    for (var i = 0; i < activity.timeline.length; i++) {
        if (activity.timeline[i] >= current_year) {
            next_target_year = activity.timeline[i];
            next_step_index = i;
            break;
        }
    }

    // 3. UPDATE OR FINISH
    if (next_target_year !== -1) {
        // Sequence continues
        activity.target_year = next_target_year;
        activity.sequence_current_step = next_step_index;
    } else {
        // Sequence Finished
        console.log(`[Think2] Stand ${stand_data_obj.stand_id}: Sequence '${activity.chosen_Activity}' finished.`);
        
        // Handling the "Wait" / "Set Aside" case:
        // Since no physical action occurred, there is no history flag to trigger the index update later.
        // We must increment the state HERE.
        if (activity.chosen_Activity === 'noManagement') {
             stand_data_obj.state.regime_index++;
             console.log(`[Think2] Stand ${stand_data_obj.stand_id}: 'noManagement' block done. Advanced to Index ${stand_data_obj.state.regime_index}.`);
        }

        // Reset Sequence State
        activity.is_Sequence = false;
        activity.target_year = -1;
        activity.parameters = {}; 
        
        // Clean flags if necessary
        if (activity.chosen_Activity === 'selectiveThinning') {
             fmengine.standId = stand_data_obj.stand_id;
             Action.prepare.clear_selectiveThinning_flags(); 
        }
    }
    
    return stand_data_obj;
};

// ----- End of File: soco_src/cognition/decide_on_going.js -----
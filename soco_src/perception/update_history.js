// ===================================================================
// FILE: update_history.js
// ===================================================================

// Attaches the function to the globally available 'Perception' object.
Perception.update_history = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return stand_data_obj;

    const last_activity_flag = getFlag('abe_last_activity', null);
    
    // --- THIS IS THE CRITICAL FIX ---
    // Only update the history if a new activity flag is present.
    // Do NOT clear the flag. The Action module will do that before the next action.
    if (last_activity_flag) {
        stand_data_obj.history.last_activity = last_activity_flag;
        stand_data_obj.history.last_activity_Year = getFlag('abe_last_activity_year', -1);
    }
    
    return stand_data_obj;
};

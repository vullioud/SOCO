/**
 * Reads the last activity flags from the iLand stand and updates the history
 * section of the stand_data object.
 */
Perception.update_history = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return stand_data_obj;

    const history = stand_data_obj.history;
    const activity = stand_data_obj.activity;
    
    // --- THIS IS THE FIX ---
    // Use the correct API call: stand.flag()
    const last_activity_flag = stand.flag('abe_last_activity');
    const last_activity_year_flag = stand.flag('abe_last_activity_year');
    // -----------------------

    // 1. Update general history if a new activity was flagged.
    // We check for null/undefined because that's what clear_flags sets.
    if (last_activity_flag !== null && typeof last_activity_flag !== 'undefined' && last_activity_year_flag === (Globals.year - 1)) {
        history.last_activity = last_activity_flag;
        history.last_activity_Year = last_activity_year_flag;
    }
    
    
    return stand_data_obj;
};

/**
 * Reads the reassessment flag from the iLand stand.
 */
Perception.get_reassessment_flags = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return stand_data_obj;

    // --- THIS IS THE FIX ---
    // Use the correct API call: stand.flag() with a default value.
    var needs_reassessment = stand.flag('abe_need_reassessment');
    stand_data_obj.iLand_stand_data.needs_reassessment = (needs_reassessment === true); // Ensure it's a boolean
    // -----------------------

    return stand_data_obj;
};
/**
 * Reads the last activity flags from the iLand stand and updates the history
 * section of the stand_data object.
 */
Perception.update_history = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return stand_data_obj;

    const last_activity_flag = getFlag('abe_last_activity', null);
    
    // If a new activity flag is present on the stand, update the history.
    // If the flag is null, the existing history values in stand_data_obj remain untouched.
    if (last_activity_flag) {
        stand_data_obj.history.last_activity = last_activity_flag;
        stand_data_obj.history.last_activity_Year = getFlag('abe_last_activity_year', -1);
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


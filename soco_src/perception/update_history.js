// ===================================================================
// FILE: update_history.js
// ===================================================================

// Attaches the function to the globally available 'Perception' object.
Perception.update_history = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return stand_data_obj;

    const last_activity = getFlag('abe_last_activity', null);
    
    if (last_activity && last_activity !== stand_data_obj.history.last_activity) {
        stand_data_obj.history.last_activity = last_activity;
        stand_data_obj.history.last_activity_Year = getFlag('abe_last_activity_year', -1);
        
        stand.setFlag('abe_last_activity', null);
        stand.setFlag('abe_last_activity_year', null);
    }
    
    return stand_data_obj;
};
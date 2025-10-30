// ===================================================================
// FILE: get_reassessment_flags.js
// ===================================================================

// Attaches the function to the globally available 'Perception' object.
Perception.get_reassessment_flags = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return stand_data_obj;

    stand_data_obj.iLand_stand_data.needs_reassessment = getFlag('abe_need_reassessment', false);

    return stand_data_obj;
};
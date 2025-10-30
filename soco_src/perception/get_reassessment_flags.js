// Attaches the function to the globally available 'Perception' object.
Perception.get_reassessment_flags = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return stand_data_obj;

    // --- THIS IS THE CRITICAL FIX ---
    // The Perception module's only job is to READ the flag.
    // It does NOT clear it. The Action module will do that.
    stand_data_obj.iLand_stand_data.needs_reassessment = getFlag('abe_need_reassessment', false);

    return stand_data_obj;
};
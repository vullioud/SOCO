function get_raw_data(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return stand_data_obj; // Return original object if stand is invalid

    // Update the iLand_stand_data block
    stand_data_obj.iLand_stand_data.absolute_age = stand.absoluteAge;
    stand_data_obj.iLand_stand_data.volume = stand.volume;
    
    // This is where we read the feedback from the MegaSTP
    stand_data_obj.iLand_stand_data.needs_reassessment = getFlag('abe_need_reassessment', false);

    return stand_data_obj;
}
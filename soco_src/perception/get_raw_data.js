Perception.get_raw_data = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return stand_data_obj;

    stand_data_obj.iLand_stand_data.absolute_age = stand.absoluteAge;
    stand_data_obj.iLand_stand_data.volume = stand.volume;
    stand_data_obj.iLand_stand_data.basal_area = stand.basalArea;
    stand_data_obj.iLand_stand_data.top_height = stand.topHeight;
    stand_data_obj.iLand_stand_data.species_count = stand.nspecies;

    return stand_data_obj;
};
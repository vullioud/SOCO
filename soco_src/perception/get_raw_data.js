
Perception.get_raw_data = function(stand_data_obj) {
    console.log(`    [OBSERVE-STEP] get_raw_data for stand ${stand_data_obj.stand_id}`);
    fmengine.standId = stand_data_obj.stand_id;
    
    if (!stand || stand.id <= 0) {
        console.warn(`      [WARN] Could not find valid iLand stand object for ID ${stand_data_obj.stand_id}`);
        return stand_data_obj;
    }
    stand_data_obj.iLand_stand_data.absolute_age = stand.absoluteAge;
    stand_data_obj.iLand_stand_data.stand_age = stand.age; 
    stand_data_obj.iLand_stand_data.volume = stand.volume;
    stand_data_obj.iLand_stand_data.basal_area = stand.basalArea;
    stand_data_obj.iLand_stand_data.top_height = stand.topHeight;
    stand_data_obj.iLand_stand_data.species_count = stand.nspecies;

    return stand_data_obj;
};
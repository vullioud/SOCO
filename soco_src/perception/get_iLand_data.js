// ----- Start of File: soco_src/perception/get_iLand_data.js -----

Perception.get_iLand_data = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    
    if (!stand || stand.id <= 0) {
        console.warn(`      [WARN] Could not find valid iLand stand object for ID ${stand_data_obj.stand_id}`);
        return stand_data_obj;
    }

    const data = stand_data_obj.iLand_stand_data;

    data.stand_age = stand.age; 
    data.absolute_age_iLand = stand.absoluteAge;
    data.volume = stand.volume;
    data.basal_area = stand.basalArea;
    data.top_height = stand.topHeight;
    data.species_count = stand.nspecies;
    data.year_of_observation = Globals.year;
    data.U = stand.U;
    data.thinning_intensity = stand.thinningIntensity;
    data.time_since_last_activity_iLand = stand.elapsed;
    data.last_activity_name_iLand = stand.lastActivity;

    return stand_data_obj;
};


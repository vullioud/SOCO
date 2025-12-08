Perception.update_history = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return stand_data_obj;

    const history = stand_data_obj.history;
    
    // Use the correct API call: stand.flag()
    const last_activity_flag = stand.flag('abe_last_activity');
    const last_activity_year_flag = stand.flag('abe_last_activity_year');

    // 1. Update general history if a new activity was flagged.
    if (last_activity_flag !== null && typeof last_activity_flag !== 'undefined' && last_activity_year_flag === (Globals.year - 1)) {
        history.last_activity = last_activity_flag;
        history.last_activity_Year = last_activity_year_flag;

        // --- NEW: Map Activity to Phase ---
        // This maps the specific MegaSTP ID to the high-level Phase it satisfies.
        let satisfied_phase = 'none';

        if (last_activity_flag === 'MegaSTP_Planting') {
            satisfied_phase = 'Planting';
        } else if (last_activity_flag === 'MegaSTP_Tending') {
            satisfied_phase = 'Tending';
        } else if (last_activity_flag === 'MegaSTP_ThinningFromBelow' || 
                   last_activity_flag === 'MegaSTP_SelectiveThinning_Remove') {
            satisfied_phase = 'Thinning';
        } else if (last_activity_flag === 'MegaSTP_Clearcut' || 
                   last_activity_flag === 'MegaSTP_Shelterwood_Final' ||
                   last_activity_flag === 'MegaSTP_TargetDBH' ||
                   last_activity_flag === 'MegaSTP_Plenter') {
            satisfied_phase = 'Harvesting';
        }

        if (satisfied_phase !== 'none') {
            history.last_satisfied_phase = satisfied_phase;
            // console.log(`[Perception] Stand ${stand.id}: Activity '${last_activity_flag}' satisfied phase '${satisfied_phase}'.`);
        }
    }
    
    return stand_data_obj;
};

/**
 * Reads the reassessment flag from the iLand stand.
 */
Perception.get_reassessment_flags = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return stand_data_obj;

    var needs_reassessment = stand.flag('abe_need_reassessment');
    stand_data_obj.iLand_stand_data.needs_reassessment = (needs_reassessment === true); 

    return stand_data_obj;
};

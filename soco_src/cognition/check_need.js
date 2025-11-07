Cognition.check_need = function(stand_data_obj, current_year, agent) {

    if (stand_data_obj.iLand_stand_data.needs_reassessment) {
        return true;
    }

    const planning_interval = 10;
    
    if (current_year >= agent.planning_offset && (current_year - agent.planning_offset) % planning_interval === 0) {

        stand_data_obj.iLand_stand_data.needs_reassessment = true;
        return true;
    }
    
    return false;
};
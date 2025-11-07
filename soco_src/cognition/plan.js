Cognition.plan = function(stand_data_obj, agent) {
    console.log(`  (Cognition) Planning for stand ${stand_data_obj.stand_id}...`);

    stand_data_obj = Cognition.decide_on_going(stand_data_obj, agent);

    if (!stand_data_obj.activity.chosen_Activity || stand_data_obj.activity.chosen_Activity === 'noManagement') {
        stand_data_obj = Cognition.select_activity(stand_data_obj, agent);
    }
    
    stand_data_obj = Cognition.select_parameters(stand_data_obj, agent);    
    stand_data_obj = Cognition.compute_schedule(stand_data_obj, agent);
    stand_data_obj = Cognition.validate_activity(stand_data_obj, agent);

    return stand_data_obj;
};


Cognition.decide_on_going = function(stand_data_obj, agent) {
    // For now, we always reset to 'noManagement' to ensure a fresh plan is made.
    stand_data_obj.activity.chosen_Activity = 'noManagement';
    return stand_data_obj;
};


Cognition.compute_schedule = function(stand_data_obj, agent) {
    // For now, we set a placeholder value.
    stand_data_obj.activity.target_year = -1;
    return stand_data_obj;
};


Cognition.validate_activity = function(stand_data_obj, agent) {
    // For now, we assume plans are not immediately actionable.
    // This will be set to 'true' by compute_schedule in the future.
    stand_data_obj.activity.is_actionable = false;
    return stand_data_obj;
};
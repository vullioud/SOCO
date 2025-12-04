/**
 * =================================================================================
 * FILE: think.js (INSTRUMENTED WITH DETAILED LOGGING)
 * =================================================================================
 */
Cognition.think = function(stand_data_obj, agent) {
    
  
    stand_data_obj = Cognition.update_ongoing_sequence(stand_data_obj);

    var is_ongoing = stand_data_obj.activity.is_Sequence;
    var needs_new_plan = false;

    if (!is_ongoing) {
        var needs_reassessment_flag = stand_data_obj.iLand_stand_data.needs_reassessment;
        var is_periodic_planning_year = (Globals.year >= agent.planning_offset && (Globals.year - agent.planning_offset) % 10 === 0);

        if (needs_reassessment_flag || is_periodic_planning_year) {
            needs_new_plan = true;
        }
    }
    // --- STEP 3: CREATE NEW PLAN (if required) ---
    if (needs_new_plan) {
        stand_data_obj = Cognition.create_new_plan(stand_data_obj, agent);
    }


    stand_data_obj = Cognition.validate_activity(stand_data_obj)
    return stand_data_obj;
};
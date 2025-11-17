/**
 * =================================================================================
 * FILE: think.js (INSTRUMENTED WITH DETAILED LOGGING)
 * =================================================================================
 */
Cognition.think = function(stand_data_obj, agent) {
    
  //  console.log(`    [THINK] --- Starting cognitive pipeline for Stand ${stand_data_obj.stand_id} ---`);

    // --- STEP 1: MANAGE ONGOING SEQUENCES ---
 //   console.log("      -> Calling update_ongoing_sequence...");
    stand_data_obj = Cognition.update_ongoing_sequence(stand_data_obj);
  //  console.log("      -> After update_ongoing_sequence, activity object is: " + SoCo_Inspector._safeStringify(stand_data_obj.activity));

    // --- STEP 2: CHECK IF A NEW PLAN IS NEEDED ---
    var is_ongoing = stand_data_obj.activity.is_Sequence;
    var needs_new_plan = false;

    if (!is_ongoing) {
        var needs_reassessment_flag = stand_data_obj.iLand_stand_data.needs_reassessment;
        var is_periodic_planning_year = (Globals.year >= agent.planning_offset && (Globals.year - agent.planning_offset) % 10 === 0);

        if (needs_reassessment_flag || is_periodic_planning_year) {
            needs_new_plan = true;
        }
    }
   // console.log(`      -> Check complete. Is ongoing: ${is_ongoing}, Needs new plan: ${needs_new_plan}`);

    // --- STEP 3: CREATE NEW PLAN (if required) ---
    if (needs_new_plan) {
  //      console.log("      -> Calling create_new_plan...");
        stand_data_obj = Cognition.create_new_plan(stand_data_obj, agent);
 //       console.log("      -> After create_new_plan, activity object is: " + SoCo_Inspector._safeStringify(stand_data_obj.activity));
    }

    // --- STEP 4: VALIDATE THE FINAL PLAN ---
   // console.log("      -> Calling validate_activity...");
    stand_data_obj = Cognition.validate_activity(stand_data_obj);
  //  console.log("      -> After validate_activity, activity object is: " + SoCo_Inspector._safeStringify(stand_data_obj.activity));

  //  console.log(`    [THINK] --- Cognitive pipeline finished for Stand ${stand_data_obj.stand_id} ---`);
    return stand_data_obj;
};
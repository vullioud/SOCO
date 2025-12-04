// ----- Start of File: soco_src/cognition/think2.js -----

Cognition.think2 = function(stand_data_obj, agent) {
    
    // --- PHASE 1: MAINTENANCE ---
    // Update state based on timelines (always run this to track time)
    stand_data_obj = Cognition.update_ongoing_sequence(stand_data_obj);

    // Busy check: If sequence running OR single-shot pending
    if (stand_data_obj.activity.is_Sequence || 
       (stand_data_obj.activity.target_year > Globals.year)) {
        return stand_data_obj; 
    }

    // --- PHASE 2: STATE UPDATE ---
    // Check history for completions
    stand_data_obj = Cognition.update_regime_index(stand_data_obj);

    // --- PHASE 3: INITIALIZATION / REPICK ---
    // Assign regime metadata (we allow this any year so monitoring shows strategy)
    if (stand_data_obj.regime.name === "unassigned") {
        stand_data_obj = Cognition.assign_regime_and_index(stand_data_obj, agent);
    }

    // --- PLANNING CYCLE GATE (THE FIX) ---
    // 1. Minimum Start Delay: Don't plan anything before offset (e.g., Year 5-14)
    if (Globals.year < agent.planning_offset) {
        return stand_data_obj;
    }

    // 2. Periodic Planning: Only plan if this year matches the agent's cycle
    // (Year - Offset) % 10 == 0  -> E.g., Offset 5 -> Plans in Year 5, 15, 25...
    if ((Globals.year - agent.planning_offset) % 10 !== 0) {
        return stand_data_obj;
    }

    // --- PHASE 4: PLANNING ---
    // Only runs on Planning Years
    stand_data_obj = Cognition.plan_next_step(stand_data_obj);

    // --- PHASE 5: VALIDATE ---
    stand_data_obj = Cognition.validate_activity(stand_data_obj);

    return stand_data_obj;
};

// ----- End of File: soco_src/cognition/think2.js -----
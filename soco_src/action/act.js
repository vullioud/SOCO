Action.trigger_activity = function(stand_data_obj) {
    // 1. Set context
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) {
        console.error(`[Action] ERROR: Could not get valid stand object for ID ${stand_data_obj.stand_id}`);
        return;
    }

    // 2. Clear previous flags
    Action.prepare.clear_flags();
    
    const cognitive_activity_name = stand_data_obj.activity.chosen_Activity;
    let execution_activity_name = cognitive_activity_name; // Default

    // --- 3. MAPPING LOGIC (Critical for Plenter) ---
    // Map specific cognitive decisions to the generic MegaSTP activity.
    if (cognitive_activity_name === 'plenter_harvest' || cognitive_activity_name === 'plenter_thinning') {
        execution_activity_name = 'plenter';
    }

    // --- 4. PREPARE FLAGS ---
    // We use the mapped 'execution_activity_name' to find the prepare function.
    // e.g., 'plenter_thinning' -> 'plenter' -> calls Action.prepare.plenter
    var prepare_function = Action.prepare[execution_activity_name];
    
    if (typeof prepare_function === 'function') {
        // console.log(`[Action] Calling prepare function for '${execution_activity_name}'...`);
        prepare_function(stand_data_obj.activity.parameters, stand_data_obj);
    }

    // --- 5. DIAGNOSTIC LOGGING ---
    if (cognitive_activity_name === 'selectiveThinning') {
        console.log(`[Action] Verifying flags for Selective Thinning on stand ${stand.id}:`);
        console.log(`    -> abe_param_nTrees: ${stand.flag('abe_param_nTrees')}`);
        console.log(`    -> abe_param_nCompetitors: ${stand.flag('abe_param_nCompetitors')}`);
    }

    // --- 6. SIGNAL DETERMINATION ---
    var signal_name = '';

    if (cognitive_activity_name === 'selectiveThinning') {
        // Logic A: Selective Thinning (State Machine)
        // We check the flag to see if we are in Phase 1 (Select) or Phase 2 (Remove)
        var is_initialized = stand.flag('abe_selective_thinning_initialized');
        signal_name = (is_initialized === true) ? 'do_selectiveThinning_remove' : 'do_selectiveThinning_select';
    } else {
        // Logic B: Standard Activities (including mapped Plenter)
        // 'plenter' -> 'do_plenter'
        signal_name = 'do_' + execution_activity_name;
    }
    
    // --- 7. FIRE SIGNAL ---
    if (signal_name) {
        console.log(`[Action] Firing signal '${signal_name}' for stand ${stand.id}.`);
        var was_signal_received = stand.stp.signal(signal_name);
        console.log(`[Action] Signal '${signal_name}' was received by ABE: ${was_signal_received}`);
    }
};
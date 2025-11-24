/**
 * =================================================================================
 * FILE: act.js
 * =================================================================================
 * DESCRIPTION:
 * Triggers the execution of an activity on a specific stand.
 * 1. Maps cognitive activity names to execution names (e.g. fromBelow -> thinningFromBelow).
 * 2. Calls the specific 'prepare' function to set stand flags.
 * 3. Determines the correct signal to fire based on activity state (init flags, sequence steps).
 * 4. Fires the signal to the MegaSTP.
 * =================================================================================
 */

Action.trigger_activity = function(stand_data_obj) {
    // 1. Set context to the correct stand
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) {
        console.error(`[Action] ERROR: Could not get valid stand object for ID ${stand_data_obj.stand_id}`);
        return;
    }

    // 2. Clear previous flags to ensure clean state
    Action.prepare.clear_flags();
    
    const cognitive_activity_name = stand_data_obj.activity.chosen_Activity;
    let execution_activity_name = cognitive_activity_name; // Default fallback

    // --- 3. MAPPING LOGIC ---
    // Map names from JSON config/Cognition to MegaSTP/Prepare names
    
    // Plenter Mapping
    if (cognitive_activity_name === 'plenter_harvest' || cognitive_activity_name === 'plenter_thinning') {
        execution_activity_name = 'plenter';
    } 
    // Thinning From Below Mapping
    else if (cognitive_activity_name === 'fromBelow' || cognitive_activity_name === 'thinningFromBelow') {
        execution_activity_name = 'thinningFromBelow';
    }
    // Tending Mapping
    else if (cognitive_activity_name === 'tending') {
        execution_activity_name = 'tending';
    }
    // Shelterwood Mapping
    else if (cognitive_activity_name === 'shelterwood') {
        execution_activity_name = 'shelterwood';
    }
    
    else if (cognitive_activity_name === 'planting') {
        execution_activity_name = 'planting';
    }

    // --- 4. PREPARE FLAGS ---
    var prepare_function = Action.prepare[execution_activity_name];
    
    if (typeof prepare_function === 'function') {
        prepare_function(stand_data_obj.activity.parameters, stand_data_obj);
    } else {
        console.warn(`[Action] Warning: No prepare function found for '${execution_activity_name}' (Mapped from '${cognitive_activity_name}')`);
    }

    // --- 5. SIGNAL DETERMINATION ---
    var signal_name = '';

    // Logic A: Selective Thinning (State Machine via Flag)
    if (execution_activity_name === 'selectiveThinning') {
        var is_initialized = stand.flag('abe_selective_thinning_initialized');
        signal_name = (is_initialized === true) ? 'do_selectiveThinning_remove' : 'do_selectiveThinning_select';
    } 
    // Logic B: Shelterwood (State Machine via Flag + Step Index)
    else if (execution_activity_name === 'shelterwood') {
        var current_step = stand_data_obj.activity.sequence_current_step;
        var total_steps = stand_data_obj.activity.sequence_total_steps;
        var is_initialized = stand.flag('abe_shelterwood_initialized');

        // 1. Check for Final Harvest (The very last step in the sequence)
        // JavaScript arrays are 0-based, so the last index is (total - 1).
        if (current_step >= total_steps - 1) {
            signal_name = 'do_shelterwood_final';
        }
        // 2. Check for Initialization (Step 0 OR Late Entry)
        // If we are not at the end, but haven't initialized (marked trees) yet,
        // we MUST run 'select', even if we are technically at Step 1 or 2.
        else if (!is_initialized) {
            signal_name = 'do_shelterwood_select';
        }
        // 3. Standard Removal (Initialized and in middle steps)
        else {
            signal_name = 'do_shelterwood_remove';
        }
        
        console.log(`[Action] Shelterwood Signal Logic: Step=${current_step}/${total_steps}, Init=${is_initialized} -> Signal='${signal_name}'`);
    }
    // Logic C: Standard Activities (plenter, tending, thinningFromBelow, etc.)
    else {
        signal_name = 'do_' + execution_activity_name;
    }
    
    // --- 6. FIRE SIGNAL ---
    if (signal_name) {
        console.log(`[Action] Firing signal '${signal_name}' for stand ${stand.id}.`);
        stand.stp.signal(signal_name);
    }
};
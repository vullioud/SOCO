// ----- Start of File: soco_src/action/act.js -----

/**
 * =================================================================================
 * FILE: act.js
 * =================================================================================
 * DESCRIPTION:
 * Triggers the execution of an activity on a specific stand.
 * 1. Maps cognitive activity names to execution names.
 * 2. Calls the specific 'prepare' function to set stand flags.
 * 3. Determines the correct signal to fire based on activity state.
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
    
    if (cognitive_activity_name === 'plenter_harvest' || cognitive_activity_name === 'plenter_thinning') {
        execution_activity_name = 'plenter';
    } 
    else if (cognitive_activity_name === 'fromBelow' || cognitive_activity_name === 'thinningFromBelow') {
        execution_activity_name = 'thinningFromBelow';
    }
    else if (cognitive_activity_name === 'tending') {
        execution_activity_name = 'tending';
    }
    else if (cognitive_activity_name === 'shelterwood') {
        execution_activity_name = 'shelterwood';
    }
    else if (cognitive_activity_name === 'planting') {
        execution_activity_name = 'planting';
    }
    // *** NEW: Femel Mapping ***
    else if (cognitive_activity_name === 'femel') {
        execution_activity_name = 'femel';
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

    // Logic A: Selective Thinning
    if (execution_activity_name === 'selectiveThinning') {
        var is_initialized = stand.flag('abe_selective_thinning_initialized');
        signal_name = (is_initialized === true) ? 'do_selectiveThinning_remove' : 'do_selectiveThinning_select';
    } 
    // Logic B: Shelterwood
    else if (execution_activity_name === 'shelterwood') {
        var current_step = stand_data_obj.activity.sequence_current_step;
        var total_steps = stand_data_obj.activity.sequence_total_steps;
        var is_initialized = stand.flag('abe_shelterwood_initialized');

        if (current_step >= total_steps - 1) {
            signal_name = 'do_shelterwood_final';
        }
        else if (!is_initialized) {
            signal_name = 'do_shelterwood_select';
        }
        else {
            signal_name = 'do_shelterwood_remove';
        }
    }
    // *** NEW: Logic C: Femel ***
    else if (execution_activity_name === 'femel') {
        // Femel doesn't have a "final" step in this implementation, 
        // it just keeps expanding until the sequence ends or the agent stops it.
        var is_initialized = stand.flag('abe_femel_initialized');
        
        if (!is_initialized) {
            signal_name = 'do_femel_select';
        } else {
            signal_name = 'do_femel_step';
        }
    }
    // Logic D: Standard Activities
    else {
        signal_name = 'do_' + execution_activity_name;
    }
    
    // --- 6. FIRE SIGNAL ---
    if (signal_name) {
        console.log(`[Action] Firing signal '${signal_name}' for stand ${stand.id}.`);
        stand.stp.signal(signal_name);
    }
};

// ----- End of File: soco_src/action/act.js -----
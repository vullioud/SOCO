
// Helper for conditional logging
function log_debug(message) {
    if (stand.flag('debug_mode') === true) {
        console.log(message);
    }
}

Action.trigger_activity = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return;

    Action.prepare.clear_flags();
    
    const cognitive_activity_name = stand_data_obj.activity.chosen_Activity;
    let execution_activity_name = cognitive_activity_name; 

    // ... (Mappings remain the same) ...
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
    else if (cognitive_activity_name === 'femel') {
        execution_activity_name = 'femel';
    }

    var prepare_function = Action.prepare[execution_activity_name];
    if (typeof prepare_function === 'function') {
        prepare_function(stand_data_obj.activity.parameters, stand_data_obj);
    }

    var signal_name = '';

    if (execution_activity_name === 'selectiveThinning') {
        var is_initialized = stand.flag('abe_selective_thinning_initialized');
        signal_name = (is_initialized === true) ? 'do_selectiveThinning_remove' : 'do_selectiveThinning_select';
    } 
    else if (execution_activity_name === 'shelterwood') {
        var current_step = stand_data_obj.activity.sequence_current_step;
        var total_steps = stand_data_obj.activity.sequence_total_steps;
        var is_initialized = stand.flag('abe_shelterwood_initialized');

        if (current_step >= total_steps - 1) {
            signal_name = 'do_shelterwood_final';
        } else if (!is_initialized) {
            signal_name = 'do_shelterwood_select';
        } else {
            signal_name = 'do_shelterwood_remove';
        }
    }
    else if (execution_activity_name === 'femel') {
        var is_initialized = stand.flag('abe_femel_initialized');
        if (!is_initialized) {
            signal_name = 'do_femel_select';
        } else {
            signal_name = 'do_femel_step';
        }
    }
    else {
        signal_name = 'do_' + execution_activity_name;
    }
    
    if (signal_name) {
        // Only log if debug mode is ON
        log_debug(`[Action] Firing signal '${signal_name}' for stand ${stand.id}.`);
        stand.stp.signal(signal_name);
    }
};

// ----- End of File: soco_src/action/act.js -----
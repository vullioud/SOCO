Action.prepare.clear_flags = function() {
    // This function is called by 'Action.trigger_activity' BEFORE a new action is set.
    
    // --- 1. Consume the "Receipt" Flags ---
    // The agent has acknowledged the last completed action, so we clear the flags.
    stand.setFlag('abe_need_reassessment', null);
    stand.setFlag('abe_last_activity', null);
    stand.setFlag('abe_last_activity_year', null);

    // --- 2. Clear the "Command" Flag ---
    // Clear the command from the previous turn to prevent re-execution.
    stand.setFlag('abe_next_activity', null);

    // --- 3. Clear ALL Parameter Flags ---
    // This ensures a clean state for the new action's parameters.
    stand.setFlag('abe_param_execution_schedule', null);
    stand.setFlag('abe_param_preferenceFunction', null); // Added for clearcut
    stand.setFlag('abe_param_thinningShare', null);
    stand.setFlag('abe_param_nTrees', null);
    stand.setFlag('abe_param_nCompetitors', null);
    stand.setFlag('abe_param_times', null);
    stand.setFlag('abe_param_interval', null);
    stand.setFlag('abe_param_intensity', null);
    stand.setFlag('abe_param_species_profile', null);
    stand.setFlag('abe_param_plenterCurve', null);
    stand.setFlag('abe_param_dbhList', null);
};
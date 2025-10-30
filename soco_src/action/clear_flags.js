
Action.prepare.clear_flags = function() {
    // This function is called by 'Action.set_flags_for_execution' BEFORE a new action is set.
    // It is the correct place to "consume" the receipt of the last completed action.
    
    // --- THIS IS THE CRITICAL FIX ---
    // Clear the flags that signal a completed activity.
    stand.setFlag('abe_need_reassessment', null);
    stand.setFlag('abe_last_activity', null);
    stand.setFlag('abe_last_activity_year', null);

    // Also clear ALL possible 'abe_param_*' flags to ensure a clean state.
    stand.setFlag('abe_param_rotation_age', null);
    stand.setFlag('abe_param_dbh_threshold', null);
    stand.setFlag('abe_param_times', null);
    stand.setFlag('abe_param_interval', null);
    stand.setFlag('abe_param_nTrees', null);
    stand.setFlag('abe_param_speciesSelectivity', null);
    stand.setFlag('abe_param_thinningShare', null);
    stand.setFlag('abe_param_nCompetitors', null);
    stand.setFlag('abe_param_plenterCurve', null);
    stand.setFlag('abe_param_intensity', null);
    stand.setFlag('abe_param_N', null);
    stand.setFlag('abe_param_steps', null);
    stand.setFlag('abe_param_targetDBH', null);
    stand.setFlag('abe_param_dbhList', null);
    // ... etc. for any other params you might add.
};
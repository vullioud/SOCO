// Attaches the clear_flags function to the Action.prepare namespace.
Action.prepare.clear_flags = function() {
    // This list should include ALL possible 'abe_param_*' flags you will ever use.
    stand.setFlag('abe_param_rotation_age', null);
    stand.setFlag('abe_param_dbh_threshold', null);
    stand.setFlag('abe_param_times', null);
    stand.setFlag('abe_param_interval', null);
    stand.setFlag('abe_param_nTrees', null);
    // ... etc.
};
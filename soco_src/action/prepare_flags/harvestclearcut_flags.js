Action.prepare.clearcut = function(params) {
    // For clearcut, we might not have specific parameters from the agent's plan,
    // so we can set a default or leave it to the MegaSTP's default.
    // For testing, let's set a specific preference function.
    stand.setFlag('abe_param_preferenceFunction', 'dbh > 1');
}
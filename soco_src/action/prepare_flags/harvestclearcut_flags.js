// Attaches the clearcut flag function to the Action.prepare namespace.
Action.prepare.clearcut = function(params) {
    const rotation_age = (params && params.rotation_age) ? params.rotation_age : MEGA_STP_DEFAULTS.clearcut.rotation_age;
    stand.setFlag('abe_param_rotation_age', rotation_age);
};
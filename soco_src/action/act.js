// ===================================================================
// FILE: act.js (Action Module - Main)
// TYPE: Action Module
// LOCATION: soco_src/action/
// ===================================================================
// DESCRIPTION:
// This file defines the main 'Action' object and its primary entry point,
// 'set_flags_for_execution'. It acts as a namespace for all action-related
// functions. The specific flag-setting logic is defined in other files
// that attach their functions to the 'Action.prepare' namespace.
// ===================================================================

// 1. Create the global 'Action' object and its 'prepare' namespace.
// Because this is a top-level 'var', it is automatically available to
// other scripts loaded after this one.
var Action = {
    prepare: {}
};

/**
 * Main entry point for the Action module.
 * Takes a completed plan from a stand_data object and sets the
 * corresponding flags on the iLand stand.
 * @param {stand_data} stand_data_obj - The data object for the stand to act upon.
 */
Action.set_flags_for_execution = function(stand_data_obj) {
    fmengine.standId = stand_data_obj.stand_id;
    if (!stand || stand.id <= 0) return;

    Action.prepare.clear_flags();

    const activity_name = stand_data_obj.activity.chosen_Activity;
    const prepare_function = Action.prepare[activity_name];

    if (typeof prepare_function === 'function') {
        prepare_function(stand_data_obj.activity.parameters);
        stand.setFlag('abe_next_activity', activity_name);
        console.log(`ACTION: Stand ${stand_data_obj.stand_id} flagged for '${activity_name}'.`);
    } else {
        console.warn(`ACTION: No flag function for '${activity_name}'. Defaulting to noManagement.`);
        stand.setFlag('abe_next_activity', 'noManagement');
    }
};
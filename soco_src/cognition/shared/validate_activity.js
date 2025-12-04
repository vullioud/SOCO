/**
 * =================================================================================
 * FILE: validate_activity.js (Simplified with Reset Logic)
 * =================================================================================
 * DESCRIPTION:
 * This function is the final gatekeeper of the planning pipeline. It performs a
 * simple validation to determine if a planned activity is actionable within the
 * current 10-year planning window.
 *
 * LOGIC:
 * 1. If the target_year is within the 10-year window, the plan is validated,
 *    marked as 'high' priority, and made 'actionable'.
 * 2. If the target_year is outside the window (in the past or too far in the
 *    future), the entire activity plan is reset to its default 'noManagement' state.
 * =================================================================================
 */

Cognition.validate_activity = function(stand_data_obj) {
    var activity = stand_data_obj.activity;
    var current_year = Globals.year;
    var planning_horizon = 9; // Current year + 9 more years = 10-year window.

    // --- Step 1: Handle no-ops ---
    // If there is no valid plan or target year to begin with, ensure it's in a clean state.
    if (activity.chosen_Activity === 'noManagement' || activity.target_year === -1) {
        activity.is_actionable = false;
        activity.scheduling_priority = 'none';
        return stand_data_obj;
    }

    var target_year = activity.target_year;

    // --- Step 2: Perform the validation ---
    var is_within_window = (target_year >= current_year && target_year <= current_year + planning_horizon);

    if (is_within_window) {
        // --- PATH 1: The plan is valid and actionable ---
        activity.scheduling_priority = 'high';
        activity.is_actionable = true;
    } else {
        // --- PATH 2: The plan is NOT valid for this cycle. Reset it. ---
        // This is the same reset logic used in decide_on_going.js for an abandoned sequence.
        activity.chosen_Activity = 'noManagement';
        activity.parameters = {};
        activity.timeline = [];
        activity.is_Sequence = false;
        activity.sequence_total_steps = 0;
        activity.sequence_current_step = 0;
        activity.target_year = -1;
        activity.is_actionable = false;
        activity.scheduling_priority = 'none';
    }

    return stand_data_obj;
};
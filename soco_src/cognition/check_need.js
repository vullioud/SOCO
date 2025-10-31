/**
 * Attaches the 'check_need' function to the global Cognition namespace.
 */
Cognition.check_need = function(stand_data_obj, current_year) {
    // Reason 1: A major activity just completed (e.g., final harvest, salvage).
    if (stand_data_obj.iLand_stand_data.needs_reassessment) {
        return true;
    }

    // Reason 2: It's time for the periodic 10-year replanning cycle.
    const planning_interval = 10;
    const stand_offset = stand_data_obj.stand_id % planning_interval;
    if ((current_year - stand_offset) % planning_interval === 0) {
        return true;
    }

    // Note: We removed the check for 'target_year' here as per your refined logic.
    // This function is ONLY for checking if a new PLAN is needed.

    return false;
};
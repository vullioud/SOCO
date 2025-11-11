/**
 * =================================================================================
 * FILE: ten_year_planner.js
 * =================================================================================
 * DESCRIPTION:
 * This module provides tools for an agent to build and analyze a strategic
 * 10-year plan across all its managed stands.
 * =================================================================================
 */

var ten_year_planner = {

    /**
     * Collects all stands that have an actionable plan within the next 10 years.
     * @param {object} all_stands_data - The agent's `managed_stands_data` object.
     * @returns {Array} An array of stand_data objects that are actionable.
     */
    collect_actionable_stands: function(all_stands_data) {
        var actionable_stands = [];
        for (var stand_id in all_stands_data) {
            if (all_stands_data.hasOwnProperty(stand_id)) {
                var stand_data = all_stands_data[stand_id];
                // The 'is_actionable' flag is set by validate_activity for stands
                // with a target_year within the 10-year planning window.
                if (stand_data.activity.is_actionable) {
                    actionable_stands.push(stand_data);
                }
            }
        }
        return actionable_stands;
    },

    /**
     * Organizes a list of actionable stands into a year-by-year schedule.
     * @param {Array} actionable_stands - An array of stand_data objects.
     * @returns {object} An object where keys are years (simulation time) and
     *                   values are arrays of stand_data objects planned for that year.
     */
    build_initial_plan: function(actionable_stands) {
        var plan = {};
        var current_year = Globals.year;
        var planning_horizon = 9;

        // Initialize the plan object with empty arrays for each year in the window
        for (var i = 0; i <= planning_horizon; i++) {
            plan[current_year + i] = [];
        }

        // Populate the plan with the actionable stands
        for (var i = 0; i < actionable_stands.length; i++) {
            var stand_data = actionable_stands[i];
            var target_year = stand_data.activity.target_year;

            // Ensure the target year is within the planning window before adding
            if (plan.hasOwnProperty(target_year)) {
                plan[target_year].push(stand_data);
            }
        }
        return plan;
    }
};
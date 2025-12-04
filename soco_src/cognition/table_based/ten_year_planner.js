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
                // The 'is_actionable' flag is set by Cognition.validate_activity.
                if (stand_data.activity.is_actionable) {
                    actionable_stands.push(stand_data);
                }
            }
        }
        return actionable_stands;
    },

    /**
     * Analyzes a list of actionable stands and returns a summary.
     * @param {Array} actionable_stands - A filtered array of stand_data objects.
     * @returns {object} An object summarizing the plan, e.g., { total: 5, by_class: { Harvesting: 2, Thinning: 3 } }.
     */
    summarize_plan: function(actionable_stands) {
        var summary = {
            total: 0,
            by_class: {}
        };

        for (var i = 0; i < actionable_stands.length; i++) {
            var stand_data = actionable_stands[i];
            summary.total++;
            var age_class = stand_data.classified.age_class;
            if (!summary.by_class[age_class]) {
                summary.by_class[age_class] = 0;
            }
            summary.by_class[age_class]++;
        }
        return summary;
    }
};
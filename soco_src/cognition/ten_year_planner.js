// ----- Start of File: soco_src/cognition/ten_year_planner.js -----

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
    },

    /**
     * Prints a detailed 10-year plan table to the console.
     * @param {object} agent - The agent object.
     */
    report_plan: function(agent) {
        const actionable = this.collect_actionable_stands(agent.managed_stands_data);
        
        if (actionable.length === 0) {
            console.log(`[PLANNER] Agent ${agent.id}: No activities planned for the next 10 years.`);
            return;
        }

        // Sort by Target Year then by Priority
        actionable.sort((a, b) => {
            if (a.activity.target_year !== b.activity.target_year) {
                return a.activity.target_year - b.activity.target_year;
            }
            return b.activity.utility_score - a.activity.utility_score;
        });

        console.log(`\n[PLANNER] 10-Year Plan for Agent ${agent.id} (Year ${Globals.year})`);
        console.log("StandID | Activity         | Type | Year | Vol    | Age    | Prio   | Phase      | LastPhase  | TSL | BA     | Param");
        console.log("------- | ---------------- | ---- | ---- | ------ | ------ | ------ | ---------- | ---------- | --- | ------ | -----");

        actionable.forEach(data => {
            const sid = data.stand_id.toString().padEnd(7);
            const act = data.activity.chosen_Activity.substring(0, 16).padEnd(16);
            const type = (data.activity.is_Sequence ? "Seq" : "New").padEnd(4);
            const year = data.activity.target_year.toString().padEnd(4);
            const vol = data.iLand_stand_data.volume.toFixed(0).padEnd(6);
            const age = data.iLand_stand_data.stand_age.toFixed(0).padEnd(6);
            const prio = (data.activity.utility_score || 0).toFixed(1).padEnd(6);
            
            const phase = (data.classified.activity_class || "-").substring(0, 10).padEnd(10);
            const last = (data.history.last_satisfied_phase || "none").substring(0, 10).padEnd(10);
            const tsl = data.history.time_since_last_activity.toString().padEnd(3);
            const ba = data.iLand_stand_data.basal_area.toFixed(1).padEnd(6);

            let param = "-";
            if (data.activity.parameters && data.activity.parameters.execution_schedule !== undefined) {
                param = data.activity.parameters.execution_schedule.toString();
            }
            
            console.log(`${sid} | ${act} | ${type} | ${year} | ${vol} | ${age} | ${prio} | ${phase} | ${last} | ${tsl} | ${ba} | ${param}`);
        });
        console.log("----------------------------------------------------------------------------------------------------------------------\n");
    }
};


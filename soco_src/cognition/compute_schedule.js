/**
 * =================================================================================
 * FILE: compute_schedule.js (Final Bugfix Version)
 * =================================================================================
 * DESCRIPTION:
 * This version implements the simple, requested logic:
 * 1. It uses the correct "clock" (`absolute_age_soco` or `stand_age`) for each activity.
 * 2. If a future event exists, it calculates the `target_year`.
 * 3. If all events are in the past, it sets `target_year` to -1.
 * This resolves the `target_year: null` and `target_year: 0` bugs.
 * =================================================================================
 */

// --- HELPER FUNCTIONS ---

/**
 * [HELPER] Determines which "clock" (age metric) to use for an activity.
 * This is the core of the bugfix. It centralizes the logic for choosing
 * between the rotation-based age and the absolute stand age.
 * @param {object} stand_data_obj - The stand's data object.
 * @returns {number} The relevant current age for the activity.
 */
function get_relevant_age(stand_data_obj) {
    var activity_name = stand_data_obj.activity.chosen_Activity;
    var rotation_based_activities = ['clearcut', 'shelterwood', 'selectiveThinning', 'fromBelow'];

    if (rotation_based_activities.indexOf(activity_name) > -1) {
        // For these activities, use the age counter that resets after a final harvest.
        return stand_data_obj.iLand_stand_data.absolute_age_soco;
    } else {
        // For all other activities (plenter, targetDBH, tending), use the continuous iLand stand age.
        return stand_data_obj.iLand_stand_data.stand_age;
    }
}

function generate_timeline(activity_name, params) {
    var start_age = Math.round(Number(params.execution_schedule));
    var times = Number(params.times);
    var interval = Number(params.interval);

    var timeline = [];
    var is_Sequence = false;
    var sequence_total_steps = 0;

    switch (activity_name) {
        case 'clearcut':
        case 'planting':
            timeline.push(start_age);
            break;

        case 'shelterwood':
        case 'selectiveThinning':
        case 'fromBelow':
        case 'tending':
            if (times > 0 && interval > 0) {
                is_Sequence = true;
                sequence_total_steps = times;
                for (var i = 0; i < times; i++) {
                    timeline.push(start_age + (i * interval));
                }
            }
            break;

        case 'targetDBH':
            if (times > 0) {
                is_Sequence = true;
                sequence_total_steps = 12;
                for (var i = 0; i < 12; i++) {
                    timeline.push(start_age + (i * times));
                }
            }
            break;

        case 'plenter_harvest':
        case 'plenter_thinning':
            if (interval > 0) {
                is_Sequence = true;
                sequence_total_steps = 12;
                for (var i = 0; i < 12; i++) {
                    timeline.push(start_age + (i * interval));
                }
            }
            break;
    }
    return { timeline: timeline, is_Sequence: is_Sequence, sequence_total_steps: sequence_total_steps };
}

function handle_overdue_harvest(stand_data_obj, original_start_age) {
    var activity_name = stand_data_obj.activity.chosen_Activity;
    var preference = stand_data_obj.preference_focus;
    var current_age = stand_data_obj.iLand_stand_data.absolute_age_soco;

    var is_harvest = ['clearcut', 'shelterwood', 'plenter_harvest'].indexOf(activity_name) > -1;
    if (!is_harvest) {
        return original_start_age;
    }

    var age_thresholds = { "Production": 100, "Biodiversity": 140, "CO2": 120 };
    var age_limit = age_thresholds[preference] || 999;

    if (current_age > age_limit && original_start_age > current_age) {
        var random_offset = 1 + Math.floor(Math.random() * 10);
        var forced_age = Math.round(current_age + random_offset);
        console.log(`[SCHEDULE] Stand ${stand_data_obj.stand_id}: Overdue harvest. Forcing execution from ideal age ${original_start_age} to new age ${forced_age}.`);
        return forced_age;
    }

    return original_start_age;
}


// --- MAIN COGNITION FUNCTION ---

Cognition.compute_schedule = function(stand_data_obj) {
    var activity = stand_data_obj.activity;
    var params = activity.parameters;

    activity.target_year = -1;

    if (activity.chosen_Activity === 'noManagement' || typeof params.execution_schedule === 'undefined') {
        activity.timeline = [];
        activity.is_Sequence = false;
        activity.sequence_total_steps = 0;
        activity.sequence_current_step = 0;
        return stand_data_obj;
    }

    var ideal_start_age = Math.round(Number(params.execution_schedule));
    var effective_start_age = handle_overdue_harvest(stand_data_obj, ideal_start_age);
    
    var temp_params = {};
    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            temp_params[key] = params[key];
        }
    }
    temp_params.execution_schedule = effective_start_age;

    var timeline_data = generate_timeline(activity.chosen_Activity, temp_params);
    activity.timeline = timeline_data.timeline;
    activity.is_Sequence = timeline_data.is_Sequence;
    activity.sequence_total_steps = timeline_data.sequence_total_steps;

    if (activity.timeline.length > 0) {
        var current_year = Globals.year;
        var current_age = Math.floor(get_relevant_age(stand_data_obj));

        var next_target_age = -1;
        var completed_steps = 0;

        for (var i = 0; i < activity.timeline.length; i++) {
            var target_age = activity.timeline[i];
            if (target_age < current_age) {
                completed_steps++;
            }
            if (next_target_age === -1 && target_age >= current_age) {
                next_target_age = target_age;
            }
        }
        
        activity.sequence_current_step = completed_steps;

        if (next_target_age !== -1) {
            // Case 1: A future or current event was found. Calculate the target year.
            var years_until_due = next_target_age - current_age;
            activity.target_year = current_year + years_until_due;
        } else {
            // Case 2: No future event was found. All events are in the past. Set target to -1.
            activity.target_year = -1;
        }
    }

    return stand_data_obj;
};
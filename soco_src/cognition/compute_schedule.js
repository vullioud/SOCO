/**
 * =================================================================================
 * FILE: compute_schedule.js (FINAL VERSION with Syntax Fix)
 * =================================================================================
 */

// --- HELPER FUNCTIONS ---

function get_relevant_age(stand_data_obj) {
    var activity_name = stand_data_obj.activity.chosen_Activity;
    var rotation_based_activities = ['clearcut', 'shelterwood', 'selectiveThinning', 'fromBelow'];

    if (rotation_based_activities.indexOf(activity_name) > -1) {
        return stand_data_obj.iLand_stand_data.absolute_age_soco;
    } else {
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
            sequence_total_steps = 1;
            is_Sequence = false;
            break;

        case 'shelterwood':
        case 'selectiveThinning':
        case 'fromBelow':
        case 'tending':
            if (times > 1 && interval > 0) {
                is_Sequence = true;
                sequence_total_steps = times;
                for (var i = 0; i < times; i++) {
                    timeline.push(start_age + (i * interval));
                }
            } else if (times === 1) {
                // Handle it as a single, non-sequence event.
                timeline.push(start_age);
                sequence_total_steps = 1;
                is_Sequence = false;
            }
            break;

        case 'targetDBH':
        case 'plenter_harvest':
        case 'plenter_thinning':
            if (interval > 0) {
                is_Sequence = true;
                sequence_total_steps = 20;
                for (var i = 0; i < 20; i++) {
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

    if (current_age > age_limit) {
        var random_offset = 1 + Math.floor(Math.random() * 10); // Schedule it for 1-10 years in the future.
        var forced_age = Math.round(current_age + random_offset);
        console.log(`[SCHEDULE] Stand ${stand_data_obj.stand_id}: Overdue harvest detected (Age: ${current_age}, Limit: ${age_limit}). Forcing execution from ideal age ${original_start_age} to new age ${forced_age}.`);
        return forced_age;
    }
    // ----------------------

    return original_start_age;
}

Cognition.convert_age_timeline_to_calendar_years = function(stand_data_obj, age_timeline) {
    const current_year = Globals.year;
    const current_age = Math.floor(get_relevant_age(stand_data_obj));

    const calendar_timeline = age_timeline.map(target_age => {
        const years_until_due = target_age - current_age;
        return current_year + years_until_due;
    });

    return calendar_timeline;
};


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

    // 1. Determine the effective START AGE.
    var ideal_start_age = Math.round(Number(params.execution_schedule));
    var effective_start_age = handle_overdue_harvest(stand_data_obj, ideal_start_age);
    
    // --- THIS IS THE FIX ---
    // Create a copy of the params object using a compatible for...in loop.
    var temp_params = {};
    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            temp_params[key] = params[key];
        }
    }
    // ----------------------
    temp_params.execution_schedule = effective_start_age;

    // 2. Generate the AGE-BASED timeline.
    var timeline_data = generate_timeline(activity.chosen_Activity, temp_params);
    
    activity.is_Sequence = timeline_data.is_Sequence;
    activity.sequence_total_steps = timeline_data.sequence_total_steps;

    // 3. Convert the AGE timeline to a CALENDAR YEAR timeline.
    if (timeline_data.timeline.length > 0) {
        activity.timeline = Cognition.convert_age_timeline_to_calendar_years(stand_data_obj, timeline_data.timeline);

        // 4. Synchronize the plan with the present to find the first actionable step.
        let next_target_year = -1;
        let next_step_index = -1;
        const current_year = Globals.year;

        for (let i = 0; i < activity.timeline.length; i++) {
            if (activity.timeline[i] >= current_year) {
                next_target_year = activity.timeline[i];
                next_step_index = i;
                break;
            }
        }

        if (next_target_year !== -1) {
            activity.sequence_current_step = next_step_index;
            activity.target_year = next_target_year;
        } else {
            activity.sequence_current_step = activity.sequence_total_steps;
            activity.target_year = -1;
        }

    } else {
        activity.timeline = [];
        activity.target_year = -1;
        activity.sequence_current_step = 0;
    }

    return stand_data_obj;
};
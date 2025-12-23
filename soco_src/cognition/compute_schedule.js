// ----- Start of File: soco_src/cognition/compute_schedule.js -----

/**
 * =================================================================================
 * FILE: compute_schedule.js (Femel Fix)
 * =================================================================================
 */

// --- HELPER FUNCTIONS ---

function get_relevant_age(stand_data_obj) {
    var activity_name = stand_data_obj.activity.chosen_Activity;
    // Added 'femel' to rotation based activities
    var rotation_based_activities = ['clearcut', 'shelterwood', 'selectiveThinning', 'fromBelow', "planting", "femel"];

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
        case 'femel': // <--- ADDED: Femel uses times/interval logic
            if (times > 1 && interval > 0) {
                is_Sequence = true;
                sequence_total_steps = times;
                for (var i = 0; i < times; i++) {
                    timeline.push(start_age + (i * interval));
                }
            } else {
                // Fallback if times=1
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

    // Added 'femel' to harvest list for overdue check
    var is_harvest = ['clearcut', 'shelterwood', 'plenter_harvest', 'femel'].indexOf(activity_name) > -1;
    if (!is_harvest) {
        return original_start_age;
    }

    var age_thresholds = { "Production": 100, "Biodiversity": 140, "CO2": 120 };
    var age_limit = age_thresholds[preference] || 999;

    if (current_age > age_limit) {
        var random_offset = 1 + Math.floor(Math.random() * 10); 
        var forced_age = Math.round(current_age + random_offset);
        return forced_age;
    }

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
    
    var temp_params = {};
    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            temp_params[key] = params[key];
        }
    }
    temp_params.execution_schedule = effective_start_age;

    // 2. Generate the AGE-BASED timeline.
    var timeline_data = generate_timeline(activity.chosen_Activity, temp_params);
    
    activity.is_Sequence = timeline_data.is_Sequence;
    activity.sequence_total_steps = timeline_data.sequence_total_steps;

    // 3. Convert the AGE timeline to a CALENDAR YEAR timeline.
    if (timeline_data.timeline.length > 0) {
        activity.timeline = Cognition.convert_age_timeline_to_calendar_years(stand_data_obj, timeline_data.timeline);

        // 4. Synchronize the plan with the present
        let next_target_year = -1;
        let next_step_index = -1;
        const current_year = Globals.year;
        
        const grace_period = 3; 

        // A. Standard Loop
        for (let i = 0; i < activity.timeline.length; i++) {
            if (activity.timeline[i] >= current_year - grace_period) {
                next_target_year = activity.timeline[i];
                if (next_target_year < current_year) {
                    next_target_year = current_year;
                }
                next_step_index = i;
                break;
            }
        }

        // B. Catch-All for Drift
        if (next_target_year === -1 && activity.timeline.length > 0) {
            var last_scheduled = activity.timeline[activity.timeline.length - 1];
            var is_harvest_thin = activity.chosen_Activity !== 'planting';
            
            if (is_harvest_thin && last_scheduled < current_year) {
                next_target_year = current_year;
                next_step_index = 0; 
            }
        }

        if (next_target_year !== -1) {
            
            // Late Entry Filter
            if (activity.is_Sequence) {
                var steps_remaining = activity.sequence_total_steps - next_step_index;
                if (steps_remaining < 2) {
                    activity.chosen_Activity = 'noManagement';
                    activity.parameters = {};
                    activity.timeline = [];
                    activity.is_Sequence = false;
                    activity.sequence_total_steps = 0;
                    activity.sequence_current_step = 0;
                    activity.target_year = -1;
                    return stand_data_obj;
                }
            }

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

// ----- End of File: soco_src/cognition/compute_schedule.js -----
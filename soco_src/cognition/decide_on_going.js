Cognition.decide_on_going = function(stand_data_obj) {
    const activity = stand_data_obj.activity;

    // Check if there is an active, unfinished sequence.
    const is_ongoing = activity.is_Sequence && (activity.sequence_current_step < activity.sequence_total_steps);

    if (!is_ongoing) {
        return stand_data_obj;
    }

    // Calculate the probability of abandoning the sequence.
    // It increases linearly from 5% at the start to 20% at the end.
    const start_prob = 0.05; // 5% chance to abandon at the beginning
    const end_prob = 0.20;   // 20% chance to abandon at the end
    const progress = activity.sequence_current_step / (activity.sequence_total_steps - 1);
    const probability_to_abandon = start_prob + (end_prob - start_prob) * progress;

    if (Math.random() < probability_to_abandon) {
        // Decision: Abandon the sequence.
        console.log(`[COGNITION] Stand ${stand_data_obj.stand_id}: Abandoning ongoing sequence for '${activity.chosen_Activity}'.`);
        
        activity.chosen_Activity = 'noManagement';
        activity.parameters = {};
        activity.timeline = [];
        activity.is_Sequence = false;
        activity.sequence_total_steps = 0;
        activity.sequence_current_step = 0;
        activity.target_year = -1;
        activity.is_actionable = false;
        activity.scheduling_priority = 'none';
        
    } else {
        
    }
    
    return stand_data_obj;
};

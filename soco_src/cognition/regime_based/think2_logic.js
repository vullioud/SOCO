// ----- Start of File: soco_src/cognition/think2_logic.js -----

/**
 * =================================================================================
 * FILE: think2_logic.js (FINAL FIXED VERSION)
 * =================================================================================
 * Handles the core decision logic for the Regime-based architecture.
 * 
 * Key Mechanics:
 * 1. State Update: Advances the regime index based on completed actions.
 * 2. Assignment (Jump): Picks a regime and finds the bio-compatible starting point.
 * 3. Planning (Gate/Skip): Checks height constraints to Schedule, Wait, or Skip steps.
 * =================================================================================
 */

// --- 1. STATE MAINTENANCE ---

Cognition.update_regime_index = function(stand) {
    // We assume !is_Sequence here (checked in think2.js main loop).
    
    const last_year = Globals.year - 1;
    
    // Check history: Did an ACTION finish last year?
    // This catches Single-Shot activities (Planting) AND the end of Sequences (TargetDBH)
    if (stand.history.last_activity_Year === last_year) {
        
        console.log(`[Think2] Stand ${stand.stand_id}: Action completed in ${last_year}. Incrementing Index.`);
        
        stand.state.regime_index++;
        stand.last_decision_reason = `Action Done (Yr ${last_year}). Index++ -> ${stand.state.regime_index}`;

        // Boundary Check: Did we finish the regime?
        if (stand.regime.activities.length > 0 && stand.state.regime_index >= stand.regime.activities.length) {
            console.log(`[Think2] Stand ${stand.stand_id}: Regime '${stand.regime.name}' Finished. Resetting.`);
            
            // Reset to "unassigned". 
            // The main think2 loop will catch this immediately after and trigger 'assign_regime_and_index'.
            stand.regime.name = "unassigned";
            stand.regime.activities = [];
            stand.state.regime_index = 0;
        }
    }
    return stand;
};

// --- 2. INITIALIZATION / REPICK (THE JUMP) ---

Cognition.assign_regime_and_index = function(stand, agent) {
    console.log(`[Think2] Stand ${stand.stand_id}: Triggering Regime Assignment.`);

    // ... (Species Profile assignment remains the same) ...
    if (stand.species_profile === "none" || stand.regime.name === "unassigned") {
        let dominance = stand.classified.species_dominance || 'mixed';
        const preference = stand.preference_focus;
        let config = agent.species_config_table?.[preference]?.[dominance];
        
        // --- FIX: SPECIES TRANSITION LOGIC ---
        let owner_type = agent?.owner?.type || "default";
        if ((preference === 'Biodiversity' || preference === 'CO2') && dominance === 'conifer') {
            if (Math.random() < 0.5) {
                console.log(`[Think2] Stand ${stand.stand_id}: Strategy Shift -> Transitioning Conifer to Mixed.`);
                dominance = 'mixed'; 
                config = agent.species_config_table?.[preference]?.['mixed'];
            }
        }

        if (!config && dominance !== 'mixed') config = agent.species_config_table?.[preference]?.['mixed'];
        if (config) {
            const weights = Distributions.sample(config);
            stand.species_profile = Distributions.weighted_random_choice(weights);
        } else {
            stand.species_profile = "default";
        }
    }

    const pref = stand.preference_focus;
    let struct = stand.classified.structure_class || "low";
    let spec = stand.classified.species_dominance || "mixed";
    let owner_type = agent?.owner?.type || "default";
    let resources = agent?.resources !== undefined ? agent.resources : 0.5;

    let assigned = null;
    if (typeof REGIME_MATRIX !== 'undefined') {
        assigned = REGIME_MATRIX.resolve(pref, struct, spec, owner_type, resources);
    }

    if (assigned) {
        stand.regime.name = assigned.id;
        stand.regime.activities = JSON.parse(JSON.stringify(assigned.activities));
    } else {
        stand.regime.name = "Fallback_NoMgmt";
        stand.regime.activities = [{ type: "noManagement", min_h: 0, max_h: 999, duration: 10 }];
        stand.state.regime_index = 0;
        stand.last_decision_reason = "Fallback Assigned";
        return stand;
    }

    // --- D. JUMP LOGIC ---
    // FIX: Use iLand_stand_data.top_height
    const h = stand.iLand_stand_data.top_height;
    let best_index = 0;

    for (let i = 0; i < stand.regime.activities.length; i++) {
        let act = stand.regime.activities[i];
        if (h < act.max_h) {
            best_index = i;
            break;
        }
        best_index = i;
    }
    
    if (h >= stand.regime.activities[stand.regime.activities.length-1].max_h) {
         best_index = stand.regime.activities.length; 
    }

    stand.state.regime_index = best_index;
    stand.last_decision_reason = `Assigned ${stand.regime.name}. Jumped to Idx ${best_index} (h=${h.toFixed(1)})`;

    return stand;
};

// --- 3. PLANNING ---

Cognition.plan_next_step = function(stand) {
    if (stand.regime.name === "unassigned") return stand; 
    if (stand.regime.name === "Fallback_NoMgmt") {
         stand.activity.chosen_Activity = 'noManagement';
         stand.activity.parameters = { duration: 10 };
         return Cognition.compute_relative_schedule(stand);
    }

    if (stand.state.regime_index >= stand.regime.activities.length) {
        stand.regime.name = "unassigned";
        stand.regime.activities = [];
        stand.state.regime_index = 0;
        stand.species_profile = "none"; 
        return stand; 
    }

    const target_act_def = stand.regime.activities[stand.state.regime_index];
    
    // FIX: Use iLand_stand_data.top_height
    const h = stand.iLand_stand_data.top_height;

    if (target_act_def.max_h < 99 && h >= target_act_def.max_h) {
        stand.state.regime_index++;
        stand.last_decision_reason = `Skipped ${target_act_def.type} (Too Tall)`;
        return Cognition.plan_next_step(stand);
    }

    if (h >= target_act_def.min_h) {
        stand.last_decision_reason = `Gate Open: ${target_act_def.type}`;
        stand.activity.chosen_Activity = target_act_def.type;
        
        stand.activity.parameters = {};
        if (target_act_def.duration) stand.activity.parameters.duration = target_act_def.duration;
        
        stand = Cognition.compute_relative_schedule(stand); 
    } else {
        stand.activity.chosen_Activity = 'noManagement';
        stand.activity.parameters = {};
        stand.activity.timeline = [];
        stand.activity.target_year = -1;
        stand.last_decision_reason = `Gate Closed: Wait for ${target_act_def.type}`;
    }

    return stand;
};

// --- 4. SCHEDULING UTILITY ---

Cognition.compute_relative_schedule = function(stand_data_obj) {
    const activity_name = stand_data_obj.activity.chosen_Activity;
    const params = stand_data_obj.activity.parameters;
    const current_year = Globals.year;
    const random_offset = Math.floor(Math.random() * 5); 
    const start_year = current_year + random_offset;

    var times = Number(params.times) || 1;
    var interval = Number(params.interval) || 5;
    
    // Handling "Wait" Durations
    if (activity_name === 'noManagement' && params.duration) {
        var timeline = [current_year + params.duration];
        stand_data_obj.activity.timeline = timeline;
        stand_data_obj.activity.is_Sequence = true; 
        stand_data_obj.activity.sequence_total_steps = 1;
        stand_data_obj.activity.sequence_current_step = 0;
        stand_data_obj.activity.target_year = timeline[0];
        return stand_data_obj;
    }

    var timeline = [];
    var is_Sequence = false;
    var sequence_total_steps = 0;

    switch (activity_name) {
        case 'clearcut':
        case 'planting':
        case 'shelterwood_final': 
            timeline.push(start_year);
            sequence_total_steps = 1;
            is_Sequence = false;
            break;

        // *** UPDATED: Added 'femel' here ***
        case 'shelterwood':
        case 'selectiveThinning':
        case 'fromBelow': 
        case 'thinningFromBelow':
        case 'tending':
        case 'femel':
            if (times > 1 && interval > 0) {
                is_Sequence = true;
                sequence_total_steps = times;
                for (var i = 0; i < times; i++) {
                    timeline.push(start_year + (i * interval));
                }
            } else {
                timeline.push(start_year);
                sequence_total_steps = 1;
                is_Sequence = false;
            }
            break;

        case 'targetDBH':
        case 'plenter':
        case 'plenter_harvest':
        case 'plenter_thinning':
            if (interval > 0) {
                is_Sequence = true;
                sequence_total_steps = 2; 
                for (var i = 0; i < 2; i++) {
                    timeline.push(start_year + (i * interval));
                }
            }
            break;
            
        default:
            timeline.push(start_year);
            sequence_total_steps = 1;
            is_Sequence = false;
            break;
    }

    stand_data_obj.activity.timeline = timeline;
    stand_data_obj.activity.is_Sequence = is_Sequence;
    stand_data_obj.activity.sequence_total_steps = sequence_total_steps;
    stand_data_obj.activity.sequence_current_step = 0;

    if (timeline.length > 0) {
        stand_data_obj.activity.target_year = timeline[0];
    } else {
        stand_data_obj.activity.target_year = -1;
    }

    return stand_data_obj;
};


// ----- End of File: soco_src/cognition/think2_logic.js -----
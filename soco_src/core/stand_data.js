// ----- Start of File: soco_src/core/stand_data.js -----

/**
 * =================================================================================
 * FILE: stand_data.js
 * TYPE: Core Class (Data Transfer Object)
 * =================================================================================
 */

class stand_data {
    constructor(stand_id, agent_id, preference_focus) {
        // --- I. IDENTIFIERS & FIXED TRAITS ---
        this.stand_id = stand_id;
        this.agent_id = agent_id;
        this.preference_focus = preference_focus;
        this.species_profile = "none";

        // --- II. PERCEPTION DATA ---
        this.iLand_stand_data = {
            // Agent-managed age counter
            absolute_age_soco: 0,
            absolute_age_iLand: 0,
            // Raw iLand metrics
            stand_age: 0,
            basal_area: 0,
            volume: 0,
            top_height: 0,
            species_count: 0,
            
            // Management context from iLand
            U: 0,
            thinning_intensity: 'unknown',
            time_since_last_activity_iLand: -1,
            last_activity_name_iLand: 'none',

            // Observation metadata
            year_of_observation: -1,
            needs_reassessment: false
        };
        this.classified = {
            age_class: 'unknown',
            structure_class: 'unknown',
            species_dominance: 'unknown'
        };
        this.history = {
            last_activity: 'none',
            last_activity_Year: -1, 
            time_since_last_activity: -1
        };

        // --- III. AGENT'S PLAN ---
        this.activity = {
            chosen_Activity: 'noManagement',
            parameters: {},
            target_year: -1,
            is_actionable: false,
            is_Sequence: false,
            timeline: [],
            sequence_total_steps: 0,
            sequence_current_step: 0
        };

        // --- IV. MONITORING SNAPSHOT ---
        this.monitoringSnapshot = null;
    }
}
this.stand_data = stand_data;

// ----- End of File: soco_src/core/stand_data.js -----
// FILE: soco_src/core/stand_data.js

class stand_data {
    constructor(stand_id, agent) { // Changed signature to accept the agent object
        // --- I. IDENTIFIERS & FIXED TRAITS ---
        this.stand_id = stand_id;
        this.agent_id = agent.id; 
      //  this.agent = agent;     
        this.preference_focus = "none"; 
        this.species_profile = "none";

        // --- II. PERCEPTION DATA ---
        this.iLand_stand_data = {
            absolute_age_soco: 0,
            absolute_age_iLand: 0,
            stand_age: 0,
            basal_area: 0,
            volume: 0,
            top_height: 0,
            species_count: 0,
            U: 0,
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
            time_since_last_activity: -1, 
            last_satisfied_phase: 'none', 
            target_species: []
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
            sequence_current_step: 0,
            sequence_sub_activity: 'none' 
        };

        // --- IV. MONITORING SNAPSHOT ---
        this.monitoringSnapshot = null;
        this.is_monitoring_candidate = false; 
        
        // --- V. DATA LOGS --- 
        // These were missing and are required by Monitoring.snapshot
        this.detailed_history = []; 
        this.activity_history = [];
    }
}
this.stand_data = stand_data;
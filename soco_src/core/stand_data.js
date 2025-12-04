// FILE: soco_src/core/stand_data.js

class stand_data {
    constructor(stand_id, agent) { // Changed signature to accept the agent object
        // --- I. IDENTIFIERS & FIXED TRAITS ---
        this.stand_id = stand_id;
        this.agent_id = agent.id; // Get the ID from the agent object
      //  this.agent = agent;       // Store the direct reference
        this.preference_focus = "none"; // This will be set by the agent
        this.species_profile = "none";

        this.regime = {
            name: "unassigned", 
            activities: {} 
        };
        this.last_decision_reason = "Init"; 
        this.state = {
         regime_index: 0 
        };
        // --- II. PERCEPTION DATA ---
        this.iLand_stand_data = {
            absolute_age_soco: 0,
            absolute_age_iLand: 0,
            stand_age: 0,
            basal_area: 0,
            volume: 0,
            top_height: 0,
            species_count: 0,
            stems_per_ha: 0,
            U: 0,
            thinning_intensity: 'unknown',
            time_since_last_activity_iLand: -1,
            last_activity_name_iLand: 'none',
            year_of_observation: -1,
            needs_reassessment: false
        };
        this.classified = {
            age_class: 'unknown',
            structure_class: 'unknown',
            species_dominance: 'unknown', 
            activity_class: 'unknown',
            dominant_species: [] // Vector of {id, share}
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
            sequence_current_step: 0,
            sequence_sub_activity: 'none' // <-- NEW PROPERTY ADDED HERE
        };

        // --- IV. MONITORING SNAPSHOT ---
        this.monitoringSnapshot = null;
        this.is_monitoring_candidate = false; // Default to false
        
        // --- V. DATA LOGS --- 
        // These were missing and are required by Monitoring.snapshot
        this.detailed_history = []; 
        this.activity_history = [];
    }
}
this.stand_data = stand_data;
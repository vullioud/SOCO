/**
 * =================================================================================
 * FILE: stand_data.js
 * TYPE: Core Class (Data Transfer Object)
 * LOCATION: soco_src/core/
 * =================================================================================
 * DESCRIPTION:
 * A structured container representing the agent's complete knowledge and plan
 * for a single forest stand. It decouples the cognitive layer from the iLand
 * physical layer.
 *
 * VERTICAL INTEGRATION:
 * [Level 5] - Created and held by `socoabe_agent`.
 *           - Links logically 1-to-1 with an iLand `Stand` (via `stand_id`).
 *
 * HORIZONTAL INTEGRATION (Pipeline):
 * [Data Subject] - Passed through the pipeline:
 *                  - Updated by Perception modules.
 *                  - Read/Updated by Cognition modules.
 *                  - Read by Action modules to set iLand flags.
 * =================================================================================
 */

class stand_data {
    constructor(stand_id, agent_id, preference_focus) {
        // --- I. IDENTIFIERS & FIXED TRAITS ---
        this.stand_id = stand_id;
        this.agent_id = agent_id;
        this.preference_focus = preference_focus;

        // --- II. PERCEPTION DATA ---
        this.iLand_stand_data = {
            absolute_age: 0,
            stand_age: 0,
            basal_area: 0,
            volume: 0,
            needs_reassessment: true // Default to true for initial planning
        };
        this.classified = {
            age_class: 'unknown',
            structure_class: 'unknown',
            species_dominance: 'unknown'
        };
        this.history = {
            last_activity: 'none',
            last_activity_Year: -1
        };

        // --- III. AGENT'S PLAN ---
        this.activity = {
            chosen_Activity: 'noManagement',
            parameters: {},
            target_year: -1,
            is_actionable: false,
            is_Sequence: false,
            sequence_total_steps: 0,
            sequence_current_step: 0
        };

        // --- IV. MONITORING SNAPSHOT ---
        this.monitoringSnapshot = null;
    }
}
this.stand_data = stand_data;
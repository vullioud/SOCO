/**
 * =================================================================================
 * FILE: soco_src/core/unit_data.js
 * =================================================================================
 */

class unit_data {
    constructor(agent_id) {
        this.agent_id = agent_id;

        // 1. STRATEGIC METRICS (Aggregates)
        // Kept for quick "health checks" against the preference vector
        this.metrics = {
            total_area: 0,
            total_volume: 0,
            mean_volume: 0,
            
            // Distributions (Counts)
            age_class_dist: {}, 
            activity_class_dist: {},
            structure_dist: {},
            preference_dist: {}
        };

        // 2. STAND INVENTORY ("The Table")
        // A flat list of stand summaries. One row per stand.
        // Used for both reporting and tactical decision making (Think 2.0).
        this.stands = []; 
    }
}
this.unit_data = unit_data;
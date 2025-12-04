// ----- Start of File: soco_src/perception/aggregate_unit.js -----

/**
 * =================================================================================
 * FILE: aggregate_unit.js
 * =================================================================================
 * DESCRIPTION:
 * Aggregates individual stand data into the Agent's Unit Data structure.
 * This function prepares the "Unit Table" used for reporting and high-level strategy.
 * =================================================================================
 */

Perception.aggregate_unit = function(agent) {
    const unit = agent.unit_data;
    const stands_map = agent.managed_stands_data;

    // 1. Reset Unit Metrics
    unit.stands = []; 
    unit.metrics.total_area = 0;
    unit.metrics.total_volume = 0;
    unit.metrics.mean_volume = 0;
    
    // Reset Distributions
    unit.metrics.age_class_dist = {};
    unit.metrics.activity_class_dist = {};
    unit.metrics.structure_dist = {};
    unit.metrics.preference_dist = {};

    // 2. Iterate through all managed stands
    for (const stand_id in stands_map) {
        const s = stands_map[stand_id];
        const d = s.iLand_stand_data;
        const c = s.classified;
        const h = s.history;
        
        // Logic to determine Dominant Species for the report
        let dom_sp = "none";
        let dom_share = 0;
        
        if (c.dominant_species && c.dominant_species.length > 0) {
            // Sort by share descending to find the top species
            const sorted_specs = c.dominant_species.slice().sort((a, b) => b.share - a.share);
            dom_sp = sorted_specs[0].id;
            dom_share = sorted_specs[0].share;
        }

        // Build the Summary Row
        const row = {
            // Identifiers
            stand_id: s.stand_id,
            preference: s.preference_focus,
            
            // Regime State (NEW)
            regime_name: s.regime.name,
            regime_idx: s.state.regime_index,
            
            // Classification
            activity_class: c.activity_class || "unknown",
            structure_class: c.structure_class || "unknown",
            
            // Dendrometrics
            age: d.absolute_age_iLand,
            stand_age: d.stand_age,
            area: 1, // Assuming 1ha per pixel/stand if not specified, or use stand.area if available
            volume: d.volume,
            density: d.stems_per_ha,
            top_height: d.top_height,
            dom_top_height: d.top_height,  // same as top_height
            // Species
            species_count: d.species_count,
            dom_species: dom_sp,
            dom_share: dom_share,
            species_composition: c.dominant_species, 
            
            // Activity Status
            last_activity: h.last_activity,
            time_since_last: h.time_since_last_activity,
            
            // Planning State
            next_act: s.activity.chosen_Activity,
            target_year: s.activity.target_year,
            is_ongoing: s.activity.is_Sequence
        };

        // Add to Unit List
        unit.stands.push(row);

        // Update Aggregates
        unit.metrics.total_volume += (row.volume * row.area);
        unit.metrics.total_area += row.area;

        // Helper to increment distribution counters
        const inc = (obj, key) => { obj[key] = (obj[key] || 0) + 1; };
        
        inc(unit.metrics.activity_class_dist, row.activity_class);
        inc(unit.metrics.structure_dist, row.structure_class);
        inc(unit.metrics.preference_dist, row.preference);
    }

    // 3. Final Calculations
    if (unit.metrics.total_area > 0) {
        unit.metrics.mean_volume = unit.metrics.total_volume / unit.metrics.total_area;
    }
};

// ----- End of File: soco_src/perception/aggregate_unit.js -----
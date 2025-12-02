// FILE: soco_src/perception/aggregate_unit.js

Perception.aggregate_unit = function(agent) {
    const unit = agent.unit_data;
    const stands_map = agent.managed_stands_data;

    unit.stands = []; 
    unit.metrics.total_area = 0;
    unit.metrics.total_volume = 0;
    unit.metrics.activity_class_dist = {};
    unit.metrics.structure_dist = {};
    unit.metrics.preference_dist = {};

    for (const stand_id in stands_map) {
        const s = stands_map[stand_id];
        const d = s.iLand_stand_data;
        const c = s.classified;
        const h = s.history;
        
        let dom_sp = "none";
        let dom_share = 0;
        
        if (c.dominant_species && c.dominant_species.length > 0) {
            const sorted_specs = c.dominant_species.slice().sort((a, b) => b.share - a.share);
            dom_sp = sorted_specs[0].id;
            dom_share = sorted_specs[0].share;
        }

        const row = {
            stand_id: s.stand_id,
            activity_class: c.activity_class || "unknown",
            structure_class: c.structure_class || "unknown",
            preference: s.preference_focus,
            age: d.absolute_age_iLand,
            stand_age: d.stand_age,
            area: stand.area || 1, 
            volume: d.volume,
            density: d.stems_per_ha,
            top_height: d.top_height,
            dom_top_height: c.dom_top_height, 
            species_count: d.species_count,
            dom_species: dom_sp,
            dom_share: dom_share,
            species_composition: c.dominant_species, 
            last_activity: h.last_activity,
            time_since_last: h.time_since_last_activity,
            is_ongoing: s.activity.is_Sequence,
            target_year: s.activity.target_year,
            regime_name: s.regime.name // Include regime
        };

        unit.stands.push(row);

        unit.metrics.total_volume += (row.volume * row.area);
        unit.metrics.total_area += row.area;

        const inc = (obj, key) => { obj[key] = (obj[key] || 0) + 1; };
        inc(unit.metrics.activity_class_dist, row.activity_class);
        inc(unit.metrics.structure_dist, row.structure_class);
        inc(unit.metrics.preference_dist, row.preference);
    }

    if (unit.metrics.total_area > 0) {
        unit.metrics.mean_volume = unit.metrics.total_volume / unit.metrics.total_area;
    }
};
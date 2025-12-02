/**
 * =================================================================================
 * FILE: soco_src/utils/monitoring.js
 * =================================================================================
 * DESCRIPTION:
 * Handles data logging for Stands (Detailed & Activity) and Units.
 * Includes safety checks for undefined values to prevent crashes.
 * =================================================================================
 */

var Monitoring = {
    
    // Master switch to enable/disable all logging
    isEnabled: function() {
        if (typeof SoCoABE_CONFIG !== 'undefined' && SoCoABE_CONFIG.MONITORING) {
            return SoCoABE_CONFIG.MONITORING.ENABLED;
        }
        return true;
    },

    // --- HELPER: Safety Float Fixer ---
    // Prevents "toFixed is not a function" crashes if value is null/undefined/string
    _safeFixed: function(val, digits) {
        if (typeof val === 'number' && !isNaN(val)) {
            return val.toFixed(digits);
        }
        return "0";
    },

    // --- 1. STAND SNAPSHOT (Detailed & Activity) ---
    snapshot: function(agent, stand_data) {
        if (!this.isEnabled()) return;

        // Force iLand to recalculate statistics for the stand context
        fmengine.standId = stand_data.stand_id;
        stand.reload(); 

        var activity_happened = (stand_data.activity.target_year === Globals.year);

        // Optimization: Do nothing if nothing happened AND stand isn't selected for detailed monitoring
        if (!activity_happened && !stand_data.is_monitoring_candidate) {
            return;
        }

        var owner_type = "unknown";
        if (agent && agent.owner) owner_type = agent.owner.type;
        
        var d = stand_data.iLand_stand_data; // Shorthand for metrics

        // Create the record
        var record = {
            year: Globals.year,
            agent_id: agent.id,
            owner_type: owner_type,
            stand_id: stand_data.stand_id,
            preference: stand_data.preference_focus,
            
            // Biological State
            age: stand.age,
            absolute_age: stand.absoluteAge,
            volume: stand.volume,
            basal_area: stand.basalArea,
            height: stand.height,
            top_height: stand.topHeight,
            stems: stand.stems,

            // Increment Metrics
            mai_decade: d.mai_decade,
            mai_total: d.mai_total,

            // Harvest Metrics (Cumulative)
            harv_tot: d.harvest_total,
            harv_thin: d.harvest_thinning,
            harv_salv: d.harvest_salvage,
            harv_final: d.harvest_final,

            // Deadwood Metrics (Stock)
            dw_tot: d.dw_total,
            dw_nat: d.dw_natural,
            dw_beetle: d.dw_beetle,
            dw_storm: d.dw_storm,
            
            // Action State
            activity_name: stand_data.activity.chosen_Activity,
            is_active: activity_happened ? 1 : 0,
            
            // Classification
            age_class: stand_data.classified.age_class || "N/A",
            structure_class: stand_data.classified.structure_class || "N/A",
            activity_class: stand_data.classified.activity_class || "N/A",

            // Parameters
            removed_fraction: stand.flag('abe_param_fraction_to_remove') || 0,
            thinning_share: stand.flag('abe_param_thinningShare') || 0
        };

        // Log to Detailed History (if selected)
        if (stand_data.is_monitoring_candidate) {
            stand_data.detailed_history.push(record);
        }

        // Log to Activity History (if action occurred)
        if (activity_happened && stand_data.activity.chosen_Activity !== 'noManagement') {
            stand_data.activity_history.push(record);
        }
    },

    // --- 2. UNIT SNAPSHOT ---
    snapshot_unit: function(unit_obj, year) {
        if (!this.isEnabled()) return;
        
        var i = unit_obj.iland_metrics;
        var a = unit_obj.aggregated_metrics;

        var record = {
            year: year,
            unit_id: unit_obj.unit_id,
            
            // iLand Metrics
            area: i.area,
            vol_mean: i.volume,
            mai_unit: i.mai,
            plan_annual: i.annual_plan,
            harvest_realized: i.realized_harvest,
            
            // SoCoABE Aggregates
            total_vol_m3: a.total_standing_volume_m3,
            total_harv_m3: a.total_harvest_m3,
            dw_stock_mean: a.mean_deadwood_ha, // m3/ha
            age_mean: a.mean_stand_age
        };
        
        unit_obj.history.push(record);
    },

    // --- 3. CSV SAVERS ---

    save_detailed_csv: function(all_agents, filename) {
        console.log(`--- Monitoring: Saving Detailed Log to ${filename} ---`);
        this._write_csv(all_agents, filename, "detailed_history");
    },

    save_activity_csv: function(all_agents, filename) {
        console.log(`--- Monitoring: Saving Activity Log to ${filename} ---`);
        this._write_csv(all_agents, filename, "activity_history");
    },

    save_unit_csv: function(units_map, filename) {
        console.log(`--- Monitoring: Saving Unit Log to ${filename} ---`);
        
        var header = "year,unit_id,area,vol_mean,mai_unit,plan_annual,harvest_realized,total_vol_m3,total_harv_m3,dw_stock_mean,age_mean";
        var lines = [header];
        var count = 0;

        for (var uid in units_map) {
            var u = units_map[uid];
            if (u && u.history) {
                for (var i = 0; i < u.history.length; i++) {
                    var r = u.history[i];
                    var line = `${r.year},${r.unit_id},` +
                               `${this._safeFixed(r.area, 1)},` +
                               `${this._safeFixed(r.vol_mean, 2)},` +
                               `${this._safeFixed(r.mai_unit, 2)},` +
                               `${this._safeFixed(r.plan_annual, 2)},` +
                               `${this._safeFixed(r.harvest_realized, 2)},` +
                               `${this._safeFixed(r.total_vol_m3, 0)},` +
                               `${this._safeFixed(r.total_harv_m3, 0)},` +
                               `${this._safeFixed(r.dw_stock_mean, 2)},` +
                               `${this._safeFixed(r.age_mean, 1)}`;
                    lines.push(line);
                    count++;
                }
            }
        }
        
        Globals.saveTextFile(filename, lines.join("\n"));
        console.log(`      -> Saved ${count} unit records.`);
    },
    // ... inside monitoring.js ...

    snapshot_unit: function(unit_obj, year) {
        if (!this.isEnabled()) return;
        
        const m = unit_obj.metrics;

        var record = {
            year: year,
            unit_id: unit_obj.unit_id,
            
            area: m.total_area,
            vol_mean: m.mean_volume_ha,
            mai_mean: m.mean_mai_ha, // This is your baseline for planning!
            
            harv_tot_m3: m.total_harvest_vol,
            harv_final_m3: m.harvest_by_type.final,
            
            age_mean: m.mean_age,
            dw_mean: m.mean_deadwood_ha,

            // Distributions (Saved as JSON string)
            age_dist: JSON.stringify(m.age_classes),
            struct_dist: JSON.stringify(m.structure_classes),
            spec_dist: JSON.stringify(m.species_shares)
        };
        
        unit_obj.history.push(record);
    },
    
    save_unit_csv: function(units_map, filename) {
        console.log(`--- Monitoring: Saving Unit Log to ${filename} ---`);
        
        var header = "year,unit_id,area,vol_mean,mai_mean,harv_tot_m3,harv_final_m3,age_mean,dw_mean,age_dist_json,struct_dist_json,spec_dist_json";
        var lines = [header];

        for (var uid in units_map) {
            var u = units_map[uid];
            if (u && u.history) {
                for (var i = 0; i < u.history.length; i++) {
                    var r = u.history[i];
                    // Use a regex to escape quotes in JSON for CSV validity if needed, 
                    // but standard JSON string usually works if we wrap the whole field in quotes.
                    // Simple approach: replace " with '
                    
                    var line = `${r.year},${r.unit_id},` +
                               `${this._safeFixed(r.area, 1)},` +
                               `${this._safeFixed(r.vol_mean, 2)},` +
                               `${this._safeFixed(r.mai_mean, 2)},` +
                               `${this._safeFixed(r.harv_tot_m3, 0)},` +
                               `${this._safeFixed(r.harv_final_m3, 0)},` +
                               `${this._safeFixed(r.age_mean, 1)},` +
                               `${this._safeFixed(r.dw_mean, 2)},` +
                               `"${r.age_dist.replace(/"/g, "'")}",` +
                               `"${r.struct_dist.replace(/"/g, "'")}",` +
                               `"${r.spec_dist.replace(/"/g, "'")}"`;
                    lines.push(line);
                }
            }
        }
        
        Globals.saveTextFile(filename, lines.join("\n"));
    },
    

    // Internal helper for Stand CSVs
    _write_csv: function(all_agents, filename, array_key) {
        var header = "year,agent_id,owner_type,stand_id,preference," + 
                     "age,absolute_age,volume,basal_area,height,top_height,stems," +
                     "mai_decade,mai_total," +
                     "harv_tot,harv_thin,harv_salv,harv_final," +
                     "dw_tot,dw_nat,dw_beetle,dw_storm," +
                     "activity_name,is_active,age_class,structure_class,activity_class," +
                     "removed_fraction,thinning_share";

        var lines = [header];
        var total_records = 0;

        for (var i = 0; i < all_agents.length; i++) {
            var agent = all_agents[i];
            for (var stand_id in agent.managed_stands_data) {
                var stand_data = agent.managed_stands_data[stand_id];
                var history_arr = stand_data[array_key]; 

                if (history_arr && history_arr.length > 0) {
                    for (var h = 0; h < history_arr.length; h++) {
                        var r = history_arr[h];
                        
                        var line = `${r.year},${r.agent_id},${r.owner_type},${r.stand_id},${r.preference},` +
                                   `${this._safeFixed(r.age, 1)},` +
                                   `${this._safeFixed(r.absolute_age, 1)},` +
                                   `${this._safeFixed(r.volume, 2)},` +
                                   `${this._safeFixed(r.basal_area, 2)},` +
                                   `${this._safeFixed(r.height, 2)},` +
                                   `${this._safeFixed(r.top_height, 2)},` +
                                   `${this._safeFixed(r.stems, 0)},` +
                                   
                                   // Increment
                                   `${this._safeFixed(r.mai_decade, 2)},` +
                                   `${this._safeFixed(r.mai_total, 2)},` +
                                   
                                   // Harvest
                                   `${this._safeFixed(r.harv_tot, 2)},` +
                                   `${this._safeFixed(r.harv_thin, 2)},` +
                                   `${this._safeFixed(r.harv_salv, 2)},` +
                                   `${this._safeFixed(r.harv_final, 2)},` +

                                   // Deadwood
                                   `${this._safeFixed(r.dw_tot, 2)},` +
                                   `${this._safeFixed(r.dw_nat, 2)},` +
                                   `${this._safeFixed(r.dw_beetle, 2)},` +
                                   `${this._safeFixed(r.dw_storm, 2)},` +

                                   `${r.activity_name},${r.is_active},` +
                                   `${r.age_class},${r.structure_class},${r.activity_class},` +
                                   `${this._safeFixed(r.removed_fraction, 2)},${this._safeFixed(r.thinning_share, 2)}`;
                        
                        lines.push(line);
                        total_records++;
                    }
                }
            }
        }

        var content = lines.join("\n");
        Globals.saveTextFile(filename, content);
        console.log(`      -> Saved ${total_records} records.`);
    }
};

this.Monitoring = Monitoring;

// ----- End of File: soco_src/utils/monitoring.js -----
// ----- Start of File: soco_src/utils/monitoring.js -----

/**
 * =================================================================================
 * FILE: soco_src/utils/monitoring.js
 * =================================================================================
 * DESCRIPTION:
 * Handles data logging for Stands (Detailed & Activity) and Units.
 * Captures biological state, management history, and cognitive decision rationale.
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
    // Prevents crashes if a value is null/undefined
    _safeFixed: function(val, digits) {
        if (typeof val === 'number' && !isNaN(val)) {
            return val.toFixed(digits);
        }
        return "0";
    },

    // --- HELPER: Serialize Species Vector ---
    // Converts [{id:'piab', share:0.8}, {id:'fasy', share:0.2}] -> "piab:0.80|fasy:0.20"
    _serializeSpecies: function(species_vector) {
        if (!species_vector || species_vector.length === 0) return "none";
        // Sort by share descending to put dominant species first
        let sorted = species_vector.slice().sort((a, b) => b.share - a.share);
        // Format: "id:share|id:share"
        return sorted.map(s => `${s.id}:${s.share.toFixed(2)}`).join('|');
    },

    // --- 1. STAND SNAPSHOT (Detailed & Activity) ---
    // Called every year for every managed stand
    snapshot: function(agent, stand_data) {
        if (!this.isEnabled()) return;

        // Force iLand to recalculate statistics for the specific stand context
        fmengine.standId = stand_data.stand_id;
        stand.reload(); 

        var activity_happened = (stand_data.activity.target_year === Globals.year);

        // Optimization: Do nothing if nothing happened AND stand isn't selected for detailed monitoring
        if (!activity_happened && !stand_data.is_monitoring_candidate) {
            return;
        }

        var owner_type = "unknown";
        if (agent && agent.owner) owner_type = agent.owner.type;
        
        var d = stand_data.iLand_stand_data; 

        // Create the data record
        var record = {
            year: Globals.year,
            agent_id: agent.id,
            owner_type: owner_type,
            stand_id: stand_data.stand_id,
            preference: stand_data.preference_focus,
            
            // --- STRATEGY & COGNITION ---
            regime: stand_data.regime.name || "unassigned",
            regime_idx: (stand_data.state && stand_data.state.regime_index !== undefined) ? stand_data.state.regime_index : -1,
            species_profile: stand_data.species_profile || "none",
            species_composition: this._serializeSpecies(stand_data.classified.dominant_species),
            decision: stand_data.last_decision_reason || "n/a", // The "Why"
            
            // --- BIOLOGICAL STATE ---
            age: stand.age,
            absolute_age: stand.absoluteAge,
            volume: stand.volume,
            basal_area: stand.basalArea,
            height: stand.height,
            top_height: stand.topHeight,
            stems: stand.stems,

            // --- HARVEST METRICS (Cumulative) ---
            harv_tot: d.harvest_total,
            harv_final: d.harvest_final,

            // --- DEADWOOD METRICS ---
            dw_tot: d.dw_total,
            
            // --- ACTION STATE ---
            activity_name: stand_data.activity.chosen_Activity,
            target_year: stand_data.activity.target_year,
            is_active: activity_happened ? 1 : 0,
            
            // --- CLASSIFICATION ---
            age_class: stand_data.classified.age_class || "N/A",
            structure_class: stand_data.classified.structure_class || "N/A",
            activity_class: stand_data.classified.activity_class || "N/A",

            // --- PARAMETERS ---
            removed_fraction: stand.flag('abe_param_fraction_to_remove') || 0,
            thinning_share: stand.flag('abe_param_thinningShare') || 0
        };

        // Push to Detailed History (if selected for monitoring)
        if (stand_data.is_monitoring_candidate) {
            stand_data.detailed_history.push(record);
        }

        // Push to Activity History (if an action actually occurred)
        if (activity_happened && stand_data.activity.chosen_Activity !== 'noManagement') {
            stand_data.activity_history.push(record);
        }
    },

    // --- 2. UNIT SNAPSHOT ---
    // Called once per year per agent
snapshot_unit: function(unit_obj, year) {
        if (!this.isEnabled()) return;
        
        var m = unit_obj.metrics;

        var record = {
            year: year,
            unit_id: unit_obj.agent_id,
            owner_type: unit_obj.owner_type || "unknown", // <--- USE IT
            
            area: m.total_area,
            vol_mean: m.mean_volume,
            
            pref_dist: JSON.stringify(m.preference_dist),
            struct_dist: JSON.stringify(m.structure_dist),
            act_dist: JSON.stringify(m.activity_class_dist)
        };
        
        if (!unit_obj.history) unit_obj.history = [];
        unit_obj.history.push(record);
    },
    
    save_unit_csv: function(units_map, filename) {
        console.log(`--- Monitoring: Saving Unit Log to ${filename} ---`);
        
        // Added 'owner_type' to header
        var header = "year,unit_id,owner_type,area,vol_mean,pref_dist,struct_dist,act_dist";
        var lines = [header];

        for (var uid in units_map) {
            var u = units_map[uid];
            if (u && u.history) {
                for (var i = 0; i < u.history.length; i++) {
                    var r = u.history[i];
                    var line = `${r.year},${r.unit_id},${r.owner_type},` +
                               `${this._safeFixed(r.area, 1)},` +
                               `${this._safeFixed(r.vol_mean, 2)},` +
                               `"${r.pref_dist.replace(/"/g, "'")}",` +
                               `"${r.struct_dist.replace(/"/g, "'")}",` +
                               `"${r.act_dist.replace(/"/g, "'")}"`;
                    lines.push(line);
                }
            }
        }
        
        Globals.saveTextFile(filename, lines.join("\n"));
    },
    // --- 3. CSV SAVERS ---

    save_detailed_csv: function(all_agents, filename) {
        console.log(`--- Monitoring: Saving Detailed Log to ${filename} ---`);
        this._write_stand_csv(all_agents, filename, "detailed_history");
    },

    save_activity_csv: function(all_agents, filename) {
        console.log(`--- Monitoring: Saving Activity Log to ${filename} ---`);
        this._write_stand_csv(all_agents, filename, "activity_history");
    },

    save_unit_csv: function(units_map, filename) {
        console.log(`--- Monitoring: Saving Unit Log to ${filename} ---`);
        
        var header = "year,unit_id,area,vol_mean,pref_dist,struct_dist,act_dist";
        var lines = [header];
        var count = 0;

        for (var uid in units_map) {
            var u = units_map[uid];
            if (u && u.history) {
                for (var i = 0; i < u.history.length; i++) {
                    var r = u.history[i];
                    // Replace double quotes in JSON strings with single quotes to keep CSV valid
                    var line = `${r.year},${r.unit_id},` +
                               `${this._safeFixed(r.area, 1)},` +
                               `${this._safeFixed(r.vol_mean, 2)},` +
                               `"${r.pref_dist.replace(/"/g, "'")}",` +
                               `"${r.struct_dist.replace(/"/g, "'")}",` +
                               `"${r.act_dist.replace(/"/g, "'")}"`;
                    lines.push(line);
                    count++;
                }
            }
        }
        
        Globals.saveTextFile(filename, lines.join("\n"));
        console.log(`      -> Saved ${count} unit records.`);
    },

    // --- INTERNAL HELPER: Write Stand CSV ---
    // Shared logic for both Detailed and Activity logs to ensure consistency
    _write_stand_csv: function(all_agents, filename, array_key) {
        
        // Comprehensive Header
        var header = "year,agent_id,owner_type,stand_id,preference," + 
                     "regime,regime_idx,species_profile,species_composition,decision," + // Logic Fields
                     "age,absolute_age,volume,basal_area,height,top_height,stems," + // Bio Fields
                     "harv_tot,harv_final,dw_tot," + // Harvest/Deadwood
                     "activity_name,target_year,is_active," + // Activity Status
                     "age_class,structure_class,activity_class," + // Classification
                     "removed_fraction,thinning_share"; // Parameters

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
                        
                        // Sanitize decision string (remove commas to prevent CSV breakage)
                        var clean_decision = r.decision.replace(/,/g, ";");

                        var line = `${r.year},${r.agent_id},${r.owner_type},${r.stand_id},${r.preference},` +
                                   // Logic
                                   `${r.regime},${r.regime_idx},${r.species_profile},"${r.species_composition}","${clean_decision}",` +
                                   
                                   // Bio
                                   `${this._safeFixed(r.age, 1)},` +
                                   `${this._safeFixed(r.absolute_age, 1)},` +
                                   `${this._safeFixed(r.volume, 2)},` +
                                   `${this._safeFixed(r.basal_area, 2)},` +
                                   `${this._safeFixed(r.height, 2)},` +
                                   `${this._safeFixed(r.top_height, 2)},` +
                                   `${this._safeFixed(r.stems, 0)},` +
                                   
                                   // Harvest/Deadwood
                                   `${this._safeFixed(r.harv_tot, 2)},` +
                                   `${this._safeFixed(r.harv_final, 2)},` +
                                   `${this._safeFixed(r.dw_tot, 2)},` +

                                   // Activity
                                   `${r.activity_name},${r.target_year},${r.is_active},` +
                                   
                                   // Classification
                                   `${r.age_class},${r.structure_class},${r.activity_class},` +
                                   
                                   // Params
                                   `${this._safeFixed(r.removed_fraction, 2)},${this._safeFixed(r.thinning_share, 2)}`;
                        
                        lines.push(line);
                        total_records++;
                    }
                }
            }
        }

        var content = lines.join("\n");
        Globals.saveTextFile(filename, content);
        console.log(`      -> Saved ${total_records} records to ${filename}.`);
    }
};

this.Monitoring = Monitoring;

// ----- End of File: soco_src/utils/monitoring.js -----
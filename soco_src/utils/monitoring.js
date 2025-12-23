var Monitoring = {
    
    aggregated_history: [],

    isEnabled: function() {
        if (typeof SoCoABE_CONFIG !== 'undefined' && SoCoABE_CONFIG.MONITORING) {
            return SoCoABE_CONFIG.MONITORING.ENABLED;
        }
        return true;
    },

    getAggInterval: function() {
        if (typeof SoCoABE_CONFIG !== 'undefined' && SoCoABE_CONFIG.MONITORING && SoCoABE_CONFIG.MONITORING.agg_interval) {
            return SoCoABE_CONFIG.MONITORING.agg_interval;
        }
        return 1; // Default: Every year
    },

    _safeFixed: function(val, digits) {
        if (typeof val === 'number' && !isNaN(val)) return val.toFixed(digits);
        return "0";
    },

    _getSpeciesJson: function() {
        try {
            var comp = {};
            var total_ba = stand.basalArea;
            if (total_ba > 0) {
                for (var i = 0; i < stand.nspecies; i++) {
                    var share = stand.speciesBasalArea(i) / total_ba;
                    if (share > 0.01) comp[stand.speciesId(i)] = Number(share.toFixed(3));
                }
            }
            return JSON.stringify(comp).replace(/"/g, "'"); 
        } catch (e) { return "{}"; }
    },

    _getTargetsJson: function(stand_data) {
        try {
            var targets = (stand_data.history && stand_data.history.target_species) ? stand_data.history.target_species : [];
            return JSON.stringify(targets).replace(/"/g, "'");
        } catch (e) { return "[]"; }
    },

    // --- 1. DATA COLLECTION ---

snapshot: function(agent, stand_data) {

        if (!this.isEnabled()) return;
        try {
            // 1. Set the Context
            fmengine.standId = stand_data.stand_id;
            
            // 2. CRITICAL FIX: FORCE RELOAD
            // During 'noManagement', ABE might be looking at a cached or "Ghost" state.
            // We must force it to look at the living trees NOW.
            if (stand.reload) {
                stand.reload(); 
            } else {
                // Fallback if .reload() isn't exposed: Access a property that forces calculation
                var _wakeUp = stand.npp; 
            }

            // 3. Ghost Check
            if (stand.id !== stand_data.stand_id) {
                console.log("[Monitoring] Ghost Stand detected. Expected " + stand_data.stand_id + ", got " + stand.id);
                return; 
            }
            
            var activity_happened = (stand_data.activity.target_year === Globals.year);
            if (!activity_happened && !stand_data.is_monitoring_candidate) return;

            var d = stand_data.iLand_stand_data; 
            
            var record = {
                year: Globals.year,
                agent_id: agent.id,
                owner_type: (agent.owner) ? agent.owner.type : "unknown",
                stand_id: stand_data.stand_id,
                preference: stand_data.preference_focus,
                strategy: stand_data.species_profile || "none", 
                
                age: stand.age,
                absolute_age: stand.absoluteAge, 
                soco_age: d.absolute_age_soco,   
                
                // Now these will be the LIVE values
                volume: stand.volume,     
                basal_area: stand.basalArea,
                height: stand.height,
                
                species_composition: this._getSpeciesJson(), // This calls stand.speciesBasalArea, which needs the reload too
                target_species: this._getTargetsJson(stand_data),

                activity_name: stand_data.activity.chosen_Activity,
                is_active: activity_happened ? 1 : 0,
                
                age_class: stand_data.classified.age_class || "N/A",
                activity_class: stand_data.classified.activity_class || "N/A",
                structure_class: stand_data.classified.structure_class || "N/A"
            };

            if (stand_data.is_monitoring_candidate) stand_data.detailed_history.push(record);
            if (activity_happened && stand_data.activity.chosen_Activity !== 'noManagement') {
                stand_data.activity_history.push(record);
            }
        } catch (e) { console.error(`[Monitoring] Snapshot failed: ${e.message}`); }
    },
    // --- 2. LANDSCAPE AGGREGATION (Optimized) ---
    record_aggregate: function(institution, year) {
        if (!this.isEnabled()) return;
        
        // Performance Check: Only run every N years
        if (year % this.getAggInterval() !== 0) return;

        // 1. Build a Fast Lookup: StandID -> OwnerType
        // This avoids jumping through agent objects inside the loop
        var stand_owner_map = {}; 
        var agents = institution.all_agents;
        for (var i = 0; i < agents.length; i++) {
            var ag = agents[i];
            var o = ag.owner.type;
            for (var j = 0; j < ag.managed_stand_ids.length; j++) {
                stand_owner_map[ag.managed_stand_ids[j]] = o;
            }
        }

        // 2. Initialize Sums
        var sums = {};
        
        // 3. Linear Scan of All Stands (Faster in iLand than random access)
        var all_ids = fmengine.standIds; // Array of all IDs
        
        for (var i = 0; i < all_ids.length; i++) {
            var sid = all_ids[i];
            var owner = stand_owner_map[sid];
            
            if (owner) { // Only process managed stands
                if (!sums[owner]) sums[owner] = { total_ba: 0, species: {} };
                
                fmengine.standId = sid;
                if (stand.id > 0) { // Valid stand
                 if (stand.reload) stand.reload(); 

    
                    var ba = stand.basalArea;
                    if (ba > 0) {
                        sums[owner].total_ba += ba;
                        for (var k = 0; k < stand.nspecies; k++) {
                            var sp = stand.speciesId(k);
                            var sp_ba = stand.speciesBasalArea(k);
                            if (!sums[owner].species[sp]) sums[owner].species[sp] = 0;
                            sums[owner].species[sp] += sp_ba;
                        }
                    }
                }
            }
        }

        // 4. Store Results
        for (var owner in sums) {
            var data = sums[owner];
            var comp = {};
            if (data.total_ba > 0) {
                for (var sp in data.species) {
                    var share = data.species[sp] / data.total_ba;
                    if (share > 0.001) comp[sp] = Number(share.toFixed(4));
                }
            }
            this.aggregated_history.push({
                year: year,
                owner_type: owner,
                total_ba: data.total_ba,
                species_json: JSON.stringify(comp).replace(/"/g, '""')
            });
        }
    },

    // --- 3. EXPORT FUNCTIONS ---

    save_detailed_csv: function(all_agents, filename) {
        console.log(`--- Monitoring: Saving Detailed Log ---`);
        this._write_csv(all_agents, filename, "detailed_history");
    },

    save_activity_csv: function(all_agents, filename) {
        console.log(`--- Monitoring: Saving Activity Log ---`);
        this._write_csv(all_agents, filename, "activity_history");
    },

    save_aggregated_csv: function(filename) {
        console.log(`--- Monitoring: Saving Aggregated Log ---`);
        var header = "year,owner_type,total_ba,species_composition";
        var lines = [header];
        for (var i = 0; i < this.aggregated_history.length; i++) {
            var r = this.aggregated_history[i];
            var line = `${r.year},${r.owner_type},${r.total_ba.toFixed(2)},"${r.species_json}"`;
            lines.push(line);
        }
        Globals.saveTextFile(filename, lines.join("\n"));
    },

    _write_csv: function(all_agents, filename, array_key) {
        try {
            // FIX: Added structure_class to header
            var header = "year,agent_id,owner_type,stand_id,preference,strategy," + 
                         "age,absolute_age,soco_age,volume,basal_area,height," +
                         "species_composition,target_species," +
                         "activity_name,is_active,age_class,activity_class,structure_class";

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
                            var sp_json = (r.species_composition || "{}").replace(/'/g, '""'); 
                            var tg_json = (r.target_species || "[]").replace(/'/g, '""');

                            // FIX: Added r.structure_class
                            var line = `${r.year},${r.agent_id},${r.owner_type},${r.stand_id},${r.preference},${r.strategy},` +
                                       `${this._safeFixed(r.age, 1)},` +
                                       `${this._safeFixed(r.absolute_age, 1)},` +
                                       `${this._safeFixed(r.soco_age, 1)},` +
                                       `${this._safeFixed(r.volume, 2)},` +
                                       `${this._safeFixed(r.basal_area, 2)},` +
                                       `${this._safeFixed(r.height, 2)},` +
                                       `"${sp_json}","${tg_json}",` +
                                       `${r.activity_name},${r.is_active},` +
                                       `${r.age_class},${r.activity_class},${r.structure_class}`;
                            
                            lines.push(line);
                            total_records++;
                        }
                    }
                }
            }
            Globals.saveTextFile(filename, lines.join("\n"));
            console.log(`      -> Saved ${total_records} records to ${filename}.`);
        } catch (e) {
             console.error(`[Monitoring] Error saving CSV ${filename}: ${e.message}`);
        }
    }
};

this.Monitoring = Monitoring;

// ----- End of File: soco_src/utils/monitoring.js -----
// ----- Start of File: soco_src/integration/SOCO_main.js -----
var socoabe; 

class socoabe_main {
    constructor() {
        this.institution = null;
        this.initialized = false;
    }
    
    initialize() {
        console.log("--- SoCoABE Main: Initializing Cognitive Layer... ---");
        const configs = this.load_all_configs();
        this.institution = new institution(configs);
        
        // --- FIX: Use the Config value, not hardcoded 10 ---
        let sample_n = 10; // Default
        if (typeof SoCoABE_CONFIG !== 'undefined' && SoCoABE_CONFIG.MONITORING) {
            sample_n = SoCoABE_CONFIG.MONITORING.sample_size || 10;
        }
        this.select_monitoring_stands(sample_n);
        // ---------------------------------------------------

        this.initialized = true;
        console.log(`--- SoCoABE Main: Initialization Complete. Monitoring ${sample_n} stands. ---`);
    }

    load_all_configs() {
         return {
            traits:             JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/traits/agent_traits.json'))),
            activities:         JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/activities/activity_distributions.json'))),
            age_class:          JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/age_class/age_class_lookup.json'))),
            parameters:         JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/params/parameter_distributions.json'))),
            plenter_profiles:   JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/profiles/plenter_profiles.json'))),
            targetDBH_profiles: JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/profiles/targetDBH_profiles.json'))),           
            species_config:     JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/species/species_config.json'))),
            species_list:       JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/species/species_list.json'))),
            species_profile_per_activity_table: JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/species/species_profile_per_activity.json')))
        };
    }

    select_monitoring_stands(count) {
        let all_stands = [];
        this.institution.all_agents.forEach(agent => {
            for (let stand_id in agent.managed_stands_data) {
                all_stands.push(agent.managed_stands_data[stand_id]);
            }
        });
        
        // Fisher-Yates Shuffle
        for (let i = all_stands.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [all_stands[i], all_stands[j]] = [all_stands[j], all_stands[i]];
        }
        
        let selected = all_stands.slice(0, count);
        selected.forEach(sd => sd.is_monitoring_candidate = true);
    }

    update(current_year) {
        if (!this.initialized) return;
        this.institution.all_agents.forEach(agent => {
            agent.run_yearly_cycle(current_year);
        });
    }

    finalize() {
        if (!this.initialized) return;
        console.log("--- SoCoABE Main: Finalizing and Saving Logs ---");
        
        var path_detailed = Globals.path("soco_log_detailed_stands.csv");
        Monitoring.save_detailed_csv(this.institution.all_agents, path_detailed);

        var path_activity = Globals.path("soco_log_activities.csv");
        Monitoring.save_activity_csv(this.institution.all_agents, path_activity);

        let all_units_map = {};
        this.institution.all_agents.forEach(agent => {
            if (agent.unit_data) {
                all_units_map[agent.unit_data.agent_id] = agent.unit_data;
            }
        });

        var path_unit = Globals.path("soco_log_units.csv");
        Monitoring.save_unit_csv(all_units_map, path_unit);
    }
}
this.socoabe_main = socoabe_main;

// ----- End of File: soco_src/integration/SOCO_main.js -----
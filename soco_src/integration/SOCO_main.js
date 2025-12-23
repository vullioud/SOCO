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
        
        // --- FIX: Use Configured Sample Size ---
        const sample_size = (typeof SoCoABE_CONFIG !== 'undefined' && SoCoABE_CONFIG.MONITORING) 
                            ? SoCoABE_CONFIG.MONITORING.sample_size 
                            : 10;

        this.select_monitoring_stands(sample_size);
        this.initialized = true;
        console.log(`--- SoCoABE Main: Initialization Complete. Monitoring ${sample_size} stands. ---`);
    }

    load_all_configs() {
         // ... (Same as previous) ...
         return {
            traits:             JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/traits/agent_traits.json'))),
            activities:         JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/activities/activity_distributions.json'))),
            age_class:          JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/age_class/age_class_lookup.json'))),
            parameters:         JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/params/parameter_distributions.json'))),
            plenter_profiles:   JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/profiles/plenter_profiles.json'))),
            targetDBH_profiles: JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/profiles/targetDBH_profiles.json'))),           
            species_config:     JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/species/species_config.json'))),
        };
    }

    select_monitoring_stands(count) {
        let all_stands = [];
        this.institution.all_agents.forEach(agent => {
            for (let stand_id in agent.managed_stands_data) {
                all_stands.push(agent.managed_stands_data[stand_id]);
            }
        });
        for (let i = all_stands.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [all_stands[i], all_stands[j]] = [all_stands[j], all_stands[i]];
        }
        let selected = all_stands.slice(0, count);
        selected.forEach(sd => sd.is_monitoring_candidate = true);
    }

   update(current_year) {
        if (!this.initialized) return;
        
        // 1. Run Agent Logic
        this.institution.all_agents.forEach(agent => {
            agent.run_yearly_cycle(current_year);
        });
        
        // 2. Record Landscape State (In Memory)
        Monitoring.record_aggregate(this.institution, current_year);
    }

    finalize() {
        if (!this.initialized) return;
        console.log("--- SoCoABE Main: Finalizing and Saving Logs ---");
        
        // 1. Detailed Stand Logs
        var path_detailed = Globals.path("soco_log_detailed_stands.csv");
        Monitoring.save_detailed_csv(this.institution.all_agents, path_detailed);

        // 2. Activity Logs
        var path_activity = Globals.path("soco_log_activities.csv");
        Monitoring.save_activity_csv(this.institution.all_agents, path_activity);

        // 3. Unit Logs
        // ... (unit log logic) ...

        // 4. Aggregated Species Log (NEW)
        var path_agg = Globals.path("soco_log_aggregated_species.csv");
        Monitoring.save_aggregated_csv(path_agg);
    }
}
this.socoabe_main = socoabe_main;


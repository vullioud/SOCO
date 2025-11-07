/**
 * =================================================================================
 * FILE: SOCO_main.js
 * TYPE: Main Controller
 * LOCATION: soco_src/integration/
 * =================================================================================
 * DESCRIPTION:
 * The central orchestrator of the SoCoABE model. It manages the lifecycle of the
 * cognitive layer, loads configurations, and triggers the annual update cycle.
 *
 * VERTICAL INTEGRATION:
 * [Level 1] - Holds the `institution` instance.
 *           - Loads all JSON configurations and passes them down.
 *
 * HORIZONTAL INTEGRATION (Pipeline):
 * [Orchestrator] - In `update(year)`, it iterates through all agents to trigger
 *                  their yearly cognitive cycle.
 * =================================================================================
 */

var socoabe; // Global instance

class socoabe_main {
    constructor() {
        this.institution = null;
        this.initialized = false;
    }
    
    initialize() {
        console.log("--- SoCoABE Main: Initializing Cognitive Layer... ---");
        const configs = this.load_all_configs();
        this.institution = new institution(configs);
        this.initialized = true;
        console.log("--- SoCoABE Main: Initialization Complete. ---");
    }

    load_all_configs() {
        console.log("  -> Loading all JSON configuration tables...");
        try {
            // We now load each file into a specific, named property.
            return {
                traits:             JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/traits/agent_traits.json'))),
                activities:         JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/activities/activity_distributions.json'))),
                age_class:          JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/age_class/age_class_lookup.json'))),
                parameters:         JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/params/parameter_distributions.json'))),
                plenter_profiles:   JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/profiles/plenter_profiles.json'))),
                targetDBH_profiles: JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/profiles/targetDBH_profiles.json'))),           
                species_config:     JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/species/species_config.json'))),
                species_list:       JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/species/species_list.json'))),
                species_profile_per_activity_table:    JSON.parse(Globals.loadTextFile(Globals.path('./abe/SOCO/config/tables/species/species_profile_per_activity.json')))

            };
        } catch (e) {
            console.error("FATAL ERROR parsing JSON configuration files: " + e.message);
            throw e;
        }
    }

    update(current_year) {
    if (!this.initialized) return;
    console.log(`--- socoabe_main: update(year=${current_year}) called. Processing ${this.institution.all_agents.length} agents.`); // BREADCRUMB 3
    this.institution.all_agents.forEach(agent => {
        agent.run_yearly_cycle(current_year);
    });
    }

  
}
this.socoabe_main = socoabe_main;
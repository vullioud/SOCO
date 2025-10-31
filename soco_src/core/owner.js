// ----- START OF CORRECTED FILE: soco_src/core/owner.js -----

/**
 * =================================================================================
 * FILE: owner.js
 * TYPE: Core Class (Data Provider)
 * LOCATION: soco_src/core/
 * =================================================================================
 * DESCRIPTION:
 * Represents a specific type of forest owner (e.g., 'state', 'small_private').
 * It acts as a repository for type-specific configurations and distributions.
 *
 * VERTICAL INTEGRATION:
 * [Level 3] - Created by `institution`.
 *           - Creates and holds `socoabe_agent` instances.
 *           - Provides specific config subsets to its agents upon request.
 *
 * HORIZONTAL INTEGRATION (Pipeline):
 * [Static] - Passive data provider. Does not have a yearly cycle.
 * =================================================================================
 */

class owner {
    constructor(institution, owner_type, agent_stand_map, all_configs) {
        this.institution = institution;
        this.type = owner_type;
        this.agent_list = [];

        // --- THE DEFINITIVE, EXPLICIT STRUCTURE ---
        // Each configuration is assigned to its own top-level property.
        
        // Owner-specific tables
        this.trait_table = all_configs.traits[this.type];
        this.activity_table = all_configs.activities[this.type];
        this.species_config_table = all_configs.species_config[this.type];

        // Universal tables (shared by all owners of this type)
        this.age_class_table = all_configs.age_class['all'];
        this.parameter_table = all_configs.parameters['all'];
        this.plenter_profiles_table = all_configs.plenter_profiles['all'];
        this.targetDBH_profiles_table = all_configs.targetDBH_profiles['all'];
        this.species_list_table = all_configs.species_list['all'];

        // Create the agents, which will inherit these properties.
        for (const agent_name in agent_stand_map) {
            const stand_ids = agent_stand_map[agent_name];
            const new_agent = new socoabe_agent(agent_name, this, stand_ids);
            this.agent_list.push(new_agent);
        }
    }
}
this.owner = owner;

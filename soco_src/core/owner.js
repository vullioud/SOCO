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
    constructor(owner_type, agent_stand_map, all_configs) {
        this.type = owner_type;
        this.agent_list = [];
        this.configs = all_configs;

        for (const agent_name in agent_stand_map) {
            // Get the list of stand IDs for this agent from the map
            const stand_ids = agent_stand_map[agent_name];
            // Pass the agent's name and its list of stands to the constructor
            const new_agent = new socoabe_agent(agent_name, this, stand_ids);
            this.agent_list.push(new_agent);
        }
    }

    get_config_for_owner(config_group, is_owner_specific = true) {
        try {
            return is_owner_specific ? this.configs[config_group][this.type] : this.configs[config_group];
        } catch (e) {
            return null;
        }
    }
}
this.owner = owner;
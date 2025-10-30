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
    // --- THIS IS THE CRITICAL FIX ---
    // The constructor signature must match the order of parameters passed from institution.js
    constructor(institution, owner_type, agent_stand_map, all_configs) {
        this.institution = institution; // Store the reference to the parent institution
        this.type = owner_type;         // This will now correctly be a string like "small"
        this.agent_list = [];
        this.configs = all_configs;

        for (const agent_name in agent_stand_map) {
            // Get the list of stand IDs for this agent from the map
            const stand_ids = agent_stand_map[agent_name];
            // Pass the agent's name and its list of stands to the constructor
            // 'this' correctly refers to this owner instance.
            const new_agent = new socoabe_agent(agent_name, this, stand_ids);
            this.agent_list.push(new_agent);
        }
    }

    get_config_for_owner(config_group, is_owner_specific = true) {
        try {
            // This lookup will now work because 'this.type' is a string key
            return is_owner_specific ? this.configs[config_group][this.type] : this.configs[config_group];
        } catch (e) {
            console.error(`Error getting config for group '${config_group}' and owner '${this.type}'.`);
            return null;
        }
    }
}
this.owner = owner;

// ----- END OF CORRECTED FILE: soco_src/core/owner.js -----
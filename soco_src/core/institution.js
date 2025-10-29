/**
 * =================================================================================
 * FILE: institution.js
 * TYPE: Core Class (Static Structure)
 * LOCATION: soco_src/core/
 * =================================================================================
 * DESCRIPTION:
 * Represents the top-level structural entity. It is responsible for discovering
 * the initial landscape setup from iLand and creating the agent hierarchy.
 *
 * VERTICAL INTEGRATION:
 * [Level 2] - Created by `SOCO_main`.
 *           - Creates and holds `owner` instances based on landscape discovery.
 *
 * HORIZONTAL INTEGRATION (Pipeline):
 * [Static] - Primarily active during initialization. Does not have a yearly cycle.
 * =================================================================================
 */

class institution {
    constructor(all_configs) {
        this.owners = {};
        this.all_agents = [];
        this.configs = all_configs;
        console.log("Institution created. Discovering landscape...");
        this.discover_and_create();
    }

    discover_and_create() {
        // This map is all we need: { owner_type: { agent_name: [stand_ids] } }
        const owner_agent_stand_map = {};

        fmengine.standIds.forEach(id => {
            fmengine.standId = id;
            if (stand && stand.agent) {
                const agent_name = stand.agent.name;
                const owner_type = stand.flag('owner_type');
                if (!owner_type) return;

                if (!owner_agent_stand_map[owner_type]) owner_agent_stand_map[owner_type] = {};
                if (!owner_agent_stand_map[owner_type][agent_name]) owner_agent_stand_map[owner_type][agent_name] = [];
                owner_agent_stand_map[owner_type][agent_name].push(id);
            }
        });

        console.log("--- Creating SoCoABE Agents per Owner ---");
        for (const owner_type in owner_agent_stand_map) {
            const agent_stand_map = owner_agent_stand_map[owner_type];
            // We don't need to pass the agent_body_map anymore
            const new_owner = new owner(owner_type, agent_stand_map, this.configs);
            this.owners[owner_type] = new_owner;
            this.all_agents.push(...new_owner.agent_list);
            console.log(`  -> Owner '${owner_type}': created ${new_owner.agent_list.length} agents.`);
        }
        console.log(`Institution discovered ${Object.keys(this.owners).length} owner types, created ${this.all_agents.length} total agents.`);
    }
}
this.institution = institution;
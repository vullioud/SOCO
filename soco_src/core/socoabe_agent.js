/**
 * =================================================================================
 * FILE: socoabe_agent.js
 * TYPE: Core Class (Cognitive Actor)
 * LOCATION: soco_src/core/
 * =================================================================================
 * DESCRIPTION:
 * The cognitive "brain" of a forest manager. It holds the state of its managed
 * stands and executes the perception-cognition-action cycle annually.
 *
 * VERTICAL INTEGRATION:
 * [Level 4] - Created by `owner`.
 *           - Links 1-to-1 with an iLand ABE agent "body".
 *           - Creates and holds many `stand_data` objects.
 *
 * HORIZONTAL INTEGRATION (Pipeline):
 * [Executor] - `run_yearly_cycle(year)` is the main loop that calls:
 *              Observe -> Check -> Plan -> Act.
 * =================================================================================
 */

class socoabe_agent {
    constructor(agent_id, owner, stand_ids) {
        this.id = agent_id;
        this.owner = owner;
        this.managed_stand_ids = stand_ids;
        this.managed_stands_data = {};
        this.configs = {
            traits: this.owner.get_config_for_owner('traits'),
            activities: this.owner.get_config_for_owner('activities'),
            parameters: this.owner.get_config_for_owner('parameters', false),
            species: this.owner.get_config_for_owner('species'),
            plenter_profiles: this.owner.get_config_for_owner('plenter_profiles', false),
            targetDBH_profiles: this.owner.get_config_for_owner('targetDBH_profiles', false)
        };
        this.preferences = {};
        this.resources = 0;
        this.risk_tolerance = 0;
        this.init();
    }

    init() {
        this.sample_my_traits();
        this.initialize_managed_stands();
        console.log(`Agent '${this.id}' initialized, managing ${Object.keys(this.managed_stands_data).length} stands.`);
    }

    sample_my_traits() {
        const trait_configs = this.configs.traits;
        if (!trait_configs) throw new Error(`Agent '${this.id}' has no trait configs for owner '${this.owner.type}'.`);
        if (trait_configs.preferences) this.preferences = Distributions.sample(trait_configs.preferences);
        if (trait_configs.resources) this.resources = Distributions.sample(trait_configs.resources);
        if (trait_configs.riskTolerance) this.risk_tolerance = Distributions.sample(trait_configs.riskTolerance);
    }

    initialize_managed_stands() {
        this.managed_stand_ids.forEach(id => {
            const stand_preference_focus = Distributions.weighted_random_choice(this.preferences);
            const new_stand_data = new stand_data(id, this.id, stand_preference_focus);
            this.managed_stands_data[id] = new_stand_data;
        });
    }

    observe() {
    for (const stand_id of this.managed_stand_ids) {
        let stand_data_obj = this.managed_stands_data[stand_id];
        // Pass the institution object, which the agent can access via its owner
        this.managed_stands_data[stand_id] = Perception.observe_stand(stand_data_obj, this.owner.institution);
    }
}

    /**
     * The agent's main annual cycle.
     * It first checks if a test is active. If not, it proceeds with normal logic.
     */
    
    run_yearly_cycle(current_year) {
        // --- 1. Check if a test scenario is active ---
    const test_was_run = Test_Runner.run(this, current_year);
    if (test_was_run) {
        return; // If a test was run, skip the normal agent logic.
    }

    this.observe();
    }
}
this.socoabe_agent = socoabe_agent;
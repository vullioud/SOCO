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
        
        // THE FIX: Use a plain JavaScript Object, not a Map.
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
            
            // THE FIX: Use standard object property assignment.
            this.managed_stands_data[id] = new_stand_data;
        });
    }
    run_yearly_cycle(current_year) {
    // --- PUPPET MASTER TEST V2 ---

    const first_stand_id = this.managed_stand_ids[0];
    if (!first_stand_id) return; // Skip if this agent has no stands

    const stand_data_obj = this.managed_stands_data[first_stand_id];

    // Test 1: On year 5, order a clearcut.
    if (current_year === 5) {
        console.log(`PUPPET MASTER [${this.id}]: Ordering stand ${first_stand_id} to perform a 'clearcut'.`);
        stand_data_obj.activity.chosen_Activity = 'clearcut';
        stand_data_obj.activity.parameters = { rotation_age: 85 };
        Action.set_flags_for_execution(stand_data_obj);
    }

    // Test 2: On year 6, check if the last activity was a clearcut and, if so, reset to noManagement.
    // This simulates the agent reacting to the completed task.
    if (current_year === 6) {
        fmengine.standId = first_stand_id;
        if (stand && stand.flag('abe_last_activity') === 'MegaSTP_Clearcut') {
            console.log(`PUPPET MASTER [${this.id}]: Acknowledging clearcut on stand ${first_stand_id}. Resetting plan.`);
            stand_data_obj.activity.chosen_Activity = 'noManagement';
            stand_data_obj.activity.parameters = {};
            Action.set_flags_for_execution(stand_data_obj);
             }
        }
    }
}
this.socoabe_agent = socoabe_agent;
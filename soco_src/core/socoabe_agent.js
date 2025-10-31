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

        // --- THE DEFINITIVE, EXPLICIT STRUCTURE ---
        // The agent creates its own deep copy of each configuration table.
        // This guarantees independence and prepares for future learning.
        this.trait_table = helpers.deepCopy(this.owner.trait_table);
        this.activity_table = helpers.deepCopy(this.owner.activity_table);
        this.species_config_table = helpers.deepCopy(this.owner.species_config_table);
        this.age_class_table = helpers.deepCopy(this.owner.age_class_table);
        this.parameter_table = helpers.deepCopy(this.owner.parameter_table);
        this.plenter_profiles_table = helpers.deepCopy(this.owner.plenter_profiles_table);
        this.targetDBH_profiles_table = helpers.deepCopy(this.owner.targetDBH_profiles_table);
        this.species_list_table = helpers.deepCopy(this.owner.species_list_table);

        // Agent-specific properties (sampled once at initialization)
        this.preferences = {};
        this.resources = 0;
        this.risk_tolerance = 0;
        
        this.init();
    }

    init() {
        this.sample_my_traits(); // This now uses this.trait_table
        this.initialize_managed_stands();
        console.log(`Agent '${this.id}' initialized, managing ${Object.keys(this.managed_stands_data).length} stands.`);
    }

    sample_my_traits() {
        const trait_configs = this.trait_table;
        
        if (!trait_configs) throw new Error(`Agent '${this.id}' has no trait_table.`);
        if (trait_configs.preferences) {
            this.preferences = Distributions.sample(trait_configs.preferences);
        }
        if (trait_configs.resources) {
            this.resources = Distributions.sample(trait_configs.resources);
        }
        if (trait_configs.riskTolerance) {
            this.risk_tolerance = Distributions.sample(trait_configs.riskTolerance);
        }
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
    // --- 1. Check if an active test scenario should run for THIS agent ---
    // The Test_Runner will execute the test and return 'true' if it did.
    const test_was_run = Test_Runner.run_for_agent(this, current_year);
    
    // If the Test_Runner ran a scenario, the agent's job for this year is done.
    if (test_was_run) {
        return;
    }

    // --- 2. Normal Agent Logic (runs ONLY if no test was active) ---
    // This is the code you want to see running when SoCoABE_CONFIG.TESTING.active_scenario = 'none'

    // [Observe]
    this.observe();

    // [Check & Plan & Act]
    for (const stand_id in this.managed_stands_data) {
        let stand_data_obj = this.managed_stands_data[stand_id];

        const needs_new_plan = Cognition.check_need(stand_data_obj, current_year);
        if (needs_new_plan) {
            stand_data_obj = Cognition.plan(stand_data_obj, this);
        }

        const is_actionable_this_year = (stand_data_obj.activity.is_actionable && 
                                         stand_data_obj.activity.target_year === current_year);
        if (is_actionable_this_year) {
            Action.set_flags_for_execution(stand_data_obj);
           }
        }
    }
};

this.socoabe_agent = socoabe_agent;
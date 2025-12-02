// FILE: soco_src/core/socoabe_agent.js (MODIFIED)

class socoabe_agent {
    constructor(agent_id, owner, stand_ids) {
        this.id = agent_id;
        this.owner = owner;
        this.managed_stand_ids = stand_ids;
        this.managed_stands_data = {};
        this.trait_table = helpers.deepCopy(this.owner.trait_table);
        this.activity_table = helpers.deepCopy(this.owner.activity_table);
        this.species_config_table = helpers.deepCopy(this.owner.species_config_table);
        this.age_class_table = helpers.deepCopy(this.owner.age_class_table);
        this.parameter_table = helpers.deepCopy(this.owner.parameter_table);
        this.plenter_profiles_table = helpers.deepCopy(this.owner.plenter_profiles_table);
        this.targetDBH_profiles_table = helpers.deepCopy(this.owner.targetDBH_profiles_table);
        this.species_profile_per_activity_table = helpers.deepCopy(this.owner.species_profile_per_activity_table);
        this.preferences = {};
        this.resources = 0;
        this.risk_tolerance = 0;
        this.planning_offset = Math.floor(Math.random() * 10) + 5;
        this.is_initialized = false;
        this.init();
    }

    init() {
        this.sample_my_traits();
        this.initialize_managed_stands();
    }

    sample_my_traits() {
        const trait_configs = this.trait_table;
        if (!trait_configs) throw new Error(`Agent '${this.id}' has no trait_table.`);
        if (trait_configs.preferences) this.preferences = Distributions.sample(trait_configs.preferences);
        if (trait_configs.resources) this.resources = Distributions.sample(trait_configs.resources);
        if (trait_configs.riskTolerance) this.risk_tolerance = Distributions.sample(trait_configs.riskTolerance);
    }

   initialize_managed_stands() {
        this.managed_stand_ids.forEach(id => {
            const stand_data_obj = new stand_data(id, this);
            stand_data_obj.preference_focus = Distributions.weighted_random_choice(this.preferences);
            this.managed_stands_data[id] = stand_data_obj;
        });
    }

    assign_species_profiles() {
        console.log(`[AGENT DEBUG] Agent ${this.id}: Assigning species profiles...`);
        for (const stand_id in this.managed_stands_data) {
            const stand_data_obj = this.managed_stands_data[stand_id];
            if (stand_data_obj.species_profile === "none") {
                const dominance = stand_data_obj.classified.species_dominance;
                const preference = stand_data_obj.preference_focus;
                console.log(`[AGENT DEBUG] Stand ${stand_id}: Looking up with pref='${preference}', dom='${dominance}'`);
                const species_dist_config = this.species_config_table?.[preference]?.[dominance];
                if (species_dist_config) {
                    console.log(`[AGENT DEBUG] Stand ${stand_id}: Found distribution config. Sampling...`);
                    const profile_weights = Distributions.sample(species_dist_config);
                    stand_data_obj.species_profile = Distributions.weighted_random_choice(profile_weights);
                } else {
                    console.warn(`[AGENT DEBUG] Stand ${stand_id}: No species distribution found.`);
                    stand_data_obj.species_profile = "default";
                }
            }
        }
    }

    act(scheduled_stands) {
        for (var i = 0; i < scheduled_stands.length; i++) {
            var stand_data_obj = scheduled_stands[i];
            if (stand_data_obj.activity.target_year === Globals.year) {
                Action.trigger_activity(stand_data_obj);
            }
        }
    }

    observe() {
        for (const stand_id of this.managed_stand_ids) {
            this.managed_stands_data[stand_id] = Perception.observe_stand(this.managed_stands_data[stand_id], this);
        }
    }

    cognitize(current_year) {
        const actionable_stands = [];
        for (const stand_id in this.managed_stands_data) {
            // Run the entire cognitive pipeline for the stand.
            let stand_data_obj = this.managed_stands_data[stand_id];
            stand_data_obj = Cognition.think(stand_data_obj, this);
            
            // Store the updated state back into the agent's memory.
            this.managed_stands_data[stand_id] = stand_data_obj;

            // Check if the resulting plan is actionable for the current year.
            if (stand_data_obj.activity.is_actionable && stand_data_obj.activity.target_year === current_year) {
                actionable_stands.push(stand_data_obj);
            }
        }
        return actionable_stands;
    }

    // ======================== CORE LOGIC CHANGE ========================
    // The run_yearly_cycle is now the single orchestrator for the agent.
    run_yearly_cycle(current_year) {

        // Allow test scenarios to override the cycle.
        const test_overrode_cycle = Test_Runner.run_for_agent(this, current_year);
        if (test_overrode_cycle) {
            return;
        }

        this.observe();
        
        if (current_year === 1) {
            this.assign_species_profiles();
        }
        
        const actionable_stands = this.cognitize(current_year);

        if (actionable_stands.length > 0) {
            this.act(actionable_stands);
        }

        // --- NEW MONITORING CALL ---
        // Snapshot every stand managed by this agent at the end of the turn
        for (const stand_id in this.managed_stands_data) {
            Monitoring.snapshot(this, this.managed_stands_data[stand_id]);
        }
    }
};
this.socoabe_agent = socoabe_agent;
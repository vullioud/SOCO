// FILE: soco_src/core/socoabe_agent.js

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
        
        // --- DIAGNOSTIC ---
        // Add a log to verify that the agent is receiving the table from its owner.
        this.species_profile_per_activity_table = helpers.deepCopy(this.owner.species_profile_per_activity_table);
        if (this.species_profile_per_activity_table) {
            console.log(`    -> [DIAGNOSTIC] Agent '${this.id}': Successfully received 'species_profile_per_activity_table'.`);
        } else {
            console.error(`    -> [DIAGNOSTIC-ERROR] Agent '${this.id}': FAILED to receive 'species_profile_per_activity_table' from owner.`);
        }
        // --- END DIAGNOSTIC ---

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
        // This function takes the final, scheduled list of stands and
        // commits the actions by triggering the activities in iLand.
        for (var i = 0; i < scheduled_stands.length; i++) {
            var stand_data_obj = scheduled_stands[i];
            // Only act if the stand is scheduled for the *current* year.
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

    check(current_year) {
        const stands_needing_plan = [];
        for (const stand_id in this.managed_stands_data) {
            const stand_data_obj = this.managed_stands_data[stand_id];
            if (Cognition.check_need(stand_data_obj, current_year, this)) {
                stands_needing_plan.push(stand_data_obj);
            }
        }
        return stands_needing_plan;
    }
    
    plan(stands_to_plan) {
        const planned_stands = [];
        for (var i = 0; i < stands_to_plan.length; i++) {
            var stand_data_obj = stands_to_plan[i];
            var updated_stand_data = Cognition.create_stand_plan(stand_data_obj, this);
            this.managed_stands_data[updated_stand_data.stand_id] = updated_stand_data;
            planned_stands.push(updated_stand_data);
        }
        return planned_stands;
    }

    run_yearly_cycle(current_year) {

        const test_overrode_cycle = Test_Runner.run_for_agent(this, current_year);
        if (test_overrode_cycle) {
            return;
        }

        this.observe();
        
        if (current_year === 1) {
            this.assign_species_profiles();
        }
        
        const stands_to_plan = this.check(current_year);

        if (stands_to_plan.length > 0) {
            this.plan(stands_to_plan);
        }
    }
};
this.socoabe_agent = socoabe_agent;
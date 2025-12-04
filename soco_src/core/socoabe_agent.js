// ----- Start of File: soco_src/core/socoabe_agent.js -----

class socoabe_agent {
    constructor(agent_id, owner, stand_ids) {
        // ... (standard properties) ...
        this.id = agent_id;
        this.owner = owner;
        this.managed_stand_ids = stand_ids;
        this.managed_stands_data = {};
        
        // Copy tables from owner
        this.trait_table = helpers.deepCopy(this.owner.trait_table);
        this.activity_table = helpers.deepCopy(this.owner.activity_table);
        this.species_config_table = helpers.deepCopy(this.owner.species_config_table);
        this.age_class_table = helpers.deepCopy(this.owner.age_class_table);
        this.parameter_table = helpers.deepCopy(this.owner.parameter_table);
        this.plenter_profiles_table = helpers.deepCopy(this.owner.plenter_profiles_table);
        this.targetDBH_profiles_table = helpers.deepCopy(this.owner.targetDBH_profiles_table);
        this.species_profile_per_activity_table = helpers.deepCopy(this.owner.species_profile_per_activity_table);
        
        // IMPORTANT: Copy the regime matrix
        this.regime_matrix = helpers.deepCopy(this.owner.regime_matrix);

        this.preferences = {};
        this.resources = 0;
        this.risk_tolerance = 0;
        this.planning_offset = Math.floor(Math.random() * 10) + 5;
        
        this.unit_data = new unit_data(this.id);
        this.unit_data.owner_type = this.owner.type; 
        this.action_log = []; 

        this.init();
    }

    init() {
        this.sample_my_traits();
        this.initialize_managed_stands();
    }

    sample_my_traits() {
        const trait_configs = this.trait_table;
        if (!trait_configs) return;
        if (trait_configs.preferences) this.preferences = Distributions.sample(trait_configs.preferences);
        if (trait_configs.resources) this.resources = Distributions.sample(trait_configs.resources);
        if (trait_configs.riskTolerance) this.risk_tolerance = Distributions.sample(trait_configs.riskTolerance);
    }

    initialize_managed_stands() {
        this.managed_stand_ids.forEach(id => {
            const stand_data_obj = new stand_data(id, this);
            stand_data_obj.preference_focus = Distributions.weighted_random_choice(this.preferences);
            // We DO NOT assign regimes here anymore. 
            // We leave them as "unassigned" so think2 handles the init logic.
            this.managed_stands_data[id] = stand_data_obj;
        });
    }

    // --- REMOVED assign_regimes() --- 
    // Logic moved to Cognition.assign_regime_and_index inside think2_logic.js

    act(scheduled_stands) {
        for (var i = 0; i < scheduled_stands.length; i++) {
            var stand_data_obj = scheduled_stands[i];
            if (stand_data_obj.activity.target_year === Globals.year) {
                Action.trigger_activity(stand_data_obj);
                // Log action
                this.action_log.push({
                    year: Globals.year,
                    stand_id: stand_data_obj.stand_id,
                    activity: stand_data_obj.activity.chosen_Activity,
                    regime: stand_data_obj.regime.name
                });
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
            let stand_data_obj = this.managed_stands_data[stand_id];
            
            // EXECUTE THINK2
            stand_data_obj = Cognition.think2(stand_data_obj, this);
            
            this.managed_stands_data[stand_id] = stand_data_obj;
            
            // Check if actionable for THIS year
            if (stand_data_obj.activity.is_actionable && stand_data_obj.activity.target_year === current_year) {
                actionable_stands.push(stand_data_obj);
            }
        }
        return actionable_stands;
    }

    run_yearly_cycle(current_year) {
        const test_overrode_cycle = Test_Runner.run_for_agent(this, current_year);
        if (test_overrode_cycle) return;

        this.observe();
        Perception.aggregate_unit(this);
        Monitoring.snapshot_unit(this.unit_data, current_year);
        
        const actionable_stands = this.cognitize(current_year);

        if (actionable_stands.length > 0) {
            this.act(actionable_stands);
        }

        for (const stand_id in this.managed_stands_data) {
            Monitoring.snapshot(this, this.managed_stands_data[stand_id]);
        }
    }
};
this.socoabe_agent = socoabe_agent;

// ----- End of File: soco_src/core/socoabe_agent.js -----
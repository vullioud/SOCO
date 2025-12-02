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
        this.species_profile_per_activity_table = helpers.deepCopy(this.owner.species_profile_per_activity_table);
        
        this.regime_matrix = helpers.deepCopy(this.owner.regime_matrix);

        this.preferences = {};
        this.resources = 0;
        this.risk_tolerance = 0;
        this.planning_offset = Math.floor(Math.random() * 10) + 5;
        this.is_initialized = false;

        this.unit_data = new unit_data(this.id);
        this.action_log = []; 

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
                const species_dist_config = this.species_config_table?.[preference]?.[dominance];
                if (species_dist_config) {
                    const profile_weights = Distributions.sample(species_dist_config);
                    stand_data_obj.species_profile = Distributions.weighted_random_choice(profile_weights);
                } else {
                    stand_data_obj.species_profile = "default";
                }
            }
        }
    }

    // --- ASSIGN REGIME ---
    assign_regimes() {
        console.log(`[AGENT DEBUG] Agent ${this.id}: Assigning Regimes...`);
        
        for (const stand_id in this.managed_stands_data) {
            let s = this.managed_stands_data[stand_id];
            const pref = s.preference_focus;
            
            // SAFE CLASSIFICATION LOOKUP
            // If unknown (e.g. Year 1), default to 'low' structure and 'mixed' species
            // This ensures we always get a valid regime
            let struct = s.classified.structure_class;
            if (!struct || struct === 'unknown') struct = "low";

            let spec = s.classified.species_dominance;
            if (!spec || spec === 'unknown') spec = "mixed";

            // Matrix Lookup
            let assigned = null;
            if (this.regime_matrix &&
                this.regime_matrix[pref] && 
                this.regime_matrix[pref][struct] && 
                this.regime_matrix[pref][struct][spec]) {
                
                assigned = this.regime_matrix[pref][struct][spec];
            }

            // Assignment
            if (assigned) {
                s.regime.name = assigned.name;
                s.regime.activities = assigned.activities;
            } else {
                console.warn(`[AGENT WARN] No regime found for ${pref}/${struct}/${spec}. Using fallback.`);
                s.regime.name = "Fallback_NoMgmt";
                s.regime.activities = {};
            }
        }
    }

    act(scheduled_stands) {
        for (var i = 0; i < scheduled_stands.length; i++) {
            var stand_data_obj = scheduled_stands[i];
            if (stand_data_obj.activity.target_year === Globals.year) {
                Action.trigger_activity(stand_data_obj);
                this.action_log.push({
                    year: Globals.year,
                    stand_id: stand_data_obj.stand_id,
                    activity: stand_data_obj.activity.chosen_Activity,
                    activity_class: stand_data_obj.classified.activity_class,
                    preference: stand_data_obj.preference_focus,
                    parameters: helpers.deepCopy(stand_data_obj.activity.parameters)
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
            stand_data_obj = Cognition.think(stand_data_obj, this);
            this.managed_stands_data[stand_id] = stand_data_obj;
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
        
        // Init Phase (Year 1)
        if (current_year === 1) {
            this.assign_species_profiles();
            this.assign_regimes(); 
        }

        Perception.aggregate_unit(this);

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
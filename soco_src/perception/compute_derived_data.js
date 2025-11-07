// ----- Start of File: soco_src/perception/compute_classified_data.js -----

Perception.compute_derived_data = function(stand_data_obj, agent) {
    
    // --- 1. CALCULATE HISTORY-DEPENDENT METRICS ---
    const data = stand_data_obj.iLand_stand_data;
    const history = stand_data_obj.history;

    // A. Calculate time_since_last_activity
    if (history.last_activity_Year !== -1) {
        history.time_since_last_activity = Globals.year - history.last_activity_Year;
    } else {
        history.time_since_last_activity = -1;
    }

    // B. Calculate agent_managed_age (absolute_age_soco)
    const is_final_harvest = (history.last_activity === 'MegaSTP_Clearcut' || history.last_activity === 'Universal_Salvage');
    
    if (data.absolute_age_soco === 0 && Globals.year > 1) {
        data.absolute_age_soco = Math.floor(data.stand_age);
    } else if (is_final_harvest && history.last_activity_Year === (Globals.year - 1)) {
        data.absolute_age_soco = 0;
    } else if (Globals.year > 1) {
        data.absolute_age_soco += 1;
    }

    // --- 2. AGE CLASS Classification ---
    const age_class_lookup = agent.age_class_table;
    if (!age_class_lookup || age_class_lookup.length === 0) {
        throw new Error(`Agent '${agent.id}' is missing or has an empty 'age_class_table'.`);
    }
    
    // --- THIS IS THE FIX ---
    // Use `stand_age` for classification, as explicitly directed.
    const age = Math.floor(data.stand_age);
    
    let age_row = null;
    for (let i = 0; i < age_class_lookup.length; i++) {
        if (age_class_lookup[i].age === age) {
            age_row = age_class_lookup[i];
            break;
        }
    }

    if (age_row) {
        const weights = {
            "Planting": age_row.Planting, "Tending": age_row.Tending,
            "Thinning": age_row.Thinning, "Harvesting": age_row.Harvesting
        };
        stand_data_obj.classified.age_class = Distributions.weighted_random_choice(weights);
    } else {
        const max_age_in_table = age_class_lookup[age_class_lookup.length - 1].age;
        if (age > max_age_in_table) {
            stand_data_obj.classified.age_class = 'Harvesting';
        } else {
            stand_data_obj.classified.age_class = 'Planting';
        }
    }

    // --- 3. STRUCTURE and SPECIES Classification (remains the same) ---
    fmengine.standId = stand_data_obj.stand_id;
    if (stand && stand.id > 0) {
        stand.trees.loadAll();
        const dbh_values = [];
        for (let i = 0; i < stand.trees.count; i++) {
            dbh_values.push(stand.trees.tree(i).dbh);
        }
        const dbh_std_dev = helpers.calculate_std_dev(dbh_values);
        if (dbh_std_dev < 8) stand_data_obj.classified.structure_class = 'low';
        else if (dbh_std_dev < 15) stand_data_obj.classified.structure_class = 'medium';
        else stand_data_obj.classified.structure_class = 'high';

        const conifer_species = ['piab', 'pisy', 'abal', 'lade', 'psme', 'pini'];  
        let conifer_ba = 0;  
        const total_ba = stand.basalArea;  
        if (total_ba === 0) {  
            stand_data_obj.classified.species_dominance = 'mixed';  
        } else {  
            for (let i = 0; i < stand.nspecies; i++) {  
                if (conifer_species.includes(stand.speciesId(i))) {  
                    conifer_ba += stand.speciesBasalArea(i);  
                }  
            }  
            const conifer_ratio = total_ba > 0 ? conifer_ba / total_ba : 0;  
            if (conifer_ratio > 0.7) stand_data_obj.classified.species_dominance = 'conifer';  
            else if (conifer_ratio < 0.3) stand_data_obj.classified.species_dominance = 'broadleaf';  
            else stand_data_obj.classified.species_dominance = 'mixed';  
        }  
    } else {
        stand_data_obj.classified.structure_class = 'low';
        stand_data_obj.classified.species_dominance = 'mixed';
    }

    return stand_data_obj;
};


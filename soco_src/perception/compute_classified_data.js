Perception.compute_classified_data = function(stand_data_obj, agent) {
    console.log(`    [OBSERVE-STEP] compute_classified_data for stand ${stand_data_obj.stand_id}`);
    
    // Use the agent's own age_class_table.
    const age_class_lookup = agent.age_class_table;
    if (!age_class_lookup) {
        throw new Error(`Agent '${agent.id}' is missing its 'age_class_table'.`);
    }

    const raw_data = stand_data_obj.iLand_stand_data;
    const age = Math.floor(raw_data.stand_age);
    
    let age_row = null;
    for (let i = 0; i < age_class_lookup.length; i++) {
        if (age_class_lookup[i].age == age) {
            age_row = age_class_lookup[i];
            break;
        }
    }

    if (age_row) {
        const weights = {
            "Planting": age_row.Planting,
            "Tending": age_row.Tending,
            "Thinning": age_row.Thinning,
            "Harvesting": age_row.Harvesting
        };
        stand_data_obj.classified.age_class = Distributions.weighted_random_choice(weights);
    } else {
     
        if (age > age_class_lookup[age_class_lookup.length - 1].age) {
            stand_data_obj.classified.age_class = 'Harvesting';
            console.log(`      -> Stand age ${age} is > max table age. Defaulting to 'Harvesting'.`);
        } else {
            // Handle other cases, like ages below the minimum.
            stand_data_obj.classified.age_class = 'Planting'; // A safe default for very young stands
            console.warn(`      -> Stand age ${age} not found in table. Defaulting to 'Planting'.`);
        }
    }

    // --- 2. DBH Standard Deviation Calculation ---
    fmengine.standId = stand_data_obj.stand_id;
    if (stand && stand.id > 0) {
        stand.trees.loadAll();
        const dbh_values = [];
        for (let i = 0; i < stand.trees.count; i++) {
            dbh_values.push(stand.trees.tree(i).dbh);
        }
        raw_data.dbh_std_dev = helpers.calculate_std_dev(dbh_values);
    } else {
        raw_data.dbh_std_dev = 0;
    }

    // --- 3. Structure Class Classification ---
    const dbh_std_dev = raw_data.dbh_std_dev;
    if (dbh_std_dev < 8) {
        stand_data_obj.classified.structure_class = 'low';
    } else if (dbh_std_dev < 15) {
        stand_data_obj.classified.structure_class = 'medium';
    } else {
        stand_data_obj.classified.structure_class = 'high';
    }

    // --- 4. Species Dominance Classification ---
    if (stand && stand.id > 0) {  
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
            const conifer_ratio = conifer_ba / total_ba;  
            if (conifer_ratio > 0.7) {  
                stand_data_obj.classified.species_dominance = 'conifer';  
            } else if (conifer_ratio < 0.3) {  
                stand_data_obj.classified.species_dominance = 'broadleaf';  
            } else {  
                stand_data_obj.classified.species_dominance = 'mixed';  
            }  
        }  
    }
    return stand_data_obj;
};
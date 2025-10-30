Perception.compute_classified_data = function(stand_data_obj, institution) {
    const raw_data = stand_data_obj.iLand_stand_data;
    const age_class_lookup = institution.age_class_lookup; // This is your probability table

    // --- 1. Age Class Classification (Probabilistic) ---
    const age = Math.floor(raw_data.absolute_age);
    const age_row = age_class_lookup.find(row => row.age === age);
    if (age_row) {
        const weights = {
            "planting": age_row.Planting,
            "tending": age_row.Tending,
            "thinning": age_row.Thinning,
            "harvesting": age_row.Harvesting
        };
        stand_data_obj.classified.age_class = Distributions.weighted_random_choice(weights);
    } else {
        stand_data_obj.classified.age_class = 'harvesting'; // Default for very old stands
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

    // --- 4. Species Dominance Classification (Robust Method) ---
    if (stand && stand.id > 0) {
        let conifer_ba = 0;
        const total_ba = stand.basalArea;

        if (total_ba === 0) {
            stand_data_obj.classified.species_dominance = 'mixed';
        } else {
            for (let i = 0; i < stand.nspecies; i++) {
                // This uses the iLand API to check if a species is a conifer, avoiding hardcoded lists.
                if (stand.species(i).isConifer) {
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
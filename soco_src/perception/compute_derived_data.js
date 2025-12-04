// ----- Start of File: soco_src/perception/compute_derived_data.js -----

Perception.compute_derived_data = function(stand_data_obj, agent) {
    const data = stand_data_obj.iLand_stand_data; // <--- Accessing raw data here
    const history = stand_data_obj.history;
    const classified = stand_data_obj.classified;
    
    if (history.last_activity_Year !== -1) {
        history.time_since_last_activity = Globals.year - history.last_activity_Year;
    } else {
        history.time_since_last_activity = -1;
    }
    const is_final_harvest = (history.last_activity === 'MegaSTP_Clearcut' || 
                              history.last_activity === 'MegaSTP_Shelterwood_Final'  ||
                              history.last_activity === 'MegaSTP_femelProgram_Final');
    
    if (data.absolute_age_soco === 0 && Globals.year > 1) {
        data.absolute_age_soco = Math.floor(data.stand_age);
    } else if (is_final_harvest && history.last_activity_Year === (Globals.year - 1)) {
        data.absolute_age_soco = 0;
    } else if (Globals.year > 1) {
        data.absolute_age_soco += 1;
    }

    fmengine.standId = stand_data_obj.stand_id;
    stand.trees.loadAll(); 

    // --- 2. ACTIVITY CLASS ---
    
    // A. DOMINANCE
    var species_vector = [];
    var leading_species_id = "none";
    var max_share = 0;
    var total_ba = stand.basalArea;

    if (total_ba > 0) {
        for (var i = 0; i < stand.nspecies; i++) {
            var sp_id = stand.speciesId(i);
            var share = stand.speciesBasalArea(i) / total_ba;
            species_vector.push({ id: sp_id, share: share });
            if (share > max_share) { max_share = share; leading_species_id = sp_id; }
        }
    }
    classified.dominant_species = species_vector; 
    
    // B. DOMINANT TOP HEIGHT
    // Removed redundant assignment. We use data.top_height directly below.

    // C. PHASE
    var thresholds = [2, 13, 28]; 
    if (max_share > 0.70 && leading_species_id !== "none") {
        if (['piab', 'abal'].indexOf(leading_species_id) > -1) thresholds = [2, 13, 28];  
        else if (['fasy', 'quro'].indexOf(leading_species_id) > -1) thresholds = [2, 16, 30]; 
    } 

    // Use iLand data directly
    var dom_h = data.top_height; 

    var activity_phase = "Planting"; 
    if (dom_h < thresholds[0]) activity_phase = "Planting";
    else if (dom_h >= thresholds[0] && dom_h < thresholds[1]) activity_phase = "Tending";
    else if (dom_h >= thresholds[1] && dom_h < thresholds[2]) activity_phase = "Thinning";
    else activity_phase = "Harvesting";
    
    classified.activity_class = activity_phase;
    classified.age_class = classified.activity_class; // unified age class and activity class

    
    // --- 3. STRUCTURE CLASSIFICATION (VERTICAL LAYERING) ---
    var ba_lower = 0, ba_middle = 0, ba_upper = 0;
    var limit_low = dom_h * 0.33;
    var limit_high = dom_h * 0.66;
    
    var count = stand.trees.count;
    for(var i = 0; i < count; i++) {
        var t = stand.trees.tree(i);
        var ba = t.basalArea;
        if (t.height < limit_low) ba_lower += ba;
        else if (t.height < limit_high) ba_middle += ba;
        else ba_upper += ba;
    }
    
    var layers = 0;
    var threshold_share = 0.10; 
    
    if (total_ba > 0) {
        if ((ba_lower / total_ba) > threshold_share) layers++;
        if ((ba_middle / total_ba) > threshold_share) layers++;
        if ((ba_upper / total_ba) > threshold_share) layers++;
    }

    if (layers <= 1) classified.structure_class = 'low';
    else if (layers === 2) classified.structure_class = 'medium';
    else classified.structure_class = 'high';

    // --- 4. SPECIES DOMINANCE ---
    var conifers = ['piab', 'pisy', 'abal', 'psme', 'lade', 'pini', 'larix'];
    if (leading_species_id === "none") classified.species_dominance = 'mixed';
    else {
        if (conifers.indexOf(leading_species_id) > -1) classified.species_dominance = 'conifer';
        else classified.species_dominance = 'broadleaf';
        if (max_share < 0.70) classified.species_dominance = 'mixed';
    }

    return stand_data_obj;
};


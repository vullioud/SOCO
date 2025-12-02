/**
 * =================================================================================
 * FILE: compute_derived_data.js
 * =================================================================================
 * DESCRIPTION:
 * Derives socio-ecological metrics using three independent pipelines.
 * 
 * 1. Legacy Age Pipeline: Maps Age -> age_class (from JSON).
 * 2. WET Activity Pipeline: Maps Dominant Species + Dom Height -> activity_class.
 *    - Uses 70% threshold for strict dominance rules.
 *    - Uses general thresholds for mixed/undefined stands.
 * 3. Structure Pipeline: Maps Heterogeneity -> structure_class.
 *    - Calculates Score (0-1) based on Delta DBH, Delta Height, Species Count.
 *    - Bins: 0-0.33 (Low), 0.33-0.66 (Medium), >0.66 (High).
 * 
 * EXPORTS:
 * - classified.age_class
 * - classified.activity_class
 * - classified.structure_class
 * - classified.dom_top_height
 * - classified.dominant_species (Vector of {id, share})
 * - classified.species_dominance (Legacy Conifer/Broadleaf/Mixed)
 * =================================================================================
 */

Perception.compute_derived_data = function(stand_data_obj, agent) {
    
    const data = stand_data_obj.iLand_stand_data;
    const history = stand_data_obj.history;
    const classified = stand_data_obj.classified;

    // --- 0. PRE-PROCESSING (History & Soco Age) ---
    if (history.last_activity_Year !== -1) {
        history.time_since_last_activity = Globals.year - history.last_activity_Year;
    } else {
        history.time_since_last_activity = -1;
    }
    
    const is_final_harvest = (history.last_activity === 'MegaSTP_Clearcut' || 
                              history.last_activity === 'MegaSTP_Shelterwood_Final');
    
    if (data.absolute_age_soco === 0 && Globals.year > 1) {
        data.absolute_age_soco = Math.floor(data.stand_age);
    } else if (is_final_harvest && history.last_activity_Year === (Globals.year - 1)) {
        data.absolute_age_soco = 0;
    } else if (Globals.year > 1) {
        data.absolute_age_soco += 1;
    }

    // Set context
    fmengine.standId = stand_data_obj.stand_id;
    stand.trees.loadAll(); 

    // =========================================================
    // --- 1. PIPELINE A: AGE CLASS (LEGACY) ---
    // =========================================================
    var age_class_result = "Harvesting"; 

    if (agent && agent.age_class_table) {
        var soco_age = data.absolute_age_soco;
        for (var cls in agent.age_class_table) {
            if (agent.age_class_table.hasOwnProperty(cls)) {
                var range = agent.age_class_table[cls]; 
                if (soco_age >= range[0] && soco_age <= range[1]) {
                    age_class_result = cls;
                    break;
                }
            }
        }
    }
    classified.age_class = age_class_result;


    // =========================================================
    // --- 2. PIPELINE B: ACTIVITY CLASS (WET / HEIGHT) ---
    // =========================================================
    
    // --- 2a. Analyze Composition ---
    var species_vector = [];
    var leading_species_id = "none";
    var max_share = 0;
    var total_ba = stand.basalArea;

    if (total_ba > 0) {
        for (var i = 0; i < stand.nspecies; i++) {
            var sp_id = stand.speciesId(i);
            var sp_ba = stand.speciesBasalArea(i);
            var share = sp_ba / total_ba;
            
            species_vector.push({ id: sp_id, share: share });

            if (share > max_share) {
                max_share = share;
                leading_species_id = sp_id;
            }
        }
    }
    // Export vector as requested
    classified.dominant_species = species_vector; 

    // --- 2b. Compute Dominant Top Height (h100) ---
    var dom_h = 0;
    if (leading_species_id !== "none") {
        stand.trees.load("species=" + leading_species_id);
        if (stand.trees.count > 0) {
            stand.trees.sort("-dbh"); 
            var target_count = 100 * stand.area; 
            stand.trees.filter("incsum(1) <= " + target_count); 
            dom_h = stand.trees.mean("height");
        }
        stand.trees.loadAll(); // Reset list
    }
    classified.dom_top_height = dom_h;

    // --- 2c. Select Thresholds & Determine Phase ---
    // Thresholds: [Start_Tending, Start_Thinning, Start_Harvesting]
     var thresholds = [2, 10, 23]; 

    // Apply 70% Dominance Rule
    if (max_share > 0.70 && leading_species_id !== "none") {
        // Group 1: Tall Conifers (Spruce, Fir, Douglas Fir, Larch)
        if (['piab', 'abal', 'psme', 'lade', 'larix'].indexOf(leading_species_id) > -1) {
              thresholds = [2, 12, 25];  
        }
        // Group 2: Light Demanding (Pine, Oak)
        else if (['pisy', 'pini', 'quro', 'qupe'].indexOf(leading_species_id) > -1) {
             thresholds = [2, 12, 24];
        }
        // Group 3: Shade Tolerant Broadleaves (Beech)
        else if (['fasy', 'acps', 'acer'].indexOf(leading_species_id) > -1) {
           thresholds = [2, 10, 23]; 
        }
    } 
    // Else: Keep General Thresholds [2, 12, 28] for mixed/low-dominance stands

    var activity_phase = "Planting"; 

    if (leading_species_id === "none" || dom_h < thresholds[0]) {
        activity_phase = "Planting";
    } else if (dom_h >= thresholds[0] && dom_h < thresholds[1]) {
        activity_phase = "Tending";
    } else if (dom_h >= thresholds[1] && dom_h < thresholds[2]) {
        activity_phase = "Thinning";
    } else {
        activity_phase = "Harvesting";
    }

    classified.activity_class = activity_phase;


    // =========================================================
    // --- 3. PIPELINE C: STRUCTURE CLASSIFICATION ---
    // =========================================================
    
    // --- 3a. Calculate Raw Metrics (Deltas) ---
    var sd_dbh = 0;
    var sd_h = 0;
    var count = stand.trees.count;

    if (count > 5) {
        var sum_dbh = 0, sum_h = 0;
        
        // First Pass: Mean
        for(var i = 0; i < count; i++) {
            var t = stand.trees.tree(i);
            sum_dbh += t.dbh;
            sum_h += t.height;
        }
        var mean_dbh = sum_dbh / count;
        var mean_h = sum_h / count;
        
        // Second Pass: Variance
        var sum_sq_dbh = 0, sum_sq_h = 0;
        for(var i = 0; i < count; i++) {
            var t = stand.trees.tree(i);
            sum_sq_dbh += Math.pow(t.dbh - mean_dbh, 2);
            sum_sq_h += Math.pow(t.height - mean_h, 2);
        }
        
        sd_dbh = Math.sqrt(sum_sq_dbh / count);
        sd_h = Math.sqrt(sum_sq_h / count);
    }

    // --- 3b. Normalize & Calculate Score (0-1) ---
    // Normalization constants (Max expected values)
    const MAX_SD_DBH = 40.0;  // cm
    const MAX_SD_H = 15.0;    // m
    const MAX_SP = 8.0;       // count

    // Weights (Sum = 1.0)
    const W_DBH = 0.2;
    const W_H = 0.3;
    const W_SP = 0.5;

    var n_sp = stand.nspecies;

    // Normalize inputs (clamp to 1.0)
    var norm_dbh = Math.min(sd_dbh / MAX_SD_DBH, 1.0);
    var norm_h = Math.min(sd_h / MAX_SD_H, 1.0);
    var norm_sp = Math.min(n_sp / MAX_SP, 1.0);

    var structure_score = (norm_dbh * W_DBH) + (norm_h * W_H) + (norm_sp * W_SP);

    // --- 3c. Classify (Equal Bins) ---
    if (structure_score < 0.33) {
        classified.structure_class = 'low';
    } else if (structure_score < 0.66) {
        classified.structure_class = 'medium';
    } else {
        classified.structure_class = 'high';
    }


    // =========================================================
    // --- 4. PIPELINE D: SPECIES DOMINANCE (LEGACY) ---
    // =========================================================
    var conifers = ['piab', 'pisy', 'abal', 'psme', 'lade', 'pini', 'larix'];
    
    if (leading_species_id === "none") {
        classified.species_dominance = 'mixed';
    } else {
        if (conifers.indexOf(leading_species_id) > -1) classified.species_dominance = 'conifer';
        else classified.species_dominance = 'broadleaf';
        
        // Use strict 70% threshold for Pure vs Mixed in Legacy logic too
        if (max_share < 0.70) classified.species_dominance = 'mixed';
    }

    return stand_data_obj;
};
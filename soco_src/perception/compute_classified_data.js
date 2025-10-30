// ===================================================================
// FILE: compute_classified_data.js
// ===================================================================

// Attaches the function to the globally available 'Perception' object.
Perception.compute_classified_data = function(stand_data_obj, institution) {
    const age = stand_data_obj.iLand_stand_data.absolute_age;
    const age_class_lookup = institution.age_class_lookup;
    
    if (age <= age_class_lookup.planting.max_age) {
        stand_data_obj.classified.age_class = 'planting';
    } else if (age <= age_class_lookup.tending.max_age) {
        stand_data_obj.classified.age_class = 'tending';
    } else if (age <= age_class_lookup.thinning.max_age) {
        stand_data_obj.classified.age_class = 'thinning';
    } else {
        stand_data_obj.classified.age_class = 'harvesting';
    }

    stand_data_obj.classified.structure_class = 'medium'; // Placeholder
    stand_data_obj.classified.species_dominance = 'mixed'; // Placeholder

    return stand_data_obj;
};
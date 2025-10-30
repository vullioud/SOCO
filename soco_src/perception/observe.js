// ===================================================================
// FILE: observe.js (Perception Module Main)
// ===================================================================
// This file defines the main Perception object and the high-level
// 'observe_stand' function that orchestrates the perception pipeline.

// 1. Create the global Perception object to act as a namespace.
var Perception = {};
this.Perception = Perception;

/**
 * Main entry point for the Perception module.
 * Updates a stand_data object with the latest information from iLand.
 * @param {stand_data} stand_data_obj - The stand_data object to be updated.
 * @param {institution} institution - The global institution object, needed for lookups.
 * @returns {stand_data} The updated stand_data object.
 */
Perception.observe_stand = function(stand_data_obj, institution) {
    // Run the pipeline of perception functions in order.
    stand_data_obj = Perception.get_raw_data(stand_data_obj);
    stand_data_obj = Perception.get_reassessment_flags(stand_data_obj);
    stand_data_obj = Perception.update_history(stand_data_obj);
    stand_data_obj = Perception.compute_classified_data(stand_data_obj, institution);
    
    return stand_data_obj;
};

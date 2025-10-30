// ===================================================================
// FILE: observe.js (Perception Module Main)
// ===================================================================
// This file defines the main Perception object and the high-level
// 'observe_stand' function that orchestrates the perception pipeline.

// 1. Create the global Perception object to act as a namespace.
var Perception = {};
this.Perception = Perception;

Perception.observe_stand = function(stand_data_obj, institution) {
    console.log(`  [OBSERVE] Running pipeline for stand ${stand_data_obj.stand_id}...`);

    try {
        stand_data_obj = Perception.get_raw_data(stand_data_obj);
        stand_data_obj = Perception.get_reassessment_flags(stand_data_obj);
        stand_data_obj = Perception.update_history(stand_data_obj);
        stand_data_obj = Perception.compute_classified_data(stand_data_obj, institution);
    } catch (e) {
        // This catch block is crucial. It will expose the silent error.
        console.error(`    [OBSERVE-ERROR] A critical error occurred during observation for stand ${stand_data_obj.stand_id}: ${e.message}`);
        console.error(`    Stack Trace: ${e.stack}`);
    }
    
    console.log(`  [OBSERVE] Pipeline finished for stand ${stand_data_obj.stand_id}.`);
    return stand_data_obj;
};

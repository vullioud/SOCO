// ===================================================================
// FILE: observe.js
// ===================================================================
// Include sub-modules (will be done in ABE_tiny_ex.js)

var Perception = {
    /**
     * Main entry point for the Perception module.
     * Updates a stand_data object with the latest information from iLand.
     */
    observe_stand: function(stand_data_obj) {
        // Run the pipeline of perception functions
        stand_data_obj = get_raw_data(stand_data_obj);
        // stand_data_obj = get_reassessment_flags(stand_data_obj); // Example for later
        // stand_data_obj = update_history(stand_data_obj);       // Example for later
        
        return stand_data_obj;
    }
};
this.Perception = Perception;
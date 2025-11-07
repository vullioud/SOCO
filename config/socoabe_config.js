/**
 * SoCoABE Central Configuration File
 * This file assembles the final configuration object from the globally
 * available variables that were loaded by `Globals.include` in the main script.
 */

// const { act } = require("react");

if (typeof SoCoABE_CONFIG === 'undefined') {
    var SoCoABE_CONFIG = {
        csv_path: "./abe/stand_files/agent_table_low_shuffled-true.csv", // Default path, can be overridden in the main script
        core_abe_agent_type: 'socoabe_controller', 
        warmupPeriod: 0,
        
        TESTING: {
       // active_scenario: "inspect_classification_step"  //     
       // active_scenario: "inspect_raw_data_step"  // 
       // active_scenario: "inspect_history_step"
       // active_scenario: 'none'  
       // active_scenario: "inspect_check_need_step"
       // active_scenario: "inspect_planning_trigger"
       // active_scenario: "inspect_initialization"
       // active_scenario: "inspect_full_initialization_flow"  
          active_scenario: "snapshot_stand_data"

    }
    };
}
this.SoCoABE_CONFIG = SoCoABE_CONFIG;

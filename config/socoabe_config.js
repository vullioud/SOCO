/**
 * SoCoABE Central Configuration File
 * This file assembles the final configuration object from the globally
 * available variables that were loaded by `Globals.include` in the main script.
 */

// const { act } = require("react");

if (typeof SoCoABE_CONFIG === 'undefined') {
    var SoCoABE_CONFIG = {
        csv_path: "./abe/stand_files/agent_table_high_shuffled-false.csv", // Default path, can be overridden in the main script
        core_abe_agent_type: 'socoabe_controller', 
        warmupPeriod: 0,

         MONITORING: {
            ENABLED: true,
            mode: "stratified", 
            sample_size: 50, 
            agg_interval: 5 // Interpretation depends on mode (Total count OR Count per Owner)
        },

        TESTING: {
       // active_scenario: "inspect_classification_step"  //     
       // active_scenario: "inspect_raw_data_step"  // 
       // active_scenario: "inspect_history_step"
       // active_scenario: 'none'  
       // active_scenario: "inspect_check_need_step"
       // active_scenario: "inspect_planning_trigger"
       // active_scenario: "inspect_initialization"
       // active_scenario: "inspect_full_initialization_flow"  
        //  active_scenario: "snapshot_stand_data"
       // active_scenario: 'inspect_sequence_progression'
       // activiy_scenario: 'inspect_signal_trigger_targetDBH'
     //  active_scenario: "inspect_selectiveThinning_flags"
        //  active_scenario: "inspect_selectiveThinning_execution"  
     // active_scenario: "verify_mark_and_remove"
       // active_scenario: 'verify_phased_removal'
    //   active_scenario: 'verify_thinningFromBelow_sequence'
    active_scenario: 'staggered_clearcut_by_owner'
    }
    };
}
this.SoCoABE_CONFIG = SoCoABE_CONFIG;
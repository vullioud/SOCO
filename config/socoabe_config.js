/**
 * SoCoABE Central Configuration File
 * This file assembles the final configuration object from the globally
 * available variables that were loaded by `Globals.include` in the main script.
 */

if (typeof SoCoABE_CONFIG === 'undefined') {
    var SoCoABE_CONFIG = {
        csv_path: "./abe/stand_files/agent_table_low_shuffled-true.csv", // Default path, can be overridden in the main script
        core_abe_agent_type: 'socoabe_controller', 
        warmupPeriod: 0,
        
        TESTING: {
        // SET THE ACTIVE TEST SCENARIO HERE.
        // 'none' or null      -> Run the normal agent logic.
        // 'puppet_master_v1'  -> Run the simple clearcut test.
        // 'observe_and_report'-> Run a test to validate the perception module.
        active_scenario: "perception_action_loop" // Options: 'none', 'puppet_master_v1', 'observe_and_report'

    }
    };
}

// Make the final config object available globally for other scripts to use.
this.SoCoABE_CONFIG = SoCoABE_CONFIG;

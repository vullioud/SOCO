// ----- START OF REFACTORED FILE: soco_src/test/test_runner.js -----

// ===================================================================
// FILE: test_runner.js
// ===================================================================
// This module acts as a dispatcher for test scenarios.
// The scenarios themselves are defined in other files and attached
// to the global 'Test_Scenarios' object.
// ===================================================================

// 1. Create the global namespace where all test scenarios will live.
var Test_Scenarios = {};
this.Test_Scenarios = Test_Scenarios;

var Test_Runner = {
    /**
     * Main entry point for the test harness.
     * Finds the active test scenario and executes it for the given agent.
     */
    run: function(agent, current_year) {
        const scenario_name = SoCoABE_CONFIG.TESTING.active_scenario;
        if (!scenario_name || scenario_name === 'none') {
            return false; // No test active.
        }

        // Look for the test function in our global namespace
        const test_function = Test_Scenarios[scenario_name];
        
        if (typeof test_function === 'function') {
            // Execute the test
            test_function(agent, current_year);
            return true; // A test was run.
        } else if (current_year === SoCoABE_CONFIG.warmupPeriod) {
            // Print a warning only once if the test is not found
            console.warn(`TEST RUNNER: Active scenario '${scenario_name}' not found in 'Test_Scenarios'.`);
        }
        
        return false;
    }
};
// Make the Test_Runner object globally available.
this.Test_Runner = Test_Runner;


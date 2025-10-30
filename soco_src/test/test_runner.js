// ===================================================================
// FILE: test_runner.js
// ===================================================================
// This module contains isolated test scenarios that can be "plugged in"
// to the agent's main loop to validate specific parts of the pipeline.
// ===================================================================

var Test_Runner = {
    /**
     * Main entry point for the test harness.
     * @param {socoabe_agent} agent - The agent instance to run the test on.
     * @param {number} current_year - The current simulation year.
     * @returns {boolean} Returns 'true' if a test was run, 'false' otherwise.
     */
    run: function(agent, current_year) {
        const scenario = SoCoABE_CONFIG.TESTING.active_scenario;
        if (!scenario || scenario === 'none') {
            return false; // No test active.
        }

        const test_function = this.scenarios[scenario];
        if (typeof test_function === 'function') {
            test_function(agent, current_year);
            return true; // A test was run.
        }
        return false;
    },

    // --- Namespace for all test scenarios ---
    scenarios: {
        /**
         * TEST 1: Puppet Master
         * Validates the Action layer (stand_data -> flags -> MegaSTP).
         */
        puppet_master_v1: function(agent, current_year) {
            // This test runs ONLY in year 5.
            if (current_year !== 5) return;

            // Get the first stand managed by this agent for the test.
            const first_stand_id = agent.managed_stand_ids[0];
            if (first_stand_id) {
                const stand_data_obj = agent.managed_stands_data[first_stand_id];
                
                console.log(`TEST RUNNER [puppet_master_v1]: Ordering stand ${first_stand_id} to 'clearcut'.`);
                
                // Manually create a "plan" in the stand_data object.
                stand_data_obj.activity.chosen_Activity = 'clearcut';
                stand_data_obj.activity.parameters = { rotation_age: 85 }; // A custom parameter for the test.
                
                // Call the action module to set the flags based on our manual plan.
                Action.set_flags_for_execution(stand_data_obj);
            }
        }
        // ... Future tests like 'observe_and_report' will be added here ...
    }
};
// Make the Test_Runner object globally available.
this.Test_Runner = Test_Runner;
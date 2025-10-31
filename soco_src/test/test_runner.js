var Test_Runner = {
    /**
     * Is called by each agent every year. Checks if a test is active and,
     * if so, executes the test logic for that specific agent.
     * @param {socoabe_agent} agent - The agent instance calling the runner.
     * @param {number} current_year - The current simulation year.
     * @returns {boolean} - True if a test was run, false otherwise.
     */
    run_for_agent: function(agent, current_year) {
        const scenario_name = SoCoABE_CONFIG.TESTING.active_scenario;
        if (!scenario_name || scenario_name === 'none') {
            return false; // No test active.
        }

        const test_function = Test_Scenarios[scenario_name];
        
        if (typeof test_function === 'function') {
            // Execute the test function, passing the specific agent that called it.
            test_function(agent, current_year);
            return true; // Signal that a test was run.
        }
        
        return false; // Test was configured but not found.
    }
};
this.Test_Runner = Test_Runner;
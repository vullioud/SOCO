
var Test_Runner = {
    run_for_agent: function(agent, current_year) {
        const scenario_name = SoCoABE_CONFIG.TESTING.active_scenario;
        if (!scenario_name || scenario_name === 'none') {
            return false;
        }

        const test_function = Test_Scenarios[scenario_name];
        
        if (typeof test_function === 'function') {
            // Execute the test and capture its return value
            const did_override = test_function(agent, current_year);
            // Return true only if the test function explicitly wants to override the main loop.
            return did_override === true; 
        }
        
        return false;
    }
};
this.Test_Runner = Test_Runner;
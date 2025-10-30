    
// ----- START OF CORRECTED FILE: soco_src/test/scenarios/perception_action_loop.js -----

/**
 * =================================================================================
 * TEST SCENARIO: Validating the One-Year Action Delay
 * =================================================================================
 * This test validates the full feedback loop, accounting for the one-year delay
 * between flagging an action and its execution by the iLand engine.
 *
 * SEQUENCE:
 * 1. Year 9: Observe the stand in its initial state ("Pre-Action").
 * 2. Year 10: Order a 'clearcut' action. The action will be executed by iLand
 *    at the beginning of year 11.
 * 3. Year 11: Observe the stand. We expect to see the results of the clearcut
 *    (zero volume) and the "receipt" flags (`needs_reassessment`, `last_activity`).
 * 4. Year 12: Observe again to confirm the state persists and that a subsequent
 *    'noManagement' action would have cleared the receipt flags.
 * =================================================================================
 */
Test_Scenarios.perception_action_loop = function(agent, current_year) {
    
    function getTestStands(agent) {
        if (agent.id !== socoabe.institution.all_agents[0].id) return [];
        return agent.managed_stand_ids.slice(0, 4);
    }

    function observe_and_log(stand_id, year_label) {
        console.log(`--- [TEST] Observation for Stand ${stand_id} (${year_label}) ---`);
        const stand_data_obj = agent.managed_stands_data[stand_id];
        const updated_stand_data = Perception.observe_stand(stand_data_obj, agent.owner.institution);
        
        console.log(JSON.stringify(updated_stand_data, null, 2));
        console.log("--------------------------------------------------");
    }

    const test_stands = getTestStands(agent);
    if (test_stands.length === 0) return;

    // --- Year 9: Pre-Action Observation ---
    if (current_year === 9) {
        console.log(`[TEST] Year 9: Performing initial observation.`);
        test_stands.forEach(stand_id => observe_and_log(stand_id, "Pre-Action"));
    } 
    
    // --- Year 10: Order the Action ---
    else if (current_year === 10) {
        console.log(`[TEST] Year 10: Ordering 'clearcut'. Action will execute at the start of Year 11.`);
        test_stands.forEach(stand_id => {
            const stand_data_obj = agent.managed_stands_data[stand_id];
            stand_data_obj.activity.chosen_Activity = 'clearcut';
            stand_data_obj.activity.parameters = {};
            Action.set_flags_for_execution(stand_data_obj);
        });
    }
    
    // --- Year 11: Observe the Results ---
    else if (current_year === 11) {
        console.log(`[TEST] Year 11: Observing stands immediately after clearcut execution.`);
        test_stands.forEach(stand_id => observe_and_log(stand_id, "Post-Action (Results Year)"));
    }

    // --- Year 12: Confirm State and Flag Clearing ---
    else if (current_year === 12) {
        console.log(`[TEST] Year 12: Observing to confirm flags were cleared.`);
        
        // In a real scenario, the agent's Cognition module would see 'needs_reassessment: true'
        // in year 11 and decide on a new action (e.g., 'noManagement'). Let's simulate that.
        test_stands.forEach(stand_id => {
            const stand_data_obj = agent.managed_stands_data[stand_id];
            stand_data_obj.activity.chosen_Activity = 'noManagement';
            Action.set_flags_for_execution(stand_data_obj);
        });

        // Now, observe again. The flags should be gone.
        test_stands.forEach(stand_id => observe_and_log(stand_id, "Confirmation Year"));
    }

        else if (current_year === 22) {
        console.log(`[TEST] Year 13: Observing to confirm flags were cleared.`);
        
        // In a real scenario, the agent's Cognition module would see 'needs_reassessment: true'
        // in year 11 and decide on a new action (e.g., 'noManagement'). Let's simulate that.
        test_stands.forEach(stand_id => {
            const stand_data_obj = agent.managed_stands_data[stand_id];
            stand_data_obj.activity.chosen_Activity = 'noManagement';
            Action.set_flags_for_execution(stand_data_obj);
        });

        // Now, observe again. The flags should be gone.
        test_stands.forEach(stand_id => observe_and_log(stand_id, "Confirmation Year"));
    }
};

// ----- END OF CORRECTED FILE: soco_src/test/scenarios/perception_action_loop.js -----

  
Test_Scenarios.single_action_validation = function(agent, current_year) {
    
    // --- We will only test the very first stand of the very first agent ---
    const first_agent_id = socoabe.institution.all_agents[0].id;
    if (agent.id !== first_agent_id) {
        return; // Do nothing for all other agents.
    }
    const stand_to_test = agent.managed_stand_ids[0];

    // --- Helper function to log a detailed observation ---
    function observe_and_log(stand_id, year_label) {
        console.log(`--- [TEST] Observation for Stand ${stand_id} (${year_label}) ---`);
        const stand_data_obj = agent.managed_stands_data[stand_id];
        const updated_stand_data = Perception.observe_stand(stand_data_obj, agent.owner.institution);
        console.log(JSON.stringify(updated_stand_data, null, 2));
        console.log("--------------------------------------------------");
    }

    // --- Test Logic ---

    if (current_year === 5) {
        console.log(`[TEST] Year 5: Ordering 'clearcut' for stand ${stand_to_test}. Action should execute in Year 6.`);
        
        // Get the stand_data object for our target stand
        const stand_data_obj = agent.managed_stands_data[stand_to_test];
        
        // Set the plan
        stand_data_obj.activity.chosen_Activity = 'clearcut';
        stand_data_obj.activity.parameters = {};
        
        // Execute the action (this sets the iLand flags)
        Action.set_flags_for_execution(stand_data_obj);

        // Log the state of the stand BEFORE the action takes effect
        observe_and_log(stand_to_test, "Pre-Action");
    } 
    else if (current_year === 6) {
        console.log(`[TEST] Year 6: Observing stand ${stand_to_test} to verify clearcut results.`);
        
        // Observe the stand. The clearcut should have executed at the start of this year.
        observe_and_log(stand_to_test, "Post-Action");
    }
};

// ----- END OF SIMPLIFIED TEST FILE: soco_src/test/scenarios/perception_action_loop.js -----
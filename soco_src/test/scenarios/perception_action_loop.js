
// =================================================================================
// TEST SCENARIO 1: Perception-Action Feedback Loop
// =================================================================================
Test_Scenarios.perception_action_loop = function(agent, current_year) {
    
    const AGENT_ID_TO_TEST = "small_agent_51";
    if (agent.id !== AGENT_ID_TO_TEST) return;

    function getTestStands(_agent) {
        return _agent.managed_stand_ids.slice(0, 4);
    }

    function observe_and_log(_agent, stand_id, year_label) {
        console.log(`--- [TEST] Observation for Stand ${stand_id} (${year_label}) ---`);
        const stand_data_obj = _agent.managed_stands_data[stand_id];
        // The call inside here was also wrong, it should pass the agent directly.
        const updated_stand_data = Perception.observe_stand(stand_data_obj, _agent);
        console.log(JSON.stringify(updated_stand_data, null, 2));
        console.log("--------------------------------------------------");
    }

    const test_stands = getTestStands(agent);
    if (test_stands.length === 0) return;

    if (current_year >= 9 && current_year <= 12) {
        console.log(`[TEST] Running 'perception_action_loop' for agent ${agent.id} in year ${current_year}`);
        
        if (current_year === 9) {
            // --- THE FIX --- Pass the 'agent' object here.
            test_stands.forEach(stand_id => observe_and_log(agent, stand_id, "Pre-Action"));
        } else if (current_year === 10) {
            test_stands.forEach(stand_id => {
                const stand_data_obj = agent.managed_stands_data[stand_id];
                stand_data_obj.activity.chosen_Activity = 'clearcut';
                Action.set_flags_for_execution(stand_data_obj);
            });
        } else if (current_year === 11) {
            // --- THE FIX --- Pass the 'agent' object here.
            test_stands.forEach(stand_id => observe_and_log(agent, stand_id, "Post-Action (Results Year)"));
        } else if (current_year === 12) {
            test_stands.forEach(stand_id => {
                const stand_data_obj = agent.managed_stands_data[stand_id];
                stand_data_obj.activity.chosen_Activity = 'noManagement';
                Action.set_flags_for_execution(stand_data_obj);
            });
            // --- THE FIX --- Pass the 'agent' object here.
            test_stands.forEach(stand_id => observe_and_log(agent, stand_id, "Confirmation Year"));
        }
    }
};

// =================================================================================
// TEST SCENARIO 2: Cognition and Planning Loop
// =================================================================================
Test_Scenarios.cognition_planning_loop = function(agent, current_year) {
    
    const AGENT_ID_TO_TEST = "small_agent_51";
    if (agent.id !== AGENT_ID_TO_TEST) return;

    function getTestStands(_agent) {
        return Object.keys(_agent.managed_stands_data).slice(0, 2);
    }

    function log_stand_data(stand_data_obj, year_label) {
        console.log(`--- [TEST] Final State of Stand ${stand_data_obj.stand_id} (Agent: ${stand_data_obj.agent_id}, Year: ${year_label}) ---`);
        console.log(JSON.stringify(stand_data_obj, null, 2));
        console.log("--------------------------------------------------");
    }

    const test_stand_ids = getTestStands(agent);
    if (test_stand_ids.length === 0) return;

    if (current_year >= 3 && current_year <= 7) {
        console.log(`\n[TEST] ==================== Running Cognition Test Cycle for Year ${current_year} for Agent ${agent.id} ====================`);
        
        test_stand_ids.forEach(stand_id => {
            console.log(`\n[TEST] Processing Stand: ${stand_id}`);
            let stand_data_obj = agent.managed_stands_data[stand_id];

            // 1. OBSERVE - Pass the agent object correctly.
            stand_data_obj = Perception.observe_stand(stand_data_obj, agent);

            // 2. MANIPULATE
            if (current_year === 5) {
                console.log(`  [TEST] Artificially triggering 'needs_reassessment' for stand ${stand_id}.`);
                stand_data_obj.iLand_stand_data.needs_reassessment = true;
            }

            // 3. COGNITION
            const needs_new_plan = Cognition.check_need(stand_data_obj, current_year);
            if (needs_new_plan) {
                stand_data_obj = Cognition.plan(stand_data_obj, agent);
            }
            
            // Update the agent's memory
            agent.managed_stands_data[stand_id] = stand_data_obj;

            // 4. LOG THE RESULT
            log_stand_data(stand_data_obj, current_year);
        });
    }
};
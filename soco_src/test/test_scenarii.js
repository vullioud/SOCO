// ----- Start of File: soco_src/test/scenarios/inspect_raw_data.js -----

/**
 * =================================================================================
 * TEST SCENARIO: Inspect Raw Data Perception Step
 * =================================================================================
 */
Test_Scenarios.inspect_raw_data_step = function(agent, current_year) {
    
    // --- CONFIGURATION ---
    const AGENT_ID_TO_INSPECT = "small_agent_51";
    const YEARS_TO_INSPECT = [2, 4];
    // ---------------------

    if (agent.id !== AGENT_ID_TO_INSPECT || !YEARS_TO_INSPECT.includes(current_year)) {
        return; 
    }

    const stand_id_to_inspect = agent.managed_stand_ids[0];
    if (typeof stand_id_to_inspect === 'undefined') return;

    console.log(`\n[TEST] ==================== Running Raw Data Inspection for Year ${current_year} ====================`);

    // --- 1. ARTIFICIAL STATE MANIPULATION (for Year 4) ---
    if (current_year === 4) {
        console.log("[TEST] MANIPULATION: Artificially setting 'abe_last_activity' flag to simulate a clearcut from Year 3.");
        fmengine.standId = stand_id_to_inspect;
        stand.setFlag('abe_last_activity', 'MegaSTP_Clearcut');
        stand.setFlag('abe_last_activity_year', current_year - 1);
    }
    
    // --- 2. OBSERVE (Run the full perception pipeline silently) ---
    let stand_data_obj = agent.managed_stands_data[stand_id_to_inspect];
    stand_data_obj = Perception.observe_stand(stand_data_obj, agent);
    
    // --- 3. LOG THE FINAL RESULT ---
    // --- THIS WAS THE MISSING PART ---
    SoCo_Inspector.log_stand_data_section(
        agent, 
        stand_id_to_inspect, 
        "iLand_stand_data", 
        `Final Raw Data State - Year ${current_year}`
    );

    // IMPORTANT: Update the agent's memory with the final state
    agent.managed_stands_data[stand_id_to_inspect] = stand_data_obj;
    
    console.log(`[TEST] ==================== Inspection Complete for Year ${current_year} ====================\n`);
};


/**
 * =================================================================================
 * TEST SCENARIO: COMPUTED CLASSIFICATION
 * =================================================================================
 */
Test_Scenarios.inspect_classification_step = function(agent, current_year) {
    
    // --- CONFIGURATION ---
    const AGENT_ID_TO_INSPECT = "small_agent_51";
    const YEARS_TO_INSPECT = [1, 3, 4];
    // ---------------------

    if (agent.id !== AGENT_ID_TO_INSPECT || !YEARS_TO_INSPECT.includes(current_year)) {
        return;
    }

    const stand_id_to_inspect = agent.managed_stand_ids[0];
    if (typeof stand_id_to_inspect === 'undefined') return;

    console.log(`\n[TEST] ==================== Running Classification Inspection for Year ${current_year} ====================`);

    // --- 1. OBSERVE (Run the full perception pipeline silently) ---
    let stand_data_obj = agent.managed_stands_data[stand_id_to_inspect];
    stand_data_obj = Perception.observe_stand(stand_data_obj, agent);
    
    // --- 2. MANIPULATE (On a specific year) ---
    if (current_year === 4) {
        console.log("[TEST] MANIPULATION: Artificially setting stand_age to 260 to test edge case.");
        stand_data_obj.iLand_stand_data.stand_age = 260;
        stand_data_obj.std = 260;

        // Re-run the classification step to see the effect of the manipulation
        console.log("[TEST] Re-running classification after manipulation...");
        stand_data_obj = Perception.compute_classified_data(stand_data_obj, agent);
    }
    
    // --- 3. LOG THE FINAL RESULT ---
    // Log the key input data.
    SoCo_Inspector.log_stand_data_section(
        agent, 
        stand_id_to_inspect, 
        "iLand_stand_data", 
        `Input Data State - Year ${current_year}`
    );

    // Log the classification output.
    SoCo_Inspector.log_stand_data_section(
        agent, 
        stand_id_to_inspect, 
        "classified", 
        `Final Classified State - Year ${current_year}`
    );

    // IMPORTANT: Update the agent's memory with the final state
    agent.managed_stands_data[stand_id_to_inspect] = stand_data_obj;
    
    console.log(`[TEST] ==================== Inspection Complete for Year ${current_year} ====================\n`);
};


/**
 * =================================================================================
 * TEST SCENARIO: Inspect History FLAG Perception Step
 * =================================================================================
 */
// ----- Start of File: soco_src/test/scenarios/inspect_history.js -----

Test_Scenarios.inspect_history_step = function(agent, current_year) {
    
    const AGENT_ID_TO_INSPECT = "small_agent_51";
    const YEARS_TO_INSPECT = [2, 3, 4, 5, 7, 8];

    if (agent.id !== AGENT_ID_TO_INSPECT || !YEARS_TO_INSPECT.includes(current_year)) {
        return;
    }

    const stand_id_to_inspect = agent.managed_stand_ids[0];
    if (typeof stand_id_to_inspect === 'undefined') return;

    console.log(`\n[TEST] ==================== Running History Inspection for Year ${current_year} ====================`);

    // --- 1. MANIPULATE (Only for Year 4) ---
    if (current_year === 4) {
        console.log("[TEST] MANIPULATION: Setting 'abe_last_activity' flag for Year 3.");
        fmengine.standId = stand_id_to_inspect;
        stand.setFlag('abe_last_activity', 'MegaSTP_Clearcut');
        stand.setFlag('abe_last_activity_year', current_year - 1); // Year 3
        stand.setFlag('abe_need_reassessment', true); 
    } else {
        // On other years, ensure the flag is clear so we can see the counter increment.
        fmengine.standId = stand_id_to_inspect;
        stand.setFlag('abe_last_activity', null);
        stand.setFlag('abe_last_activity_year', null);
    }
    
    // --- 2. OBSERVE ---
    let stand_data_obj = agent.managed_stands_data[stand_id_to_inspect];
    stand_data_obj = Perception.observe_stand(stand_data_obj, agent);
    
    // --- 3. LOG ---
    SoCo_Inspector.log_stand_data_section(agent, stand_id_to_inspect, "history", `Final History State - Year ${current_year}`);
    console.log(`NEEDS_REASSESSMENT flag is now: ${stand_data_obj.iLand_stand_data.needs_reassessment}`);

    // Update the agent's memory
    agent.managed_stands_data[stand_id_to_inspect] = stand_data_obj;
    
    console.log(`[TEST] ==================== Inspection Complete for Year ${current_year} ====================\n`);
};

/**
 * =================================================================================
 * TEST SCENARIO: Inspect Reassessment Flag Trigger
 * =================================================================================
 * DESCRIPTION:
 * This scenario verifies that setting the `abe_need_reassessment` flag on an
 * iLand stand correctly triggers the agent's `check()` method to select that
 * stand for replanning, independent of the 10-year periodic cycle.
 * =================================================================================
 */
Test_Scenarios.inspect_check_need_step = function(agent, current_year) {
    
    // --- CONFIGURATION ---
    const AGENT_ID_TO_INSPECT = "small_agent_51";
    // Choose a year that is GUARANTEED NOT to be a periodic planning year.
    // Since offsets are 5-14, Year 3 is a safe choice.
    const YEAR_TO_INSPECT = 3;
    // ---------------------

    if (agent.id !== AGENT_ID_TO_INSPECT || current_year !== YEAR_TO_INSPECT) {
        return;
    }

    const stands_to_flag = agent.managed_stand_ids.slice(0, 2); // Select the first two stands
    if (stands_to_flag.length < 2) {
        console.warn(`[TEST] Agent ${agent.id} does not have enough stands for this test.`);
        return;
    }

    console.log(`\n[TEST] ==================== Running Reassessment Flag Inspection for Year ${current_year} ====================`);

    // --- 1. MANIPULATE ---
    console.log(`[TEST] MANIPULATION: Setting 'abe_need_reassessment' flag to true for stands: ${stands_to_flag.join(', ')}.`);
    stands_to_flag.forEach(stand_id => {
        fmengine.standId = stand_id;
        stand.setFlag('abe_need_reassessment', true);
    });
    
    // --- 2. OBSERVE ---
    // This step is crucial for the agent to read the flags we just set.
    agent.observe();
    
    // --- 3. CHECK & LOG ---
    // This is the core of the test. We call the function we want to verify.
    const stands_found = agent.check(current_year);

    console.log("\n--- TEST RESULTS ---");
    console.log(`Agent ${agent.id}: Found ${stands_found.length} stands requiring a new plan.`);
    
    if (stands_found.length > 0) {
        const found_ids = stands_found.map(s => s.stand_id);
        console.log(`IDs of stands found: [${found_ids.join(', ')}]`);
    }

    // Verification
    if (stands_found.length === 2) {
        console.log("[TEST] SUCCESS: The correct number of stands was identified.");
    } else {
        console.error(`[TEST] FAILURE: Expected to find 2 stands, but found ${stands_found.length}.`);
    }
    
    console.log(`[TEST] ==================== Inspection Complete for Year ${current_year} ====================\n`);
};

// ----- Start of File: soco_src/test/scenarios/inspect_planning_trigger.js -----

/**
 * =================================================================================
 * TEST SCENARIO: Inspect Planning Trigger and Activity Selection
 * =================================================================================
 */
Test_Scenarios.inspect_planning_trigger = function(agent, current_year) {
    
    const YEARS_TO_INSPECT = [3, 4, 5, 6];
    
    if (typeof this.stands_to_watch === 'undefined') {
        this.stands_to_watch = {};
        for (const owner_type in socoabe.institution.owners) {
            const owner = socoabe.institution.owners[owner_type];
            if (owner.agent_list.length > 0 && owner.agent_list[0].managed_stand_ids.length > 0) {
                const agent_id = owner.agent_list[0].id;
                const stand_id = owner.agent_list[0].managed_stand_ids[0];
                this.stands_to_watch[agent_id] = stand_id;
                console.log(`[TEST SETUP] Watching Stand ${stand_id} from Agent ${agent_id} (Owner: ${owner_type})`);
            }
        }
    }

    if (this.stands_to_watch[agent.id] === undefined || !YEARS_TO_INSPECT.includes(current_year)) {
        return;
    }

    const stand_id_to_inspect = this.stands_to_watch[agent.id];
    console.log(`\n[TEST] --- Inspecting Agent ${agent.id}, Stand ${stand_id_to_inspect} for Year ${current_year} ---`);

    // --- 1. MANIPULATE (for Year 5) ---
    if (current_year === 5) {
        console.log(`[TEST] MANIPULATION: Setting 'abe_need_reassessment' flag to true.`);
        fmengine.standId = stand_id_to_inspect;
        stand.setFlag('abe_need_reassessment', true);
    }

    // --- 2. RUN THE AGENT'S P-C-A CYCLE ---
    agent.observe();
    const stands_to_plan = agent.check(current_year);
    if (stands_to_plan.length > 0) {
        agent.plan(stands_to_plan);
    }

    // --- 3. LOG THE RESULT ---
    const final_stand_data = agent.managed_stands_data[stand_id_to_inspect];
    
    // --- ENHANCED LOGGING ---
    console.log("--- TEST RESULTS ---");
    console.log(`  Context:`);
    console.log(`    - Preference Focus: ${final_stand_data.preference_focus}`);
    console.log(`    - Species Focus: ${final_stand_data.species_profile}`);
    console.log(`    - Stand Age:        ${final_stand_data.iLand_stand_data.stand_age.toFixed(2)}`);
   console.log(`    - absolute Age:        ${final_stand_data.iLand_stand_data.absolute_age_soco.toFixed(2)}`);
    console.log(`    - Age Class:        ${final_stand_data.classified.age_class}`);
    console.log(`    - Structure Class:  ${final_stand_data.classified.structure_class}`);
    console.log(`  Result:`);
    console.log(`    - Chosen Activity:  '${final_stand_data.activity.chosen_Activity}'`);
    console.log(`    - Arguments:  '${final_stand_data.activity.parameters ? SoCo_Inspector._safeStringify(final_stand_data.activity.parameters) : '{}'}'`);
    console.log(`    - target year:  '${final_stand_data.activity.target_year}'`);
    console.log("--------------------");
};



Test_Scenarios.inspect_initialization = function(agent, current_year) {
    
    // This test runs only in Year 2, AFTER the main initialization has happened in Year 1.
    if (current_year !== 2) { 
        return;
    }

    // Setup stands to watch on the first run of this test
    if (typeof this.stands_to_watch === 'undefined') {
        this.stands_to_watch = {};
        for (const owner_type in socoabe.institution.owners) {
            const owner = socoabe.institution.owners[owner_type];
            if (owner.agent_list.length > 0 && owner.agent_list[0].managed_stand_ids.length > 0) {
                const agent_id = owner.agent_list[0].id;
                const stand_id = owner.agent_list[0].managed_stand_ids[0];
                this.stands_to_watch[agent_id] = stand_id;
            }
        }
    }

    if (this.stands_to_watch[agent.id] === undefined) {
        return;
    }

    // --- THIS IS THE FIX ---
    // 1. First, we must run the agent's observation for the current year (Year 2)
    //    to ensure all data is up-to-date.
    agent.observe();

    // 2. Now we can inspect the result.
    const stand_id_to_inspect = this.stands_to_watch[agent.id];
    const stand_data_obj = agent.managed_stands_data[stand_id_to_inspect];

    console.log(`\n[TEST] --- Verifying Initialization for Agent ${agent.id}, Stand ${stand_id_to_inspect} (inspected in Year 2) ---`);
    console.log(`  - Stand Preference Focus: ${stand_data_obj.preference_focus}`);
    console.log(`  - Assigned Species Profile: ${stand_data_obj.species_profile}`);
    
    if (stand_data_obj.preference_focus !== "none" && stand_data_obj.species_profile !== "none") {
        console.log("  - [SUCCESS] Stand appears to be initialized correctly.");
    } else {
        console.error("  - [FAILURE] Stand initialization is incomplete.");
    }
    console.log(`----------------------------------------------------------`);
};

Test_Scenarios.inspect_full_initialization_flow = function(agent, current_year) {
    
    const AGENT_ID_TO_INSPECT = "small_agent_51";

    // This test runs ONLY in Year 1 for our target agent.
    if (agent.id !== AGENT_ID_TO_INSPECT || current_year !== 1 ) {
        return;
    }

    const stand_id_to_inspect = agent.managed_stand_ids[0];
    if (typeof stand_id_to_inspect === 'undefined') return;

    console.log(`\n[TEST] ==================== Full Initialization Flow for Agent ${agent.id}, Stand ${stand_id_to_inspect} ====================`);

    // --- 1. STATE AFTER CONSTRUCTOR ---
    // We log the initial state before any perception runs.
    let stand_data_obj = agent.managed_stands_data[stand_id_to_inspect];
    console.log("\n[TEST] --- State AFTER constructor ---");
    console.log(SoCo_Inspector._safeStringify(stand_data_obj));

    // --- 2. RUN AND LOG OBSERVE STEP ---
    console.log("\n[TEST] --- Running agent.observe()... ---");
    agent.observe();
    stand_data_obj = agent.managed_stands_data[stand_id_to_inspect]; // Re-fetch
    console.log("[TEST] --- State AFTER observe() ---");
    console.log(SoCo_Inspector._safeStringify(stand_data_obj));


    // --- 3. RUN AND LOG PROFILE ASSIGNMENT STEP ---
    console.log("\n[TEST] --- Running agent.assign_species_profiles()... ---");
    agent.assign_species_profiles();
    stand_data_obj = agent.managed_stands_data[stand_id_to_inspect]; // Re-fetch
    console.log("[TEST] --- State AFTER assign_species_profiles() ---");
    console.log(SoCo_Inspector._safeStringify(stand_data_obj));

    console.log(`[TEST] ==================== Inspection Complete ====================\n`);
    
    // Manually set the flag since we are overriding the main loop.
    agent.is_initialized = true;
};

// ----- Start of File: soco_src/test/scenarios/snapshot_stand_data.js -----

/**
 * =================================================================================
 * TEST SCENARIO: Snapshot Stand Data
 * =================================================================================
 * DESCRIPTION:
 * This is a simple reporting tool, not a test. It runs alongside the normal
 * agent logic and logs the complete state of specific stand_data objects
 * at specified years. This is used for direct inspection of the model's state
 * during a normal run.
 * =================================================================================
 */
Test_Scenarios.snapshot_stand_data = function(agent, current_year) {
    
    // --- CONFIGURATION ---
    const YEARS_TO_SNAPSHOT = [4, 5, 6];
    
    // Setup stands to watch on the first run
    if (typeof this.stands_to_watch === 'undefined') {
        this.stands_to_watch = {};
        for (const owner_type in socoabe.institution.owners) {
            const owner = socoabe.institution.owners[owner_type];
            if (owner.agent_list.length > 0 && owner.agent_list[0].managed_stand_ids.length > 0) {
                const agent_id = owner.agent_list[0].id;
                const stand_id = owner.agent_list[0].managed_stand_ids[0];
                this.stands_to_watch[agent_id] = stand_id;
            }
        }
    }
    // ---------------------

    if (this.stands_to_watch[agent.id] === undefined || !YEARS_TO_SNAPSHOT.includes(current_year)) {
        // This scenario does not override the agent's logic, so we return false.
        return false; 
    }

    const stand_id_to_inspect = this.stands_to_watch[agent.id];
    const stand_data_obj = agent.managed_stands_data[stand_id_to_inspect];

    console.log(`\n--- SNAPSHOT of Stand ${stand_id_to_inspect} at END of Year ${current_year} ---`);
    console.log(SoCo_Inspector._safeStringify(stand_data_obj));
    console.log(`--- END SNAPSHOT ---`);

    // Return false to allow the normal agent logic to run.
    return false;
};

/**
 * =================================================================================
 * TEST SCENARIO: Inspect Schedule Computation
 * =================================================================================
 * DESCRIPTION:
 * This scenario verifies the entire planning pipeline, from activity and parameter
 * selection through to schedule computation. It logs the complete `activity` object
 * to show the final generated timeline.
 * =================================================================================
 */
Test_Scenarios.inspect_schedule_computation = function(agent, current_year) {
    
    // --- CONFIGURATION ---
    const YEARS_TO_INSPECT = [3, 4, 12, 16, 17];
    
    if (typeof this.stands_to_watch === 'undefined') {
        this.stands_to_watch = {};
        for (const owner_type in socoabe.institution.owners) {
            const owner = socoabe.institution.owners[owner_type];
            if (owner.agent_list.length > 0 && owner.agent_list[0].managed_stand_ids.length > 0) {
                const agent_id = owner.agent_list[0].id;
                const stand_id = owner.agent_list[0].managed_stand_ids[0];
                this.stands_to_watch[agent_id] = stand_id;
            }
        }
    }
    // ---------------------

    if (this.stands_to_watch[agent.id] === undefined || !YEARS_TO_INSPECT.includes(current_year)) {
        return;
    }

    const stand_id_to_inspect = this.stands_to_watch[agent.id];
    console.log(`\n[TEST] --- Inspecting Agent ${agent.id}, Stand ${stand_id_to_inspect} for Year ${current_year} ---`);

    // --- 1. MANIPULATE (for Year 5) ---
    if (current_year === 12) {
        console.log(`[TEST] MANIPULATION: Setting 'abe_need_reassessment' flag to true.`);
        fmengine.standId = stand_id_to_inspect;
        stand.setFlag('abe_need_reassessment', true);
    }

    // --- 2. RUN THE AGENT'S P-C-A CYCLE ---
    agent.observe();
    const stands_to_plan = agent.check(current_year);
    if (stands_to_plan.length > 0) {
        agent.plan(stands_to_plan);
    }

    // --- 3. LOG THE RESULT ---
    const final_stand_data = agent.managed_stands_data[stand_id_to_inspect];
    
    console.log("--- TEST RESULTS ---");
    console.log(`  Context:`);
    console.log(`    - Stand Age:       ${final_stand_data.iLand_stand_data.stand_age.toFixed(2)}`);
    console.log(`    - absolute Age:        ${final_stand_data.iLand_stand_data.absolute_age_soco.toFixed(2)}`);
    console.log(`    - Species Profile: ${final_stand_data.species_profile}`);
    console.log(`  Result (Full Activity Object):`);
    console.log(SoCo_Inspector._safeStringify(final_stand_data.activity));
    console.log(SoCo_Inspector._safeStringify(final_stand_data.target_year));

    console.log("--------------------");
};


Test_Scenarios.inspect_schedule_only = function(agent, current_year) {
    
    // This test runs only once, for any agent, in year 2.
    if (current_year !== 2 || typeof this.test_has_run !== 'undefined') {
        return;
    }
    this.test_has_run = true; // Ensure it only runs for the very first agent.

    console.log(`\n[TEST] ==================== Inspecting compute_schedule Function Directly ====================`);

    // --- TEST CASE 1: Finite Sequence (selectiveThinning) ---
    let test_stand_1 = new stand_data(1, agent.id, "Production");
    test_stand_1.activity.chosen_Activity = "selectiveThinning";
    test_stand_1.activity.parameters = { execution_schedule: 40, times: 4, interval: 8 };
    
    console.log("\n--- Testing: selectiveThinning ---");
    console.log("Input Parameters:", SoCo_Inspector._safeStringify(test_stand_1.activity.parameters));
    test_stand_1 = Cognition.compute_schedule(test_stand_1);
    console.log("Result:", SoCo_Inspector._safeStringify(test_stand_1.activity));

    // --- TEST CASE 2: Continuous Sequence (plenter_thinning) ---
    let test_stand_2 = new stand_data(2, agent.id, "Biodiversity");
    test_stand_2.activity.chosen_Activity = "plenter_thinning";
    test_stand_2.activity.parameters = { execution_schedule: 50, interval: 7 };

    console.log("\n--- Testing: plenter_thinning ---");
    console.log("Input Parameters:", SoCo_Inspector._safeStringify(test_stand_2.activity.parameters));
    test_stand_2 = Cognition.compute_schedule(test_stand_2);
    console.log("Result:", SoCo_Inspector._safeStringify(test_stand_2.activity));

    // --- TEST CASE 3: Continuous Sequence (targetDBH) ---
    let test_stand_3 = new stand_data(3, agent.id, "CO2");
    test_stand_3.activity.chosen_Activity = "targetDBH";
    test_stand_3.activity.parameters = { execution_schedule: 80, times: 6 }; // 'times' is the interval

    console.log("\n--- Testing: targetDBH ---");
    console.log("Input Parameters:", SoCo_Inspector._safeStringify(test_stand_3.activity.parameters));
    test_stand_3 = Cognition.compute_schedule(test_stand_3);
    console.log("Result:", SoCo_Inspector._safeStringify(test_stand_3.activity));

    console.log(`\n[TEST] ==================== Inspection Complete ====================\n`);
};

/**
 * =================================================================================
 * TEST SCENARIO: Inspect Age Classification Logic
 * =================================================================================
 * DESCRIPTION:
 * This is a simple, focused test to verify the age classification logic.
 * It runs for a single stand in a single year. It loops through ages 1 to 200,
 * artificially sets the stand_age, re-runs the classification logic, and logs
 * the result. This allows for direct validation of the `age_class_lookup.json` table.
 * =================================================================================
 */
Test_Scenarios.inspect_age_classification_logic = function(agent, current_year) {

    // --- CONFIGURATION ---
    const AGENT_ID_TO_INSPECT = "small_agent_51"; // We only need one agent to run this
    const YEAR_TO_INSPECT = 2; // Run this test once, early in the simulation
    // ---------------------

    // Guard clause: only run this test for the specified agent and year.
    if (agent.id !== AGENT_ID_TO_INSPECT || current_year !== YEAR_TO_INSPECT) {
        return false; // Let other agents/years run normally
    }

    // Select the first stand managed by this agent for the test.
    var stand_id_to_inspect = agent.managed_stand_ids[0];
    if (typeof stand_id_to_inspect === 'undefined') {
        console.warn("[TEST] Agent " + agent.id + " has no stands to test.");
        return true; // Stop the test
    }

    var stand_data_obj = agent.managed_stands_data[stand_id_to_inspect];

    console.log("\n[TEST] --- Verifying Age Classification Logic (Ages 1-200) ---");
    console.log("stand_age,age_class"); // Print CSV header

    // Loop from age 1 to 200
    for (var test_age = 1; test_age <= 200; test_age++) {

        // 1. Artificially set the stand_age in the data object.
        stand_data_obj.iLand_stand_data.stand_age = test_age;

        // 2. Re-run the perception step that performs the classification.
        //    We pass the agent object because compute_derived_data needs it to access the age_class_table.
        stand_data_obj = Perception.compute_derived_data(stand_data_obj, agent);

        // 3. Log the result in a simple, comma-separated format.
        var age_class_result = stand_data_obj.classified.age_class;
        console.log(test_age + "," + age_class_result);
    }

    console.log("[TEST] --- Age Classification Test Complete ---");

    // Return true to signify that we have taken over the agent's logic for this year.
    // The agent will do nothing else.
    return true;
};
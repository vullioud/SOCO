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


 /**
 * =================================================================================
 * TEST SCENARIO: Inspect 10-Year Plan Summary (Detailed)
 * =================================================================================
 * DESCRIPTION:
 * This test provides a detailed summary of each agent and its managed stands,
 * including their ages, planned activities, and target years.
 * =================================================================================
 */
Test_Scenarios.inspect_10_year_plan_summary = function(agent, current_year) {
    
    // --- CONFIGURATION ---
    const YEAR_TO_INSPECT = 5;
    // ---------------------

    if (current_year !== YEAR_TO_INSPECT) {
        return false; // Do not override the agent's logic in other years.
    }

    console.log(`\n[TEST] --- Running Detailed 10-Year Plan Summary for Agent ${agent.id} (Owner: ${agent.owner.type}) ---`);
    console.log(`  - Number of managed stands: ${agent.managed_stand_ids.length}`);

    // 1. Force reassessment for all stands
    for (const stand_id in agent.managed_stands_data) {
        fmengine.standId = stand_id;
        stand.setFlag('abe_need_reassessment', true);
    }

    // 2. Run the agent's P-C-A cycle
    agent.observe();
    const stands_to_plan = agent.check(current_year);
    if (stands_to_plan.length > 0) {
        agent.plan(stands_to_plan);
    }

    // 3. Log details for each stand
    for (const stand_id in agent.managed_stands_data) {
        const stand_data = agent.managed_stands_data[stand_id];
        fmengine.standId = stand_id; // Set context for accessing stand properties

        console.log(`\n  --- Stand ${stand_id} ---`);
        console.log(`    - Age: ${stand.age}`);
        console.log(`    - Absolute Age: ${stand.absoluteAge}`);
        console.log(`    - Activity: ${stand_data.activity.chosen_Activity}`);
        console.log(`    - AgeClass: ${stand_data.classified.age_class}`);
        console.log(`    - Target Year: ${stand_data.activity.target_year}`);
    }

    console.log(`[TEST] ==================== Inspection Complete ====================\n`);

    // Return true to override the agent's normal 'act' phase for this test run.
    return true;
};

/**
 * =================================================================================
 * TEST SCENARIO: Inspect Flag Setting for a Single Clearcut Action
 * =================================================================================
 * DESCRIPTION:
 * This test verifies the entire "plan -> act -> flag" pipeline for a single,
 * hardcoded 'clearcut' activity. It checks if the agent's `act()` method
 * correctly calls the Action module, which should then set the appropriate
 * flags on the iLand stand object.
 * =================================================================================
 */
/**
 * =================================================================================
 * TEST SCENARIO: Inspect Signal Triggering System for Multiple Activities
 * =================================================================================
 */
Test_Scenarios.inspect_signal_trigger_system = function(agent, current_year) {
    
    // --- CONFIGURATION ---
    const AGENT_ID_TO_INSPECT = "big_agent_1";
    const TRIGGER_YEAR = 10;
    const VERIFY_YEAR = 13;
    // ---------------------

    if (agent.id !== AGENT_ID_TO_INSPECT || (current_year !== TRIGGER_YEAR && current_year !== VERIFY_YEAR)) {
        return false;
    }

    // --- TRIGGER PHASE ---
    if (current_year === TRIGGER_YEAR) {
        console.log(`\n[TEST] ==================== Triggering Activities via Signal ====================`);
        
        const stands_for_clearcut = agent.managed_stand_ids.slice(0, 5);
        const stands_for_no_mgmt = agent.managed_stand_ids.slice(5, 10);

        var plans = [];
        // Create clearcut plans
        for (var i = 0; i < stands_for_clearcut.length; i++) {
            var stand_id = stands_for_clearcut[i];
            var stand_plan = agent.managed_stands_data[stand_id];
            stand_plan.activity.chosen_Activity = 'clearcut';
            stand_plan.activity.target_year = TRIGGER_YEAR;
            plans.push(stand_plan);
        }
        // Create noManagement plans
        for (var i = 0; i < stands_for_no_mgmt.length; i++) {
            var stand_id = stands_for_no_mgmt[i];
            var stand_plan = agent.managed_stands_data[stand_id];
            stand_plan.activity.chosen_Activity = 'noManagement';
            stand_plan.activity.target_year = TRIGGER_YEAR;
            plans.push(stand_plan);
        }

        console.log(`[TEST] Calling agent.act() for ${plans.length} stands...`);
        agent.act(plans);
        console.log(`[TEST] Signals fired. Execution expected in year ${TRIGGER_YEAR + 1}.`);
    }

    // --- VERIFICATION PHASE ---
    if (current_year === VERIFY_YEAR) {
        console.log(`\n[TEST] ==================== Verifying Activity Execution in Year ${VERIFY_YEAR} ====================`);
        
        const stands_to_verify = agent.managed_stand_ids.slice(0, 10);
        
        agent.observe(); // Run observation to update all stand_data objects

        console.log("\n--- VERIFICATION RESULTS ---");
        for (var i = 0; i < stands_to_verify.length; i++) {
            var stand_id = stands_to_verify[i];
            var stand_data = agent.managed_stands_data[stand_id];
            var volume = stand_data.iLand_stand_data.volume;

            console.log(`  - Stand ${stand_id}: Volume = ${volume.toFixed(2)} m3/ha`);
            if (i < 5) { // First 5 should be clearcut
                if (volume < 1.0) console.log("    - [SUCCESS] Stand was clearcut as planned.");
                else console.error(`    - [FAILURE] Stand was NOT clearcut.`);
            } else { // Next 5 should be noManagement
                if (volume > 1.0) console.log("    - [SUCCESS] Stand was not harvested, as planned.");
                else console.error(`    - [FAILURE] Stand volume is zero, which was not expected.`);
            }
        }

        // Log full object for one stand of each type
        console.log("\n--- Detailed Stand Data Object for a Clearcut Stand ---");
        console.log(SoCo_Inspector._safeStringify(agent.managed_stands_data[stands_to_verify[0]]));
        
        console.log("\n--- Detailed Stand Data Object for a No-Management Stand ---");
        console.log(SoCo_Inspector._safeStringify(agent.managed_stands_data[stands_to_verify[5]]));

        console.log(`[TEST] ==================== Verification Complete ====================\n`);
    }

    return true;
};

/**
 * =================================================================================
 * TEST SCENARIO: Inspect Signal Triggering for Target DBH Harvest
 * =================================================================================
 */
Test_Scenarios.inspect_signal_trigger_targetDBH = function(agent, current_year) {
    
    // --- CONFIGURATION ---
    const AGENT_ID_TO_INSPECT = "big_agent_1";
    const TRIGGER_YEAR = 15;
    const VERIFY_YEAR = 17;
    // ---------------------

    if (agent.id !== AGENT_ID_TO_INSPECT || (current_year !== TRIGGER_YEAR && current_year !== VERIFY_YEAR)) {
        return false;
    }

    // --- TRIGGER PHASE ---
    if (current_year === TRIGGER_YEAR) {
        console.log(`\n[TEST] ==================== Triggering TargetDBH via Signal ====================`);
        
        const stand_id_to_trigger = agent.managed_stand_ids[0];
        if (typeof stand_id_to_trigger === 'undefined') return true;

        var stand_plan = agent.managed_stands_data[stand_id_to_trigger];
        stand_plan.activity.chosen_Activity = 'targetDBH';
        stand_plan.activity.target_year = TRIGGER_YEAR;
        stand_plan.activity.parameters = { dbhListProfile: 'default' }; 

        console.log(`[TEST] Calling agent.act() for stand ${stand_id_to_trigger} with profile: '${stand_plan.activity.parameters.dbhListProfile}'`);
        agent.act([stand_plan]);
        console.log(`[TEST] Signal fired. Execution expected in year ${TRIGGER_YEAR + 1}.`);
    }

    // --- VERIFICATION PHASE ---
    if (current_year === VERIFY_YEAR) {
        console.log(`\n[TEST] ==================== Verifying TargetDBH Execution in Year ${VERIFY_YEAR} ====================`);
        
        const stand_id_to_verify = agent.managed_stand_ids[0];
        
        agent.observe();
        
        var stand_data = agent.managed_stands_data[stand_id_to_verify];
        var volume_after = stand_data.iLand_stand_data.volume;

        // Read the flag that was used by the MegaSTP in the execution year.
        fmengine.standId = stand_id_to_verify;
        var dbhList_used = stand.flag('abe_param_dbhList');

        console.log("--- VERIFICATION RESULTS ---");
        console.log(`  - Stand ${stand_id_to_verify}: Volume = ${volume_after.toFixed(2)} m3/ha`);
        
        if (volume_after > 1.0 && volume_after < 1000) { // A plausible range for partial harvest
            console.log("    - [SUCCESS] Stand was partially harvested, as expected for targetDBH.");
        } else {
            console.error(`    - [FAILURE] Stand volume is unexpected (${volume_after}).`);
        }

        console.log("\n--- Detailed Stand Data Object ---");
        console.log(SoCo_Inspector._safeStringify(stand_data));

        console.log("\n--- Parameter Flag Verification ---");
        console.log("  - The 'abe_param_dbhList' flag used by the MegaSTP was:");
        console.log("    - " + JSON.stringify(dbhList_used));
        
        console.log(`[TEST] ==================== Verification Complete ====================\n`);
    }

    return true; 
};
/**
 * =================================================================================
 * TEST SCENARIO: Inspect Unit Aggregation
 * =================================================================================
 */

/**
 * =================================================================================
 * TEST SCENARIO: Inspect Unit Aggregation (Full Table)
 * =================================================================================
 */

Test_Scenarios.test_unit_aggregation = function(agent, current_year) {
    
    // --- SETUP: Pick 1 agent per owner type ---
    if (typeof Test_Scenarios._unit_test_agents === 'undefined') {
        Test_Scenarios._unit_test_agents = [];
        console.log("\n[TEST SETUP] Selecting agents...");
        for (var owner_type in socoabe.institution.owners) {
            var owner = socoabe.institution.owners[owner_type];
            if (owner.agent_list.length > 0) {
                Test_Scenarios._unit_test_agents.push(owner.agent_list[0].id);
            }
        }
    }

    if (current_year > 12) return false; 
    if (Test_Scenarios._unit_test_agents.indexOf(agent.id) === -1) return false;

    // --- LOGIC ---
    var unit = agent.unit_data;

    console.log(`\n=============================================================`);
    console.log(`[TEST] Unit Data for Agent ${agent.id} (Year ${current_year})`);
    console.log(`=============================================================`);
    
    // 1. METRICS
    console.log(`METRICS SUMMARY:`);
    console.log(`  Total Area:   ${unit.metrics.total_area} ha`);
    console.log(`  Mean Vol:     ${unit.metrics.mean_volume.toFixed(1)} m3/ha`);
    console.log(`  Activity Dist: ` + JSON.stringify(unit.metrics.activity_class_dist));
    console.log(`  Struct Dist:   ` + JSON.stringify(unit.metrics.structure_dist));
    
    // 2. STAND TABLE (The "Full Object")
    console.log(`\nSTAND INVENTORY TABLE (${unit.stands.length} rows):`);
    console.log(`ID   | ActClass   | Struct | Vol | Dens | H_dom | Spp | DomSp (Share) | Time | Ongoing`);
    console.log(`-----|------------|--------|-----|------|-------|-----|---------------|------|--------`);
    
    unit.stands.forEach(s => {
        // Simple formatting for the log
        var d_sp_str = `${s.dom_species} (${(s.dom_share*100).toFixed(0)}%)`;
        var line = `${s.stand_id}`.padEnd(5) + 
                   `| ${s.activity_class.substring(0,10)}`.padEnd(11) +
                   `| ${s.structure_class.substring(0,6)}`.padEnd(7) +
                   `| ${s.volume.toFixed(0)}`.padEnd(4) +
                   `| ${s.density.toFixed(0)}`.padEnd(5) + 
                   `| ${s.dom_top_height.toFixed(1)}`.padEnd(6) +
                   `| ${s.species_count}`.padEnd(4) +
                   `| ${d_sp_str}`.padEnd(14) + 
                   `| ${s.time_since_last}`.padEnd(5) + 
                   `| ${s.is_ongoing}`;
        console.log(line);
        
        // Log Full Species Vector for the first stand to verify deeply
        if (s === unit.stands[0]) {
             console.log(`     [DEBUG] Full Species Vector for Stand ${s.stand_id}: ` + JSON.stringify(s.species_composition));
        }
    });
    console.log(`=============================================================\n`);

    return false; 
};




Test_Scenarios.test_regime_assignment = function(agent, current_year) {
    // Run only in Year 1
    if (current_year !== 1) return false;
    
    // Filter: Test on 'big_agent_1'
    if (agent.id !== "big_agent_1") return false;

    console.log(`\n[TEST] Manually triggering Initialization for Agent ${agent.id}...`);
    
    // 1. OBSERVE (Populates classified data like structure_class)
    agent.observe(); 

    // 2. INIT LOGIC (Species & Regime)
    agent.assign_species_profiles();
    agent.assign_regimes();
    
    // 3. AGGREGATE (Check if data flows to unit_data)
    Perception.aggregate_unit(agent);

    console.log(`[TEST] Verifying Regime Assignment...`);
    
    let count_assigned = 0;
    let count_total = 0;
    let sample_logged = 0;
    
    for (let stand_id in agent.managed_stands_data) {
        let s = agent.managed_stands_data[stand_id];
        count_total++;
        
        // Check if a valid regime was assigned (not unassigned, not fallback)
        if (s.regime && s.regime.name && s.regime.name !== "unassigned" && s.regime.name !== "Fallback_NoMgmt") {
            count_assigned++;
            
            // Log first few successes
            if (sample_logged < 3) {
                console.log(`  Stand ${stand_id}:`);
                console.log(`    > Inputs: ${s.preference_focus} | ${s.classified.species_dominance} | ${s.classified.structure_class}`);
                console.log(`    > Output: '${s.regime.name}'`);
                sample_logged++;
            }
        } else {
             // Log failure details
             console.warn(`  Stand ${stand_id} FALLBACK. Inputs: ${s.preference_focus} | ${s.classified.species_dominance} | ${s.classified.structure_class}`);
        }
    }
    
    console.log(`Result: ${count_assigned} / ${count_total} stands assigned valid regime.`);

    // 4. TRACE AGGREGATION
    console.log(`[TEST] Tracing Aggregation Table (Sample row)...`);
    if (agent.unit_data.stands.length > 0) {
        let first = agent.unit_data.stands[0];
        console.log(`  ID: ${first.stand_id}`); 
        console.log(`  Regime: ${first.regime_name}`);
        console.log(`  Density: ${first.density ? first.density.toFixed(1) : 0} stems/ha`);
        console.log(`  Structure: ${first.structure_class}`);
        console.log(`  Activity Class: ${first.activity_class}`);
    } else {
        console.warn("  Unit Data Stands table is empty!");
    }
    console.log("--------------------------------------------------\n");

    return true; // STOP the normal cycle for this agent to avoid double execution
};
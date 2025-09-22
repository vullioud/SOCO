/**
 * SoCoABE iLand Test Runner
 */
console.log("--- Initializing iLand Test Run ---");
try {
    // ABE.js is expected to have already loaded all application code (Distributions, Helpers, Owner, etc.)
    // and the abe-lib into the global scope.

    // 1. Load the files that DEFINE the test suite functions.
    Globals.include('./abe/SOCO/tests/suit_of_tests/test_utils.js');
    Globals.include('./abe/SOCO/tests/suit_of_tests/test_integration.js');
    Globals.include('./abe/SOCO/tests/suit_of_tests/test_core.js');
    console.log("Test suites loaded.");

    // 2. Call the globally available test suite functions.
    console.log("\nExecuting test suites...");
    runUtilsTestSuite();
    runIntegrationTestSuite();
    runCoreTestSuite();

} catch(e) {
    console.error("Failed to execute the iLand test suite: " + e.message);
    console.error("Stack: " + e.stack);
}
console.log("\n--- iLand test run complete. ---\n");
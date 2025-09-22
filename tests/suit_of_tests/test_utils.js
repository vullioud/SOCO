/**
 * SoCoABE Test Suite: Utilities
 * Assumes Dependencies (Distributions, Helpers) are available globally.
 */
function runUtilsTestSuite() {
    console.log("\n--- Running Utility Test Suite ---");
    try {
        console.log("\nTesting Distributions...");
        const betaSample = Distributions.sampleBeta(2, 8);
        console.log(`  - Beta(2, 8) sample: ${betaSample.toFixed(4)}`);
        console.log("  Distributions Test: PASSED");
    } catch (e) { console.error("  Distributions Test: FAILED - " + e.message); }

    try {
        console.log("\nTesting Helpers...");
        const preferences = [0.8, 0.1, 0.1];
        const beliefs = [{ alpha: 4, beta: 6 }, { alpha: 5, beta: 5 }, { alpha: 6, beta: 4 }];
        const { overallSatisfaction } = Helpers.calculateSatisfaction(preferences, beliefs);
        console.log(`  - Overall Satisfaction score: ${overallSatisfaction.toFixed(4)}`);
        console.log("  Helpers Test: PASSED");
    } catch (e) { console.error("  Helpers Test: FAILED - " + e.message); }
}


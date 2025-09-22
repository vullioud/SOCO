/**
 * SoCoABE Test Suite: Integration
 * Assumes Dependencies (ESMapper, Configs, lib) are available globally.
 */
function runIntegrationTestSuite() {
    const isILand = typeof module === 'undefined';

    console.log("\n--- Running Integration Test Suite ---");

    try {
        console.log("\nTesting ESMapper (Unit Test)...");
        const mockStand = { volume: 350, basalArea: 40, age: 80, nspecies: 6, topHeight: 32, area: 2.5 };
        const esMapper = new ESMapper();
        const esScores = esMapper.mapForestMetricsToES(mockStand);
        console.log(`  - Mapped ES Scores - Production: ${esScores.production.toFixed(3)}`);
        console.log("  ESMapper Unit Test: PASSED");
    } catch (e) { console.error("  ESMapper Unit Test: FAILED - " + e.message); }

    try {
        console.log("\nTesting Configuration Files...");
        if (!OWNER_TYPE_CONFIGS || !PROTO_STPS) throw new Error("Config files not loaded.");
        console.log(`  - Loaded ${Object.keys(OWNER_TYPE_CONFIGS).length} owner types.`);
        console.log("  Configuration Files Test: PASSED");
    } catch (e) { console.error("  Configuration Files Test: FAILED - " + e.message); }

    try {
        console.log("\nTesting ABE Library Integration...");
        if (typeof lib === 'undefined' || typeof lib.harvest.clearcut !== 'function') {
            throw new Error("The 'abe-lib' library did not load correctly.");
        }
        console.log("  - 'lib' object is defined and accessible.");
        console.log("  ABE Library Test: PASSED");
    } catch(e) { console.error("  ABE Library Test: FAILED - " + e.message); }

    if (isILand) {
        console.log("\n--- Running iLand-Specific Live Test ---");
        try {
            if (fmengine.standIds.length === 0) {
                 console.warn("  - WARNING: No stands found. Did you 'Create' the model in the UI?");
            } else {
                const testStandId = fmengine.standIds[0];
                testESMapperWithRealStand(testStandId);
            }
        } catch(e) { console.error("  iLand Live Test: FAILED - " + e.message); }
    }
}

function testESMapperWithRealStand(standId) {
    console.log(`  Testing ESMapper with real stand ID: ${standId}`);
    fmengine.standId = standId;
    if (!stand || stand.id <= 0) { throw new Error(`Stand ${standId} invalid.`); }
    const esMapper = new ESMapper();
    const esScores = esMapper.mapForestMetricsToES(stand);
    console.log(`    - Stand ${standId} - Production Score: ${esScores.production.toFixed(4)}`);
    console.log("  iLand Live Test: PASSED");
}
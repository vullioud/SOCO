/**
 * SoCoABE NodeJS Test Runner
 */
const path = require('path');
const fs = require('fs');

console.log("--- SoCoABE NodeJS Test Runner ---");

// --- 1. Define Paths ---
const socoRoot = path.resolve(__dirname, '..');
const abeRoot = path.resolve(socoRoot, '..');
const abeLibRoot = path.join(abeRoot, 'abe-lib');

// --- 2. Setup Mock iLand Environment ---
global.Globals = {
    include: function(filePath) {
        const absolutePath = path.join(abeLibRoot, filePath);
        if (fs.existsSync(absolutePath)) { try { require(absolutePath); } catch (e) {} }
    }
};
global.console = console;

// --- 3. Manually Load ALL Dependencies into the Global Scope ---
console.log("Loading all modules into global scope...");
global.Distributions = require('../src/utils/distributions.js');
global.Helpers = require('../src/utils/helpers.js');
global.ESMapper = require('../src/core/ESMapper.js');
global.OWNER_TYPE_CONFIGS = require('../config/owner_types.js');
global.PROTO_STPS = require('../config/proto-stp.js');
global.SoCoABeAgent = require('../src/core/SoCoABeAgent.js');
global.Owner = require('../src/core/Owner.js');
// ** THE FIX IS HERE: Corrected path **
global.Institution = require('../src/core/Institution.js');

try {
    require(path.join(abeLibRoot, 'ABE-library.js'));
    console.log("ABE Library loaded.");
} catch (e) {
    console.error("FATAL: Could not load ABE-library.js.", e);
    process.exit(1);
}

// --- 4. Load Test Suite Functions ---
const suiteUtilsContent = fs.readFileSync(path.join(__dirname, 'suit_of_tests/test_utils.js'), 'utf8');
const suiteIntegrationContent = fs.readFileSync(path.join(__dirname, 'suit_of_tests/test_integration.js'), 'utf8');
const suiteCoreContent = fs.readFileSync(path.join(__dirname, 'suit_of_tests/test_core.js'), 'utf8');

eval(suiteUtilsContent);
eval(suiteIntegrationContent);
eval(suiteCoreContent);

// --- 5. Run Tests ---
console.log("\nExecuting test suites...");
runUtilsTestSuite();
runIntegrationTestSuite();
runCoreTestSuite();

console.log("\n--- NodeJS test run complete. ---\n");
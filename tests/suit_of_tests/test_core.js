/**
 * SoCoABE Test Suite: Core Classes
 */
function runCoreTestSuite() {
    // Dependencies are expected to be in the global scope
    const Owner = this.Owner || global.Owner;
    const SoCoABeAgent = this.SoCoABeAgent || global.SoCoABeAgent;
    const Distributions = this.Distributions || global.Distributions;
    const Helpers = this.Helpers || global.Helpers;
    const OWNER_TYPE_CONFIGS = this.OWNER_TYPE_CONFIGS || global.OWNER_TYPE_CONFIGS;
    const Institution = this.Institution || global.Institution; // Add Institution

    console.log("\n--- Running Core Classes Test Suite ---");

    // Test Owner and Agent (as before)
    try {
        console.log("\nTesting Owner & Agent Instantiation...");
        const mockStands = [{id: 1}, {id: 2}];
        const stateConfig = OWNER_TYPE_CONFIGS.state;
        const dependencies = { Helpers, Distributions, SoCoABeAgent };
        const stateOwner = new Owner('state', stateConfig, mockStands, dependencies);
        stateOwner.createAgents();
        if (stateOwner.agents.length !== stateConfig.targetAgentCount) throw new Error("Agent creation count mismatch.");
        console.log("  - Owner and Agent basic tests: PASSED");
    } catch (e) { console.error("  - Owner and Agent basic tests: FAILED - " + e.message); }

    // New Test for the Institution Class
    try {
        console.log("\nTesting Institution Class...");
        const mockStandIds = Array.from({length: 59}, (_, i) => i + 1);
        const mockStands = mockStandIds.map(id => ({ id: id }));

        const dependencies = {
            Helpers,
            Distributions,
            SoCoABeAgent,
            Owner,
            OWNER_TYPE_CONFIGS
        };

        const institution = new Institution();
        institution.initialize(mockStands, dependencies);

        if (institution.owners.length !== 3) {
            throw new Error(`Expected 3 owners, but created ${institution.owners.length}.`);
        }
        console.log(`  - Correctly created ${institution.owners.length} owners.`);

        const totalAgents = institution.agents.length;
        const expectedAgents = OWNER_TYPE_CONFIGS.state.targetAgentCount + 
                               OWNER_TYPE_CONFIGS.big_company.targetAgentCount + 
                               OWNER_TYPE_CONFIGS.small_private.targetAgentCount;
        
        if (totalAgents !== expectedAgents) {
            throw new Error(`Expected ${expectedAgents} total agents, but created ${totalAgents}.`);
        }
        console.log(`  - Correctly created ${totalAgents} total agents.`);

        const totalAssignedStands = institution.agents.reduce((sum, agent) => sum + agent.managedStands.length, 0);
        if (totalAssignedStands !== 59) {
            throw new Error(`Stand assignment mismatch. Assigned ${totalAssignedStands} of 59 stands.`);
        }
        console.log(`  - Correctly assigned all ${totalAssignedStands} stands.`);
        
        console.log("  Institution Class Test: PASSED");
    } catch (e) {
        console.error("  Institution Class Test: FAILED - " + e.message);
        console.error(e.stack);
    }
}
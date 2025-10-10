/**
 * SoCoABE Central Configuration File
 * This file assembles the final configuration object from the globally
 * available variables that were loaded by `Globals.include` in the main script.
 */

if (typeof SoCoABE_CONFIG === 'undefined') {
    var SoCoABE_CONFIG = {

        core_abe_agent_type: 'socoabe_controller', 
        warmupPeriod: 5,
        
        AGENT: {
            forgettingFactor: 0.1
        },

        ECOMETRICS: {
            benchmarkMemoryWindow: 20
        },        
         
        DEBUG: {
            enableAgentTurnover: true,
            forceSingleSTP: null,
            enableReassessment: true
        }
    };
}

// Make the final config object available globally for other scripts to use.
this.SoCoABE_CONFIG = SoCoABE_CONFIG;

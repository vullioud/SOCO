/**
 * SoCoABE Central Configuration File
 * This file assembles the final configuration object from the globally
 * available variables that were loaded by `Globals.include` in the main script.
 */

if (typeof SoCoABE_CONFIG === 'undefined') {
    var SoCoABE_CONFIG = {
        core_abe_agent_type: 'socoabe_controller', 

        INSTITUTION: {
            ownerTypeDistribution: [0.2, 0.7, 0.1], // [state, big_company, small_private] by AREA
        },

        AGENT: {
            forgettingFactor: 0.1
        }
    };
}

// Make the final config object available globally for other scripts to use.
this.SoCoABE_CONFIG = SoCoABE_CONFIG;

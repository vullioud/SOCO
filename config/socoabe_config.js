/**
 * SoCoABE Central Configuration File
 * This file assembles the final configuration object from the globally
 * available variables that were loaded by `Globals.include` in the main script.
 */

// NOTE: We do NOT use 'require'. OWNER_TYPE_CONFIGS and PROTO_STPS
// are expected to be in the global scope already.


if (typeof SoCoABE_CONFIG === 'undefined') {
    var SoCoABE_CONFIG = {
        // ... (OWNER_TYPE_CONFIGS and PROTO_STPS are unchanged)

        // C. Global Simulation Parameters
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

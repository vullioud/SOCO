// In config/socoabe_config.js

/**
 * SoCoABE Central Configuration File
 * This file assembles the final configuration object from the globally
 * available variables that were loaded by `Globals.include` in the main script.
 */

// NOTE: We do NOT use 'require'. OWNER_TYPE_CONFIGS and PROTO_STPS
// are expected to be in the global scope already.

if (typeof SoCoABE_CONFIG === 'undefined') {
    var SoCoABE_CONFIG = {
        // A. Owner and Agent Configurations
        OWNER_TYPE_CONFIGS: OWNER_TYPE_CONFIGS, // Accessing the global variable

        // B. Management Strategy (Proto-STP) Definitions
        PROTO_STPS: PROTO_STPS, // Accessing the global variable

        // C. Global Simulation Parameters
        INSTITUTION: {
            ownerTypeDistribution: [0.2, 0.7, 0.1], // [state, big_company, small_private] by AREA
            agentCounts: {
                'state': 4,
                'big_company': 10,
                'small_private': 4 // Note: We might want more small_private agents later
            }
        },

        AGENT: {
            // The rate at which agents forget past observations (0 to 1).
            forgettingFactor: 0.1
        }
    };
}

// Make the final config object available globally for other scripts to use.
this.SoCoABE_CONFIG = SoCoABE_CONFIG;

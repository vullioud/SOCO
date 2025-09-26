// In config/es_config.js

/**
 * Configuration parameters for the Ecosystem Service Mapper and Institution benchmarks.
 */
var ES_CONFIG = {
    benchmarkMemoryWindow: 20,
    BIOMASS_EXPANSION_FACTOR: 1.3,
    CARBON_FRACTION: 0.5,
};

// For NodeJS testing compatibility
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = ES_CONFIG;
}
// In config/es_config.js

/**
 * Configuration parameters for the Ecosystem Service Mapper and Institution benchmarks.
 */
var ES_CONFIG = {
    benchmarkMemoryWindow: 20,
    biodiversityWeights: { species: 0.5, structure: 0.4, deadwood: 0.1}
};

// For NodeJS testing compatibility
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = ES_CONFIG;
}
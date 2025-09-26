// In config/es_config.js

/**
 * Configuration parameters for the Ecosystem Service Mapper and Institution benchmarks.
 */
var ES_CONFIG = {
    benchmarkMemoryWindow: 20,
};

// For NodeJS testing compatibility
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = ES_CONFIG;
}
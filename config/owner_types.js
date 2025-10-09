// ----- Start of File: config/owner_types.js (Cleaned) -----

var OWNER_TYPE_CONFIGS = {
    'state': {
        esPreferences: [2, 8, 3],
        riskTolerance: { alpha: 2, beta: 8 },
        resources: { alpha: 3, scale: 20 },
        tenure: { min: 12, max: 45, alpha: 3.5, beta: 2.8},
        freedomDistribution: { alpha: 3, beta: 7 },
        ageDistribution: { mean: 35, stddev: 8 },
        // protoSTPs removed
        beliefPriors: {
            production: { alpha: 3, beta: 3 },
            biodiversity: { alpha: 5, beta: 2 },
            carbon: { alpha: 4, beta: 3 }
        }, 
        managementIntensity: { meanStandsPerAgent: 3, stddev: 1}
    },
    'big_company': {
        esPreferences: [8, 1, 2],
        riskTolerance: { alpha: 6, beta: 4 },
        resources: { alpha: 4, scale: 20 },
        tenure: { min: 8, max: 40, alpha: 3.0, beta: 3.2 },
        freedomDistribution: { alpha: 4, beta: 6 },
        ageDistribution: { mean: 32, stddev: 6 },
        // protoSTPs removed
        beliefPriors: {
            production: { alpha: 5, beta: 2 },
            biodiversity: { alpha: 2, beta: 5 },
            carbon: { alpha: 3, beta: 3 }, 
        }, 
        managementIntensity: { meanStandsPerAgent: 5, stddev: 1}
    },
    'small_private': {
        esPreferences: [4, 4, 2],
        riskTolerance: { alpha: 1, beta: 9 },
        resources: { alpha: 2, scale: 10 },
        tenure: { min: 5, max: 45, alpha: 3.2, beta: 2.6 },
        freedomDistribution: { alpha: 7, beta: 3 },
        ageDistribution: { mean: 45, stddev: 12 },
        // protoSTPs removed
        beliefPriors: {
            production: { alpha: 4, beta: 3 },
            biodiversity: { alpha: 4, beta: 3 },
            carbon: { alpha: 3, beta: 4}
        }, 
        managementIntensity: { meanStandsPerAgent: 1, stddev: 1},
    }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = OWNER_TYPE_CONFIGS;
}
// ----- End of File -----```

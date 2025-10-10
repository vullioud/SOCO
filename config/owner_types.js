
var OWNER_TYPE_CONFIGS = {
    'state': {
        esPreferences: [2, 8, 3],
        riskTolerance: { alpha: 2, beta: 8 },
        // CHANGED: Resources now use a Beta distribution to produce a value between 0 and 1.
        // State owners have a moderately high and stable resource level.
        resources: { alpha: 8, beta: 3 },
        tenure: { min: 12, max: 45, alpha: 3.5, beta: 2.8},
        freedomDistribution: { alpha: 3, beta: 7 },
        ageDistribution: { mean: 35, stddev: 8 },
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
        // CHANGED: Big companies consistently have high resources.
        resources: { alpha: 9, beta: 2 },
        tenure: { min: 8, max: 40, alpha: 3.0, beta: 3.2 },
        freedomDistribution: { alpha: 4, beta: 6 },
        ageDistribution: { mean: 32, stddev: 6 },
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
        // CHANGED: Small private owners have a wide, slightly skewed-low distribution of resources.
        resources: { alpha: 3, beta: 6 },
        tenure: { min: 5, max: 45, alpha: 3.2, beta: 2.6 },
        freedomDistribution: { alpha: 7, beta: 3 },
        ageDistribution: { mean: 45, stddev: 12 },
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
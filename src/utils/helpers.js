// ----- Start of Refactored File: src/utils/helpers.js -----

/**
 * Helper utilities for the SoCoABE model. Converted to an ES5-compatible object literal.
 */
var Helpers = {
    calculateSatisfaction: function(preferences, beliefs) {
        if (preferences.length !== beliefs.length) {
            throw new Error('Preferences and beliefs arrays must have the same length.');
        }
        var satisfactionByES = [];
        var totalSatisfaction = 0;
        var weightSum = 0;
        for (var i = 0; i < preferences.length; i++) {
            var weight = preferences[i];
            var belief = beliefs[i];
            var beliefMean = belief.alpha / (belief.alpha + belief.beta);
            var satisfaction = 1 - Math.abs(weight - beliefMean);
            satisfactionByES.push(satisfaction);
            totalSatisfaction += weight * satisfaction;
            weightSum += weight;
        }
        return {
            overallSatisfaction: weightSum > 0 ? totalSatisfaction / weightSum : 0,
            satisfactionByES: satisfactionByES
        };
    },

    calculateSwitchProbability: function(satisfaction, precision, inertia, steepness) {
        inertia = (typeof inertia === 'undefined') ? 0.5 : inertia;
        steepness = (typeof steepness === 'undefined') ? 2.0 : steepness;
        var dissatisfactionScore = (1 - satisfaction) * precision;
        return 1 / (1 + Math.exp(-steepness * (dissatisfactionScore - inertia)));
    },

    softmax: function(values, temperature) {
        temperature = (typeof temperature === 'undefined') ? 1.0 : temperature;
        var maxVal = Math.max.apply(null, values);
        var exp_values = values.map(function(v) { return Math.exp((v - maxVal) / temperature); });
        var sum_exp = exp_values.reduce(function(a, b) { return a + b; }, 0);
        return exp_values.map(function(v) { return v / sum_exp; });
    },

    assignStandsToAgents: function(standIds, numAgents, method) {
        method = (typeof method === 'undefined') ? 'equal' : method;
        var assignments = Array(numAgents).fill(0).map(function() { return []; });
        switch (method) {
            case 'equal':
                standIds.forEach(function(standId, index) { assignments[index % numAgents].push(standId); });
                break;
            case 'random':
                standIds.forEach(function(standId) { assignments[Math.floor(Math.random() * numAgents)].push(standId); });
                break;
            default:
                throw new Error('Unknown stand assignment method: ' + method);
        }
        return assignments;
    },
    
    normalizeVector: function(vector) {
        var sum = vector.reduce(function(a, b) { return a + b; }, 0);
        return sum === 0 ? vector : vector.map(function(v) { return v / sum; });
    },

    calculateStdDev: function(arr) {
        if (!arr || arr.length < 2) {
            return 0;
        }
        var n = arr.length;
        var mean = arr.reduce(function(a, b) { return a + b; }) / n;
        var variance = arr.map(function(x) { return Math.pow(x - mean, 2); }).reduce(function(a, b) { return a + b; }) / n;
        return Math.sqrt(variance);
    }
};

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Helpers;
} else {
    this.Helpers = Helpers;
}
// ----- End of Refactored File -----
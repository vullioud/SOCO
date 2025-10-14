// ----- Start of Refactored File: src/utils/distributions.js -----

/**
 * Statistical distribution utilities for the SoCoABE model.
 * This module provides static methods for sampling from various
 * probability distributions. Converted to an ES5-compatible object literal.
 */
var Distributions = {

    _spare: null, // Property for the Box-Muller transform

    /**
     * Samples from a Beta distribution.
     * @param {number} alpha - The alpha shape parameter (> 0).
     * @param {number} beta - The beta shape parameter (> 0).
     * @returns {number} A random sample from the Beta(alpha, beta) distribution.
     */
    sampleBeta: function(alpha, beta) {
        if (alpha <= 0 || beta <= 0) {
            throw new Error('Beta distribution parameters must be positive.');
        }
        // CORRECTED: Call sampleGamma using the object name
        var x = Distributions.sampleGamma(alpha, 1);
        var y = Distributions.sampleGamma(beta, 1);
        return x / (x + y);
    },

    /**
     * Samples from a Gamma distribution using the Marsaglia-Tsang method.
     * @param {number} alpha - The shape parameter (> 0).
     * @param {number} [scale=1] - The scale parameter.
     * @returns {number} A random sample from the Gamma(alpha, scale) distribution.
     */
    sampleGamma: function(alpha, scale) {
        scale = (typeof scale === 'undefined') ? 1 : scale; // Default value for scale
        if (alpha <= 0) {
            throw new Error('Gamma distribution alpha parameter must be positive.');
        }

        if (alpha < 1) {
            var u = Math.random();
            // CORRECTED: Call sampleGamma using the object name
            return Distributions.sampleGamma(alpha + 1, scale) * Math.pow(u, 1 / alpha);
        }

        var d = alpha - 1 / 3;
        var c = 1 / Math.sqrt(9 * d);

        while (true) {
            var x, v;
            do {
                // CORRECTED: Call sampleNormal using the object name
                x = Distributions.sampleNormal(0, 1);
                v = 1 + c * x;
            } while (v <= 0);

            v = v * v * v;
            var u = Math.random();

            if (u < 1 - 0.0331 * x * x * x * x) {
                return d * v * scale;
            }

            if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
                return d * v * scale;
            }
        }
    },

    /**
     * Samples from a Dirichlet distribution.
     * @param {number[]} alphas - An array of alpha parameters.
     * @returns {number[]} An array of samples that sum to 1.
     */
    sampleDirichlet: function(alphas) {
        var samples = alphas.map(function(alpha) {
            return Distributions.sampleGamma(alpha, 1);
        });
        var sum = samples.reduce(function(acc, val) { return acc + val; }, 0);
        return samples.map(function(s) { return s / sum; });
    },

    /**
     * Samples from a Normal (Gaussian) distribution using the Box-Muller transform.
     * @param {number} [mean=0] - The mean of the distribution.
     * @param {number} [stddev=1] - The standard deviation of the distribution.
     * @returns {number} A random sample from the Normal(mean, stddev) distribution.
     */
    sampleNormal: function(mean, stddev) {
        mean = (typeof mean === 'undefined') ? 0 : mean;
        stddev = (typeof stddev === 'undefined') ? 1 : stddev;

        // CORRECTED: Access _spare property using the object name
        if (Distributions._spare) {
            var result = Distributions._spare;
            Distributions._spare = null;
            return result;
        } else {
            var u = Math.random();
            var v = Math.random();
            var mag = stddev * Math.sqrt(-2 * Math.log(u));
            Distributions._spare = mag * Math.cos(2 * Math.PI * v) + mean;
            return mag * Math.sin(2 * Math.PI * v) + mean;
        }
    },

    /**
     * Updates Beta distribution parameters based on a new observation and a forgetting factor.
     * @param {number} alpha - Current alpha parameter.
     * @param {number} beta - Current beta parameter.
     * @param {number} observation - The new observation (a value between 0 and 1).
     * @param {number} [forgettingFactor=0.1] - The rate at which to discount past observations (φ).
     * @returns {object} An object containing the new alpha and beta parameters: { alpha, beta }.
     */
    updateBeta: function(alpha, beta, observation, forgettingFactor) {
        forgettingFactor = (typeof forgettingFactor === 'undefined') ? 0.1 : forgettingFactor;
        var newAlpha = (1 - forgettingFactor) * alpha + observation;
        var newBeta = (1 - forgettingFactor) * beta + (1 - observation);
        return { alpha: newAlpha, beta: newBeta };
    }
};

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Distributions;
} else {
    this.Distributions = Distributions;
}
// ----- End of Refactored File -----
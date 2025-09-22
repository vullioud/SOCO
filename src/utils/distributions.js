/**
 * Statistical distribution utilities for the SoCoABE model.
 * This module provides static methods for sampling from various
 * probability distributions.
 */

// In JavaScript, a 'class' is a blueprint for creating objects.
// By using 'static' methods, we are creating utility functions that
// belong to the class itself, not to an instance of it. This is similar
// to creating a collection of functions in an R script or a Julia module.
// You can call them directly, e.g., Distributions.sampleBeta(...), without
// needing to create an instance like 'new Distributions()'.

class Distributions {

    /**
     * Samples from a Beta distribution.
     * @param {number} alpha - The alpha shape parameter (> 0).
     * @param {number} beta - The beta shape parameter (> 0).
     * @returns {number} A random sample from the Beta(alpha, beta) distribution.
     */
    static sampleBeta(alpha, beta) {
        
        // Basic input validation. 'throw new Error' stops execution and
        // reports an error, which is helpful for debugging.
        if (alpha <= 0 || beta <= 0) {
            throw new Error('Beta distribution parameters must be positive.');
        }

        // 'const' declares a block-scoped variable that cannot be reassigned.
        // It's good practice to use 'const' by default and 'let' if you need to reassign.
        // 'this' in a static method refers to the class itself (Distributions).
        const x = this.sampleGamma(alpha, 1);
        const y = this.sampleGamma(beta, 1);
        return x / (x + y);
    }


    /**
     * Samples from a Gamma distribution using the Marsaglia-Tsang method.
     * @param {number} alpha - The shape parameter (> 0).
     * @param {number} [scale=1] - The scale parameter.
     * @returns {number} A random sample from the Gamma(alpha, scale) distribution.
     */
    static sampleGamma(alpha, scale = 1) {
        if (alpha <= 0) {
            throw new Error('Gamma distribution alpha parameter must be positive.');
        }

        if (alpha < 1) {
            const u = Math.random();
            return this.sampleGamma(alpha + 1, scale) * Math.pow(u, 1 / alpha);
        }

        const d = alpha - 1 / 3;
        const c = 1 / Math.sqrt(9 * d);

        while (true) {
            let x, v; // 'let' declares a block-scoped variable that can be reassigned.
            do {
                x = this.sampleNormal(0, 1);
                v = 1 + c * x;
            } while (v <= 0);

            v = v * v * v;
            const u = Math.random();

            if (u < 1 - 0.0331 * x * x * x * x) {
                return d * v * scale;
            }

            if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
                return d * v * scale;
            }
        }
    }


    /**
     * Samples from a Dirichlet distribution.
     * @param {number[]} alphas - An array of alpha parameters.
     * @returns {number[]} An array of samples that sum to 1.
     */
    static sampleDirichlet(alphas) {
        // '.map()' is a standard array method in JS, similar to R's `lapply` or `purrr::map`.
        // It creates a new array by applying a function to each element of the original array.
        const samples = alphas.map(alpha => this.sampleGamma(alpha, 1));

        // '.reduce()' is another standard array method, similar to R's `Reduce`.
        // It accumulates a single value by iterating through the array.
        const sum = samples.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

        return samples.map(s => s / sum);
    }

    /**
     * Samples from a Normal (Gaussian) distribution using the Box-Muller transform.
     * @param {number} [mean=0] - The mean of the distribution.
     * @param {number} [stddev=1] - The standard deviation of the distribution.
     * @returns {number} A random sample from the Normal(mean, stddev) distribution.
     */
    static sampleNormal(mean = 0, stddev = 1) {
        // The '_' prefix is a common convention in JS to indicate a "private" property,
        // though it's not enforced by the language. Here, `this._spare` stores an extra
        // value from the Box-Muller transform for efficiency. -> https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
        if (!this._spare) {
            const u = Math.random();
            const v = Math.random();
            const mag = stddev * Math.sqrt(-2 * Math.log(u));
            this._spare = mag * Math.cos(2 * Math.PI * v) + mean;
            return mag * Math.sin(2 * Math.PI * v) + mean;
        } else {
            const result = this._spare;
            this._spare = null; // Clear the spare value
            return result;
        }
    }

    /**
     * Updates Beta distribution parameters based on a new observation and a forgetting factor.
     * @param {number} alpha - Current alpha parameter.
     * @param {number} beta - Current beta parameter.
     * @param {number} observation - The new observation (a value between 0 and 1).
     * @param {number} [forgettingFactor=0.1] - The rate at which to discount past observations (φ).
     * @returns {object} An object containing the new alpha and beta parameters: { alpha, beta }.
     */
    static updateBeta(alpha, beta, observation, forgettingFactor = 0.1) {
        const newAlpha = (1 - forgettingFactor) * alpha + observation;
        const newBeta = (1 - forgettingFactor) * beta + (1 - observation);
        // Returning an object literal is a common way to return multiple values.
        return { alpha: newAlpha, beta: newBeta };
    }
}


/* example usage
console.log(Distributions.sampleGamma(1,1));
console.log(Distributions.sampleNormal(0,1));
console.log(Distributions.sampleBeta(2,5));
console.log(Distributions.sampleDirichlet([1,2,3]));
console.log(Distributions.updateBeta(2,5,0.7,0.1)); 
*/


// Universal Module Definition: Make the class available in different environments
if (typeof module !== 'undefined' && module.exports) {
    // We are in a NodeJS environment -> use module.exports
    module.exports = Distributions;
} else {
    // We are in a browser or iLand environment -> attach to the global object
    this.Distributions = Distributions;
}

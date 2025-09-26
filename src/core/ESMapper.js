// In src/core/ESMapper.js

/**
 * Maps raw iLand forest metrics to normalized Ecosystem Service (ES) scores using a dynamic,
 * landscape-wide benchmark. This class is a stateless utility.
 */
class ESMapper {

    /**
     * A safe normalization helper function.
     * @param {number} value The value to normalize.
     * @param {number} min The minimum of the range.
     * @param {number} max The maximum of the range.
     * @returns {number} A score between 0 and 1.
     */
    normalize(value, min, max) {
        if (max - min === 0) return 0.5; // Avoid division by zero; return a neutral value.
        const score = (value - min) / (max - min);
        return Math.max(0, Math.min(1, score)); // Clamp the score between 0 and 1.
    }

    /**
     * Extracts relevant metrics from an iLand FMStand object.
     */
    extractiLandMetrics(stand) {
        return {
            volume: stand.volume,
            basalArea: stand.basalArea,
            age: stand.age,
            speciesCount: stand.nspecies,
            topHeight: stand.topHeight,
            area: stand.area
        };
    }

    /**
     * Maps extracted forest metrics to a set of normalized ES scores.
     * @param {object} stand - The iLand stand object.
     * @param {object} benchmark - The dynamic benchmark object from the Institution.
     * @returns {object} An object with ES scores {production, biodiversity, carbon}.
     */
    mapForestMetricsToES(stand, benchmark) {
        if (!stand || !benchmark || Object.keys(benchmark).length === 0) {
            // Return neutral scores if data is missing to prevent errors
            return { production: 0.5, biodiversity: 0.5, carbon: 0.5 };
        }

        const metrics = this.extractiLandMetrics(stand);

        return {
            production: this.calculateProductionES(metrics, benchmark.mai),
            biodiversity: this.calculateBiodiversityES(metrics, benchmark),
            carbon: this.calculateCarbonES(metrics, benchmark.volume)
        };
    }

    /**
     * Calculates the Production ES score based on Mean Annual Increment.
     */
    calculateProductionES(metrics, benchmark) {
        const mai = metrics.age > 0 ? metrics.volume / metrics.age : 0;
        return this.normalize(mai, benchmark.min, benchmark.max);
    }

    /**
     * Calculates the Biodiversity ES score as a composite index.
     */
    calculateBiodiversityES(metrics, benchmark) {
        const speciesScore = this.normalize(metrics.speciesCount, benchmark.speciesCount.min, benchmark.speciesCount.max);
        const structureScore = this.normalize(metrics.topHeight, benchmark.topHeight.min, benchmark.topHeight.max);
        
        // A simple weighted average. This can be made more complex later.
        return (speciesScore * 0.5) + (structureScore * 0.5);
    }

    /**
     * Calculates the Carbon Storage ES score based on total biomass carbon.
     */
    calculateCarbonES(metrics, benchmark) {
        const carbonStock = metrics.volume;

        const minCarbon = benchmark.min;
        const maxCarbon = benchmark.max;

        return this.normalize(carbonStock, minCarbon, maxCarbon);
    }

    /**
     * Adds random noise to observations based on an agent's resource level.
     */
    addObservationNoise(esScores, resourceLevel) {
        const noiseLevel = Math.max(0, (1 - resourceLevel) * 0.1);
        const noisyScores = {};
        Object.keys(esScores).forEach(es => {
            const noise = (Math.random() - 0.5) * 2 * noiseLevel;
            noisyScores[es] = Math.max(0, Math.min(1, esScores[es] + noise));
        });
        return noisyScores;
    }
}

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ESMapper;
} else {
    this.ESMapper = ESMapper;
}
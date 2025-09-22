/**
 * Maps raw iLand forest metrics to normalized Ecosystem Service (ES) scores.
 * This class acts as the bridge between the simulation's state and the agent's perception.
 */
class ESMapper {

    /**
     * Extracts relevant metrics from an iLand FMStand object.
     * This is the primary integration point with the iLand ABE's C++ backend.
     * @param {object} stand - The iLand stand object (from fmengine.stand(id)).
     * @returns {object} An object containing key forest metrics.
     */
    extractiLandMetrics(stand) {
        // These methods and properties are defined in the iLand ABE C++ source
        // (fmstand.h, fomescript.h) and are available on the 'stand' object in JS.
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
     * @returns {object} An object with ES scores {production, biodiversity, carbon}.
     */
    mapForestMetricsToES(stand) {
        if (!stand) {
            throw new Error('A valid iLand stand object is required for ES mapping.');
        }

        const metrics = this.extractiLandMetrics(stand);

        // These mapping functions can be made more complex later. For now, they
        // provide a simple, functional baseline.
        return {
            production: this.calculateProductionES(metrics),
            biodiversity: this.calculateBiodiversityES(metrics),
            carbon: this.calculateCarbonES(metrics)
        };
    }

    /**
     * Calculates the Production ES score [0, 1].
     * @param {object} metrics - The extracted forest metrics.
     * @returns {number}
     */
    calculateProductionES(metrics) {
        // A simple proxy for productivity is Mean Annual Increment (Volume / Age).
        const productivity = metrics.age > 0 ? metrics.volume / metrics.age : 0;
        const maxProductivity = 15; // A calibrated threshold representing max expected m3/ha/yr.
        return Math.min(1.0, productivity / maxProductivity);
    }

    /**
     * Calculates the Biodiversity ES score [0, 1].
     * @param {object} metrics - The extracted forest metrics.
     * @returns {number}
     */
    calculateBiodiversityES(metrics) {
        // A composite score from species richness and structural diversity.
        const speciesDiversity = Math.min(1.0, metrics.speciesCount / 8); // Assume 8 species = high diversity.
        const structuralDiversity = Math.min(1.0, metrics.topHeight / 40); // Assume 40m top height = mature structure.
        return (speciesDiversity + structuralDiversity) / 2;
    }

    /**
     * Calculates the Carbon Storage ES score [0, 1].
     * @param {object} metrics - The extracted forest metrics.
     * @returns {number}
     */
    calculateCarbonES(metrics) {
        // Carbon is roughly proportional to standing volume.
        const maxCarbonVolume = 600; // A calibrated threshold for max volume in m3/ha. These metrics need to be empirically derived.
        return Math.min(1.0, metrics.volume / maxCarbonVolume);
    }

    /**
     * Adds random noise to observations based on an agent's resource level.
     * @param {object} esScores - The calculated ES scores.
     * @param {number} resourceLevel - The agent's resource level (higher is better).
     * @returns {object} The ES scores with added noise.
     */
    addObservationNoise(esScores, resourceLevel) {
        // Higher resources = less noise. Max noise is 20% for lowest resources.
        const noiseLevel = Math.max(0, (1 - resourceLevel) * 0.2);
        const noisyScores = {};

        Object.keys(esScores).forEach(es => {
            const noise = (Math.random() - 0.5) * 2 * noiseLevel; // Symmetrical noise
            noisyScores[es] = Math.max(0, Math.min(1, esScores[es] + noise)); // clamping
        });

        return noisyScores;
    }
}

// Universal Module Definition for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ESMapper;
} else {
    this.ESMapper = ESMapper;
}
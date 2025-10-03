// In src/core/ForestMetricsMapper.js -- REPLACE THE ENTIRE FILE CONTENT

/**
 * A stateless utility class for mapping raw stand metrics to normalized scores
 * and classifying stand properties.
 */
class ForestMetricsMapper {
    normalize(value, min, max) {
        if (max - min === 0) return 0.5;
        const score = (value - min) / (max - min);
        return Math.max(0, Math.min(1, score));
    }

    /**
     * Classifies a stand's structure based on its normalized DBH std dev score.
     * @param {number} score - A value between 0 and 1.
     * @returns {string} 'even_aged', 'multi_layered', or 'complex_uneven_aged'.
     */
    classifyStructure(score) {
        if (score < 0.3) return 'even_aged';
        if (score < 0.7) return 'multi_layered';
        return 'complex_uneven_aged';
    }

    /**
     * Classifies a stand's species composition.
     * @param {object} composition - The composition object from the StandSnapshot.
     * @returns {string} 'conifer_dominated', 'broadleaf_dominated', or 'mixed'.
     */
    classifySpecies(composition) {
        const coniferSpecies = ['piab', 'pisy', 'abal', 'lade', 'psme', 'pini'];
        let coniferBA = 0;
        for (const species in composition.distribution) {
            if (coniferSpecies.includes(species)) {
                coniferBA += composition.distribution[species];
            }
        }
        if (coniferBA > 0.6) return 'conifer_dominated';
        if (coniferBA < 0.4) return 'broadleaf_dominated';
        return 'mixed';
    }
}

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ForestMetricsMapper;
} else {
    this.ForestMetricsMapper = ForestMetricsMapper;
}
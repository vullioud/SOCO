// In: SOCO/src/core/ForestMetricsMapper.js (ES5 Compatible)

function ForestMetricsMapper() {}

ForestMetricsMapper.prototype.normalize = function(value, min, max) {
    if (max - min === 0) return 0.5;
    var score = (value - min) / (max - min);
    return Math.max(0, Math.min(1, score));
};

ForestMetricsMapper.prototype.classifyStructure = function(score) {
    if (score < 0.3) return 'even_aged';
    if (score < 0.7) return 'multi_layered';
    return 'complex_uneven_aged';
};

ForestMetricsMapper.prototype.classifySpecies = function(composition) {
    var coniferSpecies = ['piab', 'pisy', 'abal', 'lade', 'psme', 'pini'];
    var coniferBA = 0;
    for (var species in composition.distribution) {
        if (coniferSpecies.indexOf(species) !== -1) {
            coniferBA += composition.distribution[species];
        }
    }
    if (coniferBA > 0.6) return 'conifer_dominated';
    if (coniferBA < 0.4) return 'broadleaf_dominated';
    return 'mixed';
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ForestMetricsMapper;
} else {
    this.ForestMetricsMapper = ForestMetricsMapper;
}
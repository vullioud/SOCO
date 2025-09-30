// In src/core/ESMapper.js

/**
 * Maps a rich StandSnapshot object to normalized Ecosystem Service (ES) scores
 * using a dynamic, landscape-wide benchmark. This class is a stateless utility.
 */
class ESMapper {
    normalize(value, min, max) {
        if (max - min === 0) return 0.5;
        const score = (value - min) / (max - min);
        return Math.max(0, Math.min(1, score));
    }

    mapForestMetricsToES(snapshot, benchmark) {
        if (!snapshot || !benchmark || Object.keys(benchmark).length === 0) {
            return { production: 0.5, biodiversity: 0.5, carbon: 0.5 };
        }
        return {
            production: this.calculateProductionES(snapshot, benchmark.mai),
            biodiversity: this.calculateBiodiversityES(snapshot, benchmark),
            carbon: this.calculateCarbonES(snapshot, benchmark.volume)
        };
    }

    calculateProductionES(snapshot, maiBenchmark) {
        if (!maiBenchmark) return 0.5;
        const mai = snapshot.age > 0 ? snapshot.volume / snapshot.age : 0;
        return this.normalize(mai, maiBenchmark.min, maiBenchmark.max);
    }

    
    calculateBiodiversityES(snapshot, fullBenchmark) {
        const speciesBench = fullBenchmark.speciesCount || { min: 0, max: 10 };
        const structureBench = fullBenchmark.topHeight || { min: 0, max: 15 };

        const speciesScore = this.normalize(snapshot.composition.speciesCount, speciesBench.min, speciesBench.max);
        const structureScore = this.normalize(snapshot.topHeight, structureBench.min, structureBench.max);

        // Reverted to a simple 50/50 weighted average for stability.
        return (speciesScore * 0.5) + (structureScore * 0.5);
    }

    calculateCarbonES(snapshot, volumeBenchmark) {
        if (!volumeBenchmark) return 0.5;
        return this.normalize(snapshot.volume, volumeBenchmark.min, volumeBenchmark.max);
    }
    
    addObservationNoise(esScores, resourceLevel) {
        const noiseLevel = Math.max(0, (1 - resourceLevel) * 0.2);
        const noisyScores = {};
        Object.keys(esScores).forEach(function(es) {
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
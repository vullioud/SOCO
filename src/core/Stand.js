// In src/core/StandSnapshot.js

/**
 * A data-rich class that represents the state of a single iLand stand at a specific point in time.
 * This simplified version avoids complex tree and deadwood iterations for stability.
 */
class StandSnapshot {
    constructor(standId) {
        fmengine.standId = standId;
        if (!stand || stand.id <= 0) {
            this.isValid = false;
            return;
        }
        this.isValid = true;

        // --- Basic Metrics ---
        this.id = stand.id;
        this.area = stand.area;
        this.age = stand.age;
        this.volume = stand.volume;
        this.basalArea = stand.basalArea;
        this.topHeight = stand.topHeight;

        // --- Composition ---
        this.composition = {
            speciesCount: stand.nspecies,
            dominantSpecies: stand.nspecies > 0 ? stand.speciesId(0) : 'none',
            distribution: {}
        };
        for (let i = 0; i < stand.nspecies; i++) {
            this.composition.distribution[stand.speciesId(i)] = stand.relSpeciesBasalArea(i);
        }

        // --- Structure (Simplified) ---
        this.structure = {
            dbhMean: stand.dbh
        };

        // --- History ---
        this.history = {
            lastActivity: stand.lastActivity,
            yearsSinceLastActivity: stand.elapsed
        };
    }
}

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StandSnapshot;
} else {
    this.StandSnapshot = StandSnapshot;
}
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

        // --- Structure ---
        this.structure = {
            dbhMean: stand.dbh,
            dbhStdDev: 0 
        };

        stand.trees.loadAll();
        const dbhValues = [];
        for (let i = 0; i < stand.trees.count; i++) {
            dbhValues.push(stand.trees.tree(i).dbh);
        }
        this.structure.dbhStdDev = Helpers.calculateStdDev(dbhValues);

        // --- History ---
        this.history = {
            lastActivity: stand.lastActivity,
            yearsSinceLastActivity: stand.elapsed
        };

        this.nextAssessmentYear = Number(stand.flag('nextAssessmentYear')) || 0;
    }
}

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StandSnapshot;
} else {
    this.StandSnapshot = StandSnapshot;
}
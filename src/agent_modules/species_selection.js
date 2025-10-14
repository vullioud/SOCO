function SpeciesSelectionModule(agent) {
    this.agent = agent;
}

/**
 * Determines the species strategy based on owner type and agent's risk tolerance.
 * @returns {string} The name of the species strategy (e.g., 'pnv_1_1', 'Productive').
 */
SpeciesSelectionModule.prototype.determineSpeciesStrategy = function() {
    var ownerType = this.agent.owner.type;
    var risk = this.agent.riskTolerance;

    if (this.agent.preferences[1] < 0.1) {
         return 'IST';
    }

    switch (ownerType) {
        case 'state':
            if (risk < 0.3) return 'pnv_1_1';
            return 'pnv_1_2';
        
        case 'big_company':
            if (risk > 0.7) return 'IST';
            return 'Productive';

        case 'small_private':
            if (risk < 0.2) return 'pnv_1_1';
            if (risk > 0.8) return 'Productive';
            return 'pnv_1_2';

        default:
            return 'pnv_1_2';
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpeciesSelectionModule;
} else {
    this.SpeciesSelectionModule = SpeciesSelectionModule;
}
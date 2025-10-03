// ----- Start of File: src/agent_modules/species_selection.js -----

class SpeciesSelectionModule {
    constructor(agent) {
        this.agent = agent;
    }

    /**
     * Determines the species strategy based on owner type and agent's risk tolerance.
     * @returns {string} The name of the species strategy (e.g., 'pnv_1_1', 'Productive').
     */
    determineSpeciesStrategy() {
        const ownerType = this.agent.owner.type;
        const risk = this.agent.riskTolerance; // A value between 0 (risk-averse) and 1 (risk-seeking)

        // No species choice (simple default)
        if (this.agent.preferences[1] < 0.1) { // Example: low preference for biodiversity
             return 'IST'; // Default to most productive
        }

        switch (ownerType) {
            case 'state':
                if (risk < 0.3) return 'pnv_1_1'; // Risk-averse state owner prefers climate adapted PNV
                return 'pnv_1_2'; // Default for state is current PNV
            
            case 'big_company':
                if (risk > 0.7) return 'IST'; // Risk-seeking company goes for high productivity
                return 'Productive'; // Default for company is productive species mix

            case 'small_private':
                if (risk < 0.2) return 'pnv_1_1'; // Very risk-averse private owner adapts to climate change
                if (risk > 0.8) return 'Productive'; // Risk-seeking private owner tries for production
                return 'pnv_1_2'; // Default for private is to mimic natural composition

            default:
                return 'pnv_1_2'; // A safe default
        }
    }
}


if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpeciesSelectionModule;
} else {
    this.SpeciesSelectionModule = SpeciesSelectionModule;
}

// ----- End of File: src/agent_modules/species_selection.js -----
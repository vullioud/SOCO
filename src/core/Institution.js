/**
 * Represents the top-level Institution in the SoCoABE model.
 * This class is responsible for creating the Owner population and tracking
 * landscape-level metrics.
 */

class Institution {
    constructor() {
        // Defines the proportion of the landscape managed by each owner type.
        // [state, big_company, small_private]
            this.ownerTypeDistribution = null; 
        this.owners = [];
        this.agents = [];
        this.year = 0;

        // Landscape-level metrics
        this.nationalMetrics = {
            totalProduction: 0,
            averageBiodiversity: 0,
            totalCarbon: 0,
            averageSatisfaction: 0.5
        };
    }

    /**
     * Initializes the entire agent hierarchy.
     * @param {object[]} standData - An array of all stand objects in the simulation.
     * @param {object} dependencies - An object containing all required class constructors.
     */
    initialize(standData, dependencies) {
        this.ownerTypeDistribution = SoCoABE_CONFIG.INSTITUTION.ownerTypeDistribution;

        if (!standData || standData.length === 0) {
            throw new Error("Institution requires a non-empty array of stand data to initialize.");
        }

        const standsByOwner = this.distributeStandsToOwners(standData);

        // Clear any previous state
        this.owners = [];
        this.agents = [];

        // Create owner instances for each type that has stands assigned
        const self = this; 

        // Create owner instances for each type that has stands assigned
        Object.keys(standsByOwner).forEach(ownerType => {
            if (standsByOwner[ownerType].length > 0) {
                const ownerConfig = dependencies.OWNER_TYPE_CONFIGS[ownerType];
                if (!ownerConfig) {
                    throw new Error(`Configuration for owner type '${ownerType}' not found.`);
                }
                
                const owner = new dependencies.Owner(ownerType, ownerConfig, standsByOwner[ownerType], dependencies);
                owner.createAgents();
                
                // Now use the safe reference 'self' instead of 'this'
                self.owners.push(owner);
                self.agents.push(...owner.agents);
            }
        });
        console.log(`Institution initialized with ${this.owners.length} owners and ${this.agents.length} total agents.`);
    }

    /**
     * Distributes a list of stands among owner types based on the institutional distribution.
     * @param {object[]} standData - An array of all stand objects.
     * @returns {object} An object where keys are owner types and values are arrays of stand objects.
     */
 distributeStandsToOwners(standData) {
    const [stateProp, companyProp, privateProp] = this.ownerTypeDistribution;
    const totalStands = standData.length;

    // Shuffle stands for random assignment
    const shuffledStands = [...standData].sort(() => Math.random() - 0.5);

    const stateCount = Math.floor(totalStands * stateProp);
    const companyCount = Math.floor(totalStands * companyProp);

        return {
        state: shuffledStands.slice(0, stateCount),
        big_company: shuffledStands.slice(stateCount, stateCount + companyCount),
        small_private: shuffledStands.slice(stateCount + companyCount)
        };
    }
}

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Institution;
} else {
    this.Institution = Institution;
}
// In src/core/Institution.js

class Institution {
  constructor() {
        this.ownerTypeDistribution = null; 
        this.owners = [];
        this.agents = [];
        this.year = 0;
        this.benchmarkHistory = [];
        this.dynamicBenchmark = {};
        this.memoryWindow = ES_CONFIG.benchmarkMemoryWindow;
        this.deadwoodCache = {}; // We keep this for future re-introduction
    }

    initialize(standData, dependencies) {
        this.ownerTypeDistribution = SoCoABE_CONFIG.INSTITUTION.ownerTypeDistribution;
        if (!standData || standData.length === 0) {
            throw new Error("Institution requires non-empty stand data.");
        }
        const standsByOwner = this.distributeStandsToOwners(standData);
        this.owners = [];
        this.agents = [];

        Object.keys(standsByOwner).forEach(ownerType => {
            if (standsByOwner[ownerType].length > 0) {
                const ownerConfig = dependencies.OWNER_TYPE_CONFIGS[ownerType];
                const owner = new dependencies.Owner(this, ownerType, ownerConfig, standsByOwner[ownerType], dependencies);
                owner.createAgents();
                this.owners.push(owner);
                this.agents.push(...owner.agents);
            }
        });
        console.log(`Institution initialized with ${this.owners.length} owners and ${this.agents.length} total agents.`);
    }

    /**
     * SIMPLIFIED VERSION: Surveys the landscape for basic, direct stand properties only.
     * This avoids heavy iteration over tree lists or deadwood lists to prevent crashes.
     */
  updateDynamicBenchmark(year) {
        this.year = year; // Store the current year

        const currentYearStats = {
            mai: { min: Infinity, max: -Infinity },
            volume: { min: Infinity, max: -Infinity },
            speciesCount: { min: Infinity, max: -Infinity },
            topHeight: { min: Infinity, max: -Infinity },
            dbhStdDev: { min: Infinity, max: -Infinity },
            totalDeadwood: { min: Infinity, max: -Infinity } // Keep the structure, but it will be zero
        };

        const allStandIds = fmengine.standIds;
        allStandIds.forEach(id => {
            fmengine.standId = id;
            if (stand && stand.id > 0) {
                // Direct properties
                const mai = stand.age > 0 ? stand.volume / stand.age : 0;
                currentYearStats.mai.min = Math.min(currentYearStats.mai.min, mai);
                currentYearStats.mai.max = Math.max(currentYearStats.mai.max, mai);
                currentYearStats.volume.min = Math.min(currentYearStats.volume.min, stand.volume);
                currentYearStats.volume.max = Math.max(currentYearStats.volume.max, stand.volume);
                currentYearStats.speciesCount.min = Math.min(currentYearStats.speciesCount.min, stand.nspecies);
                currentYearStats.speciesCount.max = Math.max(currentYearStats.speciesCount.max, stand.nspecies);
                currentYearStats.topHeight.min = Math.min(currentYearStats.topHeight.min, stand.topHeight);
                currentYearStats.topHeight.max = Math.max(currentYearStats.topHeight.max, stand.topHeight);

                // Safely calculate DBH Std Dev
                stand.trees.loadAll();
                const dbhValues = [];
                for (let i = 0; i < stand.trees.count; i++) {
                    dbhValues.push(stand.trees.tree(i).dbh);
                }
                const dbhStdDev = Helpers.calculateStdDev(dbhValues);
                currentYearStats.dbhStdDev.min = Math.min(currentYearStats.dbhStdDev.min, dbhStdDev);
                currentYearStats.dbhStdDev.max = Math.max(currentYearStats.dbhStdDev.max, dbhStdDev);
                
                // Set deadwood to zero for now
                currentYearStats.totalDeadwood.min = 0;
                currentYearStats.totalDeadwood.max = 0;
            }
        });

        this.benchmarkHistory.push(currentYearStats);

        if (this.benchmarkHistory.length > this.memoryWindow) {
            this.benchmarkHistory.shift();
        }

        const finalBenchmark = {};
        for (const metric in currentYearStats) {
            const minValues = this.benchmarkHistory.map(function(r) { return r[metric].min; });
            const maxValues = this.benchmarkHistory.map(function(r) { return r[metric].max; });
            finalBenchmark[metric] = {
                min: Math.min.apply(null, minValues),
                max: Math.max.apply(null, maxValues)
            };
        }
        
        this.dynamicBenchmark = finalBenchmark;

        console.log(`--- Dynamic Benchmark Updated for Year ${this.year} (Memory: ${this.benchmarkHistory.length} years) ---`);
        for (const metric in this.dynamicBenchmark) {
            const benchmark = this.dynamicBenchmark[metric];
            if (isFinite(benchmark.min) && isFinite(benchmark.max)) {
                console.log(`  - ${metric}: min=${benchmark.min.toFixed(2)}, max=${benchmark.max.toFixed(2)}`);
            }
        }
    }

    distributeStandsToOwners(standData) {
        const [stateProp, companyProp, privateProp] = this.ownerTypeDistribution;
        const totalStands = standData.length;
        const shuffledStands = [...standData].sort(() => Math.random() - 0.5);
        const stateCount = Math.floor(totalStands * stateProp);
        const companyCount = Math.floor(totalStands * companyProp);
        return {
            state: shuffledStands.slice(0, stateCount),
            big_company: shuffledStands.slice(stateCount, stateCount + companyCount),
            small_private: shuffledStands.slice(stateCount + companyCount) // slice with 1 index to end
        };
    }
}

// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Institution;
} else {
    this.Institution = Institution;
}
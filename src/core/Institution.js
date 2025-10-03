
class Institution {
    constructor() {
        this.ownerTypeDistribution = null; 
        this.owners = [];
        this.agents = [];
        this.year = 0;
        this.benchmarkHistory = [];
        this.dynamicBenchmark = {};
        this.memoryWindow = ES_CONFIG.benchmarkMemoryWindow;
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
                
                // --- THE FIX IS HERE ---
                // We call `new Owner(...)` directly, not `new dependencies.Owner(...)`
                const owner = new Owner(this, ownerType, ownerConfig, standsByOwner[ownerType], dependencies);
                
                owner.createAgents();
                this.owners.push(owner);
                this.agents.push(...owner.agents);
            }
        });
        console.log(`Institution initialized with ${this.owners.length} owners and ${this.agents.length} total agents.`);
    }

    updateDynamicBenchmark(year) {
        this.year = year;

        const currentYearStats = {
            mai: { min: Infinity, max: -Infinity },
            volume: { min: Infinity, max: -Infinity },
            speciesCount: { min: Infinity, max: -Infinity },
            topHeight: { min: Infinity, max: -Infinity },
            dbhStdDev: { min: Infinity, max: -Infinity }
        };

        const allStandIds = fmengine.standIds;
        allStandIds.forEach(id => {
            fmengine.standId = id;
            if (stand && stand.id > 0) {
                currentYearStats.mai.min = Math.min(currentYearStats.mai.min, (stand.age > 0 ? stand.volume / stand.age : 0));
                currentYearStats.mai.max = Math.max(currentYearStats.mai.max, (stand.age > 0 ? stand.volume / stand.age : 0));
                currentYearStats.volume.min = Math.min(currentYearStats.volume.min, stand.volume);
                currentYearStats.volume.max = Math.max(currentYearStats.volume.max, stand.volume);
                currentYearStats.speciesCount.min = Math.min(currentYearStats.speciesCount.min, stand.nspecies);
                currentYearStats.speciesCount.max = Math.max(currentYearStats.speciesCount.max, stand.nspecies);
                currentYearStats.topHeight.min = Math.min(currentYearStats.topHeight.min, stand.topHeight);
                currentYearStats.topHeight.max = Math.max(currentYearStats.topHeight.max, stand.topHeight);

                stand.trees.loadAll();
                const dbhValues = [];
                for (let i = 0; i < stand.trees.count; i++) {
                    dbhValues.push(stand.trees.tree(i).dbh);
                }
                const dbhStdDev = Helpers.calculateStdDev(dbhValues);
                currentYearStats.dbhStdDev.min = Math.min(currentYearStats.dbhStdDev.min, dbhStdDev);
                currentYearStats.dbhStdDev.max = Math.max(currentYearStats.dbhStdDev.max, dbhStdDev);
            }
        });

        this.benchmarkHistory.push(currentYearStats);
        if (this.benchmarkHistory.length > this.memoryWindow) {
            this.benchmarkHistory.shift();
        }

        const finalBenchmark = {};
        for (const metric in currentYearStats) {
            const minValues = this.benchmarkHistory.map(r => r[metric].min);
            const maxValues = this.benchmarkHistory.map(r => r[metric].max);
            finalBenchmark[metric] = {
                min: Math.min(...minValues),
                max: Math.max(...maxValues)
            };
        }
        
        this.dynamicBenchmark = finalBenchmark;
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
            small_private: shuffledStands.slice(stateCount + companyCount)
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Institution;
} else {
    this.Institution = Institution;
}
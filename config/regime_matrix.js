// ----- Start of File: config/regime_matrix.js -----

if (typeof REGIME_MATRIX === 'undefined') {
    var REGIME_MATRIX = {};

    // =========================================================================
    // 1. REGIME DEFINITIONS (The "Menu")
    // =========================================================================
    const REGIME_DEFS = {
        
        // --- STANDARD AGE-CLASS (Conversion/Production) ---
        "WET_Conifer_Standard": [
            { type: "planting",           min_h: 0,  max_h: 2 },
            { type: "tending",            min_h: 2,  max_h: 13 }, 
            { type: "thinningFromBelow",  min_h: 13, max_h: 28 },
            { type: "clearcut",           min_h: 28, max_h: 99 }
        ],
        "WET_Douglas_Standard": [
            { type: "planting",           min_h: 0,  max_h: 2 },
            { type: "tending",            min_h: 2,  max_h: 13 }, 
            { type: "selectiveThinning",  min_h: 13, max_h: 35 }, 
            { type: "targetDBH",          min_h: 35, max_h: 99 }
        ],
        "WET_Broadleaf_Quality": [
            { type: "planting",           min_h: 0,  max_h: 2 },
            { type: "tending",            min_h: 2,  max_h: 16 },
            { type: "selectiveThinning",  min_h: 16, max_h: 30 },
            { type: "targetDBH",          min_h: 30, max_h: 99 }
        ],
        "WET_Mixed_Standard": [
            { type: "planting",           min_h: 0,  max_h: 2 },
            { type: "tending",            min_h: 2,  max_h: 15 },
            { type: "thinningFromBelow",  min_h: 15, max_h: 29 },
            { type: "shelterwood",        min_h: 29, max_h: 99 }
        ],

        // --- SHORT ROTATION / BIOMASS ---
        "Conifer_Biomass": [
            { type: "planting",           min_h: 0,  max_h: 2 },
            { type: "tending",            min_h: 2,  max_h: 12 },
            { type: "thinningFromBelow",  min_h: 12, max_h: 25 }, // Early cut
            { type: "clearcut",           min_h: 25, max_h: 99 }
        ],
        "Broadleaf_Firewood": [
             { type: "planting",          min_h: 0,  max_h: 2 },
             { type: "tending",           min_h: 2,  max_h: 15 },
             { type: "clearcut",          min_h: 15, max_h: 99 }
        ],

        // --- CONTINUOUS COVER / BIODIVERSITY ---
        "Plenter_Conifer": [
            { type: "plenter",            min_h: 0,  max_h: 99 }
        ],
        "Plenter_Mixed": [
            { type: "plenter",            min_h: 0,  max_h: 99 }
        ],
        "Habitat_Retention": [
            { type: "tending",            min_h: 0,  max_h: 15 },
            { type: "targetDBH",          min_h: 15, max_h: 99 }
        ],

        // --- TRANSITION / CONVERSION ---
        "Conversion_Spruce_To_Mixed": [
            { type: "planting",           min_h: 0,  max_h: 99 }, // Underplanting
            { type: "selectiveThinning",  min_h: 15, max_h: 30 },
            { type: "shelterwood",        min_h: 30, max_h: 99 }
        ],

        // --- PASSIVE ---
        "Natural_Succession": [
            { type: "noManagement",       min_h: 0,  max_h: 99, duration: 10 }
        ]
    };

    // =========================================================================
    // 2. PROBABILITY HELPER SETS
    // =========================================================================
    
    // --- STATE PROFILES ---
    const STATE_PROD_LOW = {
        conifer:   [{ id: "WET_Conifer_Standard", p: 1.0 }],
        douglas:   [{ id: "WET_Douglas_Standard", p: 1.0 }],
        broadleaf: [{ id: "WET_Broadleaf_Quality", p: 1.0 }],
        mixed:     [{ id: "WET_Mixed_Standard", p: 1.0 }]
    };
    const STATE_ANY_HIGH_STRUCT = {
        conifer:   [{ id: "Plenter_Conifer", p: 1.0 }],
        douglas:   [{ id: "Plenter_Conifer", p: 1.0 }],
        broadleaf: [{ id: "Plenter_Mixed", p: 1.0 }],
        mixed:     [{ id: "Plenter_Mixed", p: 1.0 }]
    };
    const STATE_BIO = {
        conifer:   [{ id: "Conversion_Spruce_To_Mixed", p: 0.8 }, { id: "Plenter_Conifer", p: 0.2 }],
        douglas:   [{ id: "Plenter_Conifer", p: 1.0 }],
        broadleaf: [{ id: "Habitat_Retention", p: 0.8 }, { id: "Natural_Succession", p: 0.2 }],
        mixed:     [{ id: "Plenter_Mixed", p: 0.8 }, { id: "Natural_Succession", p: 0.2 }]
    };

    // --- BIG PRIVATE PROFILES ---
    const BIG_PROD_LOW = {
        conifer:   [{ id: "WET_Conifer_Standard", p: 0.6 }, { id: "Conifer_Biomass", p: 0.4 }],
        douglas:   [{ id: "WET_Douglas_Standard", p: 1.0 }],
        broadleaf: [{ id: "WET_Broadleaf_Quality", p: 0.8 }, { id: "Broadleaf_Firewood", p: 0.2 }],
        mixed:     [{ id: "WET_Mixed_Standard", p: 1.0 }]
    };

    // --- SMALL PRIVATE PROFILES ---
    const SMALL_PROD_LOW = {
        conifer:   [{ id: "WET_Conifer_Standard", p: 0.4 }, { id: "Conifer_Biomass", p: 0.2 }, { id: "Natural_Succession", p: 0.4 }],
        douglas:   [{ id: "WET_Douglas_Standard", p: 0.6 }, { id: "Natural_Succession", p: 0.4 }],
        broadleaf: [{ id: "Broadleaf_Firewood", p: 0.5 }, { id: "Natural_Succession", p: 0.5 }],
        mixed:     [{ id: "Plenter_Mixed", p: 0.3 }, { id: "Natural_Succession", p: 0.7 }]
    };
    const SMALL_PASSIVE = {
        conifer:   [{ id: "Natural_Succession", p: 1.0 }],
        douglas:   [{ id: "Natural_Succession", p: 1.0 }],
        broadleaf: [{ id: "Natural_Succession", p: 1.0 }],
        mixed:     [{ id: "Natural_Succession", p: 1.0 }]
    };


    // =========================================================================
    // 3. OWNER MATRICES (The "Orders")
    // Keys matched to data: "state", "big", "small"
    // =========================================================================
    const OWNER_MATRICES = {
        
        "state": {
            "Production": {
                "low":    STATE_PROD_LOW,
                "medium": STATE_ANY_HIGH_STRUCT, 
                "high":   STATE_ANY_HIGH_STRUCT
            },
            "Biodiversity": {
                "low":    STATE_BIO,
                "medium": STATE_BIO,
                "high":   STATE_BIO
            },
            "CO2": {
                // State CO2: High Stock -> Standard WET or Plenter
                "low":    STATE_PROD_LOW,
                "medium": STATE_ANY_HIGH_STRUCT,
                "high":   STATE_ANY_HIGH_STRUCT
            }
        },

        "big": { // Matches "big" in CSV
            "Production": {
                "low":    BIG_PROD_LOW,
                "medium": BIG_PROD_LOW, 
                "high":   BIG_PROD_LOW // Force conversion (no Plenter trap)
            },
            "Biodiversity": {
                "low":    STATE_BIO, 
                "medium": STATE_ANY_HIGH_STRUCT,
                "high":   STATE_ANY_HIGH_STRUCT
            },
            "CO2": {
                // Big Private CO2: Efficiency/Biomass
                "low":    BIG_PROD_LOW,
                "medium": BIG_PROD_LOW,
                "high":   BIG_PROD_LOW
            }
        },

        "small": { // Matches "small" in CSV
            "Production": {
                "low":    SMALL_PROD_LOW,
                "medium": SMALL_PROD_LOW,
                "high":   SMALL_PROD_LOW
            },
            "Biodiversity": {
                "low":    SMALL_PASSIVE,
                "medium": SMALL_PASSIVE,
                "high":   SMALL_PASSIVE
            },
            "CO2": {
                "low":    SMALL_PASSIVE,
                "medium": SMALL_PASSIVE,
                "high":   SMALL_PASSIVE
            }
        }
    };

    // =========================================================================
    // 4. RESOLVER LOGIC
    // =========================================================================
    
    REGIME_MATRIX.resolve = function(pref, struct, spec, owner_type) {
        
        // 1. Select Matrix based on Owner Type
        let matrix = OWNER_MATRICES[owner_type];
        
        if (!matrix) {
            // Fallback logic if owner type is completely unknown (e.g., empty string)
            matrix = OWNER_MATRICES["state"];
        }

        // 2. Navigate Preference
        if (!matrix[pref]) return null;
        let pref_node = matrix[pref];

        // 3. Navigate Structure
        let struct_node = pref_node[struct];
        if (!struct_node) struct_node = pref_node["low"]; // Fallback to 'low' (restart logic)
        
        if (!struct_node) return null;

        // 4. Navigate Species
        var candidates = null;
        
        if (spec === 'psme' && struct_node['douglas']) {
            candidates = struct_node['douglas'];
        } else if (struct_node[spec]) {
            candidates = struct_node[spec];
        } else if (struct_node["mixed"]) {
            candidates = struct_node["mixed"];
        } else {
            // Fallback: Use first available key
            var keys = Object.keys(struct_node);
            if (keys.length > 0) candidates = struct_node[keys[0]];
        }

        // 5. Stochastic Selection
        if (candidates && Array.isArray(candidates)) {
            let total_p = 0;
            candidates.forEach(c => total_p += c.p);
            
            let r = Math.random() * total_p;
            let cumulative = 0;
            
            for (let i = 0; i < candidates.length; i++) {
                cumulative += candidates[i].p;
                if (r <= cumulative) {
                    return {
                        id: candidates[i].id,
                        activities: REGIME_DEFS[candidates[i].id]
                    };
                }
            }
            let last = candidates[candidates.length - 1];
            return { id: last.id, activities: REGIME_DEFS[last.id] };
        }

        return null;
    };
}
this.REGIME_MATRIX = REGIME_MATRIX;

// ----- End of File: config/regime_matrix.js -----
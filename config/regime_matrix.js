// ----- Start of File: soco_src/config/regime_matrix.js -----

/**
 * =================================================================================
 * FILE: regime_matrix.js
 * =================================================================================
 * THE STRATEGY MATRIX
 * 
 * Dimensions:
 * 1. Agent Preference: "Production", "Biodiversity", "CO2"
 * 2. Stand Structure:  "low", "medium", "high"
 * 3. Species Type:     "conifer", "broadleaf", "mixed"
 * 
 * Priorities: 1 (Critical), 2 (High), 3 (Medium), 4 (Low)
 * =================================================================================
 */

if (typeof REGIME_MATRIX === 'undefined') {
    var REGIME_MATRIX = {
        
        // =================================================================================
        // 1. PRODUCTION AGENT (Goal: Efficiency, Volume, Financial Return)
        // =================================================================================
        "Production": {
            // --- LOW STRUCTURE (Monocultures/Even-aged) ---
            "low": {
                "conifer": { 
                    name: "Industrial_Rotation",
                    description: "Maximize softwood output. Efficient thinning, clearcut/shelterwood at optimal age.",
                    activities: {
                        "Planting":   { act: "planting", priority: 1, params: { species_profile: "production_conifer" } },
                        "Tending":    { act: "tending",  priority: 3, params: { species_profile: "dynamic_auto" } },
                        "Thinning":   { act: "thinningFromBelow", priority: 2, params: { thinningShare: 0.25 } }, 
                        "Harvesting": { act: "clearcut", priority: 1 } 
                    }
                },
                "broadleaf": {
                    name: "Quality_Rotation",
                    description: "Focus on valuable hardwood logs. Z-tree thinning.",
                    activities: {
                        "Planting":   { act: "planting", priority: 2 },
                        "Tending":    { act: "tending",  priority: 1, params: { species_profile: "dynamic_auto" } },
                        "Thinning":   { act: "selectiveThinning", priority: 2, params: { nTrees: 80, nCompetitors: 2 } },
                        "Harvesting": { act: "targetDBH", priority: 1, params: { dbhListProfile: "value_broadleaf" } }
                    }
                },
                "mixed": {
                    name: "Mixed_Production",
                    description: "Standard management for mixed stands.",
                    activities: {
                        "Planting":   { act: "planting", priority: 3 },
                        "Tending":    { act: "tending", priority: 2 },
                        "Thinning":   { act: "thinningFromBelow", priority: 2 },
                        "Harvesting": { act: "shelterwood", priority: 1 }
                    }
                }
            },
            
            // --- MEDIUM STRUCTURE (Transitioning/Irregular) ---
            "medium": {
                "conifer": { name: "Industrial_Rotation", activities: { "Planting": {act:"planting", priority:2}, "Tending":{act:"tending", priority:3}, "Thinning":{act:"thinningFromBelow", priority:2}, "Harvesting":{act:"clearcut", priority:1} } },
                "broadleaf": { name: "Quality_Rotation", activities: { "Planting": {act:"planting", priority:2}, "Tending":{act:"tending", priority:1}, "Thinning":{act:"selectiveThinning", priority:2}, "Harvesting":{act:"targetDBH", priority:1} } },
                "mixed": {
                    name: "Mixed_Production_Structure",
                    activities: {
                        "Planting":   { act: "noManagement", priority: 4 },
                        "Tending":    { act: "tending", priority: 3 },
                        "Thinning":   { act: "selectiveThinning", priority: 2 },
                        "Harvesting": { act: "targetDBH", priority: 1 }
                    }
                }
            },

            // --- HIGH STRUCTURE (Plenter/Complex) ---
            "high": {
                // For Production agents, high structure is just a resource to be tapped efficiently
                "conifer":   { name: "Extract_Value", activities: { "Planting": {act:"noManagement", priority:4}, "Tending":{act:"tending", priority:3}, "Thinning":{act:"thinningFromBelow", priority:2}, "Harvesting":{act:"targetDBH", priority:1} } },
                "broadleaf": { name: "Extract_Value", activities: { "Planting": {act:"noManagement", priority:4}, "Tending":{act:"tending", priority:3}, "Thinning":{act:"selectiveThinning", priority:2}, "Harvesting":{act:"targetDBH", priority:1} } },
                "mixed":     { name: "Extract_Value", activities: { "Planting": {act:"noManagement", priority:4}, "Tending":{act:"tending", priority:3}, "Thinning":{act:"plenter", priority:2}, "Harvesting":{act:"targetDBH", priority:1} } }
            }
        },

        // =================================================================================
        // 2. BIODIVERSITY AGENT (Goal: Complexity, Mixtures, Habitat)
        // =================================================================================
        "Biodiversity": {
            // --- LOW STRUCTURE (The "Bad" case - needs fixing) ---
            "low": {
                "conifer": {
                    name: "Transformation_Ecological",
                    description: "Converting monoculture to mixed forest.",
                    activities: {
                        "Planting":   { act: "planting", priority: 1, params: { species_profile: "biodiversity_mix" } },
                        "Tending":    { act: "tending", priority: 1, params: { species_profile: "favor_rare" } },
                        "Thinning":   { act: "selectiveThinning", priority: 2, params: { nTrees: 50, nCompetitors: 3 } }, 
                        "Harvesting": { act: "femel", priority: 2 } // Create gaps
                    }
                },
                "broadleaf": {
                    name: "Habitat_Development",
                    activities: {
                        "Planting":   { act: "planting", priority: 2 },
                        "Tending":    { act: "tending", priority: 1, params: { species_profile: "favor_rare" } },
                        "Thinning":   { act: "selectiveThinning", priority: 3 }, 
                        "Harvesting": { act: "targetDBH", priority: 3, params: { dbhListProfile: "habitat_retention" } } // Keep big trees
                    }
                },
                "mixed": {
                    name: "Structure_Promotion",
                    activities: {
                        "Planting":   { act: "planting", priority: 3 },
                        "Tending":    { act: "tending", priority: 2 },
                        "Thinning":   { act: "selectiveThinning", priority: 2 },
                        "Harvesting": { act: "shelterwood", priority: 2 }
                    }
                }
            },

            // --- MEDIUM STRUCTURE ---
            "medium": {
                "conifer": { name: "Transformation_Ecological", activities: { "Planting": {act:"planting", priority:1}, "Tending":{act:"tending", priority:1}, "Thinning":{act:"selectiveThinning", priority:2}, "Harvesting":{act:"femel", priority:2} } },
                "broadleaf": { name: "Habitat_Development", activities: { "Planting": {act:"planting", priority:3}, "Tending":{act:"tending", priority:2}, "Thinning":{act:"selectiveThinning", priority:3}, "Harvesting":{act:"targetDBH", priority:3} } },
                "mixed": { name: "Structure_Promotion", activities: { "Planting": {act:"noManagement", priority:4}, "Tending":{act:"tending", priority:2}, "Thinning":{act:"selectiveThinning", priority:2}, "Harvesting":{act:"femel", priority:3} } }
            },

            // --- HIGH STRUCTURE (The "Good" case - maintain) ---
            "high": {
                "conifer":   { name: "Continuous_Cover_Bio", activities: { "Planting": {act:"noManagement", priority:4}, "Tending":{act:"tending", priority:2}, "Thinning":{act:"plenter", priority:3}, "Harvesting":{act:"plenter", priority:3} } },
                "broadleaf": { name: "Continuous_Cover_Bio", activities: { "Planting": {act:"noManagement", priority:4}, "Tending":{act:"tending", priority:2}, "Thinning":{act:"plenter", priority:3}, "Harvesting":{act:"targetDBH", priority:3} } },
                "mixed":     { name: "Continuous_Cover_Bio", activities: { "Planting": {act:"noManagement", priority:4}, "Tending":{act:"tending", priority:2}, "Thinning":{act:"plenter", priority:3}, "Harvesting":{act:"targetDBH", priority:3} } }
            }
        },

        // =================================================================================
        // 3. CO2 AGENT (Goal: Biomass, Stability, Resilience)
        // =================================================================================
        "CO2": {
            // --- LOW STRUCTURE ---
            "low": {
                "conifer": {
                    name: "Stability_Management",
                    description: "Thin heavily to stabilize stands against windthrow.",
                    activities: {
                        "Planting":   { act: "planting", priority: 1 },
                        "Tending":    { act: "tending", priority: 2 },
                        "Thinning":   { act: "thinningFromBelow", priority: 1, params: { thinningShare: 0.3 } }, // Heavy thinning
                        "Harvesting": { act: "clearcut", priority: 2 }
                    }
                },
                "broadleaf": {
                    name: "Biomass_Max",
                    activities: {
                        "Planting":   { act: "planting", priority: 2 },
                        "Tending":    { act: "tending", priority: 3 },
                        "Thinning":   { act: "thinningFromBelow", priority: 3 }, // Keep density high
                        "Harvesting": { act: "targetDBH", priority: 1, params: { dbhListProfile: "high_volume" } }
                    }
                },
                "mixed": {
                    name: "Resilience_Builder",
                    activities: {
                        "Planting":   { act: "planting", priority: 2 },
                        "Tending":    { act: "tending", priority: 2 },
                        "Thinning":   { act: "selectiveThinning", priority: 2 },
                        "Harvesting": { act: "shelterwood", priority: 1 }
                    }
                }
            },

            // --- MEDIUM & HIGH STRUCTURE (Treat similarly: Maintain high stock) ---
            "medium": {
                "conifer": { name: "Stability_Management", activities: { "Planting": {act:"planting", priority:2}, "Tending":{act:"tending", priority:2}, "Thinning":{act:"thinningFromBelow", priority:1}, "Harvesting":{act:"femel", priority:2} } },
                "broadleaf": { name: "Biomass_Max", activities: { "Planting": {act:"planting", priority:3}, "Tending":{act:"tending", priority:3}, "Thinning":{act:"thinningFromBelow", priority:3}, "Harvesting":{act:"targetDBH", priority:1} } },
                "mixed": { name: "High_Stock_CCF", activities: { "Planting": {act:"noManagement", priority:4}, "Tending":{act:"tending", priority:3}, "Thinning":{act:"plenter", priority:2}, "Harvesting":{act:"targetDBH", priority:2} } }
            },
            "high": {
                "conifer":   { name: "High_Stock_CCF", activities: { "Planting": {act:"noManagement", priority:4}, "Tending":{act:"tending", priority:3}, "Thinning":{act:"plenter", priority:2}, "Harvesting":{act:"targetDBH", priority:2} } },
                "broadleaf": { name: "High_Stock_CCF", activities: { "Planting": {act:"noManagement", priority:4}, "Tending":{act:"tending", priority:3}, "Thinning":{act:"plenter", priority:2}, "Harvesting":{act:"targetDBH", priority:2} } },
                "mixed":     { name: "High_Stock_CCF", activities: { "Planting": {act:"noManagement", priority:4}, "Tending":{act:"tending", priority:3}, "Thinning":{act:"plenter", priority:2}, "Harvesting":{act:"targetDBH", priority:2} } }
            }
        }
    };
}
this.REGIME_MATRIX = REGIME_MATRIX;

// ----- End of File: soco_src/config/regime_matrix.js -----
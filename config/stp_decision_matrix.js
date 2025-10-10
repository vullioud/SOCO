// ----- Start of File: config/stp_decision_matrix.js (Corrected) -----

/**
 * Probabilistic Decision Matrix for STP selection.
 * Structure: Owner Type -> Forest Structure -> Dominant Species -> [ {stp, probability}, ... ]
 * NOTE: The 'stp' values are BASE names. The final name will be constructed in cognition.js.
 */
var STP_DECISION_MATRIX = {
    'state': {
        'even_aged': {
            'conifer_dominated': [
                { stp: 'shelterwood_system', probability: 0.6 },
                { stp: 'clearcut_system', probability: 0.4 }
            ],
            'broadleaf_dominated': [
                { stp: 'femel_system', probability: 0.7 },
                { stp: 'shelterwood_system', probability: 0.3 }
            ]
        },
        'multi_layered': {
            'conifer_dominated': [
                { stp: 'shelterwood_system', probability: 0.7 },
                { stp: 'plenter_system', probability: 0.3 }
            ],
            'broadleaf_dominated': [
                { stp: 'plenter_system', probability: 0.6 },
                { stp: 'femel_system', probability: 0.4 }
            ]
        },
        'complex_uneven_aged': {
            'conifer_dominated': [
                { stp: 'plenter_system', probability: 0.8 },
                { stp: 'no_management', probability: 0.2 }
            ],
            'broadleaf_dominated': [
                { stp: 'plenter_system', probability: 0.7 },
                { stp: 'no_management', probability: 0.3 }
            ]
        }
    },
    'big_company': {
        'even_aged': {
            'conifer_dominated': [ { stp: 'clearcut_system', probability: 1 } ],
            'broadleaf_dominated': [ { stp: 'clearcut_system', probability: 1 } ]
        },
        'multi_layered': {
            'conifer_dominated': [
                { stp: 'clearcut_system', probability: 0.8 },
                { stp: 'shelterwood_system', probability: 0.2}
            ],
            'broadleaf_dominated': [
                { stp: 'clearcut_system', probability: 1},
                { stp: 'femel_system', probability: 0 }
            ]
        },
        'complex_uneven_aged': {
            'conifer_dominated': [
                { stp: 'femel_system', probability: 0.6 },
                { stp: 'clearcut_system', probability: 0.4 }
            ],
            'broadleaf_dominated': [
                { stp: 'femel_system', probability: 0.9 },
                { stp: 'no_management', probability: 0.1 }
            ]
        }
    },
    'small_private': {
        'even_aged': {
            'conifer_dominated': [
                { stp: 'femel_system', probability: 0.4 },
                { stp: 'plenter_system', probability: 0.3 },
                { stp: 'no_management', probability: 0.2 },
                { stp: 'clearcut_system', probability: 0.1 }
            ],
            'broadleaf_dominated': [
                { stp: 'femel_system', probability: 0.5 },
                { stp: 'plenter_system', probability: 0.3 },
                { stp: 'no_management', probability: 0.2 }
            ]
        },
        'multi_layered': {
             'conifer_dominated': [
                { stp: 'plenter_system', probability: 0.8 },
                { stp: 'no_management', probability: 0.2 }
            ],
            'broadleaf_dominated': [
                { stp: 'plenter_system', probability: 0.6 },
                { stp: 'no_management', probability: 0.4 }
            ]
        },
        'complex_uneven_aged': {
            'conifer_dominated': [
                { stp: 'no_management', probability: 0.7 },
                { stp: 'plenter_system', probability: 0.3}
            ],
            'broadleaf_dominated': [
                { stp: 'no_management', probability: 0.5 },
                { stp: 'plenter_system', probability: 0.5}
            ]
        }
    }
};
// ----- End of File: config/stp_decision_matrix.js -----
// ----- Start of File: soco_src/action/prepare_flags/femel_flags.js -----

/**
 * =================================================================================
 * FILE: femel_flags.js
 * =================================================================================
 * DESCRIPTION:
 * Prepares parameters for the Femel (Expansion Gap) activity.
 * Sets flags for initial size and growth width.
 * =================================================================================
 */

Action.prepare.femel = function(params, stand_data_obj) {
    
    // 1. Initial Size (Radius/Factor)
    // Default to 1 (usually 10m-20m depending on patch implementation)
    var initial_size = params.initial_size || 1;
    stand.setFlag('abe_param_femel_initial_size', initial_size);

    // 2. Growth Width (Rings to add)
    // Default to 1 ring
    var growth_width = params.growth_width || 1;
    stand.setFlag('abe_param_femel_growth_width', growth_width);

    console.log(`[Action] Prepared Femel for stand ${stand.id}. InitSize=${initial_size}, Growth=${growth_width}`);
};

Action.prepare.clear_femel_flags = function() {
    stand.setFlag('abe_femel_initialized', null);
    stand.setFlag('abe_femel_current_ring', null);
    if (stand && stand.id > 0) {
        // Resetting patches clears the spatial grid
        if (stand.patches) {
            stand.patches.clear();
            stand.patches.updateGrid();
        }
    }
};

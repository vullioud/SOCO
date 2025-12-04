// ----- Start of File: soco_src/action/prepare_flags/plenter_flags.js -----

Action.prepare.plenter = function(params) {

    // --- DEBUG: Inspect Incoming Params ---
    // This will print the full object whenever plenter is triggered.
    // If the log is too noisy, we can wrap it in a check for the missing curve.
    // console.log(`[Action] Prepare Plenter for Stand ${stand.id}. Params:`, JSON.stringify(params));

    if (params && params.plenterCurve) {
        // Check if it's a valid object and not empty
        if (Object.keys(params.plenterCurve).length > 0) {
            stand.setFlag('abe_param_plenterCurve', params.plenterCurve);
            console.log(`      -> [Stand ${stand.id}] Setting 'abe_param_plenterCurve' success.`);
        } else {
            console.warn(`      -> [Stand ${stand.id}] WARN: 'plenterCurve' parameter exists but is empty object.`);
            stand.setFlag('abe_param_plenterCurve', {});
        }
    } else {
        console.warn(`      -> [Stand ${stand.id}] WARN: No 'plenterCurve' property found in parameters.`);
        console.warn(`      -> Received Params Keys: ${JSON.stringify(Object.keys(params || {}))}`);
        console.warn(`      -> Full Params Dump: ${JSON.stringify(params)}`);
        
        stand.setFlag('abe_param_plenterCurve', {});
    }
};

// ----- End of File: soco_src/action/prepare_flags/plenter_flags.js -----
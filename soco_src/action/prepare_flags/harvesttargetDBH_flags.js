Action.prepare.targetDBH = function(params) {
    if (params && params.dbhListProfile) {
        // 'params.dbhListProfile' now correctly holds the full dbhList object.
        stand.setFlag('abe_param_dbhList', params.dbhListProfile);
        console.log(`      -> Setting 'abe_param_dbhList' flag from provided profile object.`);
    } else {
        console.warn(`      -> WARN: No 'dbhListProfile' object found in parameters for targetDBH. Setting empty flag.`);
        stand.setFlag('abe_param_dbhList', {});
    }
};
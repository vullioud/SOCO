Action.prepare.targetDBH = function(params, stand_data_obj) {
    if (params && params.dbhListProfile) {
        // The agent's plan provides the NAME of the profile to use.
        var profile_name = params.dbhListProfile;
        
        // We get the actual DBH list object from the agent's config tables.
        var agent = socoabe.institution.agents.find(a => a.id === stand_data_obj.agent_id);
        if (agent && agent.targetDBH_profiles_table && agent.targetDBH_profiles_table[profile_name]) {
            var dbhList = agent.targetDBH_profiles_table[profile_name];
            stand.setFlag('abe_param_dbhList', dbhList);
            console.log(`      -> Using dbhListProfile '${profile_name}'.`);
        } else {
            console.warn(`      -> WARN: dbhListProfile '${profile_name}' not found for agent ${agent.id}. Using empty list.`);
            stand.setFlag('abe_param_dbhList', {});
        }
    }
};
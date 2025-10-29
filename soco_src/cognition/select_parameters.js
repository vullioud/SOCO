// ===== soco_src/cognition/ParameterSelector.js =====

/**
 * The "Technician". Decides HOW to perform an activity.
 * INPUT: agent (SoCoABeAgent), activityName (string)
 * OUTPUT: An object of parameters for the activity.
 */
function ParameterSelector() {
    // In the future, this will load parameter_distributions.json
}

ParameterSelector.prototype.decideParameters = function(agent, activityName) {
    console.log("  (Cognition) Selecting parameters for '" + activityName + "'");
    // Placeholder logic:
    if (activityName === 'clearcut') {
        return { rotation_age: 120 }; // Return a default parameter
    }
    return {}; // Return empty object for other activities
};
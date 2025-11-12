/**
 * =================================================================================
 * FILE: mega_STP.js
 * TYPE: Configuration (iLand Stand Treatment Program)
 * =================================================================================
 * DESCRIPTION:
 * This file defines the single, comprehensive "Mega-STP" for the SoCoABE model.
 * It contains definitions for ALL possible management activities. The SoCoABE agent
 * triggers a specific activity by setting the 'abe_next_activity' flag on a stand.
 *
 * Each activity uses an `onEvaluate` function to check this flag, acting as a
 * gatekeeper to ensure only the agent's chosen activity can run.
 * =================================================================================
 */

if (typeof lib === 'undefined') {
    fmengine.abort("ABE Library ('lib') is not defined. MegaSTP cannot be built.");
}

console.log("--- Defining the SoCoABE Mega-STP (Full Version) ---");

// --- Helper function to read flags with a default value ---
function getFlag(flagName, defaultValue) {
    // This function is defined globally within the STP's context.
    const value = stand.flag(flagName);
    return (value !== undefined && value !== null) ? value : defaultValue;
}

const MEGA_STP_ACTIVITIES = {};

// --- ACTIVITY DEFINITIONS ---

// 1. No Management
MEGA_STP_ACTIVITIES['noManagement'] = {
    id: 'MegaSTP_NoManagement',
    type: 'general', // Use 'general' for simple, non-scheduled actions
    schedule: { signal: 'do_noManagement' },
    action: function() {
        console.log(`[MEGA-STP] Executing 'noManagement' for stand ${stand.id}.`);
        // This activity does nothing but sends a completion signal.
        stand.stp.signal('Activity_Completed');
    }
};

// 2. Clearcut
MEGA_STP_ACTIVITIES['clearcut'] = {
    id: 'MegaSTP_Clearcut',
    type: 'scheduled', // Use 'scheduled' because it's a harvest activity that should be logged correctly.
    schedule: { signal: 'do_clearcut' },
    finalHarvest: true, // This is a crucial flag for ABE to reset the stand's rotation age.

    // onExecute is the correct event for a 'scheduled' activity's main logic.
    onExecute: function() {
        console.log(`[MEGA-STP] Executing 'clearcut' for stand ${stand.id}.`);

        // Read the parameter from the flag at the moment of execution.
        var preferenceFunction = getFlag('abe_param_preferenceFunction', 'dbh > 0');

        // The 'simulate' flag is automatically handled by ABE for scheduled activities.
        // We can just call the harvest logic.
        stand.trees.load(preferenceFunction);
        var harvested_count = stand.trees.harvest();
        stand.trees.removeMarkedTrees(); // Ensure simulated harvests are executed.
        console.log(`[MEGA-STP] -> Harvested ${harvested_count} trees.`);
    },

    // onExit is called after execution and is the correct place to send the completion signal.
    onExit: function() {
        stand.stp.signal('Activity_Completed');
    }
};


// --- FINAL STP ASSEMBLY ---
var MegaSTP = {
    U: [120, 150, 180],
    activities: MEGA_STP_ACTIVITIES,
    onSignal: function(signal) {
        if (!stand || !stand.id) return;
        if (signal === 'Activity_Completed') {
            var activityName = stand.activity ? stand.activity.name : 'unknown';
            fmengine.log(`Activity '${activityName}' completed. Flagging stand ${stand.id} for agent reassessment.`);
            stand.setFlag('abe_last_activity', activityName);
            stand.setFlag('abe_last_activity_year', Globals.year);
            stand.setFlag('abe_need_reassessment', true);
            stand.setFlag('abe_next_activity', null);
        }
    }
};

this.MegaSTP = MegaSTP;
console.log("--- SoCoABE Mega-STP (Full Version) defined successfully. ---");
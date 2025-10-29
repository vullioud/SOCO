/**
 * Reads STP bottom-up flags to update history
 * (called at the end of the pipeline).
 */


function update_history(standData) {
  fmengine.standId = Number(standData.id);
  if (!stand || !stand.id) return standData;

  const lastAct = stand.flag("abe_last_activity");
  const lastYear = stand.flag("abe_last_activity_year");

  if (
    lastAct &&
    Number.isFinite(lastYear) &&
    (standData.history.lastActivityYear == null ||
      lastYear > standData.history.lastActivityYear)
  ) {
    standData.history.lastActivity = lastAct;
    standData.history.lastActivityYear = lastYear;
    standData.history.lastOutcomes = standData.history.lastOutcomes || {};
  }

  return standData;
}
module.exports = update_history;
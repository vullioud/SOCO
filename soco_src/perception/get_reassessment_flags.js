/**
 * get_reassessment_flags.js
 * ------------------------------------------------------------
 * Placeholder: in future will read iLand flags like
 * 'abe_need_reassessment', 'abe_salvage_flag', etc.
 * For now, always returns false.
 * ------------------------------------------------------------
 */
function get_reassessment_flags(standData) {
  standData.need_reassessment = false;
  return standData;
}

module.exports = get_reassessment_flags;

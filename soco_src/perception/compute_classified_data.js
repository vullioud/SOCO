/**
 * compute_classified_data.js
 * ------------------------------------------------------------
 * Converts numeric stand metrics into categorical classes.
 * Classification logic is self-contained here (no external core deps).
 * ------------------------------------------------------------
 */

// Example thresholds – replace later with config or lookup JSONs
const AGE_CLASSES = [
  { name: "planting", max: 20 },
  { name: "tending", max: 60 },
  { name: "thinning", max: 100 },
  { name: "harvesting", max: Infinity }
];

function get_age_class(age) {
  for (const cls of AGE_CLASSES) if (age <= cls.max) return cls.name;
  return "unknown";
}

function get_structure_class(stddev) {
  if (stddev < 5) return "low";
  if (stddev < 15) return "medium";
  return "high";
}

function get_species_dominance(raw) {
  // Placeholder: extend with species info if available in raw
  // For now we just guess based on volume ratios if present
  return raw.speciesDominance || "mixed";
}

/**
 * Main classification function.
 * @param {Object} standData
 * @returns {Object} standData
 */
function compute_classified_data(standData) {
  const raw = standData.raw_data || {};

  standData.classified_data = {
    ageClass: get_age_class(raw.absoluteAge ?? 0),
    structureClass: get_structure_class(raw.dbhStdDev ?? 0),
    speciesDominance: get_species_dominance(raw)
  };

  return standData;
}

module.exports = compute_classified_data;

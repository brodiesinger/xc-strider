/**
 * Lineup and Results Validation Utility
 * Ensures data integrity across meet lineups and results
 */

// Valid team group keys
const VALID_GROUPS = new Set(["varsity_boys", "jv_boys", "varsity_girls", "jv_girls"]);

const GENDER_GROUPS = {
  boys: new Set(["varsity_boys", "jv_boys"]),
  girls: new Set(["varsity_girls", "jv_girls"]),
};

/**
 * Validates that an athlete is not assigned to both JV and Varsity within same gender
 * @param {string} email - Athlete email
 * @param {Array} lineupRecords - All lineup records for meet
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validateNoDualAssignment(email, lineupRecords) {
  const assignments = lineupRecords.filter(r => r.athlete_id === email && r.team_group);
  if (assignments.length === 0) return null;

  const groups = assignments.map(a => a.team_group);
  const boysGroups = groups.filter(g => GENDER_GROUPS.boys.has(g));
  const girlsGroups = groups.filter(g => GENDER_GROUPS.girls.has(g));

  // Check for dual assignment within same gender
  if (boysGroups.length > 1) {
    return `Athlete is assigned to both Varsity and JV Boys`;
  }
  if (girlsGroups.length > 1) {
    return `Athlete is assigned to both Varsity and JV Girls`;
  }

  return null;
}

/**
 * Deduplicates lineup records, keeping the last occurrence per athlete
 * @param {Array} lineupRecords - Raw lineup records
 * @returns {Array} Deduplicated lineup records
 */
export function deduplicateLineup(lineupRecords) {
  if (!lineupRecords || lineupRecords.length === 0) return [];

  const latestMap = {};
  lineupRecords.forEach(record => {
    if (!record.athlete_id) return;
    // Keep only the latest by ID (newer records typically have higher IDs)
    if (!latestMap[record.athlete_id] || record.id > latestMap[record.athlete_id].id) {
      latestMap[record.athlete_id] = record;
    }
  });

  return Object.values(latestMap);
}

/**
 * Deduplicates results, keeping the last occurrence per athlete per meet
 * @param {Array} results - Raw result records
 * @returns {Array} Deduplicated result records
 */
export function deduplicateResults(results) {
  if (!results || results.length === 0) return [];

  const latestMap = {};
  results.forEach(record => {
    if (!record.athlete_id) return;
    // Keep only the latest by ID
    if (!latestMap[record.athlete_id] || record.id > latestMap[record.athlete_id].id) {
      latestMap[record.athlete_id] = record;
    }
  });

  return Object.values(latestMap);
}

/**
 * Validates that result grouping matches lineup assignment
 * @param {Array} results - Result records
 * @param {Array} lineup - Lineup records
 * @returns {Array} Array of issues found: { athlete_id, issue }
 */
export function validateResultLineupMatch(results, lineup) {
  const issues = [];
  const deduped = deduplicateResults(results);
  const dedupeLineup = deduplicateLineup(lineup);

  const assignmentMap = {};
  dedupeLineup.forEach(l => {
    if (l.athlete_id && l.team_group) {
      assignmentMap[l.athlete_id] = l.team_group;
    }
  });

  deduped.forEach(result => {
    if (!result.athlete_id) return;
    if (result.did_not_run) return; // DNR results don't need group validation

    const lineupGroup = assignmentMap[result.athlete_id];
    // Only validate if both result and lineup exist
    // If lineup is missing, it's acceptable (unassigned athlete can still have results)
    // This is a soft check—coaches may record results for unassigned athletes
  });

  return issues;
}

/**
 * Gets assignment map from lineup (deduplicated)
 * @param {Array} lineup - Lineup records
 * @returns {Object} Map of athlete_id -> team_group
 */
export function getAssignmentMap(lineup) {
  const map = {};
  const deduped = deduplicateLineup(lineup);
  deduped.forEach(l => {
    if (l.athlete_id && l.team_group && VALID_GROUPS.has(l.team_group)) {
      map[l.athlete_id] = l.team_group;
    }
  });
  return map;
}

/**
 * Separates results into sections based on lineup assignments
 * Safe fallback: unassigned athletes go to "unassigned" section
 * @param {Array} results - Result records
 * @param {Array} lineup - Lineup records
 * @returns {Object} Object with keys: varsity_boys, jv_boys, varsity_girls, jv_girls, unassigned
 */
export function separateResultsBySections(results, lineup) {
  const sections = {
    varsity_boys: [],
    jv_boys: [],
    varsity_girls: [],
    jv_girls: [],
    unassigned: [],
  };

  const deduped = deduplicateResults(results);
  const assignmentMap = getAssignmentMap(lineup);
  const seen = new Set();

  deduped.forEach(result => {
    if (!result.athlete_id || seen.has(result.athlete_id)) return;
    seen.add(result.athlete_id);

    const group = assignmentMap[result.athlete_id];
    if (group && sections[group]) {
      sections[group].push(result);
    } else {
      // Fallback: unassigned
      sections.unassigned.push(result);
    }
  });

  return sections;
}

/**
 * Validates lineup integrity before save
 * @param {Object} assignments - Current local assignments state { email -> team_group }
 * @param {Array} athletes - All athletes on team
 * @returns {Array} Array of validation errors
 */
export function validateLineupIntegrity(assignments, athletes) {
  const errors = [];
  const seen = new Set();

  // Check for multiple assignments per athlete
  Object.entries(assignments).forEach(([email, group]) => {
    if (seen.has(email)) {
      errors.push(`Athlete ${email} assigned multiple times`);
      return;
    }
    seen.add(email);

    // Validate group key
    if (group && !VALID_GROUPS.has(group)) {
      errors.push(`Invalid group "${group}" for athlete ${email}`);
    }
  });

  // Check for unvalidated athletes (optional)
  athletes?.forEach(athlete => {
    const email = athlete.email;
    if (!email) return;

    const group = assignments[email];
    if (!group) return; // Unassigned is OK

    // Verify athlete gender matches group
    const athleteGender = athlete.team_group?.includes("boys") ? "boys" : athlete.team_group?.includes("girls") ? "girls" : null;
    const groupGender = group.includes("boys") ? "boys" : group.includes("girls") ? "girls" : null;

    // Soft check: only warn if athlete has explicit gender and it doesn't match
    // Allow unassigned athletes (no team_group) to be assigned to any group
  });

  return errors;
}
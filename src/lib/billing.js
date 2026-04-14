/**
 * Billing utility helpers.
 * Rules:
 *   demo     → full access, no restrictions
 *   active   → full access (requires plan)
 *   trial    → access based on assigned plan (requires plan)
 *   inactive → restricted, prompt upgrade
 *   missing plan → restricted, not fully active
 */

import { parseISO, isAfter } from "date-fns";

/**
 * Returns whether a team currently has access.
 * Requires BOTH a valid billing_status AND a plan to be set.
 * @param {object} team - Team entity record
 * @returns {boolean}
 */
export function teamHasAccess(team) {
  if (!team) return false;

  const status = team.billing_status;
  const plan = team.plan;

  // Must have both a status and a plan
  if (!status || !plan) return false;

  if (status === "demo") return true;
  if (status === "active") return true;

  if (status === "trial") {
    // Trial requires a plan to be assigned
    if (!team.trial_end_date) return true; // no end date = still in trial window
    return isAfter(parseISO(team.trial_end_date), new Date());
  }

  // inactive or anything unknown
  return false;
}

/**
 * Returns true if the team is in demo mode.
 * Demo users get full access with no upgrade prompts or paywalls.
 * @param {object} team
 * @returns {boolean}
 */
export function isDemo(team) {
  return team?.billing_status === "demo";
}

/**
 * Feature flags per plan.
 * Features not listed for a plan are restricted.
 */
const PLAN_FEATURES = {
  starter: [
    "athlete_logging",
    "basic_dashboard",
    "team_roster",
    "athlete_profiles",
    "messaging",
    "injury_reporting",
    "schedule",
    "announcements",
  ],
  team: [
    "athlete_logging",
    "basic_dashboard",
    "team_roster",
    "athlete_profiles",
    "messaging",
    "injury_reporting",
    "schedule",
    "announcements",
    "performance_tracking",
    "meet_results",
    "pr_tracking",
    "season_overview",
    "team_separation",
    "multi_team",
    "injury_alerts",
  ],
  elite: [
    "athlete_logging",
    "basic_dashboard",
    "team_roster",
    "athlete_profiles",
    "messaging",
    "injury_reporting",
    "schedule",
    "announcements",
    "performance_tracking",
    "meet_results",
    "pr_tracking",
    "season_overview",
    "team_separation",
    "multi_team",
    "injury_alerts",
    "ai_insights",
    "advanced_analytics",
    "overtraining_detection",
    "packet_builder",
    "exportable_reports",
  ],
};

/**
 * Returns true if the team's plan includes the given feature.
 * Demo teams always get all features.
 * @param {object} team
 * @param {string} feature - one of the PLAN_FEATURES keys
 * @returns {boolean}
 */
export function planHasFeature(team, feature) {
  if (!team) return false;
  if (isDemo(team)) return true;
  const plan = team.plan || "starter";
  return (PLAN_FEATURES[plan] || PLAN_FEATURES.starter).includes(feature);
}

/**
 * Returns a human-readable reason string when access is blocked.
 * Returns null if access is allowed.
 * @param {object} team
 * @returns {string|null}
 */
export function accessBlockedReason(team) {
  if (teamHasAccess(team) || isDemo(team)) return null;

  const status = team?.billing_status;
  const plan = team?.plan;

  if (!plan) {
    return "No plan is assigned to your team. Please select a plan to get started.";
  }

  if (!status || status === "inactive") {
    return "Your subscription is inactive. Upgrade to restore full access.";
  }

  if (status === "trial") {
    return "Your free trial has expired. Upgrade to continue using XC Team App.";
  }

  return "Your subscription is inactive. Upgrade to restore full access.";
}
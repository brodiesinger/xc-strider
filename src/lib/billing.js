/**
 * Billing utility helpers.
 * Rules:
 *   demo     → full access, no restrictions
 *   active   → full access
 *   trial    → access until trial_end_date; restricted after
 *   inactive → restricted, prompt upgrade
 */

import { parseISO, isAfter } from "date-fns";

/**
 * Returns whether a team currently has access.
 * @param {object} team - Team entity record
 * @returns {boolean}
 */
export function teamHasAccess(team) {
  if (!team) return false;

  const status = team.billing_status;

  if (status === "demo" || status === "active") return true;

  if (status === "trial") {
    if (!team.trial_end_date) return true; // no end date set = still in trial
    return isAfter(parseISO(team.trial_end_date), new Date());
  }

  // inactive or anything unknown
  return false;
}

/**
 * Returns a human-readable reason string when access is blocked.
 * Returns null if access is allowed.
 * @param {object} team
 * @returns {string|null}
 */
export function accessBlockedReason(team) {
  if (teamHasAccess(team)) return null;

  if (team?.billing_status === "trial") {
    return "Your free trial has expired. Upgrade to continue using XC Team App.";
  }

  return "Your subscription is inactive. Upgrade to restore full access.";
}
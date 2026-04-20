/**
 * Billing utility helpers.
 *
 * When global pricing is OFF (AppConfig.pricing_enabled = false):
 *   → everyone gets full access to all features.
 *
 * When global pricing is ON:
 *   → access is gated by the team's assigned plan.
 */

import { base44 } from "@/api/base44Client";

// ─── Global pricing flag ──────────────────────────────────────────────────────
// Cached in memory so we don't hammer the DB on every feature check.
let _pricingEnabled = null;
let _fetchPromise = null;

async function fetchPricingEnabled() {
  if (_pricingEnabled !== null) return _pricingEnabled;
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = base44.entities.AppConfig.filter({ key: "global" })
    .then((configs) => {
      _pricingEnabled = configs?.[0]?.pricing_enabled ?? false;
      _fetchPromise = null;
      return _pricingEnabled;
    })
    .catch(() => {
      _fetchPromise = null;
      _pricingEnabled = false;
      return false;
    });

  return _fetchPromise;
}

/** Call this to bust the cache (e.g. after admin toggle). */
export function invalidatePricingCache() {
  _pricingEnabled = null;
  _fetchPromise = null;
}

// ─── Feature flags per plan ───────────────────────────────────────────────────
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

// ─── Sync helpers (used in components that can't be async) ────────────────────

/**
 * Synchronous feature check — uses the in-memory cache.
 * Call `initBilling()` once at app startup to warm the cache.
 */
export function planHasFeature(team, feature) {
  // If pricing is off (or not yet loaded), grant full access
  if (_pricingEnabled === false || _pricingEnabled === null) return true;
  if (!team) return false;
  const plan = team.plan || "starter";
  return (PLAN_FEATURES[plan] || PLAN_FEATURES.starter).includes(feature);
}

/**
 * Returns whether a team currently has access to the app at all.
 */
export function teamHasAccess(team) {
  // If pricing is off, everyone has access
  if (_pricingEnabled === false || _pricingEnabled === null) return true;
  if (!team) return false;
  const status = team.billing_status;
  if (!status) return false;
  return status === "active" || status === "trial" || status === "demo";
}

/**
 * Returns a human-readable reason string when access is blocked.
 */
export function accessBlockedReason(team) {
  if (!_pricingEnabled) return null;
  if (teamHasAccess(team)) return null;
  const status = team?.billing_status;
  if (!status || status === "inactive") {
    return "Your subscription is inactive. Upgrade to restore full access.";
  }
  if (status === "trial") {
    return "Your free trial has expired. Upgrade to continue using XC Team App.";
  }
  return "Your subscription is inactive. Upgrade to restore full access.";
}

/**
 * Call once at app startup to warm the pricing cache.
 * Components using planHasFeature synchronously will get correct results after this resolves.
 */
export async function initBilling() {
  await fetchPricingEnabled();
}
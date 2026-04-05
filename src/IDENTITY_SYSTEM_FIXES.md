# Identity System Fix - Complete Implementation

## Overview
Fixed the entire app identity system to use the User profile table (`display_name`) as the only source of visible identity. Email is now strictly for authentication only.

## Changes Made

### 1. Display Name Generation (`lib/displayName.js`)
- **Rewrote** `generateDisplayName()` to use `first_name` and `last_name` parameters
  - Coach: `"Coach - " + lastName`
  - Athlete: `"firstName lastName"`
- **Rewrote** `getDisplayName()` to:
  - Always prefer `display_name` from User profile
  - Never show email or email prefix
  - Regenerate from first/last name if needed
  - Return safe fallback ("Coach", "Athlete", "User") only as last resort

### 2. Onboarding Flow (`pages/Onboarding.jsx`)
- **Changed Step 1** from "full_name" to separate "first_name" and "last_name" fields
- Both fields required before proceeding
- Automatically generates and saves `display_name` based on role and names
- Role selection (Step 2) now regenerates `display_name` when role is selected

### 3. User Identity Validation (`lib/CurrentUserContext.jsx`)
- **Updated** `hasRealName()` to check for `first_name` AND `last_name` (not `name_confirmed` flag)
- Ensures user must have both parts of their name before onboarding completes

### 4. Settings & Profile Updates
- **CoachSettingsTab** (`components/coach/CoachSettingsTab.jsx`)
  - Name edit form collects first_name and last_name separately
  - Generates display_name on save
  
- **AthleteProfileTab** (`components/athlete/AthleteProfileTab.jsx`)
  - Same first_name + last_name edit flow
  - Generates display_name on save

### 5. Athlete Display - All Components Updated
- **CoachInsightsTab** - Uses `getDisplayName(athlete)` (lines 89, 161)
- **CoachPerformanceTab** - Uses `getDisplayName(athlete)` (line 72)
- **AthleteList** - Uses `getDisplayName(athlete)` 
- **RosterDrawer** - Uses `getDisplayName(athlete)` for search and display
- **AthleteWorkouts** - Uses `getDisplayName(athlete)`
- **AthleteMeetHistory** - No athlete name display (meet-centric)
- **PacketAthletePages** - Uses `getDisplayName(athlete)`

### 6. Removed
- **Deleted** `components/shared/NamePromptBanner.jsx` (no longer needed since names required during onboarding)

### 7. Migration Function (`functions/backfillDisplayNames.js`)
- Admin-only function to backfill `display_name` for existing users
- Generates display_names based on first_name, last_name, and user_type
- Skips users without both first and last names
- Can be called to fix any legacy data

## User Profile Schema

```json
{
  "id": "auto-generated",
  "email": "user@example.com",
  "role": "user | admin",
  "user_type": "coach | athlete",
  "first_name": "John",
  "last_name": "Smith",
  "display_name": "Coach - Smith | John Smith",
  "team_id": "team-uuid",
  "created_date": "auto",
  "updated_date": "auto"
}
```

## Identity Rules Enforced

✅ Coach display_name: `"Coach - " + lastName`
✅ Athlete display_name: `firstName + " " + lastName`
✅ Email is authentication only, never shown as visible identity
✅ First and last names required on signup before role selection
✅ Display name auto-generated and stored after names + role set
✅ All UI components read from `display_name` field only
✅ No email prefix substitution anywhere in the app

## Where Display Names Are Used

- Coach dashboard greeting
- Athlete dashboard greeting
- Coach roster list
- Athlete roster list
- Athlete profile displays
- Coach viewing athlete profiles
- Insights page athlete cards
- Performance tab athlete cards
- Packet builder athlete pages
- Meet history headers
- Athlete cards and badges
- All user headers and lists

## Testing Checklist

- [ ] Sign up new coach with email, full name → shows as "Coach - LastName"
- [ ] Sign up new athlete with email, full name → shows as "FirstName LastName"
- [ ] Edit name in settings → display_name updates
- [ ] Coach roster shows athlete display names (not emails)
- [ ] Athlete roster shows their own display name (not email)
- [ ] Insights page shows athlete names (not emails)
- [ ] Packet builder shows athlete names (not emails)
- [ ] Meet history shows athlete names correctly
- [ ] Greetings use display_name (not email prefix)
- [ ] Run migration for legacy users with missing display_names

## Implementation Complete ✓

All email-based identity references have been removed. The app now uses the User profile `display_name` field exclusively for all visible user identity across the entire application.
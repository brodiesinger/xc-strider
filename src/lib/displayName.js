/**
 * Generates display_name from first_name, last_name, and user_type.
 * Coach  → "Coach - LastName"
 * Athlete → "FirstName LastName"
 */
export function generateDisplayName(firstName, lastName, userType) {
  const first = firstName?.trim();
  const last = lastName?.trim();

  if (userType === "coach") {
    return last ? `Coach - ${last}` : "Coach";
  }
  
  // athlete or unknown
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return "Athlete";
}

/**
 * Returns the display_name from a user object.
 * NEVER shows email, email prefix, or auth data.
 * Only uses: display_name, first_name, last_name, user_type.
 */
export function getDisplayName(user, fallback) {
  if (!user) return fallback ?? "User";

  // Always prefer display_name if it exists and isn't an email
  if (user.display_name?.trim() && !user.display_name.includes("@")) {
    return user.display_name.trim();
  }

  // Regenerate from first/last name
  const userType = user.user_type || user.role;
  const first = user.first_name?.trim();
  const last = user.last_name?.trim();
  
  if (first || last) {
    return generateDisplayName(first, last, userType);
  }

  // Fallback only
  return fallback ?? (userType === "coach" ? "Coach" : userType === "athlete" ? "Athlete" : "User");
}
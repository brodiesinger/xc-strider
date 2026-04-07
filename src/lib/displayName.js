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
 * 
 * Guaranteed never to return: null, undefined, empty string, email, or email prefix
 */
export function getDisplayName(user, fallback) {
  if (!user) return fallback ?? "User";

  // Always prefer display_name if it exists and isn't an email
  const dn = user.display_name?.trim();
  if (dn && !dn.includes("@")) {
    return dn;
  }

  // Regenerate from first/last name
  const userType = user.user_type || user.role;
  const first = user.first_name?.trim();
  const last = user.last_name?.trim();
  
  if (first || last) {
    return generateDisplayName(first, last, userType);
  }

  // Fallback only if all else is missing
  const role = user.user_type || user.role;
  if (role === "coach") return "Coach";
  if (role === "athlete") return "Athlete";
  return fallback ?? "User";
}
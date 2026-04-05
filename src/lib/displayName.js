/**
 * Generates the display_name from a user's full_name and user_type/role.
 *
 * Coach  → "Coach - LastName"
 * Athlete → "First Last"
 * Fallback → "Coach" | "Athlete" | "User"
 */
export function generateDisplayName(fullName, userType) {
  const name = fullName?.trim();
  if (!name || name.includes("@")) {
    if (userType === "coach") return "Coach";
    if (userType === "athlete") return "Athlete";
    return "User";
  }

  const parts = name.split(/\s+/).filter(Boolean);
  const firstName = parts[0];
  const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];

  if (userType === "coach") {
    const dn = `Coach - ${lastName}`;
    console.log("Generated display_name:", name, "→", dn);
    return dn;
  }

  // athlete or unknown
  const dn = parts.length > 1 ? `${firstName} ${lastName}` : firstName;
  console.log("Generated display_name:", name, "→", dn);
  return dn;
}

/**
 * Returns the best available display name for any user-like object.
 * Priority: display_name → generate from full_name → fallback label
 *
 * NEVER returns an email, null, or undefined.
 */
export function getDisplayName(user, fallback) {
  if (!user) return fallback ?? "User";

  const userType = user.user_type || user.role;

  // If display_name exists and looks valid (not an email)
  if (user.display_name?.trim() && !user.display_name.includes("@")) {
    return user.display_name.trim();
  }

  // Regenerate from full_name
  const name = user.full_name?.trim();
  if (name && !name.includes("@")) {
    return generateDisplayName(name, userType);
  }

  // Last resort fallback
  if (fallback) return fallback;
  if (userType === "coach") return "Coach";
  if (userType === "athlete") return "Athlete";
  return "User";
}
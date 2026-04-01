/**
 * Returns the display name for a user based on their role.
 * - Coach: "Coach [LastName]"
 * - Athlete: full name
 * Prioritizes full_name over email prefix.
 */
export function getDisplayName(user) {
  if (!user) return "User";
  
  const name = user.full_name?.trim();

  if (name) {
    if (user.role === "coach" || user.user_type === "coach") {
      const parts = name.split(/\s+/);
      const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      return `Coach ${lastName}`;
    }
    return name;
  }

  // No full_name set — show neutral placeholder (never use email prefix)
  if (user.role === "coach" || user.user_type === "coach") {
    return "Coach";
  }
  return "Athlete";
}
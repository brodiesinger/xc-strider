/**
 * Returns the display name for a user based on their role.
 * - Coach: "Coach [LastName]"
 * - Athlete: full name
 * NEVER falls back to email. Uses "Unnamed User" if no name is set.
 */
export function getDisplayName(user) {
  if (!user) return "Unnamed User";

  const name = user.full_name?.trim();

  if (name) {
    if (user.role === "coach" || user.user_type === "coach") {
      const parts = name.split(/\s+/);
      const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      return `Coach ${lastName}`;
    }
    return name;
  }

  // No full_name — never fall back to email
  return "Unnamed User";
}
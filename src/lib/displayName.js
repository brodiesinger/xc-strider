/**
 * Returns the display name for a user.
 * - Coach: "Coach [LastName]"
 * - Athlete: full_name
 * - Missing name: "Unnamed User"
 * NEVER uses email.
 */
export function getDisplayName(user) {
  if (!user) return "Unnamed User";

  const name = user.full_name?.trim();
  if (!name) return "Unnamed User";

  const role = user.user_type || user.role;
  if (role === "coach") {
    const parts = name.split(/\s+/);
    const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    return `Coach ${lastName}`;
  }

  return name;
}
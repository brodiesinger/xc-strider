/**
 * Returns the display name for a user based on their role.
 * - Coach: "Coach [LastName]"
 * - Athlete: full name
 */
export function getDisplayName(user) {
  const name = user?.full_name || user?.email?.split("@")[0] || "User";
  if (user?.user_type === "coach") {
    const parts = name.trim().split(/\s+/);
    const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    return `Coach ${lastName}`;
  }
  return name;
}
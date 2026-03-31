/**
 * Returns the display name for a user based on their role.
 * - Coach: "Coach [LastName]"
 * - Athlete: full name
 * Prioritizes full_name over email prefix.
 */
export function getDisplayName(user) {
  if (!user) return "User";
  
  // Always use full_name if available
  if (user.full_name?.trim()) {
    const name = user.full_name.trim();
    if (user.role === "coach" || user.user_type === "coach") {
      const parts = name.split(/\s+/);
      const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      return `Coach ${lastName}`;
    }
    return name;
  }
  
  // Fallback to email prefix only if no full_name
  const emailPrefix = user.email?.split("@")[0] || "User";
  if (user.role === "coach" || user.user_type === "coach") {
    return `Coach ${emailPrefix}`;
  }
  return emailPrefix;
}
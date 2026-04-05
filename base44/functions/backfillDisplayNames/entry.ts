import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Backfills display_name for all users based on first_name, last_name, and user_type.
 * Admin-only operation. Generates display names for users missing them.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all users
    const allUsers = await base44.asServiceRole.entities.User.list('', 1000);
    
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (const u of allUsers) {
      try {
        const first = u.first_name?.trim();
        const last = u.last_name?.trim();

        // Skip if missing names
        if (!first || !last) {
          skipped++;
          continue;
        }

        // Generate display_name based on user_type
        let displayName;
        if (u.user_type === 'coach') {
          displayName = `Coach - ${last}`;
        } else {
          displayName = `${first} ${last}`;
        }

        // Only update if display_name is missing or looks wrong (contains @)
        if (!u.display_name || u.display_name.includes('@')) {
          await base44.asServiceRole.entities.User.update(u.id, {
            display_name: displayName,
          });
          updated++;
        }
      } catch (err) {
        errors.push({ userId: u.id, error: err.message });
      }
    }

    return Response.json({
      success: true,
      message: `Updated ${updated} users, skipped ${skipped}`,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Admin-only: backfills full_name for any users who have an empty
 * or email-based full_name. Sets it to the email prefix as a temporary fix.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const users = await base44.asServiceRole.entities.User.list();

    let updated = 0;
    for (const u of users) {
      const name = u.full_name?.trim() || "";
      const needsBackfill = !name || name.includes("@");
      if (needsBackfill && u.email) {
        const emailPrefix = u.email.split("@")[0];
        // Capitalize first letter of each word separated by dots/underscores
        const readable = emailPrefix
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        await base44.asServiceRole.entities.User.update(u.id, { full_name: readable });
        updated++;
      }
    }

    return Response.json({ success: true, updated, total: users.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
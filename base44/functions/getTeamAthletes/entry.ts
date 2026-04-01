import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { team_id } = await req.json();
    if (!team_id) {
      return Response.json({ error: 'team_id is required' }, { status: 400 });
    }

    const athletes = await base44.asServiceRole.entities.User.filter(
      { team_id, user_type: 'athlete' },
      'full_name',
      100
    );

    // Return only the fields needed by the frontend
    const mapped = athletes.map((a) => ({
      id: a.id,
      email: a.email,
      full_name: a.full_name || "",
      user_type: a.user_type,
      team_id: a.team_id,
    }));

    return Response.json({ athletes: mapped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    const match = JSON.parse(event.body || '{}');

    if (!match.matchId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'matchId is required' }) };
    }

    await sql`
      INSERT INTO matches (
        match_id, date, opponent, team,
        sets, players_by_zone, lineup, event_log, updated_at
      )
      VALUES (
        ${match.matchId},
        ${match.date},
        ${match.opponent},
        ${match.team},
        ${JSON.stringify(match.sets || {})}::jsonb,
        ${JSON.stringify(match.playersByZone || {})}::jsonb,
        ${JSON.stringify(match.lineup || [])}::jsonb,
        ${JSON.stringify(match.eventLog || [])}::jsonb,
        NOW()
      )
      ON CONFLICT (match_id) DO UPDATE SET
        date = EXCLUDED.date,
        opponent = EXCLUDED.opponent,
        team = EXCLUDED.team,
        sets = EXCLUDED.sets,
        players_by_zone = EXCLUDED.players_by_zone,
        lineup = EXCLUDED.lineup,
        event_log = EXCLUDED.event_log,
        updated_at = NOW()
    `;

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Database error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Database error' }) };
  }
};
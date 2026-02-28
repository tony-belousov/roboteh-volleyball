const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    const matches = await sql`
      SELECT
        id,
        match_id AS "matchId",
        date,
        opponent,
        team,
        sets,
        players_by_zone AS "playersByZone",
        lineup,
        event_log AS "eventLog",
        created_at,
        updated_at
      FROM matches
      ORDER BY created_at DESC
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matches)
    };
  } catch (error) {
    console.error('Database error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Database error' }) };
  }
};
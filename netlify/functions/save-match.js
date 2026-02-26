const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    const match = JSON.parse(event.body);

    const existing = await sql`
      SELECT id FROM matches 
      WHERE date = ${match.date} 
        AND opponent = ${match.opponent} 
        AND team = ${match.team}
    `;

    if (existing.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Match already exists', skipped: true })
      };
    }

    await sql`
      INSERT INTO matches (date, opponent, team, sets, playersByZone, lineup, created_at)
      VALUES (${match.date}, ${match.opponent}, ${match.team}, ${match.sets}, ${match.playersByZone}, ${match.lineup}, NOW())
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database error' })
    };
  }
};
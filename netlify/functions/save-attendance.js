const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    const { date, present } = JSON.parse(event.body || '{}');

    if (!date) {
      return { statusCode: 400, body: JSON.stringify({ error: 'date is required' }) };
    }

    await sql`
      INSERT INTO attendance (date, present)
      VALUES (
        ${date},
        ${JSON.stringify(present || {})}::jsonb
      )
      ON CONFLICT (date) DO UPDATE SET
        present = EXCLUDED.present
    `;

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Database error' }) };
  }
};
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    const { date, present } = JSON.parse(event.body);

    const existing = await sql`SELECT id FROM attendance WHERE date = ${date}`;

    if (existing.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Attendance already exists', skipped: true })
      };
    }

    await sql`INSERT INTO attendance (date, present) VALUES (${date}, ${present})`;

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Database error' };
  }
};
const { neon } = require('@neondatabase/serverless');

exports.handler = async () => {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    const records = await sql`SELECT date, present FROM attendance ORDER BY date DESC`;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records)
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Database error' };
  }
};
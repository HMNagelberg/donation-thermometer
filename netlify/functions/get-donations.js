// netlify/functions/get-donations.js
const faunadb = require('faunadb');
const q = faunadb.query;

// Initialize FaunaDB client
const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

exports.handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers,
      body: 'Method Not Allowed' 
    };
  }

  try {
    // Get total amount
    let totalAmount = 0;
    try {
      const totalResult = await client.query(
        q.Get(q.Match(q.Index('total_by_id'), 'donation_total'))
      );
      totalAmount = totalResult.data.amount;
    } catch (error) {
      // If no total exists yet, keep it at 0
      if (error.name !== 'NotFound') {
        throw error;
      }
    }

    // Get recent donations (last 5)
    const donationsResult = await client.query(
      q.Map(
        q.Paginate(q.Documents(q.Collection('donations')), { size: 5, before: null }),
        q.Lambda(x => q.Get(x))
      )
    );

    const recentDonations = donationsResult.data.map(d => d.data);

    // Return both the total and recent donations
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        total: totalAmount,
        recentDonations: recentDonations
      })
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch donation data' })
    };
  }
}

// netlify/functions/add-donation.js
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: 'Method Not Allowed' 
    };
  }

  try {
    const { name, amount, adminKey } = JSON.parse(event.body);

    // Simple admin key validation
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid positive amount required' })
      };
    }

    const donationAmount = parseFloat(amount);
    
    // Store donation in FaunaDB
    await client.query(
      q.Create(
        q.Collection('donations'),
        {
          data: {
            amount: donationAmount,
            name: name || 'Anonymous',
            timestamp: new Date().toISOString()
          }
        }
      )
    );
    
    // Update total amount
    await updateTotalAmount(donationAmount);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: `Added donation of $${donationAmount} from ${name || 'Anonymous'}` 
      })
    };
  } catch (error) {
    console.error('Error processing manual donation:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to process donation' })
    };
  }
};

// Function to update total amount
async function updateTotalAmount(amountToAdd) {
  try {
    // Try to get the current total
    const result = await client.query(
      q.Get(q.Match(q.Index('total_by_id'), 'donation_total'))
    );
    
    // Update the existing total
    await client.query(
      q.Update(result.ref, {
        data: {
          amount: result.data.amount + amountToAdd
        }
      })
    );
  } catch (error) {
    // If no total exists yet, create it
    if (error.name === 'NotFound') {
      await client.query(
        q.Create(
          q.Collection('totals'),
          {
            data: {
              id: 'donation_total',
              amount: amountToAdd
            }
          }
        )
      );
    } else {
      throw error;
    }
  }
}

// netlify/functions/stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const faunadb = require('faunadb');
const q = faunadb.query;

// Initialize FaunaDB client
const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const signature = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Handle checkout.session.completed event
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    
    // Make sure this is a payment
    if (session.mode === 'payment') {
      const amount = session.amount_total / 100; // Convert from cents
      
      let customerName = 'Anonymous';
      if (session.customer_details && session.customer_details.name) {
        customerName = session.customer_details.name;
      }
      
      // Store donation in FaunaDB
      try {
        // Create a new donation record
        await client.query(
          q.Create(
            q.Collection('donations'),
            {
              data: {
                amount: amount,
                name: customerName,
                timestamp: new Date().toISOString()
              }
            }
          )
        );
        
        // Update the total amount
        await updateTotalAmount(amount);
        
      } catch (error) {
        console.error('Error saving to database:', error);
        return { statusCode: 500, body: 'Error processing donation' };
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
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

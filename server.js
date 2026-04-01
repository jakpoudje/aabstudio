const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors());
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));

// ── ANALYSIS ──
app.post('/api/analyse', async (req, res) => {
  try {
    const { request, depth, output } = req.body;
    const prompt = `You are AABStudio AI — a professional document intelligence engine.

Analysis request: "${request || 'General document analysis'}"
Depth mode: ${depth || 'deep'}
Output mode: ${output || 'report'}

Return ONLY a valid JSON object with no markdown, no code fences, no preamble:
{
  "title": "concise report title",
  "docType": "detected document type",
  "domain": "detected domain",
  "executiveSummary": "2-3 sentences of substantive analytical findings",
  "sections": [
    {
      "title": "section title",
      "body": "3-4 sentences of real analytical content",
      "evidenceItems": [
        {"label": "Finding", "text": "specific evidence", "confidence": "High"}
      ]
    }
  ]
}

Generate 5 sections appropriate to the request. Be substantive and specific.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Anthropic API error', details: err });
    }

    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const report = JSON.parse(clean);
    res.json(report);
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
});

// ── STRIPE CHECKOUT ──
app.post('/api/stripe/create-checkout', async (req, res) => {
  try {
    const { priceId, mode, successUrl, cancelUrl, customerEmail } = req.body;
    const session = await stripe.checkout.sessions.create({
      mode: mode || 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || 'https://aabstudio.ai?checkout=success',
      cancel_url: cancelUrl || 'https://aabstudio.ai?checkout=cancelled',
      customer_email: customerEmail,
      subscription_data: mode === 'subscription' ? {
        trial_period_days: 7
      } : undefined,
      allow_promotion_codes: true
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Checkout failed', details: err.message });
  }
});

// ── STRIPE WEBHOOK ──
app.post('/api/stripe/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  switch (event.type) {
    case 'checkout.session.completed':
      console.log('Checkout completed:', event.data.object.id);
      break;
    case 'customer.subscription.created':
      console.log('Subscription created:', event.data.object.id);
      break;
    case 'customer.subscription.deleted':
      console.log('Subscription cancelled:', event.data.object.id);
      break;
    case 'invoice.payment_succeeded':
      console.log('Payment succeeded:', event.data.object.id);
      break;
    case 'invoice.payment_failed':
      console.log('Payment failed:', event.data.object.id);
      break;
  }
  res.json({ received: true });
});

// ── HEALTH ──
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'AABStudio API',
    anthropic: process.env.ANTHROPIC_API_KEY ? 'set' : 'missing',
    stripe: process.env.STRIPE_SECRET_KEY ? 'set' : 'missing',
    webhook: process.env.STRIPE_WEBHOOK_SECRET ? 'set' : 'missing'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AABStudio API running on port ${PORT}`));

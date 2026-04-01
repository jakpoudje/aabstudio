const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors());
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));

app.post('/api/analyse', async (req, res) => {
  try {
    const { request, depth, output, fileName, fileContent } = req.body;

    const docSection = fileContent
      ? `\n\nDOCUMENT NAME: ${fileName || 'uploaded document'}\nDOCUMENT CONTENT:\n${fileContent.slice(0, 6000)}`
      : `\n\nNote: No document content was provided. Analyse based on the request description only.`;

    const prompt = `You are AABStudio AI — a professional document intelligence engine built for lawyers, journalists, financial analysts, researchers, and investigators.

Analysis request: "${request}"
Analysis depth: ${depth || 'deep'}
${docSection}

Return ONLY a valid JSON object (no markdown, no code fences, no preamble):
{
  "title": "concise, specific report title based on the actual document",
  "docType": "detected document type (e.g. Legal Contract, Financial Report, Research Paper, Policy Document)",
  "domain": "detected domain (Legal/Financial/Research/Investigative/Policy/Technical/General)",
  "executiveSummary": "2-3 sentences of substantive analytical findings specific to this document and request",
  "sections": [
    {
      "title": "section title",
      "body": "3-4 sentences of real analytical content with specific details from the document",
      "reasoning": {
        "observation": "specific observation from the document",
        "implication": "what this means in practice",
        "recommendation": "concrete action recommended"
      },
      "evidenceItems": [
        {
          "label": "finding type (e.g. Risk Clause, Financial Anomaly, Key Entity, Contradiction)",
          "source": "e.g. Section 4.2, Page 17, Paragraph 3",
          "text": "specific quoted or paraphrased text from the document",
          "interpretation": "what this text means analytically",
          "implication": "practical consequence or significance",
          "confidence": "High|Medium|Low"
        }
      ]
    }
  ]
}

Generate 4-5 sections with 2-3 evidence items each. Be specific to the actual document content. Use the analytical reasoning framework: Observation, Implication, Recommendation.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
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

app.post('/api/stripe/create-checkout', async (req, res) => {
  try {
    const { priceId, mode, customerEmail } = req.body;
    const session = await stripe.checkout.sessions.create({
      mode: mode || 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://aabstudio.ai?checkout=success',
      cancel_url: 'https://aabstudio.ai?checkout=cancelled',
      customer_email: customerEmail,
      subscription_data: mode === 'subscription' ? { trial_period_days: 7 } : undefined,
      allow_promotion_codes: true
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Checkout failed', details: err.message });
  }
});

app.post('/api/stripe/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  console.log('Webhook event:', event.type, event.data.object.id);
  res.json({ received: true });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'AABStudio API v2',
    anthropic: process.env.ANTHROPIC_API_KEY ? 'set' : 'missing',
    stripe: process.env.STRIPE_SECRET_KEY ? 'set' : 'missing',
    webhook: process.env.STRIPE_WEBHOOK_SECRET ? 'set' : 'missing'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AABStudio API v2 running on port ${PORT}`));

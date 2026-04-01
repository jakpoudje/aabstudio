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
Output type: ${output || 'report'}
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

Generate 4-5 sections with 2-3 evidence items each. Be specific to the actual document content. Use the analytical reasoning framework: Observation → Explanation → Implication → Evidence → Recommendation.`;

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

app.post('/api/scenes', async (req, res) => {
  try {
    const { report, presenterMode } = req.body;

    const prompt = `You are AABStudio Scene Engine — you convert analytical reports into broadcast-ready presenter scripts broken into 8-second scenes.

REPORT TITLE: ${report.title}
DOCUMENT TYPE: ${report.docType}
DOMAIN: ${report.domain}
EXECUTIVE SUMMARY: ${report.executiveSummary}

REPORT SECTIONS:
${report.sections.map((s, i) => `Section ${i+1}: ${s.title}\n${s.body}\nKey findings: ${(s.evidenceItems||[]).map(e => e.text).join(' | ')}`).join('\n\n')}

PRESENTER MODE: ${presenterMode || 'human'}
- human: teleprompter format, natural spoken language, one presenter
- ai: narration format, third-person authoritative tone, one presenter  
- dual: split between Presenter A (introduces/questions) and Presenter B (explains/analyses)

SCENE RULES:
- Maximum 8 seconds per scene
- Normal pacing: 140 words/minute = ~18 words per scene
- Each scene must be 15-20 words exactly
- Scenes must flow continuously — no abrupt cuts
- Scene types: Introduction | Evidence | Explanation | Comparison | Recommendation | Conclusion

Return ONLY valid JSON, no markdown, no code fences:
{
  "title": "production title for the video",
  "presenterMode": "${presenterMode || 'human'}",
  "totalScenes": 0,
  "estimatedDuration": "total duration in seconds",
  "discussions": [
    {
      "sectionTitle": "section this discussion block covers",
      "discussionText": "2-3 sentence expanded spoken explanation of this section, written as natural speech",
      "scenes": [
        {
          "sceneNumber": 1,
          "type": "Introduction",
          "duration": 8,
          "presenterA": "15-20 word script for presenter A (or single presenter)",
          "presenterB": "15-20 word script for presenter B (only for dual mode, otherwise null)",
          "visualPrompt": "brief description of what should appear on screen — e.g. document excerpt, chart, key statistic, or relevant imagery",
          "evidenceRef": "EV-101 or null if no direct evidence reference"
        }
      ]
    }
  ]
}

Generate one discussion block per report section. Each discussion block should have 3-5 scenes. Make the language natural, engaging, and broadcast-ready. Reference specific evidence where relevant.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
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
    const scenes = JSON.parse(clean);
    res.json(scenes);

  } catch (err) {
    console.error('Scene generation error:', err);
    res.status(500).json({ error: 'Scene generation failed', details: err.message });
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

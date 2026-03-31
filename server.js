const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: ['https://aabstudio.ai', 'https://aabstudio.pages.dev'] }));
app.use(express.json({ limit: '10mb' }));

app.post('/api/analyse', async (req, res) => {
  const { request, depth, output } = req.body;
  if (!request) return res.status(400).json({ error: 'No request provided' });
  try {
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
        messages: [{
          role: 'user',
          content: `You are AABStudio AI — a professional document intelligence engine. Analysis request: "${request}". Depth: ${depth}. Output: ${output}.\n\nReturn ONLY valid JSON:\n{"title":"report title","docType":"document type","domain":"domain","executiveSummary":"2-3 sentences of real analysis","sections":[{"title":"section","body":"3-4 sentences of analysis","evidenceItems":[{"label":"label","text":"evidence","confidence":"High"}]}]}\nGenerate 5 substantive sections.`
        }]
      })
    });
    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('');
    const report = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
});

app.post('/api/stripe/create-checkout', async (req, res) => {
  res.json({ message: 'Stripe endpoint ready — add STRIPE_SECRET_KEY to activate' });
});

app.get('/health', (req, res) => res.json({ status: 'ok', platform: 'AABStudio API' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AABStudio API running on port ${PORT}`));

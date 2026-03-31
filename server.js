const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', platform: 'AABStudio API', key: process.env.ANTHROPIC_API_KEY ? 'set' : 'missing' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AABStudio API running on port ${PORT}`));

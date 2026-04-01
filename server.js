const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mammoth = require('mammoth');
const XLSX = require('xlsx');

const app = express();

app.use(cors());
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '30mb' }));

async function extractText(fileName, fileBase64, mimeType) {
  if (!fileBase64) return null;
  const buffer = Buffer.from(fileBase64, 'base64');
  const name = (fileName || '').toLowerCase();

  try {
    // DOCX / DOC
    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.slice(0, 8000);
    }
    // XLSX / XLS
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let text = '';
      workbook.SheetNames.forEach(s => {
        text += `[Sheet: ${s}]\n` + XLSX.utils.sheet_to_csv(workbook.Sheets[s]) + '\n';
      });
      return text.slice(0, 8000);
    }
    // PPTX
    if (name.endsWith('.pptx')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let text = '';
      workbook.SheetNames.forEach((s, i) => {
        text += `[Slide ${i+1}]\n` + XLSX.utils.sheet_to_txt(workbook.Sheets[s]) + '\n';
      });
      return text.slice(0, 8000);
    }
    // CSV / TXT / JSON / HTML / MD — plain text
    if (name.match(/\.(csv|txt|md|json|html|htm)$/) || (mimeType && mimeType.startsWith('text/'))) {
      return buffer.toString('utf8').slice(0, 8000);
    }
    return null;
  } catch (err) {
    console.error('Extraction error:', err.message);
    return null;
  }
}

app.post('/api/analyse', async (req, res) => {
  try {
    const { request, depth, fileName, fileContent, fileBase64, mimeType } = req.body;
    const name = (fileName || '').toLowerCase();
    const isPDF = name.endsWith('.pdf') || mimeType === 'application/pdf';

    const analysisPrompt = `You are AABStudio AI — a professional document intelligence engine for lawyers, journalists, financial analysts, researchers, and investigators.

Analysis request: "${request}"
Analysis depth: ${depth || 'deep'}

Return ONLY valid JSON with no markdown and no code fences:
{
  "title": "specific descriptive report title based on actual document content",
  "docType": "document type (e.g. Legal Contract, Financial Report, Research Paper, Policy Document, Spreadsheet, Presentation, Consent Form)",
  "domain": "Legal | Financial | Research | Investigative | Policy | Technical | General",
  "executiveSummary": "2-3 sentences of substantive findings drawn directly from the document content",
  "sections": [
    {
      "title": "section title",
      "body": "3-4 sentences of substantive analysis referencing specific content from the document",
      "reasoning": {
        "observation": "specific observation drawn from the document",
        "implication": "what this means in practice for the user",
        "recommendation": "specific actionable recommendation"
      },
      "evidenceItems": [
        {
          "label": "Risk Clause | Financial Anomaly | Key Entity | Contradiction | Obligation | Data Point | Legal Provision",
          "source": "specific location e.g. Section 4.2, Page 17, Clause 3, Row 23, Slide 4",
          "text": "direct quote or close paraphrase from the document",
          "interpretation": "what this text means analytically",
          "implication": "practical consequence or risk",
          "confidence": "High|Medium|Low"
        }
      ]
    }
  ]
}

Generate 4-5 sections with 2-3 evidence items each. Reference actual clauses, figures, names, and dates from the document. Reasoning framework: Observation → Implication → Recommendation.`;

    let messages;

    if (isPDF && fileBase64) {
      // PDFs — send natively to Claude which reads them directly
      messages = [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 }
          },
          { type: 'text', text: analysisPrompt }
        ]
      }];
    } else {
      // All other formats — extract text server-side then send as text
      let documentText = null;
      if (fileBase64) {
        documentText = await extractText(fileName, fileBase64, mimeType);
      }
      documentText = documentText || fileContent || null;

      const docSection = documentText
        ? `\n\nDOCUMENT NAME: ${fileName}\n\nDOCUMENT CONTENT:\n${documentText}`
        : `\n\nDocument name: "${fileName}" — content could not be extracted. Analyse based on filename and request context only.`;

      messages = [{ role: 'user', content: analysisPrompt + docSection }];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3500,
        messages
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
    console.error('Stripe error:', err);
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
  console.log('Webhook:', event.type);
  res.json({ received: true });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'AABStudio API v3',
    anthropic: process.env.ANTHROPIC_API_KEY ? 'set' : 'missing',
    stripe: process.env.STRIPE_SECRET_KEY ? 'set' : 'missing',
    webhook: process.env.STRIPE_WEBHOOK_SECRET ? 'set' : 'missing',
    formats: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'csv', 'txt', 'json', 'html', 'md']
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AABStudio API v3 running on port ${PORT}`));

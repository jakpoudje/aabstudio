const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');

const app = express();

app.use(cors());
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '30mb' }));

// ── Document text extraction ──────────────────────────────────────────────────

async function extractText(fileName, fileBase64, mimeType) {
  if (!fileBase64) return null;

  const buffer = Buffer.from(fileBase64, 'base64');
  const name = (fileName || '').toLowerCase();

  try {
    // PDF
    if (mimeType === 'application/pdf' || name.endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      return data.text.slice(0, 8000);
    }

    // DOCX / DOC
    if (name.endsWith('.docx') || name.endsWith('.doc') ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.slice(0, 8000);
    }

    // XLSX / XLS / CSV
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv') ||
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        text += `\n[Sheet: ${sheetName}]\n`;
        text += XLSX.utils.sheet_to_csv(sheet);
      });
      return text.slice(0, 8000);
    }

    // PPTX
    if (name.endsWith('.pptx') ||
        mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let text = '';
      workbook.SheetNames.forEach((name, i) => {
        text += `[Slide ${i + 1}]\n`;
        const sheet = workbook.Sheets[name];
        text += XLSX.utils.sheet_to_txt(sheet) + '\n';
      });
      return text.slice(0, 8000) || '[PPTX file — slide content extraction attempted]';
    }

    // Plain text / JSON / HTML / CSV (already readable)
    if (name.match(/\.(txt|md|json|html|htm|csv)$/) ||
        (mimeType && mimeType.startsWith('text/'))) {
      return buffer.toString('utf8').slice(0, 8000);
    }

    return null;

  } catch (err) {
    console.error('Extraction error:', err.message);
    return null;
  }
}

// ── Analysis endpoint ─────────────────────────────────────────────────────────

app.post('/api/analyse', async (req, res) => {
  try {
    const { request, depth, fileName, fileContent, fileBase64, mimeType } = req.body;

    // Try server-side extraction first, fall back to client-sent text
    let extractedText = null;
    if (fileBase64) {
      extractedText = await extractText(fileName, fileBase64, mimeType);
    }

    const documentText = extractedText || fileContent || null;

    const docSection = documentText
      ? `\n\nDOCUMENT NAME: ${fileName || 'uploaded document'}\n\nDOCUMENT CONTENT:\n${documentText}`
      : `\n\nDocument name: "${fileName || 'unknown'}" — content could not be extracted. Analyse based on the filename and request only.`;

    const prompt = `You are AABStudio AI — a professional document intelligence engine built for lawyers, journalists, financial analysts, researchers, and investigators.

Analysis request: "${request}"
Analysis depth: ${depth || 'deep'}
${docSection}

Return ONLY a valid JSON object with no markdown, no code fences, no preamble. Structure:
{
  "title": "specific descriptive report title based on the actual document content",
  "docType": "document type (e.g. Legal Contract, Financial Report, Research Paper, Policy Document, Spreadsheet, Presentation, Consent Form)",
  "domain": "primary domain (Legal / Financial / Research / Investigative / Policy / Technical / General)",
  "executiveSummary": "2-3 sentences of substantive analytical findings drawn directly from the document content",
  "sections": [
    {
      "title": "section title",
      "body": "3-4 sentences of substantive analysis with specific details and references from the document",
      "reasoning": {
        "observation": "specific observation drawn from the document",
        "implication": "what this means in practice for the user",
        "recommendation": "specific actionable recommendation"
      },
      "evidenceItems": [
        {
          "label": "finding type (Risk Clause / Financial Anomaly / Key Entity / Contradiction / Obligation / Data Point / Legal Provision)",
          "source": "specific location e.g. Section 4.2 / Page 17 / Row 23 / Slide 4",
          "text": "direct quote or close paraphrase from the document",
          "interpretation": "what this text means analytically",
          "implication": "practical consequence or risk",
          "confidence": "High|Medium|Low"
        }
      ]
    }
  ]
}

Requirements:
- Generate 4-5 sections, each with 2-3 evidence items
- All analysis must be grounded in the actual document content provided
- Use the reasoning framework: Observation → Implication → Recommendation
- Be specific — reference actual clauses, figures, names, dates from the document
- If content is a spreadsheet, focus on data patterns, anomalies, and financial indicators
- If content is a presentation, focus on key messages, claims, and evidence quality
- If content is legal, focus on obligations, risks, liabilities, and compliance gaps`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3500,
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

// ── Stripe endpoints ──────────────────────────────────────────────────────────

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
    formats: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'txt', 'csv', 'json', 'html', 'md']
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AABStudio API v3 running on port ${PORT}`));

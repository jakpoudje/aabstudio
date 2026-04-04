const express = require('express')
const cors = require('cors')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const mammoth = require('mammoth')
const XLSX = require('xlsx')

const app = express()

app.use(cors())
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '50mb' }))

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY
const RUNWAY_KEY = process.env.RUNWAY_API_KEY
const CREATOMATE_KEY = process.env.CREATOMATE_API_KEY

/* ===========================================================
   GLOBAL CONFIG
=========================================================== */

const SCENE_DURATION = 8
const WORDS_PER_SCENE = 18

const COST_CONFIG = {
  runwaySceneCost: 0.10,
  elevenVoiceCost: 0.04,
  creatomateCost: 0.03,
  aiCostPerScene: 0.03,
  margin: 0.7
}

function calculateSceneCost() {
  const base =
    COST_CONFIG.runwaySceneCost +
    COST_CONFIG.elevenVoiceCost +
    COST_CONFIG.creatomateCost +
    COST_CONFIG.aiCostPerScene

  return Number((base * (1 + COST_CONFIG.margin)).toFixed(2))
}

function calculateCredits(sceneCount) {
  return Math.ceil(sceneCount * 10)
}

/* ===========================================================
   ENGINE 1 — DOCUMENT INTELLIGENCE
=========================================================== */

async function extractText(fileName, fileBase64, mimeType) {
  if (!fileBase64) return null

  const buffer = Buffer.from(fileBase64, 'base64')
  const name = (fileName || '').toLowerCase()

  try {

    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      const r = await mammoth.extractRawText({ buffer })
      return r.value.slice(0, 50000)
    }

    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const wb = XLSX.read(buffer, { type: 'buffer' })

      let text = ''

      wb.SheetNames.forEach(sheet => {
        text += `[Sheet: ${sheet}]\n`
        text += XLSX.utils.sheet_to_csv(wb.Sheets[sheet]) + '\n'
      })

      return text.slice(0, 50000)
    }

    if (
      name.match(/\.(csv|txt|md|json|html|htm)$/) ||
      (mimeType && mimeType.startsWith('text/'))
    ) {
      return buffer.toString('utf8').slice(0, 50000)
    }

    return null

  } catch (err) {
    console.error('Text extraction failed', err)
    return null
  }
}

/* ===========================================================
   ENGINE 2 — ANALYSIS
=========================================================== */

app.post('/api/analyse', async (req, res) => {

  try {

    const { request, depth, fileName, fileBase64, mimeType } = req.body

    let docText = await extractText(fileName, fileBase64, mimeType)

    const prompt = `
You are AABStudio AI — a document intelligence system.

Analyze the document deeply.

Return ONLY JSON.

{
"title":"",
"docType":"",
"domain":"",
"executiveSummary":"",
"sections":[
{
"title":"",
"sectionId":"",
"body":"",
"reasoning":{
"merits":"",
"risks":"",
"tradeOffs":"",
"recommendation":""
},
"evidenceItems":[
{
"evidenceId":"",
"text":"",
"interpretation":"",
"confidence":"High|Medium|Low"
}
]
}
]
}
`

    const r = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4500,
          messages: [
            {
              role: 'user',
              content: prompt + '\n\n' + docText
            }
          ]
        })
      }
    )

    const data = await r.json()

    const report = JSON.parse(
      data.content.map(c => c.text || '').join('')
    )

    report._usage = data.usage || {}

    res.json(report)

  } catch (err) {

    res.status(500).json({
      error: 'Analysis failed',
      details: err.message
    })

  }

})

/* ===========================================================
   ENGINE 3 — SCENE INTELLIGENCE
=========================================================== */

app.post('/api/scenes', async (req, res) => {

  try {

    const { report } = req.body

    const sections = report.sections || []

    let scenes = []

    let sceneNumber = 1

    for (const section of sections) {

      const text = section.body || ''

      const words = text.split(/\s+/)

      for (let i = 0; i < words.length; i += WORDS_PER_SCENE) {

        const segment = words.slice(i, i + WORDS_PER_SCENE).join(' ')

        scenes.push({
          sceneNumber,
          sectionId: section.sectionId,
          duration: SCENE_DURATION,
          narration: segment,
          visualPrompt: `Professional studio presenter explaining ${section.title}`
        })

        sceneNumber++

      }

    }

    const totalScenes = scenes.length
    const totalDuration = totalScenes * SCENE_DURATION

    res.json({

      title: report.title,

      scenes,

      totalScenes,

      totalDurationSeconds: totalDuration,

      estimatedCredits: calculateCredits(totalScenes),

      estimatedCost: calculateSceneCost() * totalScenes

    })

  } catch (err) {

    res.status(500).json({
      error: 'Scene generation failed',
      details: err.message
    })

  }

})

/* ===========================================================
   ENGINE 4 — DOCUMENT COMPARISON
=========================================================== */

app.post('/api/compare', async (req, res) => {

  try {

    const { docA, docB } = req.body

    const prompt = `
Compare these two documents.

Return JSON:
{
"summary":"",
"changes":[
{
"type":"",
"contentA":"",
"contentB":"",
"interpretation":""
}
]
}
`

    const r = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt + '\n\nA:\n' + docA + '\n\nB:\n' + docB
            }
          ]
        })
      }
    )

    const d = await r.json()

    const result = JSON.parse(
      d.content.map(c => c.text || '').join('')
    )

    res.json(result)

  } catch (err) {

    res.status(500).json({
      error: 'Comparison failed',
      details: err.message
    })

  }

})

/* ===========================================================
   ENGINE 5 — COST ESTIMATOR
=========================================================== */

app.post('/api/cost/estimate', (req, res) => {

  const scenes = req.body.numScenes || 20

  const cost = calculateSceneCost() * scenes

  res.json({
    estimatedScenes: scenes,
    estimatedCredits: calculateCredits(scenes),
    estimatedCost: cost,
    message: `${scenes} scenes estimated`
  })

})

/* ===========================================================
   ENGINE 6 — VOICE
=========================================================== */

app.post('/api/voice', async (req, res) => {

  try {

    const { text, voiceId } = req.body

    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2'
        })
      }
    )

    const audio = Buffer.from(await r.arrayBuffer()).toString('base64')

    res.json({
      audio,
      mimeType: 'audio/mpeg'
    })

  } catch (err) {

    res.status(500).json({
      error: 'Voice generation failed'
    })

  }

})

/* ===========================================================
   ENGINE 7 — VIDEO GENERATION
=========================================================== */

app.post('/api/video/generate', async (req, res) => {

  try {

    const { prompt } = req.body

    const r = await fetch(
      'https://api.dev.runwayml.com/v1/image_to_video',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RUNWAY_KEY}`
        },
        body: JSON.stringify({
          model: 'gen3a_turbo',
          promptText: prompt,
          duration: 8
        })
      }
    )

    const data = await r.json()

    res.json({
      taskId: data.id
    })

  } catch (err) {

    res.status(500).json({
      error: 'Runway generation failed'
    })

  }

})

/* ===========================================================
   ENGINE 8 — STRIPE
=========================================================== */

app.post('/api/stripe/create-checkout', async (req, res) => {

  try {

    const { priceId, customerEmail } = req.body

    const session = await stripe.checkout.sessions.create({

      mode: 'payment',

      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],

      success_url: 'https://aabstudio.ai?checkout=success',

      cancel_url: 'https://aabstudio.ai?checkout=cancelled',

      customer_email: customerEmail

    })

    res.json({
      url: session.url
    })

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})

/* ===========================================================
   HEALTH
=========================================================== */

app.get('/health', (req, res) => {

  res.json({
    status: 'ok',
    version: 'AABStudio API v10',
    engines: [
      'DocumentIntelligence',
      'Analysis',
      'SceneIntelligence',
      'Comparison',
      'Voice',
      'Video',
      'CostEstimator'
    ]
  })

})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {

  console.log('AABStudio API running on port', PORT)

})

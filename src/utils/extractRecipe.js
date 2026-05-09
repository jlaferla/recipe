const BASE_PROMPT = `You are a recipe extraction assistant. When given an image of a recipe, extract all available information and return it as JSON only — no markdown, no explanation.

Return this exact structure:
{
  "title": "string",
  "category": "one of: Breakfast | Lunch | Dinner | Snacks | Sauces & Condiments",
  "ingredients": ["string", ...],
  "steps": ["string", ...],
  "notes": "string or empty string",
  "portions": "string — estimate from ingredients if not stated (e.g. '4 servings')",
  "macros": {
    "calories": "string or empty string",
    "protein": "string or empty string",
    "carbs": "string or empty string",
    "fat": "string or empty string"
  }
}

Rules:
- Each ingredient as a single string including quantity, e.g. "2 tbsp olive oil"
- Each step as a single complete sentence/instruction
- If a macro is not present, use empty string
- category must exactly match one of the allowed values; infer if not stated
- portions must always be filled — estimate from the quantity of ingredients if not stated (e.g. large amounts of pasta → "4 servings")`

const UNIT_RULES = {
  metric: `
- UNIT CONVERSION (user preference: metric): Convert ALL imperial measurements to metric.
  - Weight: lbs → g (under 1 kg) or kg (1 kg+), oz → g (1 oz = 28g)
  - Volume: cups → ml (1 cup = 240ml), fl oz → ml (1 fl oz = 30ml), pints → ml, quarts → L
  - Temperature: °F → °C (formula: (°F - 32) × 5/9), round to nearest 5°C
  - Keep metric units as-is. Use sensible rounding (e.g. 454g → 450g, 113g → 115g).`,
  imperial: `
- UNIT CONVERSION (user preference: imperial): Convert ALL metric measurements to imperial.
  - Weight: g → oz (under 500g) or lbs (500g+, 1 lb = 454g), kg → lbs
  - Volume: ml → fl oz (1 fl oz = 30ml) or cups (240ml = 1 cup), L → quarts/pints
  - Temperature: °C → °F (formula: °C × 9/5 + 32), round to nearest 5°F
  - Keep imperial units as-is. Use sensible rounding.`,
}

function buildSystemPrompt(units = 'metric') {
  return BASE_PROMPT + (UNIT_RULES[units] || UNIT_RULES.metric)
}

export async function extractRecipeFromImage(imageDataUrl, units = 'metric') {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env')

  const base64 = imageDataUrl.split(',')[1]
  const mimeMatch = imageDataUrl.match(/data:([^;]+);/)
  const mediaType = mimeMatch ? mimeMatch[1] : 'image/jpeg'

  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: buildSystemPrompt(units),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          { type: 'text', text: 'Extract the recipe from this image.' },
        ],
      },
    ],
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text || ''

  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Could not parse recipe JSON from response')
  }
}

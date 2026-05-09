// Strip units that Claude sometimes includes in macro values
export function formatCalories(value) {
  if (!value) return ''
  return String(value).replace(/\s*kcal\s*/gi, '').replace(/\s*cal\s*/gi, '').trim()
}

export function formatMacroGrams(value) {
  if (!value) return ''
  return String(value).replace(/\s*g\s*$/i, '').trim()
}

// Strip "servings"/"serving"/"portions" so we don't double-up in display
export function formatPortions(value) {
  if (!value) return ''
  return String(value)
    .replace(/\s*(servings?|portions?|people|persons?|serves?)\s*/gi, '')
    .trim()
}

// Scale ingredient quantity strings by a multiplier
// Handles integers, decimals, and simple fractions (1/2, 1/4, 3/4)
export function scaleIngredient(ingredient, multiplier) {
  if (multiplier === 1) return ingredient

  return ingredient.replace(
    /(\d+\s*\/\s*\d+|\d+\.?\d*)/g,
    (match) => {
      let num
      if (match.includes('/')) {
        const [a, b] = match.split('/').map(s => parseFloat(s.trim()))
        num = a / b
      } else {
        num = parseFloat(match)
      }
      const scaled = num * multiplier
      // Return as fraction if small and clean, otherwise decimal rounded to 2dp
      return formatNumber(scaled)
    }
  )
}

function formatNumber(n) {
  if (Number.isInteger(n)) return String(n)
  // Try to express as a nice fraction for common values
  const fractions = [
    [1/8, '⅛'], [1/4, '¼'], [1/3, '⅓'], [3/8, '⅜'],
    [1/2, '½'], [5/8, '⅝'], [2/3, '⅔'], [3/4, '¾'], [7/8, '⅞'],
  ]
  for (const [val, sym] of fractions) {
    if (Math.abs(n - val) < 0.04) return sym
    // Mixed number: e.g. 1.5 → 1½
    const whole = Math.floor(n)
    if (whole > 0 && Math.abs(n - whole - val) < 0.04) return `${whole}${sym}`
  }
  // Round to 1 decimal place, strip trailing zero
  const r = Math.round(n * 10) / 10
  return r % 1 === 0 ? String(r) : String(r)
}

const CATEGORY_STYLES = {
  Breakfast: {
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    emojis: ['🍳', '☕', '🥞'],
  },
  Lunch: {
    gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    emojis: ['🥗', '🥙', '🥪'],
  },
  Dinner: {
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    emojis: ['🍽️', '🥩', '🍷'],
  },
  Snacks: {
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    emojis: ['🍎', '🥜', '🧁'],
  },
  Sauces: {
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    emojis: ['🫙', '🌶️', '🧄'],
  },
}

const INGREDIENT_EMOJI_MAP = [
  { keywords: ['chicken'], emoji: '🍗' },
  { keywords: ['salmon', 'fish', 'tuna', 'cod', 'prawn', 'shrimp'], emoji: '🐟' },
  { keywords: ['beef', 'steak', 'mince', 'burger'], emoji: '🥩' },
  { keywords: ['pasta', 'spaghetti', 'penne', 'rigatoni', 'lasagne'], emoji: '🍝' },
  { keywords: ['rice'], emoji: '🍚' },
  { keywords: ['egg', 'eggs'], emoji: '🥚' },
  { keywords: ['potato', 'potatoes'], emoji: '🥔' },
  { keywords: ['sweet potato'], emoji: '🍠' },
  { keywords: ['lamb'], emoji: '🍖' },
  { keywords: ['pork', 'bacon', 'ham'], emoji: '🥓' },
  { keywords: ['bread', 'toast', 'sourdough'], emoji: '🍞' },
  { keywords: ['pizza'], emoji: '🍕' },
  { keywords: ['taco', 'burrito', 'tortilla'], emoji: '🌮' },
  { keywords: ['soup', 'broth', 'stew'], emoji: '🍲' },
  { keywords: ['salad', 'lettuce', 'spinach'], emoji: '🥗' },
  { keywords: ['lemon', 'lime'], emoji: '🍋' },
  { keywords: ['mushroom'], emoji: '🍄' },
  { keywords: ['tomato'], emoji: '🍅' },
  { keywords: ['avocado'], emoji: '🥑' },
  { keywords: ['chocolate', 'cocoa'], emoji: '🍫' },
  { keywords: ['banana'], emoji: '🍌' },
  { keywords: ['cheese'], emoji: '🧀' },
]

export function getRecipeStyle(recipe) {
  const base = CATEGORY_STYLES[recipe.category] || CATEGORY_STYLES.Dinner
  const ingredientText = [
    recipe.title || '',
    ...(recipe.ingredients || []),
  ].join(' ').toLowerCase()

  // Find up to 2 matching ingredient emojis to swap into the display
  const matched = []
  for (const { keywords, emoji } of INGREDIENT_EMOJI_MAP) {
    if (keywords.some(k => ingredientText.includes(k))) {
      matched.push(emoji)
      if (matched.length === 2) break
    }
  }

  const emojis = matched.length > 0
    ? [...matched, base.emojis[base.emojis.length - 1]]
    : base.emojis

  return { gradient: base.gradient, emojis }
}

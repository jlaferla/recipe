export const CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Sauces',
]

export const RATINGS = {
  1: 'Bin it',
  2: 'Edible',
  3: 'Solid Cook',
  4: 'Dinner Party Worthy',
  5: 'Gordon Ramsay Would Approve',
}

export const INGREDIENT_FILTERS = [
  { label: 'Chicken', keywords: ['chicken'] },
  { label: 'Beef mince', keywords: ['beef mince', 'ground beef', 'mince'] },
  { label: 'Pasta', keywords: ['pasta', 'spaghetti', 'penne', 'rigatoni', 'fettuccine', 'linguine', 'tagliatelle', 'lasagne', 'lasagna'] },
  { label: 'Rice', keywords: ['rice'] },
  { label: 'Potato', keywords: ['potato', 'potatoes'] },
  { label: 'Sweet potato', keywords: ['sweet potato'] },
  { label: 'Salmon', keywords: ['salmon'] },
  { label: 'Eggs', keywords: ['egg', 'eggs'] },
  { label: 'Pork', keywords: ['pork', 'bacon', 'pancetta', 'chorizo', 'ham', 'prosciutto'] },
  { label: 'Lamb', keywords: ['lamb'] },
  { label: 'Tofu', keywords: ['tofu'] },
  { label: 'Lentils', keywords: ['lentil', 'lentils'] },
]

export const RATING_EMOJI = {
  1: '🗑️',
  2: '😐',
  3: '👨‍🍳',
  4: '🥂',
  5: '⭐',
}

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Recently added' },
  { value: 'rating', label: 'Rating' },
  { value: 'calories_asc', label: 'Calories (low → high)' },
  { value: 'calories_desc', label: 'Calories (high → low)' },
  { value: 'serves_asc', label: 'Serves (low → high)' },
  { value: 'az', label: 'A → Z' },
]

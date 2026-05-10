import { supabase } from './supabase'

export async function getRecipes() {
  const { data, error } = await supabase
    .from('recipes')
    .select('data')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(r => r.data)
}

export async function saveRecipe(recipe) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('recipes')
    .upsert({ id: recipe.id, user_id: user.id, data: recipe })
  if (error) throw error
  return recipe
}

export async function deleteRecipe(id) {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}

export async function getRecipeById(id) {
  const { data, error } = await supabase
    .from('recipes')
    .select('data')
    .eq('id', id)
    .single()
  if (error) throw error
  return data.data
}

export function createRecipe(fields = {}) {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    title: '',
    category: 'Dinner',
    ingredients: [],
    steps: [],
    notes: '',
    macros: { calories: '', protein: '', carbs: '', fat: '' },
    portions: '',
    rating: null,
    tags: [],            // extra auto-detected tags e.g. ['Sauces']
    imageDataUrls: [],      // multiple recipe screenshots
    imageDataUrl: null,     // legacy single screenshot (backward compat)
    mealImageDataUrls: [],  // multiple meal photos
    mealImageDataUrl: null, // legacy single meal photo (backward compat)
    ...fields,
  }
}

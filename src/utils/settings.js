const KEY = 'recipe_book_settings'

const DEFAULTS = {
  units: 'metric', // 'metric' | 'imperial'
}

export function getSettings() {
  try {
    const data = localStorage.getItem(KEY)
    return data ? { ...DEFAULTS, ...JSON.parse(data) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings))
}

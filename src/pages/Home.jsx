import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard'
import { getRecipes } from '../utils/storage'
import { CATEGORIES, INGREDIENT_FILTERS, SORT_OPTIONS } from '../utils/constants'
import { formatPortions, formatCalories } from '../utils/format'
import styles from './Home.module.css'

function recipeHasIngredient(recipe, filter) {
  const text = (recipe.ingredients || []).join(' ').toLowerCase()
  return filter.keywords.some(kw => text.includes(kw.toLowerCase()))
}

function sortRecipes(recipes, sortBy) {
  const copy = [...recipes]
  switch (sortBy) {
    case 'rating':
      return copy.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    case 'calories_asc':
      return copy.sort((a, b) => {
        const ca = parseFloat(formatCalories(a.macros?.calories)) || 0
        const cb = parseFloat(formatCalories(b.macros?.calories)) || 0
        return ca - cb
      })
    case 'calories_desc':
      return copy.sort((a, b) => {
        const ca = parseFloat(formatCalories(a.macros?.calories)) || 0
        const cb = parseFloat(formatCalories(b.macros?.calories)) || 0
        return cb - ca
      })
    case 'serves_asc':
      return copy.sort((a, b) => {
        const sa = parseInt(formatPortions(a.portions)) || 0
        const sb = parseInt(formatPortions(b.portions)) || 0
        return sa - sb
      })
    case 'az':
      return copy.sort((a, b) => a.title.localeCompare(b.title))
    default: // newest
      return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
}

export default function Home() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    getRecipes().then(setRecipes).finally(() => setLoading(false))
  }, [])

  const filtered = sortRecipes(
    recipes
      .filter(r => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return r.title?.toLowerCase().includes(q) ||
          (r.ingredients || []).some(i => i.toLowerCase().includes(q))
      })
      .filter(r => {
        if (selectedCategories.length === 0) return true
        // match category OR tags
        return selectedCategories.some(c =>
          r.category === c || (r.tags || []).includes(c)
        )
      })
      .filter(r => {
        if (selectedIngredients.length === 0) return true
        const filters = INGREDIENT_FILTERS.filter(f => selectedIngredients.includes(f.label))
        return filters.every(f => recipeHasIngredient(r, f))
      }),
    sortBy
  )

  const activeFilterCount = selectedCategories.length + selectedIngredients.length
  const hasActiveFilters = activeFilterCount > 0 || search.trim()

  function toggleCategory(cat) {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  function toggleIngredient(label) {
    setSelectedIngredients(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label])
  }

  function clearAll() {
    setSelectedCategories([])
    setSelectedIngredients([])
    setSearch('')
  }

  return (
    <div className="page">
      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.heading}>My Recipes</h1>
          <Link to="/add" className="btn btn-primary">+ Add Recipe</Link>
        </header>

        {/* Search + controls row */}
        <div className={styles.controlsRow}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search recipes or ingredients…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <button
            className={`${styles.filterBtn} ${activeFilterCount > 0 ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterOpen(true)}
            aria-label="Filters"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
            {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
          </button>

          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className={styles.activeFilters}>
            <span className={styles.resultCount}>{filtered.length} recipe{filtered.length !== 1 ? 's' : ''}</span>
            {selectedCategories.map(c => (
              <span key={c} className={styles.chip}>
                {c} <button className={styles.chipX} onClick={() => toggleCategory(c)}>✕</button>
              </span>
            ))}
            {selectedIngredients.map(l => (
              <span key={l} className={styles.chip}>
                {l} <button className={styles.chipX} onClick={() => toggleIngredient(l)}>✕</button>
              </span>
            ))}
            <button className={styles.clearAll} onClick={clearAll}>Clear all</button>
          </div>
        )}

        {loading ? (
          <div className={styles.empty}><p className={styles.emptyIcon}>⏳</p><p className={styles.emptyText}>Loading…</p></div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>🍳</p>
            <p className={styles.emptyText}>{recipes.length === 0 ? 'No recipes yet — add your first one!' : 'No recipes match.'}</p>
            {recipes.length === 0
              ? <Link to="/add" className="btn btn-primary" style={{ marginTop: '1rem' }}>Add your first recipe</Link>
              : <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={clearAll}>Clear filters</button>
            }
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(r => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        )}
      </div>

      {/* Filter drawer */}
      {filterOpen && (
        <div className={styles.backdrop} onClick={() => setFilterOpen(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h2 className={styles.drawerTitle}>Filter</h2>
              <button className={styles.drawerClose} onClick={() => setFilterOpen(false)}>✕</button>
            </div>

            <div className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>Meal type</h3>
              <div className={styles.chipGroup}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`${styles.drawerChip} ${selectedCategories.includes(cat) ? styles.drawerChipActive : ''}`}
                    onClick={() => toggleCategory(cat)}
                  >
                    {selectedCategories.includes(cat) && '✓ '}{cat}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>Ingredients</h3>
              <div className={styles.chipGroup}>
                {INGREDIENT_FILTERS.map(f => (
                  <button
                    key={f.label}
                    className={`${styles.drawerChip} ${selectedIngredients.includes(f.label) ? styles.drawerChipActive : ''}`}
                    onClick={() => toggleIngredient(f.label)}
                  >
                    {selectedIngredients.includes(f.label) && '✓ '}{f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button className="btn btn-ghost" onClick={() => { setSelectedCategories([]); setSelectedIngredients([]) }}>Clear</button>
              <button className="btn btn-primary" onClick={() => setFilterOpen(false)}>
                Show {filtered.length} recipe{filtered.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

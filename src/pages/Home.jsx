import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard'
import { getRecipes } from '../utils/storage'
import { CATEGORIES, INGREDIENT_FILTERS } from '../utils/constants'
import styles from './Home.module.css'

function recipeHasIngredient(recipe, filter) {
  const text = (recipe.ingredients || []).join(' ').toLowerCase()
  return filter.keywords.some(kw => text.includes(kw.toLowerCase()))
}

export default function Home() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    getRecipes()
      .then(setRecipes)
      .finally(() => setLoading(false))
  }, [])

  const filtered = recipes
    .filter(r => activeCategory === 'All' || r.category === activeCategory)
    .filter(r => {
      if (selectedIngredients.length === 0) return true
      const filters = INGREDIENT_FILTERS.filter(f => selectedIngredients.includes(f.label))
      return filters.every(f => recipeHasIngredient(r, f))
    })

  const hasFilters = activeCategory !== 'All' || selectedIngredients.length > 0

  function toggleIngredient(label) {
    setSelectedIngredients(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  function clearAll() {
    setActiveCategory('All')
    setSelectedIngredients([])
  }

  return (
    <div className="page">
      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.heading}>My Recipes</h1>
          <Link to="/add" className="btn btn-primary">+ Add Recipe</Link>
        </header>

        <div className={styles.filterBar}>
          <div className={styles.filters}>
            {['All', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                className={`${styles.filterBtn} ${activeCategory === cat ? styles.active : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            className={`${styles.filterIconBtn} ${selectedIngredients.length > 0 ? styles.filterIconActive : ''}`}
            onClick={() => setFilterOpen(true)}
            aria-label="Filter by ingredient"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
            {selectedIngredients.length > 0 && (
              <span className={styles.filterBadge}>{selectedIngredients.length}</span>
            )}
          </button>
        </div>

        {hasFilters && (
          <div className={styles.activeFilters}>
            <span className={styles.filterCount}>{filtered.length} recipe{filtered.length !== 1 ? 's' : ''}</span>
            {selectedIngredients.map(label => (
              <span key={label} className={styles.activeChip}>
                {label}
                <button onClick={() => toggleIngredient(label)} className={styles.chipRemove}>✕</button>
              </span>
            ))}
            <button className={styles.clearBtn} onClick={clearAll}>Clear all</button>
          </div>
        )}

        {loading ? (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>⏳</p>
            <p className={styles.emptyText}>Loading recipes…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>🍳</p>
            <p className={styles.emptyText}>
              {recipes.length === 0 ? 'No recipes yet — add your first one!' : 'No recipes match these filters.'}
            </p>
            {recipes.length === 0 ? (
              <Link to="/add" className="btn btn-primary" style={{ marginTop: '1rem' }}>Add your first recipe</Link>
            ) : (
              <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={clearAll}>Clear filters</button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

      {filterOpen && (
        <div className={styles.drawerBackdrop} onClick={() => setFilterOpen(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h2 className={styles.drawerTitle}>Filter by ingredient</h2>
              <button className={styles.drawerClose} onClick={() => setFilterOpen(false)}>✕</button>
            </div>
            <p className={styles.drawerSub}>Select one or more — recipes must contain all selected.</p>
            <div className={styles.ingredientGrid}>
              {INGREDIENT_FILTERS.map(f => {
                const active = selectedIngredients.includes(f.label)
                return (
                  <button
                    key={f.label}
                    className={`${styles.ingredientChip} ${active ? styles.ingredientChipActive : ''}`}
                    onClick={() => toggleIngredient(f.label)}
                  >
                    {active && <span className={styles.chipCheck}>✓ </span>}
                    {f.label}
                  </button>
                )
              })}
            </div>
            <div className={styles.drawerFooter}>
              <button className="btn btn-ghost" onClick={() => setSelectedIngredients([])}>Clear</button>
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

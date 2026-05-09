import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRecipeById, deleteRecipe, saveRecipe } from '../utils/storage'
import { compressImage } from '../utils/imageUtils'
import { RATINGS, RATING_EMOJI } from '../utils/constants'
import { formatCalories, formatMacroGrams, formatPortions, scaleIngredient } from '../utils/format'
import styles from './RecipeDetail.module.css'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const mealPhotoRef = useRef()
  const [recipe, setRecipe] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toast, setToast] = useState(null)
  const [servings, setServings] = useState(null) // null = use original

  useEffect(() => {
    getRecipeById(id)
      .then(r => { if (!r) navigate('/', { replace: true }); else setRecipe(r) })
      .catch(() => navigate('/', { replace: true }))
  }, [id, navigate])

  useEffect(() => {
    function handlePaste(e) {
      if (recipe?.mealImageDataUrl) return
      const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'))
      if (!item) return
      saveMealPhoto(item.getAsFile())
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [recipe])

  function saveMealPhoto(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const compressed = await compressImage(ev.target.result)
      const updated = { ...recipe, mealImageDataUrl: compressed }
      await saveRecipe(updated)
      setRecipe(updated)
      showToast('Meal photo saved!')
    }
    reader.readAsDataURL(file)
  }

  async function removeMealPhoto() {
    const updated = { ...recipe, mealImageDataUrl: null }
    await saveRecipe(updated)
    setRecipe(updated)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleDelete() {
    await deleteRecipe(id)
    navigate('/', { replace: true })
  }

  if (!recipe) return null

  const { title, category, ingredients, steps, notes, macros, portions, rating, imageDataUrl, imageDataUrls, mealImageDataUrl, createdAt } = recipe
  const screenshots = imageDataUrls?.length ? imageDataUrls : imageDataUrl ? [imageDataUrl] : []

  // Serving scaler
  const basePortions = parseInt(formatPortions(portions)) || 1
  const currentServings = servings ?? basePortions
  const multiplier = currentServings / basePortions

  function changeServings(delta) {
    const next = Math.max(1, currentServings + delta)
    setServings(next === basePortions ? null : next)
  }

  const scaledIngredients = (ingredients || []).map(ing =>
    multiplier === 1 ? ing : scaleIngredient(ing, multiplier)
  )

  const macroEntries = Object.entries(macros || {}).filter(([, v]) => v)

  return (
    <div className="page">
      {/* Hero — meal photo only */}
      <div className={styles.hero}>
        {mealImageDataUrl ? (
          <img src={mealImageDataUrl} alt={title} className={styles.heroImg} />
        ) : (
          <div className={styles.heroPlaceholder}>🍴</div>
        )}
        <div className={styles.heroOverlay}>
          <div className="container">
            <div className={styles.heroTop}>
              <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
              <div className={styles.heroActions}>
                <Link to={`/recipe/${id}/edit`} className={styles.editBtn}>✏️ Edit</Link>
                <button className={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>🗑</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Title block */}
        <div className={styles.titleBlock}>
          <span className={styles.categoryTag}>{category}</span>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.metaRow}>
            {rating ? (
              <span className={styles.ratingBadge}>{RATING_EMOJI[rating]} {RATINGS[rating]}</span>
            ) : (
              <Link to={`/recipe/${id}/edit`} className={styles.ratePrompt}>+ Add rating</Link>
            )}
            {createdAt && (
              <span className={styles.metaChip}>
                {new Date(createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          {/* Meal photo controls */}
          {!mealImageDataUrl ? (
            <div className={styles.mealPhotoPrompt}>
              <button className={styles.mealPhotoBtn} onClick={() => mealPhotoRef.current.click()}>
                📸 Add a photo of the meal
              </button>
              <span className={styles.mealPhotoPaste}>or Ctrl+V to paste</span>
              <input ref={mealPhotoRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => saveMealPhoto(e.target.files?.[0])} />
            </div>
          ) : (
            <div className={styles.mealPhotoControls}>
              <button className={styles.changeMealBtn} onClick={() => mealPhotoRef.current.click()}>
                📸 Change meal photo
              </button>
              <button className={styles.removeMealBtn} onClick={removeMealPhoto}>Remove</button>
              <input ref={mealPhotoRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => saveMealPhoto(e.target.files?.[0])} />
            </div>
          )}
        </div>

        {/* Serving scaler */}
        {basePortions > 0 && (
          <section className={styles.scalerSection}>
            <div className={styles.scalerRow}>
              <span className={styles.scalerLabel}>Servings</span>
              <div className={styles.scaler}>
                <button className={styles.scalerBtn} onClick={() => changeServings(-1)} disabled={currentServings <= 1}>−</button>
                <span className={styles.scalerValue}>{currentServings}</span>
                <button className={styles.scalerBtn} onClick={() => changeServings(1)}>+</button>
              </div>
              {servings !== null && (
                <button className={styles.scalerReset} onClick={() => setServings(null)}>
                  Reset to {basePortions}
                </button>
              )}
            </div>
            {multiplier !== 1 && (
              <p className={styles.scalerNote}>
                Ingredients scaled {multiplier > 1 ? 'up' : 'down'} ×{Math.round(multiplier * 100) / 100}
              </p>
            )}
          </section>
        )}

        {/* Macros */}
        {macroEntries.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Nutrition (per serving)</h2>
            <div className={styles.macroGrid}>
              {macroEntries.map(([key, value]) => {
                const display = key === 'calories' ? formatCalories(value) : formatMacroGrams(value)
                const unit = key === 'calories' ? 'kcal' : 'g'
                return (
                  <div key={key} className={styles.macroCard}>
                    <span className={styles.macroValue}>{display}{unit}</span>
                    <span className={styles.macroKey}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Ingredients */}
        {scaledIngredients.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Ingredients</h2>
            <ul className={styles.ingredientList}>
              {scaledIngredients.map((ing, i) => (
                <li key={i} className={styles.ingredient}>
                  <span className={styles.bullet}>•</span>
                  {ing}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Steps */}
        {steps?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Method</h2>
            <ol className={styles.stepList}>
              {steps.map((step, i) => (
                <li key={i} className={styles.step}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Notes */}
        {notes && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Notes</h2>
            <p className={styles.notes}>{notes}</p>
          </section>
        )}

        {screenshots.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Recipe Screenshot{screenshots.length > 1 ? 's' : ''}</h2>
            <div className={styles.screenshotRow}>
              {screenshots.map((src, i) => (
                <img key={i} src={src} alt={`Screenshot ${i + 1}`} className={styles.recipeScreenshot} />
              ))}
            </div>
          </section>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}

      {confirmDelete && (
        <div className={styles.modalBackdrop} onClick={() => setConfirmDelete(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <p className={styles.modalTitle}>Delete this recipe?</p>
            <p className={styles.modalSub}>This cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

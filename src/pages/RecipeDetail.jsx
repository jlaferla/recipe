import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
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
  const [servings, setServings] = useState(null)

  useEffect(() => {
    getRecipeById(id)
      .then(r => { if (!r) navigate('/', { replace: true }); else setRecipe(r) })
      .catch(() => navigate('/', { replace: true }))
  }, [id, navigate])

  // Paste adds a new meal photo
  useEffect(() => {
    function handlePaste(e) {
      const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'))
      if (!item) return
      addMealPhoto(item.getAsFile())
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [recipe])

  function addMealPhoto(file) {
    if (!file || !recipe) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const compressed = await compressImage(ev.target.result)
      const existing = recipe.mealImageDataUrls?.length
        ? recipe.mealImageDataUrls
        : recipe.mealImageDataUrl ? [recipe.mealImageDataUrl] : []
      const updated = { ...recipe, mealImageDataUrls: [...existing, compressed], mealImageDataUrl: null }
      await saveRecipe(updated)
      setRecipe(updated)
      showToast('Photo added!')
    }
    reader.readAsDataURL(file)
  }

  async function removeMealPhoto(index) {
    const existing = recipe.mealImageDataUrls?.length
      ? recipe.mealImageDataUrls
      : recipe.mealImageDataUrl ? [recipe.mealImageDataUrl] : []
    const updated = {
      ...recipe,
      mealImageDataUrls: existing.filter((_, i) => i !== index),
      mealImageDataUrl: null,
    }
    await saveRecipe(updated)
    setRecipe(updated)
  }

  async function handleRating(value) {
    const newRating = recipe.rating === value ? null : value
    const updated = { ...recipe, rating: newRating }
    await saveRecipe(updated)
    setRecipe(updated)
    if (newRating) showToast(`Rated: ${RATINGS[newRating]}`)
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

  const { title, category, ingredients, steps, notes, macros, portions, rating, imageDataUrl, imageDataUrls, mealImageDataUrl, mealImageDataUrls, createdAt } = recipe

  const mealPhotos = mealImageDataUrls?.length
    ? mealImageDataUrls
    : mealImageDataUrl ? [mealImageDataUrl] : []
  const screenshots = imageDataUrls?.length ? imageDataUrls : imageDataUrl ? [imageDataUrl] : []
  const heroImage = mealPhotos[0] || null

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
  // gradient/emojis no longer needed (hero removed)

  return (
    <div className="page">
      <div className="container">
        {/* Title block */}
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <Link to="/" className={styles.backBtn}>← Recipes</Link>
            <div className={styles.titleActions}>
              <Link to={`/recipe/${id}/edit`} className={styles.editBtn}>✏️ Edit</Link>
              <button className={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>🗑</button>
            </div>
          </div>
          <span className={styles.categoryTag}>{category}</span>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.metaRow}>
            {portions && <span className={styles.metaChip}>Serves {formatPortions(portions)}</span>}
            {createdAt && (
              <span className={styles.metaChip}>
                {new Date(createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {/* Inline quick rating */}
        <div className={styles.ratingSection}>
          <p className={styles.ratingSectionLabel}>{rating ? 'Your rating' : 'Rate this recipe'}</p>
          <div className={styles.ratingBtns}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                className={`${styles.ratingBtn} ${rating === n ? styles.ratingBtnActive : ''}`}
                onClick={() => handleRating(n)}
                title={RATINGS[n]}
              >
                <span className={styles.ratingEmoji}>{RATING_EMOJI[n]}</span>
                <span className={styles.ratingBtnLabel}>{RATINGS[n]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Meal photos section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Photos of this meal</h2>
            <button className={styles.addPhotoBtn} onClick={() => mealPhotoRef.current.click()}>
              + Add photo
            </button>
            <input ref={mealPhotoRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => addMealPhoto(e.target.files?.[0])} />
          </div>
          {mealPhotos.length === 0 ? (
            <div
              className={styles.mealPhotoEmpty}
              onClick={() => mealPhotoRef.current.click()}
            >
              <span>📸</span>
              <p>Tap to add a photo of this meal · or Ctrl+V to paste</p>
            </div>
          ) : (
            <div className={styles.mealPhotoGrid}>
              {mealPhotos.map((src, i) => (
                <div key={i} className={styles.mealPhotoThumb}>
                  <img src={src} alt={`Meal photo ${i + 1}`} />
                  <button
                    className={styles.mealPhotoRemove}
                    onClick={() => removeMealPhoto(i)}
                  >✕</button>
                </div>
              ))}
              <button className={styles.addPhotoTile} onClick={() => mealPhotoRef.current.click()}>
                <span>＋</span>
                <span>Add</span>
              </button>
            </div>
          )}
        </section>

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
              <p className={styles.scalerNote}>Ingredients scaled {multiplier > 1 ? 'up' : 'down'} ×{Math.round(multiplier * 100) / 100}</p>
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
                    <span className={styles.macroKey}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
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
                  <span className={styles.bullet}>•</span>{ing}
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

        {/* Screenshots */}
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

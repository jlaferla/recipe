import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRecipeById, saveRecipe } from '../utils/storage'
import { compressImage } from '../utils/imageUtils'
import { CATEGORIES, RATINGS, RATING_EMOJI } from '../utils/constants'
import styles from './AddRecipe.module.css'
import editStyles from './EditRecipe.module.css'

export default function EditRecipe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const recipeFileRef = useRef()
  const mealFileRef = useRef()

  const [recipe, setRecipe] = useState(null)
  const [imageDataUrls, setImageDataUrls] = useState([])
  const [mealImageDataUrl, setMealImageDataUrl] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function handlePaste(e) {
      const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'))
      if (!item) return
      const file = item.getAsFile()
      if (!file) return
      loadImage(file, setMealImageDataUrl)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  useEffect(() => {
    getRecipeById(id).then(r => {
    if (!r) { navigate('/', { replace: true }); return }
    setRecipe(r)
    setImageDataUrls(r.imageDataUrls?.length ? r.imageDataUrls : r.imageDataUrl ? [r.imageDataUrl] : [])
    setMealImageDataUrl(r.mealImageDataUrl)
    setForm({
      title: r.title || '',
      category: r.category || 'Dinner',
      ingredients: r.ingredients?.length ? r.ingredients : [''],
      steps: r.steps?.length ? r.steps : [''],
      notes: r.notes || '',
      portions: r.portions || '',
      rating: r.rating || null,
      macros: {
        calories: r.macros?.calories || '',
        protein: r.macros?.protein || '',
        carbs: r.macros?.carbs || '',
        fat: r.macros?.fat || '',
      },
    })
    }).catch(() => navigate('/', { replace: true }))
  }, [id, navigate])

  function loadImage(file, setter) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => compressImage(ev.target.result).then(setter)
    reader.readAsDataURL(file)
  }

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function setMacro(key, value) {
    setForm(f => ({ ...f, macros: { ...f.macros, [key]: value } }))
  }

  function updateListItem(field, index, value) {
    setForm(f => {
      const arr = [...f[field]]
      arr[index] = value
      return { ...f, [field]: arr }
    })
  }

  function addListItem(field) {
    setForm(f => ({ ...f, [field]: [...f[field], ''] }))
  }

  function removeListItem(field, index) {
    setForm(f => {
      const arr = f[field].filter((_, i) => i !== index)
      return { ...f, [field]: arr.length ? arr : [''] }
    })
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await saveRecipe({
        ...recipe,
        ...form,
        ingredients: form.ingredients.filter(s => s.trim()),
        steps: form.steps.filter(s => s.trim()),
        imageDataUrls,
        mealImageDataUrl,
      })
      navigate(`/recipe/${id}`)
    } catch (err) {
      alert('Failed to save: ' + err.message)
      setSaving(false)
    }
  }

  if (!form) return null

  return (
    <div className="page">
      <div className="container">
        <header className={styles.header}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Back</button>
          <h1 className={styles.heading}>Edit Recipe</h1>
        </header>

        {/* Meal photo */}
        <section className={editStyles.photoSection}>
          <h2 className={editStyles.photoHeading}>📸 Photo of the meal</h2>
          <div
            className={`${editStyles.mealDrop} ${mealImageDataUrl ? editStyles.hasImage : ''}`}
            onClick={() => mealFileRef.current.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              loadImage(e.dataTransfer.files?.[0], setMealImageDataUrl)
            }}
          >
            {mealImageDataUrl ? (
              <>
                <img src={mealImageDataUrl} alt="Meal" className={editStyles.mealPreview} />
                <button
                  type="button"
                  className={editStyles.removePhoto}
                  onClick={e => { e.stopPropagation(); setMealImageDataUrl(null) }}
                >✕ Remove</button>
              </>
            ) : (
              <div className={styles.dropPrompt}>
                <span className={styles.dropIcon}>🍽️</span>
                <p>Upload a photo of the finished dish</p>
                <p className={styles.dropSub}>Tap, drag, or Ctrl+V to paste</p>
              </div>
            )}
          </div>
          <input ref={mealFileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => loadImage(e.target.files?.[0], setMealImageDataUrl)} />
        </section>

        {/* Recipe screenshots */}
        <section className={editStyles.photoSection}>
          <h2 className={editStyles.photoHeading}>📄 Recipe screenshots</h2>
          {imageDataUrls.length > 0 && (
            <div className={styles.screenshotGrid}>
              {imageDataUrls.map((url, i) => (
                <div key={i} className={styles.screenshotThumb}>
                  <img src={url} alt={`Screenshot ${i + 1}`} />
                  <button type="button" className={styles.removeThumb}
                    onClick={() => setImageDataUrls(prev => prev.filter((_, j) => j !== i))}>✕</button>
                  <span className={styles.thumbLabel}>Page {i + 1}</span>
                </div>
              ))}
              <button type="button" className={styles.addMoreBtn} onClick={() => recipeFileRef.current.click()}>
                <span className={styles.addMoreIcon}>＋</span>
                <span>Add page</span>
              </button>
            </div>
          )}
          {imageDataUrls.length === 0 && (
            <div className={editStyles.recipeDrop} onClick={() => recipeFileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); Array.from(e.dataTransfer.files).forEach(f => loadImage(f, url => setImageDataUrls(p => [...p, url]))) }}>
              <div className={styles.dropPrompt}>
                <span className={styles.dropIcon}>📷</span>
                <p>Add recipe screenshots</p>
                <p className={styles.dropSub}>Tap or drag</p>
              </div>
            </div>
          )}
          <input ref={recipeFileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => { Array.from(e.target.files).forEach(f => loadImage(f, url => setImageDataUrls(p => [...p, url]))); e.target.value = '' }} />
        </section>

        <form onSubmit={handleSave} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title}
              onChange={e => setField('title', e.target.value)} required />
          </div>

          <div className={styles.row}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category}
                onChange={e => setField('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Portions</label>
              <input className="form-input" value={form.portions}
                onChange={e => setField('portions', e.target.value)} placeholder="e.g. 4" />
            </div>
          </div>

          {/* Rating */}
          <div className="form-group">
            <label className="form-label">Rating</label>
            <div className={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button"
                  className={`${styles.ratingBtn} ${form.rating === n ? styles.ratingActive : ''}`}
                  onClick={() => setField('rating', form.rating === n ? null : n)}
                  title={RATINGS[n]}>
                  <span className={styles.ratingNum}>{RATING_EMOJI[n]}</span>
                  <span className={styles.ratingLabel}>{RATINGS[n]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Macros */}
          <div className="form-group">
            <label className="form-label">Macros (per serving)</label>
            <div className={styles.macroGrid}>
              {['calories', 'protein', 'carbs', 'fat'].map(key => (
                <div key={key} className={styles.macroField}>
                  <label className={styles.macroLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                  <input className="form-input" value={form.macros[key]}
                    onChange={e => setMacro(key, e.target.value)}
                    placeholder={key === 'calories' ? 'kcal' : 'g'} />
                </div>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div className="form-group">
            <label className="form-label">Ingredients</label>
            {form.ingredients.map((ing, i) => (
              <div key={i} className={styles.listRow}>
                <input className="form-input" value={ing}
                  onChange={e => updateListItem('ingredients', i, e.target.value)}
                  placeholder="e.g. 200g spaghetti" />
                <button type="button" className={styles.removeBtn}
                  onClick={() => removeListItem('ingredients', i)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost" style={{ marginTop: '0.4rem' }}
              onClick={() => addListItem('ingredients')}>+ Add ingredient</button>
          </div>

          {/* Steps */}
          <div className="form-group">
            <label className="form-label">Steps</label>
            {form.steps.map((step, i) => (
              <div key={i} className={styles.listRow}>
                <div className={styles.stepNum}>{i + 1}</div>
                <textarea className="form-input" value={step} rows={2}
                  onChange={e => updateListItem('steps', i, e.target.value)}
                  placeholder="Describe this step…" />
                <button type="button" className={styles.removeBtn}
                  onClick={() => removeListItem('steps', i)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost" style={{ marginTop: '0.4rem' }}
              onClick={() => addListItem('steps')}>+ Add step</button>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" value={form.notes} rows={3}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Any tips, substitutions, or serving suggestions…" />
          </div>

          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
            disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

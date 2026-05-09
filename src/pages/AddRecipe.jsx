import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractRecipeFromImage } from '../utils/extractRecipe'
import { saveRecipe, createRecipe } from '../utils/storage'
import { getSettings } from '../utils/settings'
import { compressImage } from '../utils/imageUtils'
import { CATEGORIES, RATINGS, RATING_EMOJI } from '../utils/constants'
import styles from './AddRecipe.module.css'

const EMPTY_FORM = {
  title: '',
  category: 'Dinner',
  ingredients: [''],
  steps: [''],
  notes: '',
  portions: '',
  rating: null,
  macros: { calories: '', protein: '', carbs: '', fat: '' },
}

export default function AddRecipe() {
  const navigate = useNavigate()
  const fileRef = useRef()
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function handlePaste(e) {
      const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'))
      if (!item) return
      const file = item.getAsFile()
      if (!file) return
      const reader = new FileReader()
      reader.onload = ev => compressImage(ev.target.result).then(setImageDataUrl)
      reader.readAsDataURL(file)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => compressImage(ev.target.result).then(setImageDataUrl)
    reader.readAsDataURL(file)
  }

  async function handleExtract() {
    if (!imageDataUrl) return
    setExtracting(true)
    setExtractError(null)
    try {
      const { units } = getSettings()
      const extracted = await extractRecipeFromImage(imageDataUrl, units)
      setForm({
        title: extracted.title || '',
        category: CATEGORIES.includes(extracted.category) ? extracted.category : 'Dinner',
        ingredients: extracted.ingredients?.length ? extracted.ingredients : [''],
        steps: extracted.steps?.length ? extracted.steps : [''],
        notes: extracted.notes || '',
        portions: extracted.portions || '',
        rating: null,
        macros: {
          calories: extracted.macros?.calories || '',
          protein: extracted.macros?.protein || '',
          carbs: extracted.macros?.carbs || '',
          fat: extracted.macros?.fat || '',
        },
      })
    } catch (err) {
      setExtractError(err.message)
    } finally {
      setExtracting(false)
    }
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
      const recipe = createRecipe({
        ...form,
        ingredients: form.ingredients.filter(s => s.trim()),
        steps: form.steps.filter(s => s.trim()),
        imageDataUrl,
      })
      await saveRecipe(recipe)
      navigate(`/recipe/${recipe.id}`)
    } catch (err) {
      alert('Failed to save: ' + err.message)
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <header className={styles.header}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Back</button>
          <h1 className={styles.heading}>Add Recipe</h1>
        </header>

        {/* Photo upload */}
        <section className={styles.section}>
          <div
            className={styles.dropZone}
            onClick={() => fileRef.current.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const file = e.dataTransfer.files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = ev => compressImage(ev.target.result).then(setImageDataUrl)
                reader.readAsDataURL(file)
              }
            }}
          >
            {imageDataUrl ? (
              <img src={imageDataUrl} alt="Recipe" className={styles.preview} />
            ) : (
              <div className={styles.dropPrompt}>
                <span className={styles.dropIcon}>📷</span>
                <p>Tap to upload, drag, or paste a recipe photo</p>
                <p className={styles.dropSub}>JPG, PNG, WEBP · Ctrl+V to paste</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />

          {imageDataUrl && (
            <div className={styles.extractRow}>
              <button
                className="btn btn-primary"
                onClick={handleExtract}
                disabled={extracting}
              >
                {extracting ? <><span className="spinner" /> Extracting…</> : '✨ Auto-fill from photo'}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => { setImageDataUrl(null); fileRef.current.value = '' }}
              >
                Remove
              </button>
            </div>
          )}

          {extractError && (
            <p className={styles.error}>⚠ {extractError}</p>
          )}
        </section>

        {/* Form */}
        <form onSubmit={handleSave} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              className="form-input"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              placeholder="e.g. Spaghetti Carbonara"
              required
            />
          </div>

          <div className={styles.row}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={form.category}
                onChange={e => setField('category', e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Portions</label>
              <input
                className="form-input"
                value={form.portions}
                onChange={e => setField('portions', e.target.value)}
                placeholder="e.g. 4"
              />
            </div>
          </div>

          {/* Rating */}
          <div className="form-group">
            <label className="form-label">Rating</label>
            <div className={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  className={`${styles.ratingBtn} ${form.rating === n ? styles.ratingActive : ''}`}
                  onClick={() => setField('rating', form.rating === n ? null : n)}
                  title={RATINGS[n]}
                >
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
                  <input
                    className="form-input"
                    value={form.macros[key]}
                    onChange={e => setMacro(key, e.target.value)}
                    placeholder={key === 'calories' ? 'kcal' : 'g'}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div className="form-group">
            <label className="form-label">Ingredients</label>
            {form.ingredients.map((ing, i) => (
              <div key={i} className={styles.listRow}>
                <input
                  className="form-input"
                  value={ing}
                  onChange={e => updateListItem('ingredients', i, e.target.value)}
                  placeholder={`e.g. 200g spaghetti`}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeListItem('ingredients', i)}
                  aria-label="Remove"
                >✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost" style={{ marginTop: '0.4rem' }} onClick={() => addListItem('ingredients')}>
              + Add ingredient
            </button>
          </div>

          {/* Steps */}
          <div className="form-group">
            <label className="form-label">Steps</label>
            {form.steps.map((step, i) => (
              <div key={i} className={styles.listRow}>
                <div className={styles.stepNum}>{i + 1}</div>
                <textarea
                  className="form-input"
                  value={step}
                  onChange={e => updateListItem('steps', i, e.target.value)}
                  placeholder="Describe this step…"
                  rows={2}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeListItem('steps', i)}
                  aria-label="Remove"
                >✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost" style={{ marginTop: '0.4rem' }} onClick={() => addListItem('steps')}>
              + Add step
            </button>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Any tips, substitutions, or serving suggestions…"
              rows={3}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : 'Save Recipe'}
          </button>
        </form>
      </div>
    </div>
  )
}

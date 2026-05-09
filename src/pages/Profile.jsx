import { useState } from 'react'
import { getSettings, saveSettings } from '../utils/settings'
import styles from './Profile.module.css'

const UNIT_OPTIONS = [
  {
    value: 'metric',
    label: 'Metric',
    description: 'g, kg, ml, L, °C',
    detail: 'Converts lbs → g/kg, oz → ml/g, °F → °C',
  },
  {
    value: 'imperial',
    label: 'Imperial',
    description: 'lbs, oz, cups, °F',
    detail: 'Converts g/kg → lbs/oz, ml/L → cups/fl oz, °C → °F',
  },
]

export default function Profile() {
  const [settings, setSettings] = useState(getSettings)
  const [saved, setSaved] = useState(false)

  function handleUnitChange(value) {
    const updated = { ...settings, units: value }
    setSettings(updated)
    saveSettings(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="page">
      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.heading}>Preferences</h1>
          {saved && <span className={styles.savedBadge}>✓ Saved</span>}
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Unit system</h2>
          <p className={styles.sectionDesc}>
            When you auto-fill a recipe from a photo, Claude will convert all measurements to your preferred units.
          </p>

          <div className={styles.options}>
            {UNIT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`${styles.option} ${settings.units === opt.value ? styles.active : ''}`}
                onClick={() => handleUnitChange(opt.value)}
              >
                <div className={styles.optionTop}>
                  <span className={styles.optionLabel}>{opt.label}</span>
                  <span className={styles.optionDesc}>{opt.description}</span>
                </div>
                <p className={styles.optionDetail}>{opt.detail}</p>
                {settings.units === opt.value && (
                  <span className={styles.checkmark}>✓</span>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>About</h2>
          <p className={styles.aboutText}>
            Recipes are stored locally on your device. Unit conversions happen during extraction — existing saved recipes are not retroactively converted.
          </p>
        </section>
      </div>
    </div>
  )
}

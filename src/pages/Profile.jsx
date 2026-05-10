import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { getSettings, saveSettings } from '../utils/settings'
import styles from './Profile.module.css'

const UNIT_OPTIONS = [
  { value: 'metric', label: 'Metric', description: 'g, kg, ml, L, °C', detail: 'Converts lbs → g/kg, °F → °C on extraction' },
  { value: 'imperial', label: 'Imperial', description: 'lbs, oz, cups, °F', detail: 'Converts g/kg → lbs/oz, °C → °F on extraction' },
]

export default function Profile() {
  const [user, setUser] = useState(null)
  const [settings, setSettings] = useState(getSettings)
  const [saved, setSaved] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  function handleUnitChange(value) {
    const updated = { ...settings, units: value }
    setSettings(updated)
    saveSettings(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handlePasswordReset() {
    if (!user?.email) return
    setResetting(true)
    await supabase.auth.resetPasswordForEmail(user.email)
    setResetSent(true)
    setResetting(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="page">
      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.heading}>Profile</h1>
          {saved && <span className={styles.savedBadge}>✓ Saved</span>}
        </header>

        {/* Account */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>
          <div className={styles.accountRow}>
            <div className={styles.avatar}>{user?.email?.[0]?.toUpperCase() || '?'}</div>
            <div className={styles.accountInfo}>
              <p className={styles.accountEmail}>{user?.email || '—'}</p>
              <p className={styles.accountSub}>Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '—'}</p>
            </div>
          </div>
          <div className={styles.accountActions}>
            {resetSent ? (
              <p className={styles.resetSent}>✓ Password reset email sent</p>
            ) : (
              <button className="btn btn-ghost" onClick={handlePasswordReset} disabled={resetting}>
                {resetting ? 'Sending…' : 'Reset password'}
              </button>
            )}
            <button className="btn btn-danger" onClick={handleSignOut}>Sign out</button>
          </div>
        </section>

        {/* Unit preference */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Unit system</h2>
          <p className={styles.sectionDesc}>Claude converts measurements to your preferred units when auto-filling a recipe.</p>
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
                {settings.units === opt.value && <span className={styles.checkmark}>✓</span>}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>About</h2>
          <p className={styles.aboutText}>Recipes are stored in your personal Forkd account and sync across all your devices. Unit conversions apply to new extractions only — existing recipes are not retroactively converted.</p>
        </section>
      </div>
    </div>
  )
}

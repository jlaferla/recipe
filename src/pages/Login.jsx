import { useState } from 'react'
import { supabase } from '../utils/supabase'
import styles from './Login.module.css'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [signupDone, setSignupDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      setSignupDone(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      // App.jsx auth listener will handle redirect
    }
    setLoading(false)
  }

  if (signupDone) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>🍽</div>
          <h1 className={styles.title}>Check your email</h1>
          <p className={styles.sub}>
            We sent a confirmation link to <strong>{email}</strong>.<br />
            Click it to activate your account, then come back and log in.
          </p>
          <button className="btn btn-ghost" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => { setSignupDone(false); setMode('login') }}>
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img src="/forkd-logo.svg" alt="Forkd" style={{ height: '48px', width: 'auto', margin: '0 auto 0.5rem' }} />
        <h1 className={styles.title} style={{ display: 'none' }}>Forkd</h1>
        <p className={styles.sub}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
              required
              minLength={6}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={loading}>
            {loading ? <><span className="spinner" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</> : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className={styles.toggle}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button className={styles.toggleBtn} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

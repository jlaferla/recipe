import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import styles from './Navbar.module.css'

export default function Navbar({ session }) {
  const { pathname } = useLocation()

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <img src="/forkd-logo.svg" alt="Forkd" className={styles.logoImg} />
        </Link>
        <div className={styles.links}>
          <Link to="/" className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}>
            <span className={styles.icon}>🏠</span>
            <span className={styles.label}>Home</span>
          </Link>
          <Link to="/add" className={`${styles.link} ${pathname === '/add' ? styles.active : ''}`}>
            <span className={styles.icon}>＋</span>
            <span className={styles.label}>Add</span>
          </Link>
          <Link to="/profile" className={`${styles.link} ${pathname === '/profile' ? styles.active : ''}`}>
            <span className={styles.icon}>⚙️</span>
            <span className={styles.label}>Prefs</span>
          </Link>
          <button className={styles.link} onClick={handleLogout} title={session?.user?.email}>
            <span className={styles.icon}>🚪</span>
            <span className={styles.label}>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

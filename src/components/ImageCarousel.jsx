import { useState } from 'react'
import styles from './ImageCarousel.module.css'

export default function ImageCarousel({ images, altPrefix = 'Image', initialIndex = 0, openLightbox = false, onLightboxClose }) {
  const [current, setCurrent] = useState(initialIndex)
  const [lightbox, setLightbox] = useState(openLightbox)

  // Allow parent to trigger lightbox open
  if (openLightbox && !lightbox) setLightbox(true)

  if (!images?.length) return null

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length)
  const next = () => setCurrent(i => (i + 1) % images.length)

  return (
    <>
      <div className={styles.carousel}>
        <img
          src={images[current]}
          alt={`${altPrefix} ${current + 1}`}
          className={styles.image}
          onClick={() => setLightbox(true)}
        />

        {images.length > 1 && (
          <>
            <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="Previous">‹</button>
            <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="Next">›</button>
            <div className={styles.dots}>
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        <div className={styles.zoomHint}>🔍 Tap to enlarge</div>
      </div>

      {lightbox && (
        <div className={styles.lightboxBackdrop} onClick={() => { setLightbox(false); onLightboxClose?.() }}>
          <button className={styles.lightboxClose} onClick={() => { setLightbox(false); onLightboxClose?.() }}>✕</button>
          {images.length > 1 && (
            <button className={`${styles.lightboxArrow} ${styles.lightboxLeft}`}
              onClick={e => { e.stopPropagation(); prev() }}>‹</button>
          )}
          <img
            src={images[current]}
            alt={`${altPrefix} ${current + 1}`}
            className={styles.lightboxImg}
            onClick={e => e.stopPropagation()}
          />
          {images.length > 1 && (
            <button className={`${styles.lightboxArrow} ${styles.lightboxRight}`}
              onClick={e => { e.stopPropagation(); next() }}>›</button>
          )}
          {images.length > 1 && (
            <p className={styles.lightboxCount}>{current + 1} / {images.length}</p>
          )}
        </div>
      )}
    </>
  )
}

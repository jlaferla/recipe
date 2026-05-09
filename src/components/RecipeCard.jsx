import { Link } from 'react-router-dom'
import { RATINGS, RATING_EMOJI } from '../utils/constants'
import { formatCalories, formatPortions } from '../utils/format'
import styles from './RecipeCard.module.css'

export default function RecipeCard({ recipe }) {
  const { id, title, category, rating, mealImageDataUrl, macros, portions } = recipe
  // Cards only show the meal photo — no screenshot fallback
  const heroImage = mealImageDataUrl || null
  const calories = formatCalories(macros?.calories)
  const portionNum = formatPortions(portions)

  return (
    <Link to={`/recipe/${id}`} className={styles.card}>
      <div className={styles.image}>
        {heroImage ? (
          <img src={heroImage} alt={title} />
        ) : (
          <div className={styles.placeholder}>🍴</div>
        )}
        <span className={styles.category}>{category}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{title || 'Untitled Recipe'}</h3>
        <div className={styles.meta}>
          {rating && (
            <span className={styles.rating}>
              {RATING_EMOJI[rating]} {RATINGS[rating]}
            </span>
          )}
          {calories && (
            <span className={styles.macro}>{calories} kcal</span>
          )}
          {portionNum && (
            <span className={styles.macro}>Serves {portionNum}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

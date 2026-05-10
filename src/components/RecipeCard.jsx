import { Link } from 'react-router-dom'
import { RATINGS, RATING_EMOJI } from '../utils/constants'
import { formatCalories, formatPortions } from '../utils/format'
import { getRecipeStyle } from '../utils/recipeStyle'
import styles from './RecipeCard.module.css'

export default function RecipeCard({ recipe }) {
  const { id, title, category, rating, mealImageDataUrl, mealImageDataUrls, macros, portions } = recipe
  const heroImage = mealImageDataUrls?.[0] || mealImageDataUrl || null
  const calories = formatCalories(macros?.calories)
  const portionNum = formatPortions(portions)
  const { gradient, emojis } = getRecipeStyle(recipe)

  return (
    <Link to={`/recipe/${id}`} className={styles.card}>
      <div className={styles.image}>
        {heroImage ? (
          <img src={heroImage} alt={title} />
        ) : (
          <div className={styles.placeholder} style={{ background: gradient }}>
            <div className={styles.emojiRow}>
              {emojis.map((e, i) => (
                <span key={i} className={styles.emoji} style={{ animationDelay: `${i * 0.1}s` }}>{e}</span>
              ))}
            </div>
          </div>
        )}
        <span className={styles.category}>{category}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{title || 'Untitled Recipe'}</h3>
        <div className={styles.meta}>
          {rating && (
            <span className={styles.rating}>{RATING_EMOJI[rating]} {RATINGS[rating]}</span>
          )}
          {calories && <span className={styles.macro}>{calories} kcal</span>}
          {portionNum && <span className={styles.macro}>Serves {portionNum}</span>}
        </div>
      </div>
    </Link>
  )
}

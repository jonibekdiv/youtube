import { CATEGORIES } from '../categories.js';
import { t } from '../i18n.js';

/** Bosh sahifa tepasidagi gorizontal kategoriya tugmalari. */
export default function CategoryChips({ value, onChange }) {
  return (
    <div className="chips" role="group" aria-label={t.nav.explore}>
      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          type="button"
          className="chip"
          aria-pressed={category.id === value}
          onClick={() => onChange(category.id)}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}

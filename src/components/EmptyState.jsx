import Icon from './Icon.jsx';

export default function EmptyState({ title, hint }) {
  return (
    <div className="state">
      <Icon name="search" size={48} />
      <h2 className="state-title">{title}</h2>
      {hint && <p className="state-hint">{hint}</p>}
    </div>
  );
}

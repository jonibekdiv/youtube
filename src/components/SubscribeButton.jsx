import { useLibrary } from '../state/library.jsx';
import { t } from '../i18n.js';

export default function SubscribeButton({ channel }) {
  const { isSubscribed, toggleSubscription } = useLibrary();
  const subscribed = isSubscribed(channel.id);
  return (
    <button
      type="button"
      className={`btn ${subscribed ? 'btn-soft' : 'btn-inverse'}`}
      aria-pressed={subscribed}
      onClick={() => toggleSubscription(channel)}
    >
      {subscribed ? t.channel.subscribed : t.channel.subscribe}
    </button>
  );
}

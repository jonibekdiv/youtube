// Yuklanish paytida ko'rsatiladigan "skelet" bloklar (haqiqiy kartalar bilan bir xil o'lchamda).
export function VideoCardSkeleton() {
  return (
    <div className="video-card" aria-hidden="true">
      <div className="thumb skeleton" />
      <div className="card-body">
        <div className="avatar skeleton" style={{ width: 36, height: 36 }} />
        <div className="card-text">
          <div className="skeleton line" style={{ width: '92%' }} />
          <div className="skeleton line" style={{ width: '62%' }} />
        </div>
      </div>
    </div>
  );
}

export function VideoRowSkeleton({ compact = false }) {
  return (
    <div className={`video-row${compact ? ' compact' : ''}`} aria-hidden="true">
      <div className="thumb skeleton" />
      <div className="row-text">
        <div className="skeleton line" style={{ width: '85%' }} />
        <div className="skeleton line" style={{ width: '55%' }} />
        {!compact && <div className="skeleton line" style={{ width: '40%' }} />}
      </div>
    </div>
  );
}

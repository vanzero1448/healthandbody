import "./ProfilePage.css";

interface ProfilePageProps {
  onClose?: () => void;
  showInlineBack?: boolean;
}

export default function ProfilePage({
  onClose,
  showInlineBack = false,
}: ProfilePageProps) {
  return (
    <div className="profile-page">
      {showInlineBack && (
        <div className="profile-topbar">
          <button
            className="profile-back"
            type="button"
            onClick={() => onClose?.()}
          >
            ‹ Назад
          </button>
        </div>
      )}

      <div className="profile-header">
        <div className="profile-avatar-large">
          <div className="avatar-placeholder">АИ</div>
        </div>
        <h1 className="profile-name">Алина И.</h1>
        <div className="profile-username">@alina.fit</div>
      </div>

      <div className="profile-stats-grid">
        <div className="stat-card">
          <span className="stat-label">Вес</span>
          <span className="stat-value">76.4</span>
          <span className="stat-unit">кг</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Рост</span>
          <span className="stat-value">182</span>
          <span className="stat-unit">см</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Цель</span>
          <span className="stat-value">2400</span>
          <span className="stat-unit">ккал</span>
        </div>
      </div>

      <div className="fit-subscription-card">
        <div>
          <div className="fit-title">
            Fit Premium <span className="fit-badge">PRO</span>
          </div>
          <div className="fit-desc">Персональные планы и аналитика</div>
        </div>
        <div className="fit-action">Открыть</div>
      </div>

      <div className="profile-menu">
        <div className="menu-item">
          <span className="menu-icon">⚙️</span>
          <span className="menu-text">Цели и параметры</span>
          <span className="menu-chevron">›</span>
        </div>
        <div className="menu-item">
          <span className="menu-icon">🔔</span>
          <span className="menu-text">Уведомления</span>
          <span className="menu-chevron">›</span>
        </div>
        <div className="menu-item">
          <span className="menu-icon">🧾</span>
          <span className="menu-text">
            История
            <span className="menu-badge-new">new</span>
          </span>
          <span className="menu-chevron">›</span>
        </div>
        <div className="menu-item">
          <span className="menu-icon">💬</span>
          <span className="menu-text">Поддержка</span>
          <span className="menu-chevron">›</span>
        </div>
      </div>
    </div>
  );
}

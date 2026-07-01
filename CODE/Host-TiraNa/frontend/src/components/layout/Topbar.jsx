import { useNavigate } from "react-router-dom";
import { IconMenu, IconBell } from "../icons";

export default function Topbar({
  eyebrow,
  title,
  onMenuClick,
  hostInitial = "J",
  hostName = "Juan Dela Cruz",
  hostAvatarUrl = "",
}) {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <button type="button" className="topbar-menu-btn" onClick={onMenuClick} aria-label="Toggle navigation">
        <IconMenu />
      </button>

      <div className="topbar-title-group">
        {eyebrow ? <div className="topbar-eyebrow">{eyebrow}</div> : null}
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-actions">
        <button type="button" className="topbar-icon-btn" aria-label="Notifications">
          <IconBell />
          <span className="topbar-icon-dot" />
        </button>
        <button
          type="button"
          className="topbar-profile"
          onClick={() => navigate("/dashboard/settings")}
          aria-label="Go to profile settings"
        >
          <span className="topbar-avatar">
            {hostAvatarUrl ? <img src={hostAvatarUrl} alt="" /> : hostInitial}
          </span>
          <span className="topbar-profile-name">{hostName}</span>
        </button>
      </div>
    </header>
  );
}
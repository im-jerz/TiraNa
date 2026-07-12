import { IconAlertTriangle, IconInfo, IconCheck } from "../icons";

const ICONS = { warn: IconAlertTriangle, danger: IconAlertTriangle, success: IconCheck };

export default function ConfirmModal({
  open,
  tone = "warn",
  title,
  description,
  notice,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!open) return null;
  const Icon = ICONS[tone] || IconInfo;

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div className={`modal-icon-wrap ${tone}`}>
          <Icon />
        </div>
        <h3 id="confirm-modal-title">{title}</h3>
        <p>{description}</p>

        {notice ? (
          <div className="modal-notice">
            <IconInfo />
            <span>{notice}</span>
          </div>
        ) : null}

        <div className="modal-actions">
          <button type="button" className="btn-inline btn-secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn-inline ${tone === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

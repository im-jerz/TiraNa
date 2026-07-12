import { Link } from "react-router-dom";
import { IconPlus } from "../icons";

function EmptyCabinIllustration() {
  return (
    <svg className="empty-state-illo" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="80" cy="80" r="78" fill="#F4F1E8" />
      <path d="M40 108 L80 70 L120 108 Z" fill="#1B2A4A" />
      <rect x="52" y="100" width="56" height="36" rx="2" fill="#FBF9F4" stroke="#1B2A4A" strokeWidth="1.5" />
      <rect x="72" y="116" width="16" height="20" fill="#1B2A4A" />
      <rect x="58" y="106" width="10" height="10" fill="#C9A84C" opacity="0.85" />
      <rect x="92" y="106" width="10" height="10" fill="#C9A84C" opacity="0.85" />
      <path d="M96 76 L96 58 L106 58 L106 86" fill="#1B2A4A" />
      <path d="M30 108 H130" stroke="#1B2A4A" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <circle cx="118" cy="46" r="3" fill="#C9A84C" opacity="0.7" />
      <circle cx="36" cy="58" r="2" fill="#C9A84C" opacity="0.5" />
      <path d="M45 50 q4 -6 8 0" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export default function EmptyState() {
  return (
    <div className="empty-state">
      <EmptyCabinIllustration />
      <h3>No properties listed yet</h3>
      <p>
        Your portfolio is empty for now. Add your first place to start welcoming guests —
        you can finish the listing in a few short steps.
      </p>
      <Link to="/dashboard/properties/new" className="btn-inline btn-primary">
        <IconPlus /> List your first property
      </Link>
    </div>
  );
}
